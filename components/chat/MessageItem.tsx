'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Check, X, MoreVertical, CheckCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
    sender: {
      username: string;
      avatar_url: string | null;
    };
  };
  isOwn: boolean;
  isRead?: boolean; // For DM read receipts
}

export function MessageItem({ message, isOwn, isRead }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

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
              {isOwn && (
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
            </div>
          )}

          {/* File preview */}
          {message.file_url && (
            <img 
              src={message.file_url} 
              alt="Attachment"
              className="mt-2 rounded-lg max-w-full h-auto"
            />
          )}

          {/* Edited indicator */}
          {message.edited_at && !isEditing && (
            <span className="text-xs text-muted-foreground mt-1">
              (edited)
            </span>
          )}

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
