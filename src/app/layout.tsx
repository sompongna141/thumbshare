import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThumbSnare — YouTube Thumbnail Studio",
  description:
    "Turn a video title and angle into 6 scroll-stopping thumbnail concept packs with prompts, color psychology, and A/B test variants.",
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