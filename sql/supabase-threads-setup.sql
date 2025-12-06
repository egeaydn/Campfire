-- ============================================
-- CAMPFIRE: MESSAGE THREADS SYSTEM
-- ============================================
-- Bu dosya mesajlara cevap (thread/reply) özelliğini ekler

-- 1. Messages tablosuna parent_message_id ekle
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id 
  ON messages(parent_message_id);

-- 2. Thread sayacını hesapla
CREATE OR REPLACE FUNCTION get_thread_count(p_message_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE parent_message_id = p_message_id
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Thread'deki mesajları getir
CREATE OR REPLACE FUNCTION get_thread_messages(
  p_parent_message_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  file_url TEXT,
  sender_id UUID,
  sender_username TEXT,
  sender_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Kullanıcının conversation üyesi olup olmadığını kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
    WHERE m.id = p_parent_message_id
      AND cm.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this conversation';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.file_url,
    m.sender_id,
    p.username as sender_username,
    p.avatar_url as sender_avatar_url,
    m.created_at,
    m.edited_at
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  WHERE m.parent_message_id = p_parent_message_id
    AND m.deleted_at IS NULL
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Thread görünümü (view) - ilk ve son mesajları birlikte göster
CREATE OR REPLACE VIEW message_threads AS
SELECT 
  parent.id as parent_id,
  parent.content as parent_content,
  parent.sender_id as parent_sender_id,
  parent_profile.username as parent_sender_username,
  parent.created_at as parent_created_at,
  COUNT(replies.id) as reply_count,
  MAX(replies.created_at) as last_reply_at,
  ARRAY_AGG(DISTINCT reply_profile.username) FILTER (WHERE replies.id IS NOT NULL) as reply_usernames
FROM messages parent
LEFT JOIN messages replies ON replies.parent_message_id = parent.id AND replies.deleted_at IS NULL
JOIN profiles parent_profile ON parent.sender_id = parent_profile.id
LEFT JOIN profiles reply_profile ON replies.sender_id = reply_profile.id
WHERE parent.parent_message_id IS NULL
  AND parent.deleted_at IS NULL
GROUP BY parent.id, parent.content, parent.sender_id, parent_profile.username, parent.created_at;

-- 5. Thread notification tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_user_id 
  ON thread_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_message_id 
  ON thread_subscriptions(message_id);

-- RLS
ALTER TABLE thread_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own thread subscriptions"
  ON thread_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Otomatik thread subscription (bir mesaja cevap yazınca subscribe olur)
CREATE OR REPLACE FUNCTION auto_subscribe_to_thread()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer bu bir reply ise (parent_message_id varsa)
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Kullanıcıyı thread'e subscribe et
    INSERT INTO thread_subscriptions (user_id, message_id, subscribed)
    VALUES (NEW.sender_id, NEW.parent_message_id, true)
    ON CONFLICT (user_id, message_id) DO NOTHING;
    
    -- Parent mesajın sahibini de subscribe et (eğer değilse)
    INSERT INTO thread_subscriptions (user_id, message_id, subscribed)
    SELECT sender_id, id, true
    FROM messages
    WHERE id = NEW.parent_message_id
    ON CONFLICT (user_id, message_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_subscribe_to_thread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_to_thread();

-- 7. Thread badge güncellemesi (realtime için)
CREATE OR REPLACE FUNCTION notify_thread_reply()
RETURNS TRIGGER AS $$
BEGIN
  -- Realtime notification için parent message'ı update et
  -- Bu sayede parent message'ın thread_count'u değişir
  UPDATE messages
  SET edited_at = edited_at -- Dummy update to trigger realtime
  WHERE id = NEW.parent_message_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_thread_reply
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.parent_message_id IS NOT NULL)
  EXECUTE FUNCTION notify_thread_reply();

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Kullanım:
-- 1. Mesaja cevap göndermek: parent_message_id'yi set et
-- 2. Thread'i görmek: get_thread_messages(parent_id, user_id) çağır
-- 3. Thread sayısı: get_thread_count(parent_id)
