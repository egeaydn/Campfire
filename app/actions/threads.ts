"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Thread'deki mesajları getir
 */
export async function getThreadMessages(parentMessageId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const { data, error } = await supabase.rpc("get_thread_messages", {
      p_parent_message_id: parentMessageId,
      p_user_id: user.id,
    });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error("Failed to get thread messages:", error);
    throw error;
  }
}

/**
 * Thread sayısını getir
 */
export async function getThreadCount(messageId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_thread_count", {
      p_message_id: messageId,
    });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error("Failed to get thread count:", error);
    return 0;
  }
}

/**
 * Mesaja cevap gönder (thread reply)
 */
export async function sendThreadReply({
  parentMessageId,
  content,
  fileUrl,
}: {
  parentMessageId: string;
  content?: string;
  fileUrl?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Parent mesajı getir (conversation_id için)
  const { data: parentMessage } = await supabase
    .from("messages")
    .select("conversation_id")
    .eq("id", parentMessageId)
    .single();

  if (!parentMessage) {
    throw new Error("Parent message not found");
  }

  // Reply mesajını insert et
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: parentMessage.conversation_id,
      sender_id: user.id,
      content: content || null,
      file_url: fileUrl || null,
      parent_message_id: parentMessageId,
    })
    .select(
      `
      id,
      content,
      file_url,
      sender_id,
      created_at,
      edited_at,
      parent_message_id,
      sender:profiles(username, avatar_url)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Thread subscription yönetimi
 */
export async function subscribeToThread(messageId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("thread_subscriptions").upsert({
    user_id: user.id,
    message_id: messageId,
    subscribed: true,
  });

  if (error) throw error;

  return { success: true };
}

export async function unsubscribeFromThread(messageId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("thread_subscriptions").upsert({
    user_id: user.id,
    message_id: messageId,
    subscribed: false,
  });

  if (error) throw error;

  return { success: true };
}
