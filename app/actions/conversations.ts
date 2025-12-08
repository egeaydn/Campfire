'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOrGetDM(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const userId = user.id;

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
  console.log('[createOrGetDM] Creating conversation with userId:', userId);
  
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'dm',
      created_by: userId
    })
    .select()
    .single();

  if (convError) {
    console.error('[createOrGetDM] Insert error:', convError);
    console.error('[createOrGetDM] userId:', userId);
    throw new Error(`Failed to create conversation: ${convError.message} (userId: ${userId})`);
  }
  
  console.log('[createOrGetDM] Conversation created:', newConv.id);

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

export async function createGroup({
  title,
  memberIds,
  avatarUrl
}: {
  title: string;
  memberIds: string[];
  avatarUrl?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  const userId = user.sub;

  console.log('createGroup called:', { title, memberIds, userId });

  // Validate inputs
  if (!title.trim()) {
    throw new Error('Group title is required');
  }

  if (memberIds.length === 0) {
    throw new Error('At least one member is required');
  }

  // Create group conversation
  const { data: newGroup, error: groupError } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      title: title.trim(),
      avatar_url: avatarUrl || null,
      created_by: userId
    })
    .select()
    .single();

  if (groupError) {
    console.error('Group creation error:', groupError);
    throw new Error(groupError.message);
  }

  console.log('Group created:', newGroup);

  // Add creator as admin and all selected members
  const members = [
    { conversation_id: newGroup.id, user_id: userId, role: 'admin' }
  ];

  // Add all selected members (including creator if they selected themselves)
  memberIds.forEach(memberId => {
    // Don't add creator twice
    if (memberId !== userId) {
      members.push({
        conversation_id: newGroup.id,
        user_id: memberId,
        role: 'member'
      });
    }
  });

  console.log('Adding members to group:', members);

  const { data: insertedMembers, error: membersError } = await supabase
    .from('conversation_members')
    .insert(members)
    .select();

  if (membersError) {
    console.error('Members insert error:', membersError);
    // Try to clean up the conversation if member insertion fails
    await supabase.from('conversations').delete().eq('id', newGroup.id);
    throw new Error(`Failed to add members: ${membersError.message}`);
  }

  console.log('Members inserted successfully:', insertedMembers);

  revalidatePath('/');

  return newGroup.id;
}

export async function addGroupMember(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const currentUser = data?.claims;

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  // Check if current user is admin
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUser.sub)
    .single();

  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can add members');
  }

  // Add new member
  const { error } = await supabase
    .from('conversation_members')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member'
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/chat/${conversationId}`);
}

export async function removeGroupMember(conversationId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const currentUser = data?.claims;

  if (!currentUser) {
    throw new Error('Unauthorized');
  }

  console.log('Removing member:', { conversationId, userId, currentUserId: currentUser.sub });

  // Check if current user is admin
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', currentUser.sub)
    .single();

  console.log('Current user membership:', membership);

  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can remove members');
  }

  // Remove member
  const { error } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Remove member error:', error);
    throw new Error(error.message);
  }

  console.log('Member removed successfully');

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath('/');
}

export async function leaveGroup(conversationId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Remove user from conversation
  const { error } = await supabase
    .from('conversation_members')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', user.sub);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/');
}
