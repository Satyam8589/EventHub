"use client";
import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";

export default function TestPushPage() {
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkServiceWorker = async () => {
    setLoading(true);
    addLog("Checking service worker status...");

    try {
      if (!("serviceWorker" in navigator)) {
        addLog("❌ Service Worker not supported");
        setTestResult("❌ Service Worker not supported in this browser");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration) {
        addLog("❌ No service worker registered");
        setTestResult(
          "❌ No service worker registered. Try refreshing the page."
        );
      } else {
        addLog(`✅ Service worker registered: ${registration.scope}`);
        addLog(`Active: ${registration.active ? "Yes" : "No"}`);
        addLog(`Installing: ${registration.installing ? "Yes" : "No"}`);
        addLog(`Waiting: ${registration.waiting ? "Yes" : "No"}`);

        setTestResult(
          `✅ Service Worker Active\nScope: ${registration.scope}\nState: ${
            registration.active?.state || "unknown"
          }`
        );
      }

      // Check notification permission
      addLog(`Notification permission: ${Notification.permission}`);

      if (Notification.permission === "denied") {
        addLog(
          "❌ Notification permission denied - please enable in browser settings"
        );
        setTestResult(
          "❌ Notification permission denied. Please enable notifications in your browser settings."
        );
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setTestResult(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const testLocalNotification = async () => {
    addLog("Testing local notification (no server)...");

    try {
      if (Notification.permission !== "granted") {
        addLog("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        addLog(`Permission result: ${permission}`);

        if (permission !== "granted") {
          setTestResult("❌ Permission denied");
          return;
        }
      }

      addLog("Showing test notification...");

      const notification = new Notification("🧪 Test Notification", {
        body: "If you can see this, browser notifications work!",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test-local",
        requireInteraction: false,
      });

      notification.onclick = () => {
        addLog("✅ Notification clicked!");
        notification.close();
      };

      addLog("✅ Local notification sent!");
      setTestResult("✅ Local notification sent! Did you see it?");
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setTestResult(`❌ Failed: ${error.message}`);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setTestResult("Attempting to subscribe...");
    addLog("Starting subscription process...");
    try {
      const result = await subscribe();
      addLog("✅ Subscribed successfully!");
      setTestResult(
        `✅ Subscribed successfully!\nEndpoint: ${result.endpoint.substring(
          0,
          50
        )}...`
      );
    } catch (error) {
      addLog(`❌ Subscription failed: ${error.message}`);
      setTestResult(`❌ Subscription failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setTestResult("Unsubscribing...");
    addLog("Unsubscribing...");
    try {
      await unsubscribe();
      addLog("✅ Unsubscribed successfully!");
      setTestResult("✅ Unsubscribed successfully!");
    } catch (error) {
      addLog(`❌ Unsubscribe failed: ${error.message}`);
      setTestResult(`❌ Unsubscribe failed: ${error.message}`);
    }
    setLoading(false);
  };

  const sendTestNotification = async () => {
    if (!subscription) {
      setTestResult("❌ Please subscribe first!");
      addLog("❌ No subscription found");
      return;
    }

    setLoading(true);
    setTestResult("Sending test notification...");
    addLog("Sending push notification to server...");

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.uid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addLog("✅ Server sent notification successfully!");
        addLog(
          `Successful: ${data.result.successful}, Failed: ${data.result.failed}`
        );

        // Log failed subscriptions
        data.result.results.forEach((result, index) => {
          if (result.status === "fulfilled" && !result.value.success) {
            const endpoint =
              result.value.endpoint?.substring(
                result.value.endpoint.lastIndexOf("/") + 1,
                result.value.endpoint.lastIndexOf("/") + 20
              ) || "unknown";
            addLog(
              `❌ Failed subscription: ...${endpoint}... - ${result.value.error}`
            );
          }
        });

        setTestResult(
          `✅ Test notification sent!\nSuccessful: ${data.result.successful}/${
            data.result.total
          }\n${JSON.stringify(data, null, 2)}`
        );
      } else {
        addLog(`❌ Server error: ${data.error}`);
        setTestResult(`❌ Failed to send: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Request error: ${error.message}`);
      setTestResult(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const checkSubscriptionInDB = async () => {
    if (!user) {
      setTestResult("❌ Please sign in first!");
      addLog("❌ No user signed in");
      return;
    }

    setLoading(true);
    setTestResult("Checking database...");
    addLog("Querying database for subscriptions...");

    try {
      const response = await fetch(`/api/push/check?userId=${user.uid}`);
      const data = await response.json();

      if (response.ok) {
        addLog(`✅ Found ${data.count} subscription(s) in database`);
        setTestResult(
          `✅ Subscriptions in DB: ${data.count}\n${JSON.stringify(
            data,
            null,
            2
          )}`
        );
      } else {
        addLog(`❌ Database check failed: ${data.error}`);
        setTestResult(`❌ Check failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setTestResult(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  const cleanupInvalidSubscriptions = async () => {
    if (!user) {
      setTestResult("❌ Please sign in first!");
      addLog("❌ No user signed in");
      return;
    }

    setLoading(true);
    setTestResult("Cleaning up invalid subscriptions...");
    addLog("Starting cleanup of invalid subscriptions...");

    try {
      const response = await fetch("/api/push/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addLog(
          `✅ Cleanup complete: Removed ${data.removed} invalid subscription(s)`
        );
        addLog(`Remaining: ${data.remaining} valid subscription(s)`);
        setTestResult(
          `✅ Cleanup Complete!\nRemoved: ${data.removed}\nRemaining: ${
            data.remaining
          }\n${JSON.stringify(data, null, 2)}`
        );
      } else {
        addLog(`❌ Cleanup failed: ${data.error}`);
        setTestResult(`❌ Cleanup failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
      setTestResult(`❌ Error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            🔔 Push Notification Test
          </h1>

          {/* Status Section */}
          <div className="bg-black/20 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Current Status
            </h2>
            <div className="space-y-2 text-white/80">
              <p>
                <strong>Browser Support:</strong>{" "}
                {isSupported ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Permission:</strong>{" "}
                <span
                  className={
                    permission === "granted"
                      ? "text-green-400"
                      : permission === "denied"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {permission}
                </span>
              </p>
              <p>
                <strong>Subscribed:</strong> {isSubscribed ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>User:</strong>{" "}
                {user ? `✅ ${user.email}` : "❌ Not signed in"}
              </p>
              {subscription && (
                <p className="text-xs break-all mt-2">
                  <strong>Endpoint:</strong> {subscription.endpoint}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={checkServiceWorker}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              🔍 Check Service Worker
            </button>

            <button
              onClick={testLocalNotification}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              🧪 Test Local Notification
            </button>

            <button
              onClick={handleSubscribe}
              disabled={loading || !isSupported || isSubscribed}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "⏳ Working..." : "🔔 Subscribe"}
            </button>

            <button
              onClick={handleUnsubscribe}
              disabled={loading || !isSubscribed}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "⏳ Working..." : "🔕 Unsubscribe"}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={loading || !isSubscribed}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "⏳ Sending..." : "📨 Send Test Notification"}
            </button>

            <button
              onClick={checkSubscriptionInDB}
              disabled={loading || !user}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "⏳ Checking..." : "🔍 Check Database"}
            </button>

            <button
              onClick={cleanupInvalidSubscriptions}
              disabled={loading || !user}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              {loading ? "⏳ Cleaning..." : "🧹 Cleanup Invalid"}
            </button>
          </div>

          {/* Logs Display */}
          {logs.length > 0 && (
            <div className="bg-black/40 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                📋 Activity Log:
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-white/80 text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setLogs([])}
                className="mt-3 text-xs text-white/60 hover:text-white"
              >
                Clear logs
              </button>
            </div>
          )}

          {/* Result Display */}
          {testResult && (
            <div className="bg-black/40 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Result:</h3>
              <pre className="text-white/80 text-sm whitespace-pre-wrap break-all">
                {testResult}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
            <h3 className="text-white font-semibold mb-2">📋 Testing Guide:</h3>
            <ol className="text-white/80 text-sm space-y-1 list-decimal list-inside">
              <li>
                <strong>Check Service Worker</strong> - Verify SW is registered
              </li>
              <li>
                <strong>Test Local Notification</strong> - Test browser
                notifications (no server)
              </li>
              <li>
                <strong>Subscribe</strong> - Enable push notifications
              </li>
              <li>
                <strong>Send Test Notification</strong> - Send via server (full
                flow)
              </li>
              <li>
                <strong>Check Database</strong> - Verify subscription is saved
              </li>
              <li>
                <strong>Cleanup Invalid</strong> - Remove expired/failed
                subscriptions
              </li>
            </ol>
            <div className="mt-3 text-xs text-yellow-300">
              💡 If "Test Local Notification" doesn't show anything, check:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Browser notification permission is "Allow"</li>
                <li>Windows Focus Assist is OFF</li>
                <li>Try refreshing and unregistering old service worker</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
