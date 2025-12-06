-- ============================================
-- CAMPFIRE: MESSAGE SEARCH SYSTEM
-- ============================================
-- Bu dosya full-text search (FTS) özelliğini ekler

-- 1. PostgreSQL Full-Text Search için tsvector column ekle
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Mevcut mesajlar için search_vector'ü güncelle
UPDATE messages
SET search_vector = to_tsvector('english', coalesce(content, ''))
WHERE search_vector IS NULL;

-- 3. Yeni mesajlar için otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION messages_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_search_trigger
  BEFORE INSERT OR UPDATE OF content
  ON messages
  FOR EACH ROW
  EXECUTE FUNCTION messages_search_update();

-- 4. Full-text search için GIN index (performans için kritik)
CREATE INDEX IF NOT EXISTS messages_search_idx 
  ON messages USING GIN(search_vector);

-- 5. Arama fonksiyonu - conversation içinde arama
CREATE OR REPLACE FUNCTION search_messages_in_conversation(
  p_conversation_id UUID,
  p_query TEXT,
  p_user_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM messages m
  INNER JOIN conversation_members cm 
    ON m.conversation_id = cm.conversation_id
  WHERE m.conversation_id = p_conversation_id
    AND cm.user_id = p_user_id
    AND m.deleted_at IS NULL
    AND m.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Global arama - tüm konuşmalarda arama
CREATE OR REPLACE FUNCTION search_messages_global(
  p_query TEXT,
  p_user_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  sender_id UUID,
  conversation_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    m.conversation_id,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM messages m
  INNER JOIN conversation_members cm 
    ON m.conversation_id = cm.conversation_id
  WHERE cm.user_id = p_user_id
    AND m.deleted_at IS NULL
    AND m.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Arama sonuçları için highlight (match edilen kelimeleri vurgula)
CREATE OR REPLACE FUNCTION search_messages_with_highlight(
  p_conversation_id UUID,
  p_query TEXT,
  p_user_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  highlighted_content TEXT,
  sender_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    ts_headline('english', m.content, websearch_to_tsquery('english', p_query), 
      'StartSel=<mark>, StopSel=</mark>') as highlighted_content,
    m.sender_id,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', p_query)) as rank
  FROM messages m
  INNER JOIN conversation_members cm 
    ON m.conversation_id = cm.conversation_id
  WHERE m.conversation_id = p_conversation_id
    AND cm.user_id = p_user_id
    AND m.deleted_at IS NULL
    AND m.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- KULLANIM ÖRNEKLERİ
-- ============================================

-- Conversation içinde arama:
-- SELECT * FROM search_messages_in_conversation(
--   'conversation-uuid',
--   'hello world',
--   'user-uuid',
--   50
-- );

-- Global arama:
-- SELECT * FROM search_messages_global(
--   'hello world',
--   'user-uuid',
--   50
-- );

-- Highlight ile arama:
-- SELECT * FROM search_messages_with_highlight(
--   'conversation-uuid',
--   'hello world',
--   'user-uuid',
--   50
-- );

-- ============================================
-- NOTLAR
-- ============================================
-- websearch_to_tsquery kullanıyoruz çünkü:
-- - "hello world" -> 'hello' AND 'world'
-- - "hello OR world" -> 'hello' OR 'world'
-- - "-spam" -> NOT 'spam'
-- - Daha doğal arama sorguları destekler

-- GIN index sayesinde arama çok hızlı (milliseconds)
-- ts_rank ile en alakalı sonuçlar önce gelir
