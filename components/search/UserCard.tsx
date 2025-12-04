'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/presence/StatusBadge';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createOrGetDM } from '@/app/actions/conversations';

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
      const conversationId = await createOrGetDM(user.id);
      onClose?.();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Failed to create/get DM:', error);
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
