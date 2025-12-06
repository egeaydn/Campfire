"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getThreadMessages, sendThreadReply, getThreadCount } from "@/app/actions/threads";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ThreadViewProps {
  parentMessageId: string;
  parentContent: string;
  parentSender: {
    username: string;
    avatar_url: string | null;
  };
  parentCreatedAt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ThreadMessage {
  id: string;
  content: string | null;
  file_url: string | null;
  sender_id: string;
  sender_username: string;
  sender_avatar_url: string | null;
  created_at: string;
  edited_at: string | null;
}

export function ThreadView({
  parentMessageId,
  parentContent,
  parentSender,
  parentCreatedAt,
  open,
  onOpenChange,
}: ThreadViewProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [threadCount, setThreadCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadThread();
    }
  }, [open, parentMessageId]);

  const loadThread = async () => {
    setLoading(true);
    try {
      const [messagesData, count] = await Promise.all([
        getThreadMessages(parentMessageId),
        getThreadCount(parentMessageId),
      ]);
      setMessages(messagesData);
      setThreadCount(count);
    } catch (error) {
      console.error("Failed to load thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || sending) return;

    setSending(true);
    try {
      await sendThreadReply({
        parentMessageId,
        content: replyContent.trim(),
      });
      setReplyContent("");
      await loadThread();
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Thread
            {threadCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({threadCount} {threadCount === 1 ? "reply" : "replies"})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Parent Message */}
        <div className="px-6 py-4 bg-muted/50 border-b">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={parentSender.avatar_url || ""} />
              <AvatarFallback>
                {parentSender.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{parentSender.username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(parentCreatedAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{parentContent}</p>
            </div>
          </div>
        </div>

        {/* Thread Messages */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-[40vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.sender_avatar_url || ""} />
                    <AvatarFallback>
                      {message.sender_username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{message.sender_username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No replies yet. Be the first to reply!
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Reply Input */}
        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply... (Shift+Enter for new line)"
              className="min-h-[60px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyContent.trim() || sending}
              size="icon"
              className="self-end"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
