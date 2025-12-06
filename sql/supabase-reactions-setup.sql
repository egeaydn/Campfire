-- ============================================
-- CAMPFIRE: MESSAGE REACTIONS SYSTEM
-- ============================================
-- Bu dosya mesaj reaksiyonları (emoji reactions) özelliğini ekler

-- 1. MESSAGE_REACTIONS tablosu
-- Her kullanıcı bir mesaja her emojiden sadece bir tane ekleyebilir
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- Emoji unicode karakteri (örn: "👍", "❤️", "😂")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Bir kullanıcı aynı mesaja aynı emojiyi sadece bir kez ekleyebilir
  UNIQUE(message_id, user_id, emoji)
);

-- 2. İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id 
  ON message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id 
  ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji 
  ON message_reactions(emoji);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Herkes reaksiyonları okuyabilir (conversation üyesiyse)
CREATE POLICY "Users can read reactions in their conversations"
  ON message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    )
  );

-- Kullanıcılar kendi reaksiyonlarını ekleyebilir
CREATE POLICY "Users can add their own reactions"
  ON message_reactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    )
  );

-- Kullanıcılar kendi reaksiyonlarını kaldırabilir
CREATE POLICY "Users can remove their own reactions"
  ON message_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Realtime için yayını aktif et
-- Supabase dashboard'dan: Database > Replication > message_reactions tablosunu seç

-- 5. Fonksiyon: Mesajın toplam reaksiyon sayısını hesapla
CREATE OR REPLACE FUNCTION get_message_reaction_counts(p_message_id UUID)
RETURNS TABLE(emoji TEXT, count BIGINT, user_ids UUID[]) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.emoji,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(mr.user_id) as user_ids
  FROM message_reactions mr
  WHERE mr.message_id = p_message_id
  GROUP BY mr.emoji
  ORDER BY count DESC, mr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger: Reaksiyon eklendiğinde son aktiviteyi güncelle
CREATE OR REPLACE FUNCTION update_conversation_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Conversation'ın last_message_at zamanını güncelle
  UPDATE conversations
  SET last_message_at = now()
  WHERE id = (
    SELECT conversation_id 
    FROM messages 
    WHERE id = NEW.message_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_reaction
  AFTER INSERT ON message_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_reaction();

-- 7. Test verileri (opsiyonel - geliştirme için)
-- Gerçek kullanıcı ID'lerini kullanarak test edebilirsiniz:
-- INSERT INTO message_reactions (message_id, user_id, emoji)
-- VALUES ('message-uuid', 'user-uuid', '👍');

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Sonraki adımlar:
-- 1. Supabase Dashboard > Database > Replication > message_reactions'ı enable et
-- 2. app/actions/reactions.ts dosyasını oluştur
-- 3. components/chat/EmojiPicker.tsx komponenti oluştur
-- 4. components/chat/MessageItem.tsx'e reaksiyon gösterimi ekle
