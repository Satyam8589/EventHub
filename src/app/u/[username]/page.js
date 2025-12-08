"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const username = params.username;

        if (!username) {
          setError("Invalid username");
          setLoading(false);
          return;
        }

        // Fetch user data by username to verify they exist
        const response = await fetch(`/api/users?username=${username}`);

        if (!response.ok) {
          throw new Error("User not found");
        }

        // Redirect to reels page with user parameter
        router.push(`/reels?user=${username}`);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.username, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mb-4"></div>
          <p className="text-white text-xl font-semibold">
            Loading @{params.username}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
          <p className="text-white/70 mb-2">@{params.username}</p>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all w-full"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}
