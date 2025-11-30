import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import BottomNavWrapper from "@/components/BottomNavWrapper";
import AutoPushSubscription from "@/components/AutoPushSubscription";
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
    title: "EventHub - Discover Amazing Events Near You",
    description:
      "Your ultimate destination for discovering and booking amazing events. Join thousands of people experiencing the best events in music, food, technology, and community.",
    url: "https://www.eventhubx.site",
    siteName: "EventHub",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://www.eventhubx.site/icon-512.png",
        width: 512,
        height: 512,
        alt: "EventHub Logo",
      },
      {
        url: "https://www.eventhubx.site/icon-192.png",
        width: 192,
        height: 192,
        alt: "EventHub Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EventHub - Discover Amazing Events Near You",
    description:
      "Discover and book amazing events near you. Join thousands experiencing the best events in music, food, technology, and community.",
    images: ["https://www.eventhubx.site/icon-512.png"],
    creator: "@eventhub",
    site: "@eventhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-new.png", sizes: "any" },
      { url: "/eventhub-logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: [{ url: "/favicon-new.png" }],
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
          content="Vkth46F15eq6as0bOJcEcx4EKzvQMRMO0D21knGiRXQ"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* Icons */}
        <link rel="icon" href="/favicon-new.png" sizes="any" />
        <link rel="icon" href="/eventhub-logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="shortcut icon" href="/favicon-new.png" />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "EventHub",
            alternateName: "EventHub - Event Management Platform",
            url: "https://www.eventhubx.site",
            logo: {
              "@type": "ImageObject",
              url: "https://www.eventhubx.site/icon-512.png",
              width: 512,
              height: 512,
            },
            image: "https://www.eventhubx.site/icon-512.png",
            description:
              "Your ultimate destination for discovering and booking amazing events. Join thousands of people experiencing the best events in music, food, technology, and community.",
            sameAs: ["https://www.eventhubx.site"],
          })}
        </script>
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AutoPushSubscription />
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
