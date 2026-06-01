import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://image.pollinations.ai/models", { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Models API error: ${res.status}`);
    const models = await res.json();
    return NextResponse.json({ models: Array.isArray(models) ? models : [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch models" },
      { status: 502 }
    );
  }
}
