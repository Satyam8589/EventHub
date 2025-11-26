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
  const subscriptionAttempted = useRef(new Set());

  useEffect(() => {
    // Wait for auth to complete
    if (loading) {
      return;
    }

    // Only proceed if user is authenticated
    if (!user || !user.uid) {
      return;
    }

    // Check if we've already attempted for this user
    if (subscriptionAttempted.current.has(user.uid)) {
      return;
    }

    // Mark this user as attempted
    subscriptionAttempted.current.add(user.uid);

    console.log("🔔 AutoPush: Starting for user:", user.email);

    // Delay to ensure page is fully loaded
    const timer = setTimeout(async () => {
      try {
        // Check browser support
        if (
          typeof window === "undefined" ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          console.log(
            "❌ AutoPush: Browser doesn't support push notifications"
          );
          return;
        }

        console.log("✅ AutoPush: Browser supports push notifications");

        // Check current permission
        if (Notification.permission === "denied") {
          console.log("❌ AutoPush: Notifications denied");
          return;
        }

        // Register service worker first
        let registration;
        try {
          const existing = await navigator.serviceWorker.getRegistration("/");
          if (existing) {
            registration = existing;
            console.log("✅ AutoPush: Using existing service worker");
          } else {
            registration = await navigator.serviceWorker.register("/sw.js");
            console.log("✅ AutoPush: Service worker registered");
          }
        } catch (swError) {
          console.error("❌ AutoPush: Service worker error:", swError);
          return;
        }

        // Wait for it to be ready
        await navigator.serviceWorker.ready;
        console.log("✅ AutoPush: Service worker ready");

        // Check for existing subscription
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          console.log("✅ AutoPush: Already subscribed, syncing...");
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: existing,
              userId: user.uid,
            }),
          });
          console.log("✅ AutoPush: Synced with server");
          return;
        }

        // Request permission
        let permission = Notification.permission;
        if (permission === "default") {
          console.log("📋 AutoPush: Requesting permission...");
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.log("❌ AutoPush: Permission not granted");
          return;
        }

        console.log("✅ AutoPush: Permission granted");

        // Get VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error("❌ AutoPush: VAPID key missing");
          return;
        }

        // Subscribe
        console.log("📡 AutoPush: Creating subscription...");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        console.log("✅ AutoPush: Subscription created");

        // Save to server
        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription,
            userId: user.uid,
          }),
        });

        if (response.ok) {
          console.log(
            "✅ AutoPush: SUCCESS! Notifications enabled for",
            user.email
          );
        } else {
          console.error(
            "❌ AutoPush: Server save failed:",
            await response.text()
          );
        }
      } catch (error) {
        console.error("❌ AutoPush: Error:", error);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return null;
}
