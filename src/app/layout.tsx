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
  // NOTE: do not add a <head> element or manual <meta> tags in this
  // file. Next.js manages <head> via the metadata export above, and
  // any conditional/runtime meta tag in JSX causes SSR/CSR hydration
  // mismatches. The Pollinations app key is read at build time via
  // `process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY` in the client code.
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
