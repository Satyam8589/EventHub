"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AuthTest() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    user,
    loading: authLoading,
    signInWithGoogle,
    signOut,
    mounted,
  } = useAuth();

  const addResult = (test, status, details) => {
    setTestResults((prev) => [
      ...prev,
      { test, status, details, timestamp: new Date().toISOString() },
    ]);
  };

  const testFirebaseConnection = async () => {
    setLoading(true);
    addResult(
      "Firebase Connection",
      "testing",
      "Checking Firebase initialization..."
    );

    try {
      // Test Firebase config
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      };

      const configStatus = Object.values(firebaseConfig).every(Boolean);
      addResult(
        "Firebase Config",
        configStatus ? "pass" : "fail",
        configStatus ? "All config values present" : "Missing config values"
      );

      // Test auth object
      const { auth } = await import("@/lib/firebase");
      addResult(
        "Firebase Auth",
        auth ? "pass" : "fail",
        auth ? `Auth initialized: ${auth.app.name}` : "Auth not initialized"
      );
    } catch (error) {
      addResult("Firebase Connection", "fail", error.message);
    }
    setLoading(false);
  };

  const testSyncUserAPI = async () => {
    setLoading(true);
    addResult("Sync User API", "testing", "Testing API endpoint...");

    try {
      const testData = {
        uid: "test-uid-123",
        email: "test@example.com",
        name: "Test User",
      };

      const response = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const data = await response.json();
        addResult(
          "Sync User API",
          "pass",
          `API working: ${data.user?.email || "user created"}`
        );
      } else {
        const errorText = await response.text();
        addResult("Sync User API", "fail", `${response.status}: ${errorText}`);
      }
    } catch (error) {
      addResult("Sync User API", "fail", error.message);
    }
    setLoading(false);
  };

  const testGoogleSignIn = async () => {
    setLoading(true);
    addResult("Google Sign In", "testing", "Attempting Google sign in...");

    try {
      const result = await signInWithGoogle();
      addResult("Google Sign In", "info", `Result: ${JSON.stringify(result)}`);

      if (result.user) {
        addResult("Google Sign In", "pass", `User: ${result.user.email}`);
      } else if (result.isRedirect) {
        addResult("Google Sign In", "info", "Redirecting to Google...");
      } else if (result.error) {
        addResult("Google Sign In", "fail", result.error);
      }
    } catch (error) {
      addResult("Google Sign In", "fail", error.message);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!mounted) {
    return <div className="p-4">Loading auth test...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Test</h1>

        {/* Current Auth State */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2">
            <p>
              <strong>Mounted:</strong> {mounted ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Auth Loading:</strong>{" "}
              {authLoading ? "🔄 Loading" : "✅ Done"}
            </p>
            <p>
              <strong>User:</strong>{" "}
              {user ? `✅ ${user.email} (${user.uid})` : "❌ Not signed in"}
            </p>
            <p>
              <strong>User Role:</strong> {user?.role || "Not set"}
            </p>
            <p>
              <strong>DB User:</strong>{" "}
              {user?.dbUser ? "✅ Synced" : "❌ Not synced"}
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testFirebaseConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test Firebase
            </button>
            <button
              onClick={testSyncUserAPI}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Sync API
            </button>
            <button
              onClick={testGoogleSignIn}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Test Google Sign In
            </button>
            {user && (
              <button
                onClick={signOut}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Clear Results
            </button>
          </div>

          {/* Navigation Test */}
          {user && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Navigation Test
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Test if authentication persists when navigating to the main
                page:
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Go to Main Page → Test Auth Persistence
              </Link>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.length === 0 ? (
            <p className="text-gray-500">
              No tests run yet. Click a button above to start testing.
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded flex items-start gap-3 ${
                    result.status === "pass"
                      ? "bg-green-100 border-green-300"
                      : result.status === "fail"
                      ? "bg-red-100 border-red-300"
                      : result.status === "testing"
                      ? "bg-yellow-100 border-yellow-300"
                      : "bg-blue-100 border-blue-300"
                  } border`}
                >
                  <span className="font-mono text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{result.test}</div>
                    <div className="text-sm text-gray-700">
                      {result.details}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      result.status === "pass"
                        ? "bg-green-500 text-white"
                        : result.status === "fail"
                        ? "bg-red-500 text-white"
                        : result.status === "testing"
                        ? "bg-yellow-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
