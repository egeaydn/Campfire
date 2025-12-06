"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// VAPID public key - gerçek uygulamada environment variable olmalı
const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY";

export function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
  };

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
      }
    }
    throw new Error("Service Worker not supported");
  };

  const subscribeToPush = async () => {
    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      await registration.update();

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(pushSubscription);

      // Save subscription to backend
      await saveSubscription(pushSubscription);

      toast({
        title: "Notifications Enabled",
        description: "You will now receive push notifications.",
      });
    } catch (error) {
      console.error("Failed to subscribe to push:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not enable push notifications.",
        variant: "destructive",
      });
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await deleteSubscription(subscription);
        setSubscription(null);

        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications.",
        });
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  const saveSubscription = async (pushSubscription: PushSubscription) => {
    const subscriptionData = {
      endpoint: pushSubscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(pushSubscription.getKey("p256dh")!),
        auth: arrayBufferToBase64(pushSubscription.getKey("auth")!),
      },
    };

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }
  };

  const deleteSubscription = async (pushSubscription: PushSubscription) => {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
    });
  };

  // Utility functions
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (!("Notification" in window)) {
    return null;
  }

  return (
    <div>
      {subscription ? (
        <Button
          onClick={unsubscribeFromPush}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          Notifications On
        </Button>
      ) : (
        <Button
          onClick={subscribeToPush}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <BellOff className="w-4 h-4" />
          Enable Notifications
        </Button>
      )}
    </div>
  );
}
