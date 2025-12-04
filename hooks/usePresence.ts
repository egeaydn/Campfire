"use client";

import { useEffect, useRef } from "react";
import { updateUserStatus } from "@/app/actions/user-status";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const AWAY_TIMEOUT = 300000; // 5 minutes

export function usePresence() {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

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
    
    // Clear and reset away timeout
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    awayTimeoutRef.current = setTimeout(() => {
      updateUserStatus("away").catch(console.error);
    }, AWAY_TIMEOUT);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab is hidden, set as away
      updateUserStatus("away").catch(console.error);
    } else {
      // Tab is visible again, set as online
      lastActivityRef.current = Date.now();
      updateUserStatus("online").catch(console.error);
      handleActivity();
    }
  };

  const handleBeforeUnload = () => {
    // Set offline when user closes/navigates away
    // Use sendBeacon for reliability
    const formData = new FormData();
    formData.append("status", "offline");
    
    // Fallback to sync request
    updateUserStatus("offline").catch(console.error);
  };

  useEffect(() => {
    // Set initial online status
    updateUserStatus("online").catch(console.error);

    // Start heartbeat
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Set up activity tracking
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Set up visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up beforeunload
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

      // Set offline on unmount
      updateUserStatus("offline").catch(console.error);
    };
  }, []);

  return null;
}
