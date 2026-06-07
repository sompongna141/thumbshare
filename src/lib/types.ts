export interface ThumbnailBrief {
  videoTitle: string;
  angle: string;
  topicCategory: string;
  targetAudience: string;
  tone: "dramatic" | "funny" | "educational" | "controversial" | "emotional" | "curiosity" | "fear" | "aspirational";
  /** Whether the thumbnail should include a text overlay. Default true. */
  textOverlay?: boolean;
  channelContext?: string;
  constraints?: string;
}

export interface ThumbnailConcept {
  id: string;
  conceptName: string;
  imagePrompt: string;
  faceExpression: string;
  textOverlay: { text: string; placement: string };
  colorPsychology: {
    primaryColor: string;
    contrastNote: string;
    emotion: string;
  };
  abVariantHint: string;
  platformNotes: string;
}

export interface ConceptGenerationResult {
  concepts: ThumbnailConcept[];
  brief: ThumbnailBrief;
  abPlan: string;
}

export interface AppState {
  brief: ThumbnailBrief | null;
  result: ConceptGenerationResult | null;
  loading: boolean;
  error: string | null;
}

export interface ByopState {
  key: string | null;
  status: "idle" | "connected" | "error";
}
