import type { ThumbnailBrief } from "@/lib/types";

export interface ToneOption {
  value: ThumbnailBrief["tone"];
  label: string;
  cue: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { value: "dramatic", label: "Dramatic", cue: "High stakes" },
  { value: "funny", label: "Funny", cue: "Comic beat" },
  { value: "educational", label: "Educational", cue: "Clear payoff" },
  { value: "controversial", label: "Controversial", cue: "Tension" },
  { value: "emotional", label: "Emotional", cue: "Story pull" },
  { value: "curiosity", label: "Curiosity", cue: "Open loop" },
  { value: "fear", label: "Fear", cue: "Warning" },
  { value: "aspirational", label: "Aspirational", cue: "Desired state" },
];

export const STEP_META: { label: string }[] = [
  { label: "Hook" },
  { label: "Audience" },
  { label: "Direction" },
  { label: "Concepts" },
];
