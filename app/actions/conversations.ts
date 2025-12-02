'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOrGetDM(otherUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const userId = user.sub;

  // Find all DM conversations where current user is a member
  const { data: myConversations } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (myConversations && myConversations.length > 0) {
    const conversationIds = myConversations.map(c => c.conversation_id);

    // Find conversations where other user is also a member
    const { data: sharedConversations } = await supabase
      .from('conversation_members')
      .select(`
        conversation_id,
        conversations!inner(id, type)
      `)
      .eq('user_id', otherUserId)
      .in('conversation_id', conversationIds)
      .eq('conversations.type', 'dm');

    if (sharedConversations && sharedConversations.length > 0) {
      // Return the first shared DM conversation
      return sharedConversations[0].conversation_id;
    }
  }

  // Create new DM conversation
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'dm',
      created_by: userId
    })
    .select()
    .single();

  if (convError) {
    throw new Error(convError.message);
  }

  // Add both users as members
  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert([
      { conversation_id: newConv.id, user_id: userId },
      { conversation_id: newConv.id, user_id: otherUserId }
    ]);

  if (membersError) {
    throw new Error(membersError.message);
  }

  revalidatePath('/');

  return newConv.id;
}

export async function getConversations() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      type,
      title,
      created_at,
      updated_at,
      conversation_members!inner(
        user_id,
        profile:profiles(username, display_name, avatar_url)
      )
    `)
    .eq('conversation_members.user_id', user.sub)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return conversations;
}
