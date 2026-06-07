import { NextResponse } from "next/server";
import { parseAllowedImageUrl } from "@/lib/image-proxy";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageUrl = parseAllowedImageUrl(body?.imageUrl);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Only Pollinations image URLs are allowed" },
        { status: 400 }
      );
    }

    const response = await fetch(imageUrl, {
      headers: { Accept: "image/*" },
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Image provider returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json(
        { error: "Image provider returned an invalid content type" },
        { status: 502 }
      );
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large to download" }, { status: 413 });
    }

    const image = await response.arrayBuffer();
    if (image.byteLength === 0 || image.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: image.byteLength === 0 ? "Image provider returned an empty file" : "Image is too large to download" },
        { status: image.byteLength === 0 ? 502 : 413 }
      );
    }

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(image.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image download failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
