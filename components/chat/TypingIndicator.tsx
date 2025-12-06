"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  usernames: string[];
  className?: string;
}

export function TypingIndicator({ usernames, className }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const displayText =
    usernames.length === 1
      ? `${usernames[0]} is typing...`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing...`
      : `${usernames[0]} and ${usernames.length - 1} others are typing...`;

  return (
    <div className={cn("px-4 py-2 text-sm text-muted-foreground", className)}>
      <div className="flex items-center gap-2">
        <span>{displayText}</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
