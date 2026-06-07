import "./globals.css";
import type { Metadata } from "next";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appKey = process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY || "";
  return (
    <html lang="en">
      <head>
        {appKey && <meta name="pollinations-app-key" content={appKey} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
