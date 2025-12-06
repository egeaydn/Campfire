"use server";

import { JSDOM } from "jsdom";

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

/**
 * URL'den Open Graph metadata çek
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Validate URL
    new URL(url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CampfireBot/1.0; +https://campfire.app)",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract Open Graph metadata
    const getMetaContent = (property: string) => {
      const meta = 
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      return meta?.getAttribute("content") || undefined;
    };

    const preview: LinkPreview = {
      url,
      title: 
        getMetaContent("og:title") ||
        getMetaContent("twitter:title") ||
        document.querySelector("title")?.textContent ||
        undefined,
      description:
        getMetaContent("og:description") ||
        getMetaContent("twitter:description") ||
        getMetaContent("description") ||
        undefined,
      image:
        getMetaContent("og:image") ||
        getMetaContent("twitter:image") ||
        undefined,
      siteName: getMetaContent("og:site_name") || undefined,
      favicon:
        document.querySelector('link[rel="icon"]')?.getAttribute("href") ||
        document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
        `/favicon.ico`,
    };

    // Make favicon URL absolute
    if (preview.favicon && !preview.favicon.startsWith("http")) {
      const urlObj = new URL(url);
      preview.favicon = new URL(preview.favicon, urlObj.origin).href;
    }

    // Make image URL absolute
    if (preview.image && !preview.image.startsWith("http")) {
      preview.image = new URL(preview.image, url).href;
    }

    return preview;
  } catch (error) {
    console.error("Failed to fetch link preview:", error);
    return null;
  }
}

/**
 * Mesaj içindeki URL'leri bul
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Cache link preview (opsiyonel - Supabase'de saklanabilir)
 */
export async function cacheLinkPreview(preview: LinkPreview) {
  // TODO: Implement caching in database if needed
  // Bu sayede aynı URL için tekrar fetch yapmaya gerek kalmaz
  return preview;
}
