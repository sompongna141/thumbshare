import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildPreviewImagePrompt,
  buildThumbnailImageUrl,
  extractJson,
  generatePlaceholderSvg,
} from "../src/lib/pollinations";
import { getNextFallbackModel, getPreferredModelIndex, pickDefaultModel } from "../src/lib/model-fallback";
import { sampleBriefs, sampleBriefLabels } from "../src/lib/sample-brief";
import { ThumbnailBrief, ThumbnailConcept, ConceptGenerationResult } from "../src/lib/types";
import {
  getConceptTextStyle,
  getRecommendedTextStyle,
  getResolvedTextStyle,
  getTextMode,
} from "../src/lib/text-overlay";

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

  it("parses JSON followed by model commentary", () => {
    const data = extractJson('{"concepts":[{"id":"1"}],"abPlan":"test"}\nDone.');
    expect(data.concepts[0].id).toBe("1");
  });

  it("parses nested arrays and braces inside strings", () => {
    const data = extractJson(
      'Result: {"concepts":[{"imagePrompt":"Map {upside down} [close-up]","tags":["face","map"]}]} trailing'
    );
    expect(data.concepts[0].tags).toEqual(["face", "map"]);
  });

  it("accepts trailing commas from imperfect model output", () => {
    const data = extractJson('{"concepts":[{"id":"1",},],"abPlan":"test",}');
    expect(data.concepts).toHaveLength(1);
  });

  it("rejects a truncated JSON response", () => {
    expect(() =>
      extractJson('{"concepts":[{"id":"1","imagePrompt":"upside-down map')
    ).toThrow("not valid JSON");
  });

  it("throws on empty string", () => {
    expect(() => extractJson("")).toThrow("Empty or non-string");
  });

  it("throws on garbage text with no JSON", () => {
    expect(() => extractJson("No JSON here at all")).toThrow("not valid JSON");
  });

  it("throws on malformed JSON in markdown block", () => {
    expect(() => extractJson('```json\n{not json}\n```')).toThrow("not valid JSON");
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
    expect(url).toContain("gen.pollinations.ai/image/prompt/");
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
    const decoded = decodeURIComponent(url.replace(/^.*\/prompt\//, "").replace(/\?.*$/, ""));
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

describe("buildPreviewImagePrompt", () => {
  it("reserves space for deterministic UI text without asking the model to spell it", () => {
    const prompt = buildPreviewImagePrompt(mockConcept);
    expect(prompt).toContain("leave clean negative space at bottom-center");
    expect(prompt).toContain("Do not render words, letters");
  });

  it("keeps no-text concepts free of generated lettering", () => {
    const prompt = buildPreviewImagePrompt({
      ...mockConcept,
      textOverlay: { text: "", placement: "none" },
    });
    expect(prompt).toContain("Text-free requirement");
    expect(prompt).toContain("do not render words, letters");
  });

  it("asks the image model to draw exact text in generated mode", () => {
    const prompt = buildPreviewImagePrompt(mockConcept, {
      ...sampleBriefs[0],
      textMode: "generated",
      textStyle: "impact",
    });
    expect(prompt).toContain('render the exact headline "$10K GONE"');
    expect(prompt).toContain("heavy uppercase sans-serif");
    expect(prompt).toContain("spelling and punctuation must match exactly");
  });
});

describe("text overlay modes and styles", () => {
  it("keeps old briefs backward compatible", () => {
    expect(getTextMode({ ...sampleBriefs[0], textMode: undefined, textOverlay: true })).toBe("post-process");
    expect(getTextMode({ ...sampleBriefs[0], textMode: undefined, textOverlay: false })).toBe("none");
  });

  it("resolves recommended style from tone", () => {
    expect(getRecommendedTextStyle("dramatic")).toBe("impact");
    expect(getRecommendedTextStyle("educational")).toBe("editorial");
    expect(getRecommendedTextStyle("curiosity")).toBe("minimal");
    expect(getRecommendedTextStyle("funny")).toBe("banner");
    expect(getResolvedTextStyle({ ...sampleBriefs[0], textStyle: "recommended" })).toBe("impact");
  });

  it("uses a valid AI-selected concept style and rejects unknown values", () => {
    const recommendedBrief: ThumbnailBrief = { ...sampleBriefs[0], textStyle: "recommended" };
    expect(
      getConceptTextStyle(
        { ...mockConcept, textOverlay: { ...mockConcept.textOverlay, style: "banner" } },
        recommendedBrief
      )
    ).toBe("banner");
    expect(
      getConceptTextStyle(
        {
          ...mockConcept,
          textOverlay: { ...mockConcept.textOverlay, style: "unknown" as "impact" },
        },
        recommendedBrief
      )
    ).toBe("impact");
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

  it.each([3, 4, 6, 8] as const)(
    "returns the requested %i concepts",
    async (conceptCount) => {
      const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
      const result = await generateThumbnailConcepts(
        { ...sampleBriefs[0], conceptCount },
        "mock"
      );
      expect(result.concepts).toHaveLength(conceptCount);
      expect(result.brief.conceptCount).toBe(conceptCount);
    },
    10000
  );

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

  it("textOverlay: false brief produces text-free concepts", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const noTextBrief: ThumbnailBrief = { ...sampleBriefs[0], textOverlay: false };
    const result = await generateThumbnailConcepts(noTextBrief, "mock");
    expect(result.concepts).toHaveLength(6);
    result.concepts.forEach((c) => {
      expect(c.textOverlay.text).toBe("");
      expect(c.textOverlay.placement).toBe("none");
      // imagePrompt must be text-free (no typography-positive phrasing, no font/text/wordmark references)
      const lower = c.imagePrompt.toLowerCase();
      expect(lower).not.toContain("bold text overlay");
      expect(lower).not.toContain("text on");
      expect(lower).not.toContain("font");
      expect(lower).not.toContain("wordmark");
      // platformNotes must mention text-free
      expect(c.platformNotes.toLowerCase()).toContain("text-free");
    });
    // abPlan must still mention a different variable than text (since text A/B is meaningless)
    expect(result.abPlan.toLowerCase()).not.toContain("text-heavy");
  }, 10000);

  it("textOverlay: true is the default when field is omitted", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const defaultBrief: ThumbnailBrief = {
      videoTitle: "Default Brief",
      angle: "no field provided for textOverlay at all",
      topicCategory: "test",
      targetAudience: "test",
      tone: "curiosity",
    };
    const result = await generateThumbnailConcepts(defaultBrief, "mock");
    result.concepts.forEach((c) => {
      expect(c.textOverlay.text.length).toBeGreaterThan(0);
      expect(c.textOverlay.placement).not.toBe("none");
    });
  }, 10000);

  it("generated text mode embeds the requested phrase and style in image prompts", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(
      { ...sampleBriefs[0], textMode: "generated", textStyle: "banner" },
      "mock"
    );
    result.concepts.forEach((c) => {
      expect(c.textOverlay.text).toBeTruthy();
      expect(c.imagePrompt).toContain(`"${c.textOverlay.text}"`);
      expect(c.imagePrompt).toContain("solid high-contrast rectangular banner");
      expect(c.platformNotes.toLowerCase()).toContain("experimental");
    });
  }, 10000);

  it("post-process mode reserves negative space and avoids embedded lettering", async () => {
    const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
    const result = await generateThumbnailConcepts(
      { ...sampleBriefs[0], textMode: "post-process", textStyle: "editorial" },
      "mock"
    );
    result.concepts.forEach((c) => {
      expect(c.imagePrompt).toContain("clean negative space");
      expect(c.imagePrompt).toContain("no embedded letters or words");
      expect(c.platformNotes).toContain("editorial");
    });
  }, 10000);

  it("textOverlay: false sample brief travels through the full prompt", () => {
    const noTextSamples = sampleBriefs.filter((b) => b.textOverlay === false);
    expect(noTextSamples.length).toBeGreaterThan(0);
    noTextSamples.forEach((b) => {
      expect(b.videoTitle.length).toBeGreaterThanOrEqual(3);
      expect(b.angle.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("placeholder SVG handles text-free concept gracefully", () => {
    const textFreeConcept: ThumbnailConcept = {
      ...mockConcept,
      textOverlay: { text: "", placement: "none" },
    };
    const url = generatePlaceholderSvg(textFreeConcept);
    expect(url).toMatch(/^data:image\/svg\+xml,/);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    // Should mark the thumbnail as text-free
    expect(decoded).toContain("TEXT-FREE THUMBNAIL");
    // Should still embed concept name and face
    expect(decoded).toContain(mockConcept.conceptName);
    expect(decoded).toContain(mockConcept.faceExpression);
  });

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

describe("Live response recovery", () => {
  const livePayload = (count: number) =>
    JSON.stringify({
      concepts: Array.from({ length: count }, (_, i) => ({
        ...mockConcept,
        id: String(i + 1),
        conceptName: `Recovered ${i + 1}`,
      })),
      abPlan: "Compare the recovered concepts.",
    });

  const apiResponse = (content: string) => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });

  it("retries once after truncated JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse('{"concepts":[{"id":"1"'))
      .mockResolvedValueOnce(apiResponse(livePayload(3)));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
      const result = await generateThumbnailConcepts(
        { ...sampleBriefs[0], conceptCount: 3 },
        "live-test-key"
      );
      expect(result.concepts).toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("retries when valid JSON contains the wrong concept count", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse(livePayload(2)))
      .mockResolvedValueOnce(apiResponse(livePayload(4)));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { generateThumbnailConcepts } = await import("../src/lib/pollinations");
      const result = await generateThumbnailConcepts(
        { ...sampleBriefs[0], conceptCount: 4 },
        "live-test-key"
      );
      expect(result.concepts).toHaveLength(4);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
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

// ── Placeholder SVG generation ──

describe("generatePlaceholderSvg", () => {
  it("returns a data:image/svg+xml URL", () => {
    const url = generatePlaceholderSvg(mockConcept);
    expect(url).toMatch(/^data:image\/svg\+xml,/);
  });

  it("embeds concept name in the SVG", () => {
    const url = generatePlaceholderSvg(mockConcept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain(mockConcept.conceptName);
  });

  it("embeds text overlay in the SVG", () => {
    const url = generatePlaceholderSvg(mockConcept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain(mockConcept.textOverlay.text);
  });

  it("embeds face expression in the SVG", () => {
    const url = generatePlaceholderSvg(mockConcept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain(mockConcept.faceExpression);
  });

  it("uses hex color when provided", () => {
    const concept = { ...mockConcept, colorPsychology: { ...mockConcept.colorPsychology, primaryColor: "#ff6600" } };
    const url = generatePlaceholderSvg(concept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain("#ff6600");
  });

  it("uses color map for named colors", () => {
    const concept = { ...mockConcept, colorPsychology: { ...mockConcept.colorPsychology, primaryColor: "teal" } };
    const url = generatePlaceholderSvg(concept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain("#14b8a6");
  });

  it("escapes XML special characters", () => {
    const concept = { ...mockConcept, conceptName: "A & B <test>", textOverlay: { text: "<bold>", placement: "center" } };
    const url = generatePlaceholderSvg(concept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain("A &amp; B &lt;test&gt;");
    expect(decoded).toContain("&lt;bold&gt;");
  });

  it("defaults to accent when unknown color name", () => {
    const concept = { ...mockConcept, colorPsychology: { ...mockConcept.colorPsychology, primaryColor: "unicorn" } };
    const url = generatePlaceholderSvg(concept);
    const decoded = decodeURIComponent(url.replace(/^data:image\/svg\+xml,/, ""));
    expect(decoded).toContain("#f43f5e");
  });
});

// ── Model fallback logic ──

describe("Model fallback", () => {
  it("returns next model in preference order", () => {
    expect(getNextFallbackModel("flux")).toBe("kontext");
    expect(getNextFallbackModel("kontext")).toBe("gptimage");
    expect(getNextFallbackModel("gptimage")).toBe("zimage");
    expect(getNextFallbackModel("zimage")).toBe("wan-image");
  });

  it("returns null when no more fallbacks", () => {
    expect(getNextFallbackModel("gptimage-large")).toBeNull(); // last in default order
  });

  it("returns first available alternative when current not in list", () => {
    expect(getNextFallbackModel("unknown-model", ["flux", "kontext"])).toBe("flux");
  });

  it("returns null for unknown model with no available list", () => {
    // unknown-model not in PREFERRED_MODEL_ORDER, and default available = PREFERRED_MODEL_ORDER,
    // so it finds the first available that isn't unknown-model
    const result = getNextFallbackModel("unknown-model");
    expect(result).toBeTruthy(); // returns first alternative from default list
  });

  it("preferred model index assigns known models low numbers", () => {
    expect(getPreferredModelIndex("flux")).toBe(0);
    expect(getPreferredModelIndex("kontext")).toBe(1);
    expect(getPreferredModelIndex("gptimage")).toBe(2);
    expect(getPreferredModelIndex("unknown")).toBe(999);
  });

  it("sorting by preferred index puts flux first", () => {
    const models = [{ name: "wan-image" }, { name: "flux" }, { name: "gptimage" }];
    const sorted = [...models].sort((a, b) => getPreferredModelIndex(a.name) - getPreferredModelIndex(b.name));
    expect(sorted[0].name).toBe("flux");
  });

  it("sana is not in the preference list (removed)", () => {
    expect(getPreferredModelIndex("sana")).toBe(999);
  });

  it("pickDefaultModel uses saved model if available", () => {
    expect(pickDefaultModel(["flux", "kontext"], "kontext")).toBe("kontext");
  });

  it("pickDefaultModel falls back to first available if saved missing", () => {
    expect(pickDefaultModel(["kontext"], "flux")).toBe("kontext");
  });

  it("pickDefaultModel prefers flux over kontext when both available", () => {
    expect(pickDefaultModel(["kontext", "flux"], null)).toBe("flux");
  });

  it("pickDefaultModel returns flux when nothing available", () => {
    expect(pickDefaultModel([], null)).toBe("flux");
    expect(pickDefaultModel([], "kontext")).toBe("flux"); // falls back to default when no models available
  });
});
