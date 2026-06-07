import type { ThumbnailBrief } from "@/lib/types";

/** A brief is valid for generation if the two required fields have content. */
export function isBriefValid(b: ThumbnailBrief): boolean {
  return b.videoTitle.trim().length >= 3 && b.angle.trim().length >= 5;
}

/**
 * Calculate how complete the brief is, returning a 0-1 ratio and the count of
 * filled optional fields. Used to surface a progress signal in Step 1 and 2.
 */
export function briefCompletion(b: ThumbnailBrief): { filled: number; total: number; ratio: number } {
  const checks: { ok: boolean }[] = [
    { ok: b.videoTitle.trim().length >= 3 },
    { ok: b.angle.trim().length >= 5 },
    { ok: b.topicCategory.trim().length > 0 },
    { ok: b.targetAudience.trim().length > 0 },
    { ok: !!b.tone },
    { ok: (b.channelContext?.trim().length ?? 0) > 0 },
    { ok: (b.constraints?.trim().length ?? 0) > 0 },
    { ok: b.textOverlay !== undefined },
  ];
  const filled = checks.filter((c) => c.ok).length;
  return { filled, total: checks.length, ratio: filled / checks.length };
}
