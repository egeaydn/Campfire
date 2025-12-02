// app/actions/profile.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpdateProfileInput {
  username: string;
  display_name?: string;
  bio?: string;
}

export async function updateProfile(data: UpdateProfileInput) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const user = authData?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const userId = user.sub;

  // Check if username is taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', data.username)
    .neq('id', userId)
    .single();

  if (existingUser) {
    throw new Error('Username already taken');
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      username: data.username,
      display_name: data.display_name || data.username,
      bio: data.bio,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  revalidatePath('/');
  revalidatePath('/profile/complete');
  return { success: true };
}

export async function checkUsername(username: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  return { available: !data };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const userId = user.sub;

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Clean filename and create safe path
  const fileExt = file.name.split('.').pop();
  const cleanFileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${cleanFileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  revalidatePath('/');
  return { url: publicUrl };
}
