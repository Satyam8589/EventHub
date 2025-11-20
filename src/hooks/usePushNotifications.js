"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    try {
      if (!isSupported) {
        throw new Error("Push notifications are not supported");
      }

      // Request permission if not granted
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error("Notification permission denied");
        }
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);

      // Save subscription to server
      console.log("Saving subscription for user:", user?.uid, user?.email);
      if (user) {
        await saveSubscriptionToServer(pushSubscription);
      } else {
        console.warn("No user logged in - subscription saved locally only");
      }

      console.log("Push notification subscription:", pushSubscription);
      return pushSubscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      if (!subscription) {
        return;
      }

      // Remove subscription from server FIRST
      if (user) {
        await removeSubscriptionFromServer(subscription);
      }

      // Then unsubscribe from push manager
      await subscription.unsubscribe();
      
      setSubscription(null);
      setIsSubscribed(false);

      console.log("Unsubscribed from push notifications");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      
      // Even if there's an error, try to clean up local state
      setSubscription(null);
      setIsSubscribed(false);
      
      throw error;
    }
  };

  // Save subscription to server
  const saveSubscriptionToServer = async (subscription) => {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving subscription to server:", error);
      throw error;
    }
  };

  // Remove subscription from server
  const removeSubscriptionFromServer = async (subscription) => {
    try {
      const response = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove subscription");
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing subscription from server:", error);
      throw error;
    }
  };

  // Check existing subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    requestPermission,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
