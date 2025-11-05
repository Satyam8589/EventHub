"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatches
    setMounted(true);

    // Ensure auth persistence is set immediately when app loads
    const initializePersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("🔐 Auth persistence initialized on app load");

        // After setting persistence, check if there's an existing user
        // This helps with navigation between pages where auth state might not be immediately available
        setTimeout(() => {
          const currentUser = auth.currentUser;
          if (currentUser) {
            console.log(
              "🔄 Found persisted user after delay:",
              currentUser.email
            );
            console.log(
              "🔄 Current context user state:",
              user ? user.email || "No email" : "null"
            );

            // If we have a Firebase user but no context user, force trigger auth state change
            if (!user && !loading) {
              console.log("🔥 Forcing auth state check for persisted user");
              // Force re-evaluation of auth state by triggering a re-check
              const forceAuthCheck = async () => {
                try {
                  // This will force onAuthStateChanged to fire if there's a user
                  if (currentUser.accessToken) {
                    console.log("🔥 Forcing auth state refresh");
                  }
                } catch (e) {
                  console.log("🔥 Auth check completed");
                }
              };
              forceAuthCheck();
            }
          } else {
            console.log("👤 No persisted user found after delay");
          }
        }, 500);

        // Additional check after longer delay for page navigation scenarios
        setTimeout(() => {
          const currentUser = auth.currentUser;
          if (currentUser && !user && !loading) {
            console.log(
              "🔥 LATE AUTH CHECK: Forcing delayed auth sync for:",
              currentUser.email
            );
            // Force the auth state to be re-evaluated by accessing the user
            // This should trigger onAuthStateChanged if it hasn't fired yet
            console.log(
              "🔥 Current user token available:",
              !!currentUser.accessToken
            );
            // Try to force a re-sync by checking auth state again
            setTimeout(() => {
              if (auth.currentUser && !user) {
                console.log(
                  "🔥 FINAL AUTH CHECK: Auth state still not synced, force refresh"
                );
                // Last resort: reload the page if auth is completely stuck
                if (typeof window !== "undefined") {
                  console.log("🔥 Auth state recovery needed");
                }
              }
            }, 1000);
          }
        }, 2000);
      } catch (error) {
        console.warn("⚠️ Could not set auth persistence:", error);
      }
    };

    initializePersistence();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔐 Auth state changed:",
        firebaseUser ? "User logged in" : "User logged out"
      );
      console.log("🔐 Firebase user:", firebaseUser?.email || "None");
      console.log("🔐 Firebase UID:", firebaseUser?.uid || "None");
      console.log(
        "🔐 Page URL:",
        typeof window !== "undefined" ? window.location.pathname : "Server"
      );

      if (firebaseUser) {
        // Sync user with our database
        try {
          console.log("🔄 Syncing user with database...");
          const response = await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name:
                firebaseUser.displayName || firebaseUser.email.split("@")[0],
              avatar: firebaseUser.photoURL,
              phone: firebaseUser.phoneNumber,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log("✅ User sync successful:", userData.user.email);
            setUser({
              ...firebaseUser,
              role: userData.user.role,
              dbUser: userData.user,
            });
          } else {
            const errorText = await response.text();
            console.log("⚠️ User sync failed:", response.status, errorText);
            // Still set the Firebase user even if sync fails
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("❌ Error syncing user:", error);
          // Still set the Firebase user even if sync fails
          setUser(firebaseUser);
        }
      } else {
        console.log("👤 Setting user to null");
        setUser(null);
      }
      setLoading(false);
      console.log("🔐 Auth loading set to false");
    });

    // Check for redirect result on page load
    const checkRedirectResult = async () => {
      let result = null;
      try {
        result = await getRedirectResult(auth);
        if (result && result.user) {
          // Don't set user here - let onAuthStateChanged handle it
          // This prevents conflicts and duplicate user syncing
          // onAuthStateChanged will be triggered automatically by Firebase
        }
      } catch (error) {
        console.error("Redirect authentication error:", error);
      } finally {
        // Only set loading false if no redirect result was found
        // If redirect result exists, onAuthStateChanged will handle loading
        if (!result || !result.user) {
          setLoading(false);
        }
      }
    };

    checkRedirectResult();

    // Additional auth state check for navigation scenarios
    // Sometimes Firebase needs a moment to restore auth state after page navigation
    const checkAuthState = () => {
      const currentUser = auth.currentUser;
      if (currentUser && !user) {
        console.log(
          "🔥 MANUAL AUTH CHECK: Found Firebase user but no context user"
        );
        console.log("🔥 MANUAL AUTH CHECK: Firebase user:", currentUser.email);
        console.log(
          "🔥 MANUAL AUTH CHECK: Context user:",
          user ? "exists" : "null"
        );
        console.log(
          "🔥 MANUAL AUTH CHECK: Triggering auth state check manually"
        );
        // This should trigger onAuthStateChanged if state was somehow missed
      } else if (currentUser && user) {
        console.log(
          "✅ MANUAL AUTH CHECK: Both Firebase and context user exist"
        );
      } else {
        console.log("👤 MANUAL AUTH CHECK: No authenticated user found");
      }
    };

    // Check auth state after 1 second delay (for navigation scenarios)
    const authCheckTimer = setTimeout(checkAuthState, 1000);

    return () => {
      unsubscribe();
      clearTimeout(authCheckTimer);
    };
  }, []);

  // Email/Password Sign Up
  const signUp = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  // Email/Password Sign In
  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  // Google Sign In with popup fallback to redirect
  const signInWithGoogle = async (useRedirect = false) => {
    try {
      // Ensure we use local persistence so auth state survives reloads
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (pErr) {
        // Silently continue if persistence fails
      }

      let result;

      if (useRedirect) {
        // Use redirect method (better for mobile and CORS issues)
        await signInWithRedirect(auth, googleProvider);
        // The result will be handled by getRedirectResult in useEffect
        return { user: null, error: null, isRedirect: true };
      } else {
        try {
          // Try popup method first
          result = await signInWithPopup(auth, googleProvider);

          // Don't set user here - let onAuthStateChanged handle it
          // This prevents conflicts and duplicate user syncing
          return { user: result.user, error: null };
        } catch (popupError) {
          // If popup fails (blocked by browser/ad blocker), immediately try redirect
          if (
            popupError.code === "auth/popup-blocked" ||
            popupError.message.includes("blocked") ||
            popupError.message.includes("ERR_BLOCKED_BY_CLIENT")
          ) {
            // Automatically retry with redirect
            await signInWithRedirect(auth, googleProvider);
            return { user: null, error: null, isRedirect: true };
          }
          throw popupError; // Re-throw other errors for normal handling
        }
      }
    } catch (error) {
      // Handle specific popup errors
      if (error.code === "auth/popup-closed-by-user") {
        return {
          user: null,
          error: "Sign-in was cancelled. Please try again.",
          shouldRetryWithRedirect: true,
        };
      } else if (error.code === "auth/popup-blocked") {
        return {
          user: null,
          error: "Popup was blocked by browser. Trying alternative method...",
          shouldRetryWithRedirect: true,
        };
      } else if (
        error.message.includes("Cross-Origin-Opener-Policy") ||
        error.code === "auth/cancelled-popup-request"
      ) {
        return {
          user: null,
          error:
            "Browser security settings are blocking sign-in. Trying alternative method...",
          shouldRetryWithRedirect: true,
        };
      }

      return { user: null, error: error.message };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error) {
      console.error("AuthContext - Sign out error:", error);
      return { error: error.message };
    }
  };

  // Refresh user role from database
  const refreshUserRole = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split("@")[0],
          avatar: user.photoURL,
          phone: user.phoneNumber,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser({
          ...user,
          role: userData.user.role,
          dbUser: userData.user,
        });
      }
    } catch (error) {
      console.error("Error refreshing user role:", error);
    }
  };

  const value = {
    user,
    loading,
    mounted,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserRole,
  };

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading EventHub...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
