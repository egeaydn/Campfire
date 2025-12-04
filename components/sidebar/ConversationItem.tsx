'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/presence/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: {
    id: string;
    type: 'dm' | 'group';
    title: string | null;
    avatar_url: string | null;
    updated_at: string;
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
  };
  currentUserId: string;
}

export function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const router = useRouter();

  // Get display info based on conversation type
  const otherMember = conversation.type === 'dm'
    ? conversation.conversation_members.find(m => m.user_id !== currentUserId)
    : null;

  const displayName = conversation.type === 'dm' && otherMember
    ? otherMember.profile.display_name || otherMember.profile.username
    : conversation.title || 'Group Chat';

  const avatarUrl = conversation.type === 'dm' && otherMember
    ? otherMember.profile.avatar_url
    : conversation.avatar_url;

  const lastMessage = conversation.messages[0];
  const lastMessagePreview = lastMessage?.content
    ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '')
    : 'No messages yet';

  const isOwnMessage = lastMessage?.sender_id === currentUserId;
  const messageTime = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })
    : '';

  return (
    <div
      className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-colors"
      onClick={() => router.push(`/chat/${conversation.id}`)}
    >
      {/* Avatar with Status Badge */}
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatarUrl || ''} />
          <AvatarFallback>
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {/* Show status badge only for DMs */}
        {conversation.type === 'dm' && otherMember && (
          <div className="absolute bottom-0 right-0">
            <StatusBadge userId={otherMember.user_id} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold truncate">{displayName}</h3>
          {lastMessage && (
            <span className="text-xs text-muted-foreground">{messageTime}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {isOwnMessage && lastMessage && 'You: '}
          {lastMessagePreview}
        </p>
      </div>

      {/* Unread Badge (placeholder for future) */}
      {/* <Badge variant="default" className="ml-2">3</Badge> */}
    </div>
  );
}
