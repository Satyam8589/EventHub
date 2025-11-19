import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://www.eventhubx.site"),
  applicationName: "EventHub",
  title: {
    default: "EventHub",
    template: "%s | EventHub",
  },
  description:
    "Your ultimate destination for discovering and booking amazing events. Join thousands of people experiencing the best events in music, food, technology, and community.",
  openGraph: {
    title: "EventHub",
    description:
      "Your ultimate destination for discovering and booking amazing events.",
    url: "https://www.eventhubx.site",
    siteName: "EventHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EventHub",
    description: "Discover and book amazing events near you.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
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
        <meta name="application-name" content="EventHub" />
        <meta name="apple-mobile-web-app-title" content="EventHub" />
        <meta property="og:site_name" content="EventHub" />
        <meta
          name="google-site-verification"
          content="lFMJ-P-rQSZM1roUYtf54Pde5-K-uYRM5nq1501brZQ"
        />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/eventhub-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "EventHub",
            url: "https://www.eventhubx.site",
            logo: "https://www.eventhubx.site/eventhub-logo.svg",
          })}
        </script>
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
          <SpeedInsights />
          <Analytics />
          <BottomNavWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
