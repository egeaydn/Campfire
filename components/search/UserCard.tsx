'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/presence/StatusBadge';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UserCardProps {
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  onClose?: () => void;
}

export function UserCard({ user, onClose }: UserCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMessage = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Find existing DM conversation
      const { data: myConversations } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      let conversationId: string | null = null;

      if (myConversations && myConversations.length > 0) {
        const conversationIds = myConversations.map(c => c.conversation_id);

        // Find shared DM with other user
        const { data: sharedConversations } = await supabase
          .from('conversation_members')
          .select(`
            conversation_id,
            conversations!inner(id, type)
          `)
          .eq('user_id', user.id)
          .in('conversation_id', conversationIds)
          .eq('conversations.type', 'dm');

        if (sharedConversations && sharedConversations.length > 0) {
          conversationId = sharedConversations[0].conversation_id;
        }
      }

      // Create new conversation if not exists
      if (!conversationId) {
        console.log('[UserCard] Creating new conversation for user:', currentUser.id);
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            type: 'dm',
            created_by: currentUser.id
          })
          .select()
          .single();

        if (convError) {
          console.error('[UserCard] Conversation insert error:', convError);
          throw convError;
        }
        console.log('[UserCard] Conversation created:', newConv.id);

        // Add both users as members
        const { error: membersError } = await supabase
          .from('conversation_members')
          .insert([
            { conversation_id: newConv.id, user_id: currentUser.id },
            { conversation_id: newConv.id, user_id: user.id }
          ]);

        if (membersError) {
          console.error('[UserCard] Members insert error:', membersError);
          throw membersError;
        }
        
        console.log('[UserCard] Members added successfully');
        conversationId = newConv.id;
      }

      console.log('[UserCard] Navigating to conversation:', conversationId);
      onClose?.();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Failed to create/get DM:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback>
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0">
          <StatusBadge userId={user.id} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.display_name || user.username}</p>
        <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
      </div>

      <Button 
        size="sm" 
        onClick={handleMessage}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <MessageSquare className="w-4 h-4 mr-1" />
            Message
          </>
        )}
      </Button>
    </div>
  );
}
