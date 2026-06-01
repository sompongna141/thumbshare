/**
 * Image model auto-fallback logic.
 * When an image fails to load, we retry with the next model in the preference order.
 * Preference order is a suggestion; if a model isn't available, the UI falls back
 * to the next available model from the live list.
 */

const PREFERRED_MODEL_ORDER = [
  "flux",        // fast, free, reliable
  "kontext",     // FLUX in-context editing
  "gptimage",    // fast, affordable
  "zimage",      // fast 6B Flux
  "wan-image",   // Alibaba, up to 2K
  "qwen-image",  // Alibaba
  "nova-canvas", // Amazon
  "klein",       // FLUX.2 Klein 4B
  "gptimage-large",
];

export function getNextFallbackModel(current: string, available: string[] = PREFERRED_MODEL_ORDER): string | null {
  const idx = available.indexOf(current);
  if (idx === -1) {
    // current model not in available list — try the first available model that isn't current
    const alt = available.find((m) => m !== current);
    return alt || null;
  }
  return available[idx + 1] || null;
}

export function getPreferredModelIndex(name: string): number {
  const idx = PREFERRED_MODEL_ORDER.indexOf(name);
  return idx === -1 ? 999 : idx;
}

export function pickDefaultModel(available: string[], saved?: string | null): string {
  if (saved && available.includes(saved)) return saved;
  // sort available by preference index and pick the best
  const sorted = [...available].sort((a, b) => getPreferredModelIndex(a) - getPreferredModelIndex(b));
  return sorted[0] || available[0] || "flux";
}
