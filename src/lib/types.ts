export type TextMode = "none" | "post-process" | "generated";
export type TextStyle = "recommended" | "impact" | "editorial" | "minimal" | "banner";

export interface ThumbnailBrief {
  videoTitle: string;
  angle: string;
  topicCategory: string;
  targetAudience: string;
  tone: "dramatic" | "funny" | "educational" | "controversial" | "emotional" | "curiosity" | "fear" | "aspirational";
  /** Legacy compatibility flag. New UI writes this alongside textMode. */
  textOverlay?: boolean;
  /** How lettering is applied. Old briefs infer this from textOverlay. */
  textMode?: TextMode;
  /** Visual treatment for generated or post-processed lettering. */
  textStyle?: TextStyle;
  /** How many concepts to generate. Default 6. Valid: 3, 4, 6, 8. */
  conceptCount?: 3 | 4 | 6 | 8;
  channelContext?: string;
  constraints?: string;
}

export interface ThumbnailConcept {
  id: string;
  conceptName: string;
  imagePrompt: string;
  faceExpression: string;
  textOverlay: {
    text: string;
    placement: string;
    /** AI-selected or user-selected resolved style. */
    style?: Exclude<TextStyle, "recommended">;
  };
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
