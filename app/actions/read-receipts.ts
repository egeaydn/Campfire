'use server';

import { createClient } from '@/lib/supabase/server';

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get all unread messages in this conversation
  const { data: messages } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.sub);

  if (!messages || messages.length === 0) {
    return;
  }

  const messageIds = messages.map((m) => m.id);

  // Upsert read receipts (insert or update)
  const receipts = messageIds.map((messageId) => ({
    message_id: messageId,
    user_id: user.sub,
    read_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('read_receipts')
    .upsert(receipts, {
      onConflict: 'message_id,user_id',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to mark messages as read:', error);
  }
}

export async function getReadReceipts(messageIds: string[]) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('read_receipts')
    .select(`
      message_id,
      user_id,
      read_at,
      user:profiles(username, avatar_url)
    `)
    .in('message_id', messageIds);

  if (error) {
    console.error('Failed to get read receipts:', error);
    return [];
  }

  return data;
}
