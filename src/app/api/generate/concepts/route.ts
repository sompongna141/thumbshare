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

    if (!clientKey) {
      return NextResponse.json(
        { error: "Missing Pollinations user key" },
        { status: 401 }
      );
    }

    const result = await generateThumbnailConcepts(brief, clientKey);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Generation failed" },
      { status: 500 }
    );
  }
}
