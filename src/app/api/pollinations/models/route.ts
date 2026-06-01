import { NextResponse } from "next/server";

interface PollinationsModelEntry {
  name: string;
  description?: string;
  aliases?: string[];
  input_modalities?: string[];
  output_modalities?: string[];
  type?: string;
}

export async function GET() {
  try {
    const res = await fetch("https://gen.pollinations.ai/image/models", {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Models API error: ${res.status}`);
    const json = await res.json();
    // New API returns array of objects; old API returned array of strings
    const raw = Array.isArray(json)
      ? (json as any[]).map((item): PollinationsModelEntry | null => {
          if (typeof item === "string") return { name: item, description: "" };
          if (item && typeof item === "object") {
            return {
              name: item.name || "",
              description: item.description || "",
              aliases: item.aliases || [],
              input_modalities: item.input_modalities || [],
              output_modalities: item.output_modalities || [],
              type: item.type || "",
            };
          }
          return null;
        })
      : [];
    const models: PollinationsModelEntry[] = raw.filter(
      (m): m is PollinationsModelEntry => m !== null
    );
    return NextResponse.json({ models });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch models" },
      { status: 502 }
    );
  }
}
