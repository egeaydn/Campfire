"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Tüm konuşmalarda mesaj ara
 */
export async function searchMessages(query: string, limit: number = 50) {
  if (!query || query.trim().length < 2) {
    return { data: [], error: "Query too short" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const { data, error } = await supabase.rpc("search_messages", {
      p_user_id: user.id,
      p_query: query.trim(),
      p_conversation_id: null,
      p_limit: limit,
    });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Search error:", error);
    return { data: [], error: error.message };
  }
}

/**
 * Belirli bir konuşmada mesaj ara
 */
export async function searchInConversation(
  conversationId: string,
  query: string
) {
  if (!query || query.trim().length < 2) {
    return { data: [], error: "Query too short" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const { data, error } = await supabase.rpc("search_in_conversation", {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_query: query.trim(),
    });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error("Search in conversation error:", error);
    return { data: [], error: error.message };
  }
}

/**
 * Arama geçmişine kaydet
 */
export async function saveSearchHistory(query: string, conversationId?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("search_history").insert({
    user_id: user.id,
    query: query.trim(),
    conversation_id: conversationId || null,
  });
}

/**
 * Kullanıcının son aramalarını getir
 */
export async function getRecentSearches(limit: number = 10) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("search_history")
    .select("query, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Unique queries
  const uniqueQueries = Array.from(
    new Set(data?.map((item) => item.query) || [])
  );

  return uniqueQueries.slice(0, limit);
}

/**
 * Arama geçmişini temizle
 */
export async function clearSearchHistory() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("search_history")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;

  return { success: true };
}
