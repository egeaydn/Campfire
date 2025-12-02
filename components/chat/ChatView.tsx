'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { markMessagesAsRead } from '@/app/actions/read-receipts';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  created_at: string;
  edited_at: string | null;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatViewProps {
  conversation: any;
  currentUserId: string;
}

export function ChatView({ conversation, currentUserId }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Get other user info for DM
  const otherMember = conversation.type === 'dm' 
    ? conversation.conversation_members.find((m: any) => m.user_id !== currentUserId)
    : null;

  const chatTitle = conversation.type === 'dm' && otherMember
    ? otherMember.profile.display_name || otherMember.profile.username
    : conversation.title || 'Group Chat';

  const chatAvatar = conversation.type === 'dm' && otherMember
    ? otherMember.profile.avatar_url
    : null;

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    
    // Mark messages as read when viewing conversation
    markMessagesAsRead(conversation.id);
  }, [conversation.id]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        file_url,
        created_at,
        edited_at,
        sender:profiles(username, avatar_url)
      `)
      .eq('conversation_id', conversation.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as any);
    }
    setLoading(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          // Fetch sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              file_url,
              created_at,
              edited_at,
              sender:profiles(username, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            setMessages((prev) => [...prev, message as any]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatAvatar || ''} />
          <AvatarFallback>
            {chatTitle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div>
          <h3 className="font-semibold">{chatTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'dm' ? 'Direct Message' : `${conversation.conversation_members.length} members`}
          </p>
        </div>
      </header>

      {/* Messages */}
      <MessageList 
        messages={messages} 
        currentUserId={currentUserId} 
        loading={loading}
        conversationType={conversation.type}
      />

      {/* Composer */}
      <Composer conversationId={conversation.id} />
    </div>
  );
}
