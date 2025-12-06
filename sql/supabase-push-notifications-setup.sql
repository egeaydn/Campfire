-- ============================================
-- CAMPFIRE: PUSH NOTIFICATIONS SYSTEM
-- ============================================
-- Bu dosya Web Push Notifications özelliğini ekler

-- 1. PUSH_SUBSCRIPTIONS tablosu
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL, -- Public key
  auth_key TEXT NOT NULL, -- Auth secret
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, endpoint)
);

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
  ON push_subscriptions(user_id);

-- 3. RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. NOTIFICATION_PREFERENCES tablosu
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  new_messages BOOLEAN DEFAULT true,
  mentions BOOLEAN DEFAULT true,
  group_invites BOOLEAN DEFAULT true,
  dm_messages BOOLEAN DEFAULT true,
  mute_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. NOTIFICATIONS tablosu (bildirim geçmişi)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_message', 'mention', 'group_invite', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  action_url TEXT, -- Tıklandığında gidilecek URL
  data JSONB, -- Ek metadata
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
  ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_notifications_sent_at 
  ON notifications(sent_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Fonksiyon: Kullanıcının okunmamış bildirim sayısı
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT
    FROM notifications
    WHERE user_id = p_user_id
      AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonksiyon: Eski bildirimleri temizle (30 gün)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE sent_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger: Yeni mesaj geldiğinde bildirim oluştur
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_username TEXT;
  v_conversation_type TEXT;
  v_conversation_title TEXT;
  v_member_id UUID;
BEGIN
  -- Gönderen kullanıcı adını al
  SELECT username INTO v_sender_username
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Conversation tipini al
  SELECT type, title INTO v_conversation_type, v_conversation_title
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Her conversation üyesi için (gönderen hariç) bildirim oluştur
  FOR v_member_id IN
    SELECT user_id
    FROM conversation_members
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    -- Kullanıcının bildirim tercihlerini kontrol et
    IF EXISTS (
      SELECT 1 FROM notification_preferences
      WHERE user_id = v_member_id
        AND enabled = true
        AND (
          (v_conversation_type = 'dm' AND dm_messages = true) OR
          (v_conversation_type = 'group' AND new_messages = true)
        )
        AND (mute_until IS NULL OR mute_until < now())
    ) THEN
      -- Bildirim oluştur
      INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        action_url,
        data
      ) VALUES (
        v_member_id,
        'new_message',
        CASE
          WHEN v_conversation_type = 'dm' THEN v_sender_username
          ELSE COALESCE(v_conversation_title, 'Group Chat')
        END,
        COALESCE(NEW.content, 'Sent a file'),
        '/chat/' || NEW.conversation_id,
        jsonb_build_object(
          'message_id', NEW.id,
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- ============================================
-- KULLANIM
-- ============================================
-- 1. Client: Service worker ile push subscription oluştur
-- 2. Subscription'ı push_subscriptions tablosuna kaydet
-- 3. Yeni mesaj geldiğinde trigger otomatik notification oluşturur
-- 4. Server: notifications tablosundaki yeni kayıtları dinler
-- 5. Web Push API ile bildirim gönderir
-- 6. Client: Bildirime tıklandığında action_url'ye yönlenir

-- ============================================
-- NOTLAR
-- ============================================
-- VAPID keys oluşturmak için:
-- npx web-push generate-vapid-keys
-- 
-- Environment variables:
-- NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
-- VAPID_PRIVATE_KEY=...
-- VAPID_SUBJECT=mailto:admin@campfire.chat
