/**
 * Image model auto-fallback logic.
 * When an image fails to load, we retry with the next model in the preference order.
 */

const PREFERRED_MODEL_ORDER = ["flux", "kontext", "flux-schnell", "turbo", "sdxl"];

export function getNextFallbackModel(current: string): string | null {
  const idx = PREFERRED_MODEL_ORDER.indexOf(current);
  if (idx === -1) return null;
  return PREFERRED_MODEL_ORDER[idx + 1] || null;
}

export function getPreferredModelIndex(name: string): number {
  const idx = PREFERRED_MODEL_ORDER.indexOf(name);
  return idx === -1 ? 999 : idx;
}
