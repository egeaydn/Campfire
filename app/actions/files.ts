"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export async function uploadFile(formData: FormData) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File size exceeds 10MB limit" };
  }

  // Validate file type
  const allAllowedTypes = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents];
  if (!allAllowedTypes.includes(file.type)) {
    return { success: false, error: "File type not allowed" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  try {
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from("message-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("message-files").getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
