'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Check, X, MoreVertical, CheckCheck, Download, FileText, CornerUpLeft, MessageCircle } from 'lucide-react';
import { ReportButton } from '@/components/moderation/ReportButton';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { toggleReaction, getMessageReactions, getUserReactionsForMessage } from '@/app/actions/reactions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { editMessage, deleteMessage } from '@/app/actions/messages';

interface MessageItemProps {
  message: {
    id: string;
    content: string | null;
    file_url: string | null;
    created_at: string;
    edited_at: string | null;
    reply_to_id?: string | null;
    thread_count?: number;
    sender: {
      username: string;
      avatar_url: string | null;
    };
  };
  isOwn: boolean;
  isRead?: boolean; // For DM read receipts
  onReactionChange?: () => void; // Callback for realtime updates
  onReplyClick?: (messageId: string) => void; // Callback for reply button
  onThreadClick?: (messageId: string) => void; // Callback to open thread view
  parentMessage?: {
    id: string;
    content: string | null;
    sender: {
      username: string;
    };
  } | null;
}

export function MessageItem({ message, isOwn, isRead, onReactionChange, onReplyClick, onThreadClick, parentMessage }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState<Array<{ emoji: string; count: number; userIds: string[] }>>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);

  // Reaksiyonları yükle
  useEffect(() => {
    loadReactions();
  }, [message.id]);

  const loadReactions = async () => {
    try {
      const [messageReactions, userEmojis] = await Promise.all([
        getMessageReactions(message.id),
        getUserReactionsForMessage(message.id),
      ]);
      setReactions(messageReactions);
      setUserReactions(userEmojis);
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  };

  const handleReactionClick = async (emoji: string) => {
    try {
      await toggleReaction({ messageId: message.id, emoji });
      await loadReactions();
      onReactionChange?.();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleEdit = async () => {
    if (!editedContent.trim() || editedContent === message.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await editMessage(message.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMessage(message.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine if the file is an image
  const isImageFile = message.file_url && (
    message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
    message.file_url.includes('image/')
  );

  // Get file name from URL
  const getFileName = (url: string) => {
    return url.split('/').pop()?.split('?')[0] || 'file';
  };

  return (
    <>
      <div className={cn(
        "flex gap-3 group",
        isOwn && "flex-row-reverse"
      )}>
        {/* Avatar */}
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender.avatar_url || ''} />
          <AvatarFallback>
            {message.sender.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className={cn(
          "flex flex-col max-w-[70%]",
          isOwn && "items-end"
        )}>
          {/* Sender name + timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{message.sender.username}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
          </div>

          {/* Message bubble */}
          {isEditing ? (
            <div className="space-y-2 w-full">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit} disabled={loading}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(message.content || '');
                  }}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              {/* Parent Message Preview (if this is a reply) */}
              {parentMessage && (
                <div 
                  className={cn(
                    "mb-2 p-2 border-l-2 border-primary/50 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                    isOwn ? "ml-2" : "mr-2"
                  )}
                  onClick={() => onThreadClick?.(parentMessage.id)}
                >
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <CornerUpLeft className="w-3 h-3" />
                    <span>Reply to {parentMessage.sender.username}</span>
                  </div>
                  <p className="text-muted-foreground truncate">
                    {parentMessage.content || "Attachment"}
                  </p>
                </div>
              )}

              {message.content && (
                <div className={cn(
                  "px-4 py-2 rounded-2xl break-words",
                  isOwn 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-secondary rounded-tl-sm"
                )}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              )}

              {/* Message Actions (only for own messages) */}
              {isOwn && message.content && (
                <div className={cn(
                  "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  isOwn ? "right-full mr-2" : "left-full ml-2"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Report Button (for other users' messages) */}
              {!isOwn && (message.content || message.file_url) && (
                <div className={cn(
                  "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  "right-full mr-2"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <ReportButton messageId={message.id} variant="menuItem" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Delete only option for file-only messages */}
              {isOwn && !message.content && message.file_url && (
                <div className={cn(
                  "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  isOwn ? "right-full mr-2" : "left-full ml-2"
                )}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* File preview */}
          {message.file_url && (
            <div className="mt-2">
              {isImageFile ? (
                <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={message.file_url} 
                    alt="Attachment"
                    className="rounded-lg max-w-sm max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
              ) : (
                <a 
                  href={message.file_url} 
                  download
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors",
                    isOwn ? "bg-primary/10" : "bg-secondary/50"
                  )}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getFileName(message.file_url)}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to download</p>
                  </div>
                  <Download className="w-5 h-5 text-muted-foreground" />
                </a>
              )}
            </div>
          )}

          {/* Edited indicator */}
          {message.edited_at && !isEditing && (
            <span className="text-xs text-muted-foreground mt-1">
              (edited)
            </span>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors",
                    "hover:bg-accent border",
                    userReactions.includes(reaction.emoji)
                      ? "bg-accent border-primary"
                      : "bg-background border-border"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-muted-foreground">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker for adding reactions */}
          <div className="mt-1 flex items-center gap-2">
            <EmojiPicker onEmojiSelect={handleReactionClick} size="sm" />
            
            {/* Reply Button */}
            {onReplyClick && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReplyClick(message.id)}
                className="h-7 px-2 text-xs"
              >
                <CornerUpLeft className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            {/* Thread Count (if has replies) */}
            {message.thread_count && message.thread_count > 0 && onThreadClick && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onThreadClick(message.id)}
                className="h-7 px-2 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {message.thread_count} {message.thread_count === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          {/* Read receipt (only for own messages in DMs) */}
          {isOwn && isRead && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCheck className="w-3 h-3" />
              <span>Seen</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
