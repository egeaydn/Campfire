'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessage({
  conversationId,
  content,
  fileUrl
}: {
  conversationId: string;
  content?: string;
  fileUrl?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.sub,
      content: content || null,
      file_url: fileUrl || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath(`/chat/${conversationId}`);

  return message;
}

export async function editMessage(messageId: string, content: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: message, error } = await supabase
    .from('messages')
    .update({
      content,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', user.sub) // Only allow editing own messages
    .select()
    .single();

  if (error) throw new Error(error.message);
  return message;
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.sub); // Only allow deleting own messages

  if (error) throw new Error(error.message);
}
