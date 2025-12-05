"use server";

import { createClient } from "@/lib/supabase/server";

export type UserStatus = "online" | "offline" | "away";

export async function updateUserStatus(status: UserStatus) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    // User not authenticated, silently return
    return;
  }

  const { error } = await supabase
    .from("user_status")
    .upsert(
      {
        user_id: userId,
        status,
        last_seen: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Failed to update status:", error);
    throw new Error(error.message);
  }
}

export async function getUserStatus(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_status")
    .select("status, last_seen")
    .eq("user_id", userId)
    .single();

  if (error) {
    return { status: "offline" as UserStatus, last_seen: null };
  }

  return {
    status: data.status as UserStatus,
    last_seen: data.last_seen,
  };
}

export async function getMultipleUserStatuses(userIds: string[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_status")
    .select("user_id, status, last_seen")
    .in("user_id", userIds);

  if (error) {
    console.error("Failed to fetch statuses:", error);
    return [];
  }

  return data;
}
