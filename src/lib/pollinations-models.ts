export interface PollinationsModel {
  name: string;
  description: string;
  input_modalities?: string[];
  output_modalities?: string[];
  censored?: boolean;
  type?: string;
}

let cachedModels: PollinationsModel[] | null = null;
let cacheTime = 0;
const CACHE_MS = 5 * 60 * 1000;

export async function fetchPollinationsModels(): Promise<PollinationsModel[]> {
  if (cachedModels && Date.now() - cacheTime < CACHE_MS) return cachedModels;
  const res = await fetch("https://gen.pollinations.ai/image/models");
  if (!res.ok) throw new Error("Failed to fetch Pollinations models");
  const json = await res.json();
  const models: PollinationsModel[] = Array.isArray(json)
    ? json
    : json?.models || [];
  cachedModels = models;
  cacheTime = Date.now();
  return models;
}
