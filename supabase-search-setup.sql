-- ============================================
-- CAMPFIRE: MESSAGE SEARCH SYSTEM
-- ============================================
-- Bu dosya full-text search özelliğini ekler

-- 1. Full-text search için GIN index
-- PostgreSQL'in yerleşik full-text search kullanarak
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Trigram similarity için

-- Messages tablosuna full-text search index ekle
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
  ON messages USING gin(to_tsvector('english', content));

-- Trigram index (typo tolerance için)
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm 
  ON messages USING gin(content gin_trgm_ops);

-- 2. Mesaj arama fonksiyonu
CREATE OR REPLACE FUNCTION search_messages(
  p_user_id UUID,
  p_query TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  sender_username TEXT,
  sender_avatar_url TEXT,
  conversation_title TEXT,
  conversation_type TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.file_url,
    m.created_at,
    p.username as sender_username,
    p.avatar_url as sender_avatar_url,
    c.title as conversation_title,
    c.type as conversation_type,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', p_query)) as rank
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  JOIN conversations c ON m.conversation_id = c.id
  JOIN conversation_members cm ON c.id = cm.conversation_id
  WHERE 
    cm.user_id = p_user_id
    AND m.deleted_at IS NULL
    AND m.content IS NOT NULL
    AND (
      -- Full-text search
      to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
      OR
      -- Trigram similarity (typo tolerance)
      similarity(m.content, p_query) > 0.3
    )
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hızlı arama için helper fonksiyon (sadece conversation içinde)
CREATE OR REPLACE FUNCTION search_in_conversation(
  p_conversation_id UUID,
  p_user_id UUID,
  p_query TEXT
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  sender_id UUID,
  sender_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  highlight TEXT
) AS $$
BEGIN
  -- Kullanıcının conversation üyesi olup olmadığını kontrol et
  IF NOT EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this conversation';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    p.username as sender_username,
    m.created_at,
    ts_headline('english', m.content, plainto_tsquery('english', p_query)) as highlight
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  WHERE 
    m.conversation_id = p_conversation_id
    AND m.deleted_at IS NULL
    AND m.content IS NOT NULL
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', p_query)
  ORDER BY m.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Arama geçmişi tablosu (opsiyonel)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
  ON search_history(user_id, created_at DESC);

-- RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
  ON search_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
  ON search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Popüler arama terimleri (analytics için)
CREATE OR REPLACE FUNCTION get_popular_searches(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(query TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT sh.query, COUNT(*)::BIGINT
  FROM search_history sh
  WHERE sh.user_id = p_user_id
  GROUP BY sh.query
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Test:
-- SELECT * FROM search_messages('user-uuid', 'hello', NULL, 10);
-- SELECT * FROM search_in_conversation('conv-uuid', 'user-uuid', 'hello');
