"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function DiagnosePage() {
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    runDiagnostics();
  }, [user]);

  const runDiagnostics = async () => {
    setLoading(true);
    const results = {};

    // 1. Check HTTPS
    results.https = {
      status: window.location.protocol === "https:",
      message:
        window.location.protocol === "https:"
          ? "✅ Site is using HTTPS"
          : "❌ Site must use HTTPS for push notifications",
    };

    // 2. Check Browser Support
    results.browserSupport = {
      status:
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
      message:
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
          ? "✅ Browser supports push notifications"
          : "❌ Browser doesn't support push notifications",
    };

    // 3. Check Service Worker
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      results.serviceWorker = {
        status: !!registration,
        message: registration
          ? `✅ Service worker registered at: ${registration.scope}`
          : "❌ Service worker not registered",
        details: registration
          ? {
              active: registration.active?.state,
              installing: registration.installing?.state,
              waiting: registration.waiting?.state,
            }
          : null,
      };
    } catch (error) {
      results.serviceWorker = {
        status: false,
        message: `❌ Service worker error: ${error.message}`,
      };
    }

    // 4. Check sw.js accessibility
    try {
      const swResponse = await fetch("/sw.js");
      results.swFile = {
        status: swResponse.ok,
        message: swResponse.ok
          ? "✅ Service worker file accessible at /sw.js"
          : `❌ Service worker file not found (${swResponse.status})`,
      };
    } catch (error) {
      results.swFile = {
        status: false,
        message: `❌ Cannot fetch /sw.js: ${error.message}`,
      };
    }

    // 5. Check Notification Permission
    results.permission = {
      status: Notification.permission === "granted",
      message: `${
        Notification.permission === "granted" ? "✅" : "❌"
      } Notification permission: ${Notification.permission}`,
    };

    // 6. Check VAPID Key (client-side)
    const clientVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    results.clientVapidKey = {
      status: !!clientVapidKey,
      message: clientVapidKey
        ? `✅ VAPID key available in client (${clientVapidKey.substring(
            0,
            20
          )}...)`
        : "⚠️ VAPID key not in client environment",
    };

    // 7. Check VAPID Key from server
    try {
      const keyResponse = await fetch("/api/push/vapid-key");
      if (keyResponse.ok) {
        const keyData = await keyResponse.json();
        results.serverVapidKey = {
          status: !!keyData.publicKey,
          message: keyData.publicKey
            ? `✅ VAPID key available from server (${keyData.publicKey.substring(
                0,
                20
              )}...)`
            : "❌ VAPID key missing from server",
        };
      } else {
        results.serverVapidKey = {
          status: false,
          message: `❌ Cannot fetch VAPID key from server (${keyResponse.status})`,
        };
      }
    } catch (error) {
      results.serverVapidKey = {
        status: false,
        message: `❌ Error fetching VAPID key: ${error.message}`,
      };
    }

    // 8. Check API endpoints
    const endpoints = [
      "/api/push/subscribe",
      "/api/push/test",
      "/api/push/check",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { method: "HEAD" });
        results[`api_${endpoint}`] = {
          status: response.status !== 404,
          message:
            response.status !== 404
              ? `✅ ${endpoint} exists`
              : `❌ ${endpoint} not found`,
        };
      } catch (error) {
        results[`api_${endpoint}`] = {
          status: false,
          message: `❌ ${endpoint} error: ${error.message}`,
        };
      }
    }

    // 9. Check user authentication
    results.authentication = {
      status: !!user,
      message: user
        ? `✅ User authenticated: ${user.email}`
        : "⚠️ User not signed in",
    };

    // 10. Check existing subscription
    if (results.serviceWorker.status) {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration.pushManager.getSubscription();
        results.subscription = {
          status: !!subscription,
          message: subscription
            ? `✅ Push subscription exists`
            : "⚠️ No push subscription found",
          details: subscription
            ? {
                endpoint: subscription.endpoint.substring(0, 60) + "...",
              }
            : null,
        };
      } catch (error) {
        results.subscription = {
          status: false,
          message: `❌ Error checking subscription: ${error.message}`,
        };
      }
    }

    setChecks(results);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    if (status === true) return "✅";
    if (status === false) return "❌";
    return "⚠️";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            🔍 Push Notification Diagnostics
          </h1>

          <div className="mb-6 bg-blue-500/20 rounded-xl p-4 border border-blue-400/30">
            <p className="text-white/80 text-sm">
              This page checks all requirements for push notifications to work
              in production. Share the results with support if you're having
              issues.
            </p>
          </div>

          {loading ? (
            <div className="text-white text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              Running diagnostics...
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`bg-black/20 rounded-xl p-4 border ${
                    check.status ? "border-green-500/30" : "border-red-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getStatusIcon(check.status)}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </h3>
                      <p className="text-white/80 text-sm">{check.message}</p>
                      {check.details && (
                        <pre className="text-white/60 text-xs mt-2 p-2 bg-black/20 rounded overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              🔄 Re-run Diagnostics
            </button>

            <button
              onClick={() =>
                window.open("https://www.eventhubx.site/test-push", "_blank")
              }
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              🧪 Go to Test Page
            </button>
          </div>

          <div className="mt-6 bg-yellow-500/20 rounded-xl p-4 border border-yellow-400/30">
            <h3 className="text-white font-semibold mb-2">📋 Common Issues:</h3>
            <ul className="text-white/80 text-sm space-y-1 list-disc list-inside">
              <li>
                If VAPID key is missing: Add NEXT_PUBLIC_VAPID_KEY to deployment
                environment variables
              </li>
              <li>
                If service worker fails: Clear browser cache (Ctrl+Shift+R) and
                reload
              </li>
              <li>
                If API endpoints fail: Check deployment logs for server errors
              </li>
              <li>
                If subscription fails: Grant notification permissions in browser
                settings
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
