import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base URL for canonical and OG URLs
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://arrowkill.com';

export const metadata: Metadata = {
  // Base URL for resolving relative URLs
  metadataBase: new URL(baseUrl),

  // Primary SEO
  title: {
    default: "ArrowKill - Premium Web Scraper",
    template: "%s | ArrowKill",
  },
  description: "A powerful web scraping tool with support for static and dynamic content, concurrent requests, and real-time progress tracking. Extract data from any website with ease.",
  keywords: [
    "web scraper",
    "web scraping",
    "data extraction",
    "puppeteer",
    "cheerio",
    "website crawler",
    "data mining",
    "content extraction",
    "automated scraping",
    "concurrent scraping",
  ],
  authors: [{ name: "ArrowKill Team" }],
  creator: "ArrowKill",
  publisher: "ArrowKill",

  // Canonical URL
  alternates: {
    canonical: "/",
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "ArrowKill",
    title: "ArrowKill - Premium Web Scraper",
    description: "A powerful web scraping tool with support for static and dynamic content, concurrent requests, and real-time progress tracking.",
    images: [
      {
        url: "/og-image.png", // Add this image to your public folder
        width: 1200,
        height: 630,
        alt: "ArrowKill - Extract data from any website",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "ArrowKill - Premium Web Scraper",
    description: "A powerful web scraping tool with support for static and dynamic content, concurrent requests, and real-time progress tracking.",
    images: ["/og-image.png"], // Add this image to your public folder
    creator: "@webscraperpro", // Replace with your Twitter handle
  },

  // App-specific
  applicationName: "ArrowKill",
  category: "Technology",
  classification: "Web Tools",

  // Verification tags (add your actual verification codes)
  verification: {
    google: "your-google-verification-code", // Replace with actual code
    yandex: "your-yandex-verification-code", // Replace with actual code
    // bing: "your-bing-verification-code",
  },

  // Additional meta
  other: {
    "theme-color": "#0a0a0a",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
