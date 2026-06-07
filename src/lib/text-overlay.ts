import type { TextMode, TextStyle, ThumbnailBrief, ThumbnailConcept } from "./types";

export const TEXT_STYLE_OPTIONS: Array<{
  value: TextStyle;
  label: string;
  description: string;
}> = [
  { value: "recommended", label: "AI recommended", description: "AI chooses per concept" },
  { value: "impact", label: "Impact", description: "Heavy, outlined, high contrast" },
  { value: "editorial", label: "Editorial", description: "Condensed, composed, premium" },
  { value: "minimal", label: "Minimal", description: "Clean, restrained, spacious" },
  { value: "banner", label: "Banner", description: "Solid color block behind text" },
];

export function getTextMode(brief: ThumbnailBrief): TextMode {
  if (brief.textOverlay === false) return "none";
  if (brief.textMode) return brief.textMode;
  return "post-process";
}

export function getRecommendedTextStyle(tone: ThumbnailBrief["tone"]): Exclude<TextStyle, "recommended"> {
  switch (tone) {
    case "dramatic":
    case "fear":
    case "controversial":
      return "impact";
    case "educational":
    case "aspirational":
      return "editorial";
    case "emotional":
    case "curiosity":
      return "minimal";
    case "funny":
      return "banner";
  }
}

export function getResolvedTextStyle(brief: ThumbnailBrief): Exclude<TextStyle, "recommended"> {
  const selected = brief.textStyle || "recommended";
  return selected === "recommended" ? getRecommendedTextStyle(brief.tone) : selected;
}

export function getConceptTextStyle(
  concept: ThumbnailConcept,
  brief: ThumbnailBrief
): Exclude<TextStyle, "recommended"> {
  const validStyles = new Set(["impact", "editorial", "minimal", "banner"]);
  if (
    (brief.textStyle || "recommended") === "recommended" &&
    concept.textOverlay.style &&
    validStyles.has(concept.textOverlay.style)
  ) {
    return concept.textOverlay.style;
  }
  return getResolvedTextStyle(brief);
}

export function getTextModeLabel(mode: TextMode): string {
  if (mode === "none") return "No text";
  if (mode === "generated") return "Generated in image";
  return "Post-process";
}

export function getTextStylePrompt(style: Exclude<TextStyle, "recommended">): string {
  switch (style) {
    case "impact":
      return "heavy uppercase sans-serif, thick dark outline, tight line spacing, maximum contrast";
    case "editorial":
      return "condensed editorial headline, refined spacing, controlled hierarchy, premium magazine treatment";
    case "minimal":
      return "clean medium-weight sans-serif, generous spacing, no decorative effects, restrained placement";
    case "banner":
      return "bold sans-serif inside a solid high-contrast rectangular banner with compact padding";
  }
}
