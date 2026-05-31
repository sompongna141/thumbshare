import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildThumbnailImageUrl, extractJson } from "../src/lib/pollinations";
import { sampleBriefs, sampleBriefLabels } from "../src/lib/sample-brief";
import { ThumbnailBrief, ThumbnailConcept, ConceptGenerationResult } from "../src/lib/types";

// ── Mock concept data for tests ──

export const mockConcept: ThumbnailConcept = {
  id: "1",
  conceptName: "Shocked Face Red BG",
  imagePrompt:
    "A man with a shocked open mouth expression against a red background, holding a phone screen showing a big number, YouTube thumbnail style, high contrast, 16:9, close-up face, dramatic lighting from left side",
  faceExpression: "shocked open mouth",
  textOverlay: { text: "$10K GONE", placement: "bottom-center" },
  colorPsychology: {
    primaryColor: "red",
    contrastNote: "High contrast against YouTube white UI",
    emotion: "urgency and alarm",
  },
  abVariantHint: "swap red background for dark blue",
  platformNotes: "readable at 150px on mobile",
};

export const mockResult: ConceptGenerationResult = {
  concepts: Array.from({ length: 6 }, (_, i) => ({
    ...mockConcept,
    id: String(i + 1),
    conceptName: `Concept ${i + 1}`,
  })),
  brief: sampleBriefs[0],
  abPlan: "1. Test concept #1 (shock) vs #3 (curiosity) for 48h each.\n2. If shock wins, try red vs blue background variant.\n3. Apply winner and measure CTR against channel average.",
};

// ── extractJson robustness ──

describe("extractJson", () => {
  it("parses markdown-wrapped JSON", () => {
    const data = extractJson('```json\n{"a":1}\n```');
    expect(data).toEqual({ a: 1 });
  });

  it("parses plain JSON", () => {
    const data = extractJson('{"b":2}');
    expect(data).toEqual({ b: 2 });
  });

  it("parses JSON with leading text", () => {
    const data = extractJson('Here is JSON: {"c":3}');
    expect(data).toEqual({ c: 3 });
  });

  it("throws on empty string", () => {
    expect(() => extractJson("")).toThrow("Empty or non-string");
  });

  it("throws on garbage text with no JSON", () => {
    expect(() => extractJson("No JSON here at all")).toThrow("not valid JSON");
  });

  it("throws on malformed JSON in markdown block", () => {
    expect(() => extractJson('```json\n{not json}\n```')).toThrow("Failed to parse JSON");
  });
});

// ── Types validation ──

describe("Types validation", () => {
  it("sampleBriefs have required fields", () => {
    sampleBriefs.forEach((b: ThumbnailBrief) => {
      expect(b.videoTitle.length).toBeGreaterThanOrEqual(3);
      expect(b.angle.length).toBeGreaterThanOrEqual(5);
      expect(b.tone).toBeTruthy();
    });
  });

  it("all sampleBriefs have matching labels", () => {
    expect(sampleBriefLabels.length).toBe(sampleBriefs.length);
    sampleBriefLabels.forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it("sampleBriefs cover multiple tones", () => {
    const tones = new Set(sampleBriefs.map((b) => b.tone));
    expect(tones.size).toBeGreaterThanOrEqual(3);
  });

  it("sampleBriefs cover multiple categories", () => {
    const cats = new Set(sampleBriefs.map((b) => b.topicCategory));
    expect(cats.size).toBeGreaterThanOrEqual(3);
  });
});

// ── URL builder ──

describe("buildThumbnailImageUrl", () => {
  it("encodes prompt and includes dimensions", () => {
    const url = buildThumbnailImageUrl("a surprised man holding a phone");
    expect(url).toContain("gen.pollinations.ai/image/");
    expect(url).toContain("width=1280");
    expect(url).toContain("height=720");
    expect(url).toContain("model=flux");
  });

  it("appends key when provided", () => {
    const url = buildThumbnailImageUrl("test prompt", "sk_demo_key");
    expect(url).toContain("key=sk_demo_key");
  });

  it("accepts custom model parameter", () => {
    const url = buildThumbnailImageUrl("test prompt", undefined, "turbo");
    expect(url).toContain("model=turbo");
  });

  it("truncates very long prompts to avoid URL length issues", () => {
    const longPrompt = "a ".repeat(2000);
    const url = buildThumbnailImageUrl(longPrompt);
    const decoded = decodeURIComponent(url.replace(/^.*\/image\//, "").replace(/\?.*$/, ""));
    expect(decoded.length).toBeLessThanOrEqual(1503); // 1500 + "..."
  });

  it("does not append key when omitted", () => {
    const url = buildThumbnailImageUrl("test prompt");
    expect(url).not.toContain("key=");
  });

  it("produces different URLs for different prompts", () => {
    const a = buildThumbnailImageUrl("prompt a");
    const b = buildThumbnailImageUrl("prompt b");
    expect(a).not.toBe(b);
  });

  it("changes seed on retry", () => {
    const url0 = buildThumbnailImageUrl("same prompt", undefined, "flux", 0);
    const url1 = buildThumbnailImageUrl("same prompt", undefined, "flux", 1);
    expect(url0).not.toBe(url1);
    const seed1 = Number(new URL(url1).searchParams.get("seed"));
    expect(seed1).toBeGreaterThanOrEqual(1000000);
    expect(seed1).toBeLessThan(2000000);
  });

  it("key param is properly URL-encoded", () => {
    const url = buildThumbnailImageUrl("test", "sk_key/with+special=chars");
    expect(url).toContain(encodeURIComponent("sk_key/with+special=chars"));
  });
});

// ── Concept shape ──

describe("Concept shape", () => {
  it("concept fields are all defined", () => {
    const c = mockConcept;
    expect(c.id).toBeTruthy();
    expect(c.conceptName).toBeTruthy();
    expect(c.imagePrompt.length).toBeGreaterThan(10);
    expect(c.faceExpression).toBeTruthy();
    expect(c.textOverlay.text).toBeTruthy();
    expect(c.textOverlay.placement).toBeTruthy();
    expect(c.colorPsychology.primaryColor).toBeTruthy();
    expect(c.colorPsychology.contrastNote).toBeTruthy();
    expect(c.colorPsychology.emotion).toBeTruthy();
    expect(c.abVariantHint).toBeTruthy();
    expect(c.platformNotes).toBeTruthy();
  });

  it("mock result has 6 concepts", () => {
    expect(mockResult.concepts).toHaveLength(6);
    expect(mockResult.abPlan).toBeTruthy();
  });

  it("each concept has unique id", () => {
    const ids = mockResult.concepts.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(6);
  });
});

// ── Brief validation ──

describe("Brief validation", () => {
  function isBriefValid(b: ThumbnailBrief): boolean {
    return b.videoTitle.trim().length >= 3 && b.angle.trim().length >= 5;
  }

  it("all sample briefs pass validation", () => {
    sampleBriefs.forEach((b) => {
      expect(isBriefValid(b)).toBe(true);
    });
  });

  it("empty title fails validation", () => {
    expect(isBriefValid({ ...sampleBriefs[0], videoTitle: "" })).toBe(false);
  });

  it("short angle fails validation", () => {
    expect(isBriefValid({ ...sampleBriefs[0], angle: "hi" })).toBe(false);
  });
});

// ── Mock mode validation ──

describe("Mock mode", () => {
  it("returns valid JSON with 6 concepts", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    expect(result.concepts).toHaveLength(6);
    expect(result.abPlan).toBeTruthy();
    result.concepts.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.conceptName).toBeTruthy();
      expect(c.imagePrompt).toBeTruthy();
      expect(c.faceExpression).toBeTruthy();
    });
  }, 10000);

  it("derives concept names from video title keywords", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    const keywords = sampleBriefs[0].videoTitle.split(/\s+/).filter(w => w.length > 2).slice(0, 2).join(" ");
    result.concepts.forEach((c) => {
      expect(c.conceptName.length).toBeGreaterThan(5);
      expect(c.conceptName).not.toContain("Close-Up");
    });
    // At least one concept should contain a significant keyword from the title
    const hasKeyword = result.concepts.some((c) =>
      keywords.split(/\s+/).some((kw) => c.conceptName.toLowerCase().includes(kw.toLowerCase().replace(/[^a-z]/g, "")))
    );
    expect(hasKeyword).toBe(true);
  }, 10000);

  it("color swatches match tone", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    const firstColor = result.concepts[0].colorPsychology.primaryColor;
    expect(firstColor.length).toBeGreaterThan(0);
    result.concepts.forEach((c) => {
      expect(c.colorPsychology.primaryColor).toBe(firstColor);
    });
  }, 10000);

  it("text overlay has placement for all concepts", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    result.concepts.forEach((c) => {
      expect(c.textOverlay.placement.length).toBeGreaterThan(0);
      expect(c.textOverlay.text.length).toBeGreaterThan(0);
    });
  }, 10000);

  it("platform notes are present", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    result.concepts.forEach((c) => {
      expect(c.platformNotes.length).toBeGreaterThan(0);
    });
  }, 10000);

  it("ab variant hints are present", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(sampleBriefs[0], "mock");
    result.concepts.forEach((c) => {
      expect(c.abVariantHint.length).toBeGreaterThan(0);
    });
  }, 10000);
});

// ── Tone options ──

describe("Tone enum coverage", () => {
  const validTones: ThumbnailBrief["tone"][] = [
    "dramatic",
    "funny",
    "educational",
    "controversial",
    "emotional",
    "curiosity",
    "fear",
    "aspirational",
  ];

  it("all sample brief tones are valid", () => {
    sampleBriefs.forEach((b) => {
      expect(validTones).toContain(b.tone);
    });
  });
});
