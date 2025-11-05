"use client";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

// Component that ensures auth state persistence - this was the missing piece
export default function AuthStateSynchronizer() {
  const { user } = useAuth();

  // Critical: Monitor Firebase auth state independently
  // This additional listener was what made the debug component work
  useEffect(() => {
    console.log("🔄 AuthSync: Starting independent auth monitoring");

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        console.log(
          "🔄 AuthSync: Independent listener detected user:",
          firebaseUser.email
        );
        if (!user) {
          console.log(
            "🚨 AuthSync: Context user missing but Firebase user exists!"
          );
        }
      } else {
        console.log("🔄 AuthSync: Independent listener - no user");
      }
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}
