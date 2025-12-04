"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateUserStatus } from "@/app/actions/user-status";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const AWAY_TIMEOUT = 300000; // 5 minutes

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();
  
  // Initialize refs unconditionally
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);

  // Check authentication
  useEffect(() => {
    // Initialize lastActivity timestamp on client
    lastActivityRef.current = Date.now();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Presence tracking (only runs when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const sendHeartbeat = async () => {
      try {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        const status = timeSinceActivity > AWAY_TIMEOUT ? "away" : "online";
        await updateUserStatus(status);
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };

    const handleActivity = () => {
      lastActivityRef.current = Date.now();

      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }

      awayTimeoutRef.current = setTimeout(() => {
        updateUserStatus("away").catch(console.error);
      }, AWAY_TIMEOUT);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserStatus("away").catch(console.error);
      } else {
        lastActivityRef.current = Date.now();
        updateUserStatus("online").catch(console.error);
        handleActivity();
      }
    };

    const handleBeforeUnload = () => {
      updateUserStatus("offline").catch(console.error);
    };

    // Set initial online status
    updateUserStatus("online").catch(console.error);

    // Start heartbeat
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Set up activity tracking
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Initial away timeout
    awayTimeoutRef.current = setTimeout(() => {
      updateUserStatus("away").catch(console.error);
    }, AWAY_TIMEOUT);

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      updateUserStatus("offline").catch(console.error);
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
