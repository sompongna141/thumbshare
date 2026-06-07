import { NextResponse } from "next/server";
import { generateThumbnailConcepts } from "@/lib/pollinations";
import { ThumbnailBrief } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brief: ThumbnailBrief = body.brief;
    const clientKey: string | undefined = body.clientKey;

    if (!brief || !brief.videoTitle || !brief.angle) {
      return NextResponse.json(
        { error: "Missing required brief fields: videoTitle and angle" },
        { status: 400 }
      );
    }

    const mockEnabled = process.env.POLLINATIONS_ALLOW_MOCK === "true";
    if (!clientKey && !mockEnabled) {
      return NextResponse.json(
        { error: "Missing Pollinations user key" },
        { status: 401 }
      );
    }

    const controller = new AbortController();
    // Allow one structured retry when the upstream model returns truncated JSON.
    const timeout = setTimeout(() => controller.abort(), 65000);
    try {
      const result = await generateThumbnailConcepts(brief, clientKey, controller.signal);
      return NextResponse.json(result);
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.message?.includes("timed out")) {
        return NextResponse.json(
          { error: "Generation timed out. Please retry in a moment." },
          { status: 504 }
        );
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
