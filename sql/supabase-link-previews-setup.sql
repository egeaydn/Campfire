-- ============================================
-- CAMPFIRE: LINK PREVIEWS SYSTEM
-- ============================================
-- Bu dosya URL link preview özelliğini ekler

-- 1. LINK_PREVIEWS tablosu
CREATE TABLE IF NOT EXISTS link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  
  -- Cache için
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_link_previews_url ON link_previews(url);
CREATE INDEX IF NOT EXISTS idx_link_previews_expires_at ON link_previews(expires_at);

-- 3. RLS Policies (herkes okuyabilir, system insert eder)
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read link previews"
  ON link_previews
  FOR SELECT
  USING (true);

-- Service role için insert (server-side)
CREATE POLICY "Service role can insert link previews"
  ON link_previews
  FOR INSERT
  WITH CHECK (true);

-- 4. Eski preview'ları temizle fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_expired_link_previews()
RETURNS void AS $$
BEGIN
  DELETE FROM link_previews
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 5. MESSAGE_LINKS junction table (mesaj-link ilişkisi)
CREATE TABLE IF NOT EXISTS message_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  link_preview_id UUID NOT NULL REFERENCES link_previews(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0, -- Mesajdaki kaçıncı link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(message_id, link_preview_id)
);

CREATE INDEX IF NOT EXISTS idx_message_links_message_id ON message_links(message_id);
CREATE INDEX IF NOT EXISTS idx_message_links_link_preview_id ON message_links(link_preview_id);

-- RLS
ALTER TABLE message_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read message links in their conversations"
  ON message_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_links.message_id
        AND cm.user_id = auth.uid()
    )
  );

-- 6. Fonksiyon: Mesajdaki linkleri al
CREATE OR REPLACE FUNCTION get_message_links(p_message_id UUID)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.url,
    lp.title,
    lp.description,
    lp.image_url,
    lp.site_name,
    lp.favicon_url
  FROM message_links ml
  JOIN link_previews lp ON ml.link_preview_id = lp.id
  WHERE ml.message_id = p_message_id
  ORDER BY ml.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- KULLANIM SENARYOsu
-- ============================================
-- 1. Kullanıcı mesaj gönderir: "Check this out https://example.com"
-- 2. Client-side: URL'leri regex ile tespit eder
-- 3. Server-side: Her URL için Open Graph metadata çeker
-- 4. link_previews tablosuna insert (veya cache'den al)
-- 5. message_links tablosuna message_id - link_preview_id ilişkisi
-- 6. Client: Mesajı render ederken preview'ları gösterir

-- ============================================
-- ÖRNEKOpen Graph meta tags:
-- ============================================
-- <meta property="og:title" content="Title" />
-- <meta property="og:description" content="Description" />
-- <meta property="og:image" content="https://example.com/image.jpg" />
-- <meta property="og:url" content="https://example.com" />
-- <meta property="og:site_name" content="Example" />

-- Bu meta tag'leri sunucu tarafında fetch edip parse edeceğiz
-- (JSDOM veya cheerio kullanarak)
