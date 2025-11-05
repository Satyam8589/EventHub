"use client";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthComparison() {
  const { user, signInWithGoogle } = useAuth();

  const testDirectSignIn = async () => {
    console.log(
      "🧪 COMPARISON: Testing direct sign-in (same as auth-test page)"
    );
    try {
      const result = await signInWithGoogle();
      console.log("🧪 COMPARISON: Direct result:", result);
    } catch (error) {
      console.error("🧪 COMPARISON: Direct error:", error);
    }
  };

  const testModalLikeSignIn = async () => {
    console.log("🧪 COMPARISON: Testing modal-like sign-in");
    try {
      // Same call that LoginForm makes
      const result = await signInWithGoogle(false);
      console.log("🧪 COMPARISON: Modal-like result:", result);
    } catch (error) {
      console.error("🧪 COMPARISON: Modal-like error:", error);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Auth Method Comparison</h1>

      <div className="space-y-4">
        <div>
          <strong>Current User:</strong> {user ? user.email : "Not signed in"}
        </div>

        <div className="space-x-4">
          <button
            onClick={testDirectSignIn}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Test Direct (Auth Test Style)
          </button>

          <button
            onClick={testModalLikeSignIn}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Test Modal Style (LoginForm)
          </button>
        </div>
      </div>
    </div>
  );
}
