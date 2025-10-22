"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { prisma } from "@/lib/prisma";

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
      if (firebaseUser) {
        // Sync user with our database
        try {
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
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            setUser({
              ...firebaseUser,
              role: userData.user.role,
              dbUser: userData.user,
            });
          } else {
            setUser(firebaseUser);
          }
        } catch (error) {
          console.error("Error syncing user:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

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

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, error: null };
    } catch (error) {
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
