/// <reference types="node" />
import { ThumbnailBrief, ThumbnailConcept, ConceptGenerationResult } from "./types";

function getPollinationsAppKey(): string {
  return process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY || "";
}

function getApiKey(clientKey?: string): string | null {
  if (clientKey) return clientKey;
  const serverKey = process.env.POLLINATIONS_API_KEY || "";
  if (serverKey) return serverKey;
  if (process.env.POLLINATIONS_ALLOW_MOCK === "true") return "mock";
  return null;
}

function getTextModel(): string {
  return process.env.POLLINATIONS_TEXT_MODEL || "openai";
}

async function pollinationsText(
  messages: { role: string; content: string }[],
  clientKey?: string
): Promise<string> {
  const key = getApiKey(clientKey);
  if (!key) throw new Error("Missing Pollinations user key");
  const model = getTextModel();
  const res = await fetch(
    `https://gen.pollinations.ai/openai/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${encodeURIComponent(key)}`,
        ...(getPollinationsAppKey()
          ? { "x-app-key": getPollinationsAppKey() }
          : {}),
      },
      body: JSON.stringify({ model, messages, stream: false }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pollinations API error: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content || "";
}

export function extractJson(text: string): any {
  if (!text || typeof text !== "string") throw new Error("Empty or non-string response from LLM");
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      throw new Error(`Failed to parse JSON in markdown block: ${(e as Error).message}`);
    }
  }
  const idx = text.indexOf("{");
  if (idx !== -1) {
    const candidate = text.slice(idx);
    try {
      return JSON.parse(candidate);
    } catch {
      // ignore
    }
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Response is not valid JSON. First 200 chars: ${text.slice(0, 200).replace(/\n/g, " ")}`);
  }
}

export function buildThumbnailImageUrl(prompt: string, key?: string, model = "flux"): string {
  const maxPromptChars = 1500;
  const safePrompt = prompt.length > maxPromptChars ? prompt.slice(0, maxPromptChars) + "..." : prompt;
  const base = "https://gen.pollinations.ai/image/";
  const encoded = encodeURIComponent(safePrompt);
  const url = `${base}${encoded}?width=1280&height=720&seed=${Math.floor(Math.random() * 1000000)}&model=${encodeURIComponent(model)}`;
  if (key) return `${url}&key=${encodeURIComponent(key)}`;
  return url;
}

function conceptPromptBuilder(brief: ThumbnailBrief): string {
  return `You are a YouTube thumbnail strategist. Generate 6 thumbnail concepts for this video. Each concept must be designed specifically for YouTube's 16:9 format and must work at 150px wide on mobile.

Video Title: ${brief.videoTitle}
Angle / Topic: ${brief.angle}
Category: ${brief.topicCategory}
Target Audience: ${brief.targetAudience}
Tone: ${brief.tone}
${brief.channelContext ? `Channel Context: ${brief.channelContext}` : ""}
${brief.constraints ? `Constraints: ${brief.constraints}` : ""}

Rules for image prompts:
- 50–120 words each.
- NO generic adjectives: "vibrant", "eye-catching", "stunning", "amazing", "beautiful", "dynamic", "professional".
- Use specific props, exact camera angles, lighting directions, and background descriptions.
- Must feel like a real YouTuber's thumbnail, not a stock photo or studio poster.
- Faces should be close-up, expressions exaggerated, readable at small size.
- Background must have strong contrast against white (YouTube's UI background).
- Include 1 specific prop or object that anchors the story.

For each concept, provide:
- id: "1" through "6"
- conceptName: 3–5 words
- imagePrompt: detailed prompt following the rules above
- faceExpression: describe the expression or reaction shown
- textOverlay: { text: exact text on thumbnail (5 words max), placement: specific position (top-left, center, bottom-right, etc.) }
- colorPsychology: { primaryColor: dominant color (hex or name), contrastNote: why it pops on YouTube white background, emotion: emotional trigger }
- abVariantHint: one specific change for an A/B test variant
- platformNotes: note about mobile vs desktop visibility

Also provide:
- abPlan: a concise 3-step A/B testing plan tailored to this video's topic and tone. Do not use generic steps like "choose top 2 concepts." Instead, suggest specific angles to test against each other based on the generated concepts.

Return ONLY valid JSON in this exact shape:
{
  "concepts": [
    { "id": "1", "conceptName": "...", "imagePrompt": "...", "faceExpression": "...", "textOverlay": { "text": "...", "placement": "..." }, "colorPsychology": { "primaryColor": "...", "contrastNote": "...", "emotion": "..." }, "abVariantHint": "...", "platformNotes": "..." }
  ],
  "abPlan": "..."
}

Do not include markdown, commentary, or explanations outside the JSON.`;
}

function buildMockConcepts(brief: ThumbnailBrief): string {
  const tones: Record<string, { expr: string; color: string; emotion: string; contrast: string }> = {
    dramatic: { expr: "shocked wide eyes, mouth open", color: "red", emotion: "urgency and alarm", contrast: "High contrast against YouTube white UI" },
    funny: { expr: "exaggerated laugh, squinted eyes", color: "yellow", emotion: "joy and playfulness", contrast: "Bright pop on white background" },
    educational: { expr: "curious raised eyebrow, slight smile", color: "blue", emotion: "trust and clarity", contrast: "Cool tone stands out on warm UI" },
    controversial: { expr: "skeptical side-eye, furrowed brow", color: "orange", emotion: "tension and debate", contrast: "Warm against neutral white" },
    emotional: { expr: "teary eyes, soft expression", color: "purple", emotion: "empathy and depth", contrast: "Rich tone draws attention" },
    curiosity: { expr: "intrigued half-smile, head tilt", color: "teal", emotion: "mystery and intrigue", contrast: "Unusual color catches the eye" },
    fear: { expr: "wide-eyed stare, clenched jaw", color: "darkred", emotion: "danger and caution", contrast: "Dark against white = immediate attention" },
    aspirational: { expr: "confident smile, chin up", color: "gold", emotion: "luxury and achievement", contrast: "Metallic shimmer on flat white" },
  };
  const toneInfo = tones[brief.tone] || tones.curiosity;
  const concepts = Array.from({ length: 6 }, (_, i) => ({
    id: String(i + 1),
    conceptName: `${brief.tone.charAt(0).toUpperCase() + brief.tone.slice(1)} Close-Up ${i + 1}`,
    imagePrompt: `YouTube thumbnail, 16:9, close-up face with ${toneInfo.expr}, ${toneInfo.color} background with strong gradient, bold text overlay, high contrast, designed for mobile 150px readability, single prop anchoring the story, studio lighting from left side, realistic skin texture, sharp focus on eyes, depth of field on background`,
    faceExpression: toneInfo.expr,
    textOverlay: {
      text: i % 2 === 0 ? brief.videoTitle.split(" ").slice(0, 3).join(" ").toUpperCase() : "WATCH THIS",
      placement: ["bottom-center", "top-left", "center", "bottom-right", "top-center", "bottom-left"][i],
    },
    colorPsychology: {
      primaryColor: toneInfo.color,
      contrastNote: toneInfo.contrast,
      emotion: toneInfo.emotion,
    },
    abVariantHint: `Swap ${toneInfo.color} background for its complementary color`,
    platformNotes: "Readable at 150px on mobile; text kept under 5 words for scanability.",
  }));
  return JSON.stringify({ concepts, abPlan: `1. Test concept #1 (${toneInfo.color} close-up) vs #3 (curiosity angle) for 48h each.\n2. If #1 wins, run a ${toneInfo.color} vs complementary color background A/B.\n3. Apply winner and measure CTR uplift against channel average.` });
}

export async function generateThumbnailConcepts(
  brief: ThumbnailBrief,
  clientKey?: string
): Promise<ConceptGenerationResult> {
  const key = getApiKey(clientKey);
  if (key === "mock") {
    const parsed = extractJson(buildMockConcepts(brief));
    return finalizeResult(brief, parsed);
  }
  const prompt = conceptPromptBuilder(brief);
  const text = await pollinationsText(
    [{ role: "user", content: prompt }],
    clientKey
  );
  const parsed = extractJson(text);
  const concepts: ThumbnailConcept[] = (parsed.concepts || []).map(
    (c: any, idx: number) => ({
      id: String(c.id || idx + 1),
      conceptName: c.conceptName || `Concept ${idx + 1}`,
      imagePrompt: c.imagePrompt || "",
      faceExpression: c.faceExpression || "",
      textOverlay: c.textOverlay || { text: "", placement: "" },
      colorPsychology: c.colorPsychology || {
        primaryColor: "",
        contrastNote: "",
        emotion: "",
      },
      abVariantHint: c.abVariantHint || "",
      platformNotes: c.platformNotes || "",
    })
  );

  return {
    concepts,
    brief,
    abPlan: parsed.abPlan || `A/B Test Plan for "${brief.videoTitle}":\n1. Select the top 2 concepts with highest contrast against YouTube's white background.\n2. Run each as a 48-hour thumbnail swap on an existing comparable video.\n3. Measure CTR change.\n4. Apply winner to the main video and future uploads in this topic cluster.`,
  };
}

function finalizeResult(brief: ThumbnailBrief, parsed: any): ConceptGenerationResult {
  const concepts: ThumbnailConcept[] = (parsed.concepts || []).map(
    (c: any, idx: number) => ({
      id: String(c.id || idx + 1),
      conceptName: c.conceptName || `Concept ${idx + 1}`,
      imagePrompt: c.imagePrompt || "",
      faceExpression: c.faceExpression || "",
      textOverlay: c.textOverlay || { text: "", placement: "" },
      colorPsychology: c.colorPsychology || {
        primaryColor: "",
        contrastNote: "",
        emotion: "",
      },
      abVariantHint: c.abVariantHint || "",
      platformNotes: c.platformNotes || "",
    })
  );
  return {
    concepts,
    brief,
    abPlan: parsed.abPlan || `A/B Test Plan for "${brief.videoTitle}":\n1. Select the top 2 concepts with highest contrast against YouTube's white background.\n2. Run each as a 48-hour thumbnail swap on an existing comparable video.\n3. Measure CTR change.\n4. Apply winner to the main video and future uploads in this topic cluster.`,
  };
}
