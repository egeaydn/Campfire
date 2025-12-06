"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Mesaja reaksiyon ekle
 * Kullanıcı aynı mesaja aynı emojiyi sadece bir kez ekleyebilir
 */
export async function addReaction({
  messageId,
  emoji,
}: {
  messageId: string;
  emoji: string;
}) {
  const supabase = await createClient();

  // Kullanıcıyı kontrol et
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Reaksiyonu ekle (unique constraint sayesinde duplicate olmaz)
  const { data, error } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji: emoji,
    })
    .select()
    .single();

  if (error) {
    // Duplicate key error (23505) - kullanıcı zaten bu reaksiyonu eklemiş
    if (error.code === "23505") {
      return { success: false, message: "Bu reaksiyonu zaten eklediniz" };
    }
    throw new Error(error.message);
  }

  return { success: true, data };
}

/**
 * Reaksiyonu kaldır
 */
export async function removeReaction({
  messageId,
  emoji,
}: {
  messageId: string;
  emoji: string;
}) {
  const supabase = await createClient();

  // Kullanıcıyı kontrol et
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Reaksiyonu sil
  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Mesajın tüm reaksiyonlarını getir
 * Emoji bazında gruplanmış, kaç kişinin eklediği ve kimler olduğu
 */
export async function getMessageReactions(messageId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_reactions")
    .select("emoji, user_id")
    .eq("message_id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  // Emoji'lere göre grupla ve say
  const grouped = data.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          userIds: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].userIds.push(reaction.user_id);
      return acc;
    },
    {} as Record<
      string,
      { emoji: string; count: number; userIds: string[] }
    >
  );

  // Objeyi array'e çevir ve sayıya göre sırala
  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

/**
 * Kullanıcının bir mesaja eklediği reaksiyonları getir
 */
export async function getUserReactionsForMessage(messageId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("message_reactions")
    .select("emoji")
    .eq("message_id", messageId)
    .eq("user_id", user.id);

  if (error) {
    return [];
  }

  return data.map((r) => r.emoji);
}

/**
 * Reaksiyonu toggle et (varsa kaldır, yoksa ekle)
 */
export async function toggleReaction({
  messageId,
  emoji,
}: {
  messageId: string;
  emoji: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Önce reaksiyonun var olup olmadığını kontrol et
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    // Reaksiyon varsa kaldır
    return await removeReaction({ messageId, emoji });
  } else {
    // Reaksiyon yoksa ekle
    return await addReaction({ messageId, emoji });
  }
}
