"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export async function reportMessage({
  messageId,
  reason,
  description,
}: {
  messageId: string;
  reason: ReportReason;
  description?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get the message to find the reported user
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", messageId)
    .single();

  if (messageError || !message) {
    throw new Error("Message not found");
  }

  // Don't allow reporting own messages
  if (message.sender_id === userId) {
    throw new Error("Cannot report your own message");
  }

  // Check if already reported by this user
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", userId)
    .eq("reported_message_id", messageId)
    .single();

  if (existing) {
    throw new Error("You have already reported this message");
  }

  // Create report
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_message_id: messageId,
    reason,
    description: description || null,
    status: "pending",
  });

  if (error) {
    console.error("Report creation error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function reportUser({
  userId: reportedUserId,
  reason,
  description,
}: {
  userId: string;
  reason: ReportReason;
  description?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Don't allow reporting yourself
  if (reportedUserId === userId) {
    throw new Error("Cannot report yourself");
  }

  // Check if already reported by this user
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", userId)
    .eq("reported_user_id", reportedUserId)
    .single();

  if (existing) {
    throw new Error("You have already reported this user");
  }

  // Create report
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_user_id: reportedUserId,
    reason,
    description: description || null,
    status: "pending",
  });

  if (error) {
    console.error("Report creation error:", error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getReports({
  status,
  limit = 50,
}: {
  status?: ReportStatus;
  limit?: number;
} = {}) {
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

  let query = supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      description,
      status,
      created_at,
      updated_at,
      resolved_at,
      admin_notes,
      reporter_id,
      reported_user_id,
      reported_message_id
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: reports, error } = await query;

  if (error) {
    console.error("Failed to fetch reports:", error);
    throw new Error(error.message);
  }

  return reports;
}

export async function updateReportStatus({
  reportId,
  status,
  adminNotes,
}: {
  reportId: string;
  status: ReportStatus;
  adminNotes?: string;
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

  const updateData: any = {
    status,
    resolved_by: userId,
  };

  if (status === "resolved" || status === "dismissed") {
    updateData.resolved_at = new Date().toISOString();
  }

  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData)
    .eq("id", reportId);

  if (error) {
    console.error("Failed to update report:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/reports");
}
