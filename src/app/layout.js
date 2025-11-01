import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import PWARegister from "@/components/PWARegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import SplashScreenWrapper from "@/components/SplashScreenWrapper";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EventHub - Discover Amazing Events Near You",
  description:
    "Your ultimate destination for discovering and booking amazing events. Join thousands of people experiencing the best events in music, food, technology, and community.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EventHub",
  },
  icons: {
    apple: [{ url: "/eventhub-logo.svg", sizes: "any", type: "image/svg+xml" }],
    icon: [{ url: "/eventhub-logo.svg", sizes: "any", type: "image/svg+xml" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EventHub" />
        <link rel="apple-touch-icon" href="/eventhub-logo.svg" />
        <link rel="icon" href="/eventhub-logo.svg" type="image/svg+xml" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SplashScreenWrapper />
          <PWARegister />
          {children}
          <PWAInstallPrompt />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
