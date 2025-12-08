'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConversationItem } from '@/components/sidebar/ConversationItem';
import { SearchBar } from '@/components/search/SearchBar';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  type: 'dm' | 'group';
  title: string | null;
  avatar_url: string | null;
  updated_at: string;
  is_group: boolean;
  conversation_members: Array<{
    user_id: string;
    profile: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  }>;
  messages: Array<{
    content: string | null;
    created_at: string;
    sender_id: string;
  }>;
}

interface ConversationListProps {
  currentUserId: string;
}

export function ConversationList({ currentUserId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadConversations();
    subscribeToConversations();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  const loadConversations = async () => {
    try {
      // First, get conversation IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (memberError) {
        console.error('Error fetching member data:', memberError);
        throw memberError;
      }
      
      if (!memberData || memberData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = memberData.map((m) => m.conversation_id);

      // Get full conversation details
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          title,
          avatar_url,
          updated_at,
          conversation_members(
            user_id,
            profile:profiles(username, display_name, avatar_url)
          ),
          messages(content, created_at, sender_id)
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      if (data) {
        console.log('Loaded conversations:', data);
        // Get last message for each conversation
        const conversationsWithLastMessage = data.map((conv: any) => ({
          ...conv,
          is_group: conv.type === 'group', // Calculate is_group from type
          messages: conv.messages
            .sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .slice(0, 1)
        }));
        setConversations(conversationsWithLastMessage);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Show user-friendly error
      alert('Failed to load conversations. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    // Subscribe to new messages to update conversation list
    const channel = supabase
      .channel('conversation-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${currentUserId}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </Button>
        </div>
        <SearchBar />
        
        {/* Create Group Button */}
        <div className="px-4 pt-2">
          <CreateGroupDialog />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="space-y-2">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Search for users to start chatting!
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
