-- ============================================
-- CAMPFIRE: TYPING INDICATORS SYSTEM
-- ============================================
-- Bu dosya "X is typing..." özelliğini ekler
-- Broadcast kullanarak veritabanına kaydetmeden realtime iletişim sağlar

-- Typing indicators için veritabanı tablosu GEREKMEZ!
-- Supabase Broadcast API kullanarak memory'de tutacağız
-- Bu daha hızlı ve veritabanını gereksiz yere doldurmaz

-- Ancak yine de kayıt tutmak isterseniz:
-- (Opsiyonel - genellikle gerekli değildir)

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Her kullanıcı bir konuşmada sadece bir typing kaydı olabilir
  UNIQUE(conversation_id, user_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id 
  ON typing_indicators(conversation_id);

-- RLS Policies
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see typing in their conversations"
  ON typing_indicators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = typing_indicators.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing status"
  ON typing_indicators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
  ON typing_indicators
  FOR DELETE
  USING (auth.uid() = user_id);

-- Eski typing kayıtlarını temizle (5 saniyeden eski)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < now() - interval '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Her dakika eski typing kayıtlarını temizle
-- pg_cron extension gerektirir (Supabase'de varsayılan olarak yok)
-- Bu yüzden client-side timeout kullanmak daha iyi

-- ============================================
-- ÖNERİLEN YAKLASIM: BROADCAST API
-- ============================================
-- Veritabanı yerine Supabase Broadcast kullan:
--
-- Client-side code:
-- const channel = supabase.channel('typing:conversation-id')
--   .on('broadcast', { event: 'typing' }, (payload) => {
--     console.log('User is typing:', payload)
--   })
--   .subscribe()
--
-- // Start typing
-- channel.send({
--   type: 'broadcast',
--   event: 'typing',
--   payload: { user_id: 'xxx', username: 'John', isTyping: true }
-- })
--
-- // Stop typing
-- channel.send({
--   type: 'broadcast',
--   event: 'typing',
--   payload: { user_id: 'xxx', username: 'John', isTyping: false }
-- })

-- Bu yaklaşım:
-- ✅ Daha hızlı (veritabanı okuma/yazma yok)
-- ✅ Daha temiz (otomatik temizleme)
-- ✅ Daha az maliyet (database calls yok)

-- ============================================
-- NOT: typing_indicators tablosu kullanmayacaksak
-- DROP TABLE IF EXISTS typing_indicators;
-- ============================================
