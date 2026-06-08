import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ThumbSnare — YouTube Thumbnail Studio",
  description:
    "Turn a video title and angle into 3 to 8 thumbnail concept packs with prompts, exact text overlays, color psychology, and A/B test variants.",
  openGraph: {
    title: "ThumbSnare — YouTube Thumbnail Studio",
    description: "Generate 3 to 8 structured YouTube thumbnail concepts with prompts, exact text overlays, and A/B test variants.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThumbSnare — YouTube Thumbnail Studio",
    description: "Generate 3 to 8 structured YouTube thumbnail concepts.",
  },
  // App-level meta read by the studio client to identify this app to
  // Pollinations. Rendered by the App Router metadata system — DO NOT
  // add a manual <head> element in this file, that causes SSR/CSR
  // hydration mismatches in Next.js 15.
  other: process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY
    ? { "pollinations-app-key": process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
