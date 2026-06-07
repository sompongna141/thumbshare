/**
 * LocalStorage helpers for the studio.
 * - pollinations BYOP key
 * - image model preference
 * - brief history (max 10)
 * - wizard draft (current step + brief)
 * - results view density
 * - shortlist (persisted star set)
 *
 * Every helper is a no-op when localStorage is unavailable (SSR / private mode).
 */

import type { ThumbnailBrief } from "@/lib/types";

export const LS_KEY_KEY = "pollinations_key";
export const LS_MODEL_KEY = "thumbsnare.image_model";
export const LS_HISTORY_KEY = "thumbsnare.brief_history";
export const LS_DRAFT_KEY = "thumbsnare.wizard_draft";
export const LS_DENSITY_KEY = "thumbsnare.results_density";
export const LS_SHORTLIST_KEY = "thumbsnare.shortlist";

export const MAX_HISTORY = 10;

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function getStoredKey(): string | null { return safeGet(LS_KEY_KEY); }
export function setStoredKey(key: string): void { safeSet(LS_KEY_KEY, key); }
export function clearStoredKey(): void { safeRemove(LS_KEY_KEY); }

export function getStoredModel(): string | null { return safeGet(LS_MODEL_KEY); }
export function setStoredModel(model: string): void { safeSet(LS_MODEL_KEY, model); }

export function getDensity(): "comfortable" | "compact" {
  const v = safeGet(LS_DENSITY_KEY);
  return v === "compact" ? "compact" : "comfortable";
}
export function setDensity(d: "comfortable" | "compact"): void { safeSet(LS_DENSITY_KEY, d); }

export interface BriefHistoryEntry {
  brief: ThumbnailBrief;
  savedAt: string;
  videoTitle: string;
}

export function getBriefHistory(): BriefHistoryEntry[] {
  const raw = safeGet(LS_HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveBriefHistory(brief: ThumbnailBrief): void {
  const history = getBriefHistory();
  const next = [
    { brief, savedAt: new Date().toISOString(), videoTitle: brief.videoTitle },
    ...history.filter((h) => h.videoTitle !== brief.videoTitle),
  ].slice(0, MAX_HISTORY);
  safeSet(LS_HISTORY_KEY, JSON.stringify(next));
}

export function deleteBriefHistoryEntry(videoTitle: string): void {
  const history = getBriefHistory();
  safeSet(LS_HISTORY_KEY, JSON.stringify(history.filter((h) => h.videoTitle !== videoTitle)));
}

export function clearBriefHistory(): void { safeRemove(LS_HISTORY_KEY); }

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardDraft {
  step: WizardStep;
  brief: ThumbnailBrief;
}

export function getWizardDraft(): WizardDraft | null {
  const raw = safeGet(LS_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.step !== "number" || !parsed.brief) return null;
    if (![1, 2, 3, 4].includes(parsed.step)) return null;
    return parsed as WizardDraft;
  } catch { return null; }
}

export function setWizardDraft(draft: WizardDraft): void {
  safeSet(LS_DRAFT_KEY, JSON.stringify(draft));
}

export function clearWizardDraft(): void { safeRemove(LS_DRAFT_KEY); }

export function getShortlist(): string[] {
  const raw = safeGet(LS_SHORTLIST_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

export function setShortlist(ids: string[]): void {
  safeSet(LS_SHORTLIST_KEY, JSON.stringify(ids));
}

export function clearShortlist(): void { safeRemove(LS_SHORTLIST_KEY); }
