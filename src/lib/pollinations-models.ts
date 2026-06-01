export interface PollinationsModel {
  name: string;
  description: string;
  input_modalities?: string[];
  output_modalities?: string[];
  aliases?: string[];
  type?: string;
  paid_only?: boolean;
}

let cachedModels: PollinationsModel[] | null = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

export async function fetchPollinationsModels(): Promise<PollinationsModel[]> {
  if (cachedModels && Date.now() - cacheTime < CACHE_MS) return cachedModels;
  const res = await fetch("https://gen.pollinations.ai/image/models", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch Pollinations models");
  const json = await res.json();
  // New API returns array of objects; old API returned array of strings
  const raw = Array.isArray(json)
    ? (json as any[]).map((item): PollinationsModel | null => {
        if (typeof item === "string") return { name: item, description: item };
        if (item && typeof item === "object") {
          return {
            name: item.name || "",
            description: item.description || "",
            input_modalities: item.input_modalities || [],
            output_modalities: item.output_modalities || [],
            aliases: item.aliases || [],
            type: item.type || "",
            paid_only: item.paid_only === true || item.paidOnly === true,
          };
        }
        return null;
      })
    : [];
  const models: PollinationsModel[] = raw
    .filter((m): m is PollinationsModel => m !== null)
    .filter((m) => !m.paid_only)
    .filter((m) =>
      m.output_modalities?.includes("image") &&
      !m.output_modalities?.includes("video")
    );
  cachedModels = models;
  cacheTime = Date.now();
  return models;
}
