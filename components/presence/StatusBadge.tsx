"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type UserStatus = "online" | "offline" | "away";

interface StatusBadgeProps {
  userId: string;
  showText?: boolean;
  className?: string;
}

export function StatusBadge({ userId, showText = false, className }: StatusBadgeProps) {
  const [status, setStatus] = useState<UserStatus>("offline");
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Load initial status
    loadStatus();

    // Subscribe to status changes
    const channel = supabase
      .channel(`user_status:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as any;
            setStatus(newData.status);
            setLastSeen(newData.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadStatus = async () => {
    const { data } = await supabase
      .from("user_status")
      .select("status, last_seen")
      .eq("user_id", userId)
      .single();

    if (data) {
      setStatus(data.status);
      setLastSeen(data.last_seen);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "offline":
        if (lastSeen) {
          return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
        }
        return "Offline";
      default:
        return "Offline";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            getStatusColor(),
            status === "online" && "animate-pulse"
          )}
        />
      </div>
      {showText && (
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      )}
    </div>
  );
}
