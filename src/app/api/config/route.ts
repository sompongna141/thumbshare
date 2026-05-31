import { NextResponse } from "next/server";

export async function GET() {
  const mockEnabled = process.env.POLLINATIONS_ALLOW_MOCK === "true";
  const appKeyPresent = !!process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY;
  return NextResponse.json({
    mockEnabled,
    appKeyPresent,
    appKey: appKeyPresent
      ? process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY!
      : undefined,
  });
}
