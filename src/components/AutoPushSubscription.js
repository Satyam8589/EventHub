"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

export default function AutoPushSubscription() {
  const { user, loading } = useAuth();
  const hasAttemptedSubscription = useRef(false);
  const previousUserId = useRef(null);

  useEffect(() => {
    // Only proceed if user is authenticated and we haven't attempted subscription for this user
    if (loading || !user || hasAttemptedSubscription.current === user.uid) {
      return;
    }

    // Check if this is a new user session (different from previous)
    if (previousUserId.current !== user.uid) {
      previousUserId.current = user.uid;
      hasAttemptedSubscription.current = user.uid;

      // Auto-enable push notifications
      const autoEnablePushNotifications = async () => {
        try {
          console.log(
            "🔔 Attempting to auto-enable push notifications for:",
            user.email
          );

          // Check if push notifications are supported
          if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window)
          ) {
            console.log("❌ Push notifications not supported in this browser");
            return;
          }

          // Check if permission is already denied
          if (Notification.permission === "denied") {
            console.log("❌ Push notifications denied by user previously");
            return;
          }

          // Check if already subscribed
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription =
            await registration.pushManager.getSubscription();

          if (existingSubscription) {
            console.log("✅ Already subscribed to push notifications");
            // Still save to server in case it's not synced
            try {
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  subscription: existingSubscription,
                  userId: user.uid,
                }),
              });
              console.log("✅ Synced existing subscription with server");
            } catch (syncError) {
              console.error("Error syncing subscription:", syncError);
            }
            return;
          }

          // Request permission if not already granted
          let permission = Notification.permission;
          if (permission === "default") {
            console.log("📋 Requesting notification permission...");
            permission = await Notification.requestPermission();
            console.log("📋 Permission result:", permission);
          }

          if (permission !== "granted") {
            console.log("❌ Notification permission not granted:", permission);
            return;
          }

          // Register service worker if not already registered
          let serviceWorkerRegistration;
          try {
            serviceWorkerRegistration = await navigator.serviceWorker.register(
              "/sw.js"
            );
            console.log("✅ Service Worker registered");
          } catch (swError) {
            console.error("❌ Service Worker registration failed:", swError);
            return;
          }

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log("✅ Service Worker ready");

          // Get VAPID public key
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            console.error("❌ VAPID public key not configured");
            return;
          }

          // Subscribe to push notifications
          console.log("📡 Subscribing to push notifications...");
          const pushSubscription =
            await serviceWorkerRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

          console.log(
            "✅ Push subscription created:",
            pushSubscription.endpoint
          );

          // Save subscription to server
          const response = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscription: pushSubscription,
              userId: user.uid,
            }),
          });

          if (response.ok) {
            console.log(
              "✅ Push notifications successfully enabled and saved for:",
              user.email
            );
          } else {
            const errorData = await response.json();
            console.error(
              "❌ Failed to save subscription to server:",
              errorData
            );
          }
        } catch (error) {
          console.error("❌ Error auto-enabling push notifications:", error);
        }
      };

      // Delay the subscription attempt to ensure everything is loaded
      const timer = setTimeout(() => {
        autoEnablePushNotifications();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // This component doesn't render anything
  return null;
}
