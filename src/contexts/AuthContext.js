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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔐 Auth state changed:",
        firebaseUser ? "User logged in" : "User logged out"
      );
      console.log("🔐 Firebase user:", firebaseUser?.email || "None");

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
            console.log("⚠️ User sync failed, using Firebase user only");
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("❌ Error syncing user:", error);
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
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // Immediately set the user from redirect result to improve UX while
          // the onAuthStateChanged listener completes any DB sync.
          setUser(result.user);

          // Also sync user with our database (same flow as onAuthStateChanged)
          try {
            const response = await fetch("/api/auth/sync-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: result.user.uid,
                email: result.user.email,
                name:
                  result.user.displayName || result.user.email.split("@")[0],
                avatar: result.user.photoURL,
                phone: result.user.phoneNumber,
              }),
            });

            if (response.ok) {
              const userData = await response.json();
              setUser((prev) => ({
                ...prev,
                role: userData.user.role,
                dbUser: userData.user,
              }));
            } else {
              // Redirect user sync failed, proceeding with Firebase user
            }
          } catch (err) {
            // Error syncing redirect user
          }
        }
      } catch (error) {
        console.error("Redirect authentication error:", error);
      } finally {
        // Make sure loading is turned off regardless of redirect result
        setLoading(false);
      }
    };

    checkRedirectResult();

    return () => unsubscribe();
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

          // Immediately set the user to improve UX; onAuthStateChanged will also fire
          if (result.user) {
            try {
              setUser(result.user);
              // Sync with DB for immediate role/metadata
              const response = await fetch("/api/auth/sync-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid: result.user.uid,
                  email: result.user.email,
                  name:
                    result.user.displayName || result.user.email.split("@")[0],
                  avatar: result.user.photoURL,
                  phone: result.user.phoneNumber,
                }),
              });

              if (response.ok) {
                const userData = await response.json();
                setUser((prev) => ({
                  ...prev,
                  role: userData.user.role,
                  dbUser: userData.user,
                }));
              }
            } catch (syncErr) {
              // Silently continue if sync fails
            }
          }

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
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
