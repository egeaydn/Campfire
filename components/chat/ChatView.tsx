'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from '@/components/chat/MessageList';
import { Composer } from '@/components/chat/Composer';
import { GroupInfo } from '@/components/groups/GroupInfo';
import { StatusBadge } from '@/components/presence/StatusBadge';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
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
  const [typingUsers, setTypingUsers] = useState<Array<{ user_id: string; username: string }>>([]);
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

  // Check if current user is admin (for groups)
  const currentUserMembership = conversation.conversation_members.find(
    (m: any) => m.user_id === currentUserId
  );
  const isAdmin = currentUserMembership?.role === 'admin';

  useEffect(() => {
    loadMessages();
    const messagesCleanup = subscribeToMessages();
    const reactionsCleanup = subscribeToReactions();
    const typingCleanup = subscribeToTyping();
    
    // Mark messages as read when viewing conversation
    markMessagesAsRead(conversation.id);

    return () => {
      messagesCleanup();
      reactionsCleanup();
      typingCleanup();
    };
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

  // Reaksiyon güncellemelerini dinle
  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`reactions:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE hepsini dinle
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          // MessageList'i yeniden render et - reaksiyonlar değiştiğinde
          // Her mesaj kendi reaksiyonlarını yükleyecek
          setMessages((prev) => [...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Typing indicator'ları dinle
  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing:${conversation.id}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { user_id, username, isTyping } = payload.payload;
        
        // Kendi typing'imizi gösterme
        if (user_id === currentUserId) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            // Kullanıcı yazıyor - listeye ekle (zaten yoksa)
            if (!prev.find((u) => u.user_id === user_id)) {
              return [...prev, { user_id, username }];
            }
          } else {
            // Kullanıcı yazmayı bıraktı - listeden çıkar
            return prev.filter((u) => u.user_id !== user_id);
          }
          return prev;
        });
      })
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

        <div className="flex-1">
          <h3 className="font-semibold">{chatTitle}</h3>
          {conversation.type === 'dm' && otherMember ? (
            <StatusBadge userId={otherMember.user_id} showText />
          ) : (
            <p className="text-sm text-muted-foreground">
              {conversation.conversation_members.length} members
            </p>
          )}
        </div>

        {/* Group Info Button */}
        {conversation.type === 'group' && (
          <GroupInfo
            conversationId={conversation.id}
            members={conversation.conversation_members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        )}
      </header>

      {/* Messages */}
      <MessageList 
        messages={messages} 
        currentUserId={currentUserId} 
        loading={loading}
        conversationType={conversation.type}
      />

      {/* Typing Indicator */}
      <TypingIndicator usernames={typingUsers.map((u) => u.username)} />

      {/* Composer */}
      <Composer 
        conversationId={conversation.id}
        userId={currentUserId}
        username={currentUserMembership?.profile?.username}
      />
    </div>
  );
}
