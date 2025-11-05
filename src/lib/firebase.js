// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("🔥 Firebase config check:", {
  apiKey: firebaseConfig.apiKey ? "✅ Present" : "❌ Missing",
  authDomain: firebaseConfig.authDomain ? "✅ Present" : "❌ Missing",
  projectId: firebaseConfig.projectId ? "✅ Present" : "❌ Missing",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("🔥 Firebase app initialized successfully");

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
console.log("🔐 Firebase auth initialized successfully");

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider to avoid popup issues
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Add additional scopes if needed
googleProvider.addScope("email");
googleProvider.addScope("profile");

console.log("🎯 Google provider configured successfully");

// Initialize Firestore
export const db = getFirestore(app);

export default app;
