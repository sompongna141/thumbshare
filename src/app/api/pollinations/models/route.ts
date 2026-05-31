import { NextResponse } from "next/server";
import { fetchPollinationsModels } from "@/lib/pollinations-models";

export async function GET() {
  try {
    const models = await fetchPollinationsModels();
    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch models" },
      { status: 502 }
    );
  }
}
