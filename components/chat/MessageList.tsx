'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  conversationType?: 'dm' | 'group';
}

export function MessageList({ messages, currentUserId, loading, conversationType }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-2">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId;
        // In DMs, show "seen" for own messages (simplified for MVP)
        const isRead = conversationType === 'dm' && isOwn;
        
        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={isOwn}
            isRead={isRead}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
