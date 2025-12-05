"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function checkIsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return false;
  }

  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  return !!adminCheck;
}

export async function getAdminRole() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data: adminData } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .single();

  return adminData?.role || null;
}

export async function banUser({
  userId: targetUserId,
  reason,
  permanent = false,
  expiresAt,
}: {
  userId: string;
  reason: string;
  permanent?: boolean;
  expiresAt?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!adminCheck) {
    throw new Error("Admin access required");
  }

  // Don't allow banning yourself
  if (targetUserId === userId) {
    throw new Error("Cannot ban yourself");
  }

  // Check if target is admin (protect admins)
  const { data: targetAdminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", targetUserId)
    .single();

  if (targetAdminCheck) {
    throw new Error("Cannot ban admin users");
  }

  // Check if already banned
  const { data: existingBan } = await supabase
    .from("banned_users")
    .select("id")
    .eq("user_id", targetUserId)
    .single();

  if (existingBan) {
    throw new Error("User is already banned");
  }

  // Create ban
  const { error } = await supabase.from("banned_users").insert({
    user_id: targetUserId,
    banned_by: userId,
    reason,
    permanent,
    expires_at: expiresAt || null,
  });

  if (error) {
    console.error("Ban creation error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function unbanUser(targetUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!adminCheck) {
    throw new Error("Admin access required");
  }

  // Remove ban
  const { error } = await supabase
    .from("banned_users")
    .delete()
    .eq("user_id", targetUserId);

  if (error) {
    console.error("Unban error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!adminCheck) {
    throw new Error("Admin access required");
  }

  // Soft delete the message
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) {
    console.error("Message deletion error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getBannedUsers() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!adminCheck) {
    throw new Error("Admin access required");
  }

  const { data: bans, error } = await supabase
    .from("banned_users")
    .select(
      `
      id,
      user_id,
      reason,
      banned_at,
      expires_at,
      permanent
    `
    )
    .order("banned_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch bans:", error);
    throw new Error(error.message);
  }

  return bans;
}
