import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import BottomNavWrapper from "@/components/BottomNavWrapper";
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
  icons: {
    icon: [{ url: "/eventhub-logo.svg", sizes: "any", type: "image/svg+xml" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="lFMJ-P-rQSZM1roUYtf54Pde5-K-uYRM5nq1501brZQ"
        />
        <link rel="icon" href="/eventhub-logo.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
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
          <BottomNavWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
