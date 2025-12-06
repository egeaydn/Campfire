"use server";

import { createClient } from "@/lib/supabase/server";
import { JSDOM } from "jsdom";

interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
}

/**
 * URL'den Open Graph metadata'sını çek
 */
async function fetchMetadata(url: string): Promise<LinkPreview> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CampfireBot/1.0; +https://campfire.chat)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Open Graph tags'leri çek
    const getMetaContent = (property: string): string | null => {
      const meta =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      return meta?.getAttribute("content") || null;
    };

    // Favicon bul
    const getFavicon = (): string | null => {
      const favicon =
        document.querySelector('link[rel="icon"]') ||
        document.querySelector('link[rel="shortcut icon"]');
      const faviconHref = favicon?.getAttribute("href");

      if (faviconHref) {
        // Relative URL'yi absolute yap
        try {
          return new URL(faviconHref, url).href;
        } catch {
          return null;
        }
      }

      // Fallback: /favicon.ico
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
      } catch {
        return null;
      }
    };

    const title =
      getMetaContent("og:title") ||
      document.querySelector("title")?.textContent ||
      null;

    const description =
      getMetaContent("og:description") ||
      getMetaContent("description") ||
      null;

    let imageUrl = getMetaContent("og:image");

    // Image URL'yi absolute yap
    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        imageUrl = new URL(imageUrl, url).href;
      } catch {
        imageUrl = null;
      }
    }

    return {
      url,
      title: title?.substring(0, 200) || null,
      description: description?.substring(0, 300) || null,
      image_url: imageUrl,
      site_name: getMetaContent("og:site_name"),
      favicon_url: getFavicon(),
    };
  } catch (error) {
    console.error(`Failed to fetch metadata for ${url}:`, error);
    return {
      url,
      title: null,
      description: null,
      image_url: null,
      site_name: null,
      favicon_url: null,
    };
  }
}

/**
 * Link preview'u veritabanına kaydet veya cache'den getir
 */
export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  const supabase = await createClient();

  // Cache'de var mı kontrol et
  const { data: cached } = await supabase
    .from("link_previews")
    .select("*")
    .eq("url", url)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    return cached as LinkPreview;
  }

  // Fetch metadata
  const metadata = await fetchMetadata(url);

  // Veritabanına kaydet
  const { data, error } = await supabase
    .from("link_previews")
    .upsert(
      {
        url: metadata.url,
        title: metadata.title,
        description: metadata.description,
        image_url: metadata.image_url,
        site_name: metadata.site_name,
        favicon_url: metadata.favicon_url,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün
      },
      { onConflict: "url" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to save link preview:", error);
    return metadata;
  }

  return data as LinkPreview;
}

/**
 * Mesajdaki URL'leri tespit et ve preview'larını getir
 */
export async function getLinksFromMessage(
  content: string
): Promise<LinkPreview[]> {
  // URL regex
  const urlRegex =
    /(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))/gi;

  const urls = content.match(urlRegex);

  if (!urls || urls.length === 0) {
    return [];
  }

  // Her URL için preview getir (max 3 tane)
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 3);
  const previews = await Promise.all(
    uniqueUrls.map((url) => getLinkPreview(url))
  );

  return previews.filter((p) => p !== null) as LinkPreview[];
}

/**
 * Mesaj gönderildiğinde link preview'larını kaydet
 */
export async function saveLinkPreviewsForMessage(
  messageId: string,
  content: string
) {
  const previews = await getLinksFromMessage(content);

  if (previews.length === 0) {
    return;
  }

  const supabase = await createClient();

  // message_links tablosuna kaydet
  for (let i = 0; i < previews.length; i++) {
    const preview = previews[i];

    await supabase.from("message_links").insert({
      message_id: messageId,
      link_preview_id: preview.url, // URL unique olduğu için kullanabiliriz
      position: i,
    });
  }
}

/**
 * Mesajın link preview'larını getir
 */
export async function getMessageLinkPreviews(
  messageId: string
): Promise<LinkPreview[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_message_links", {
    p_message_id: messageId,
  });

  return (data || []) as LinkPreview[];
}
