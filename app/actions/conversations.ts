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

  // Check if DM already exists between these two users
  const { data: existingConversations } = await supabase
    .from('conversations')
    .select(`
      id,
      conversation_members!inner(user_id)
    `)
    .eq('type', 'dm');

  // Find DM that has exactly these two users
  let existingDM = null;
  if (existingConversations) {
    for (const conv of existingConversations) {
      const memberIds = conv.conversation_members.map((m: any) => m.user_id);
      if (
        memberIds.length === 2 &&
        memberIds.includes(userId) &&
        memberIds.includes(otherUserId)
      ) {
        existingDM = conv;
        break;
      }
    }
  }

  if (existingDM) {
    return existingDM.id;
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
