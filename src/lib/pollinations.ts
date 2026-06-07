/// <reference types="node" />
import { ThumbnailBrief, ThumbnailConcept, ConceptGenerationResult } from "./types";

const POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";

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
  clientKey?: string,
  signal?: AbortSignal
): Promise<string> {
  const key = getApiKey(clientKey);
  if (!key) throw new Error("Missing Pollinations user key");
  const model = getTextModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // Combine external signal with our local timeout
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }
    const res = await fetch(
      `${POLLINATIONS_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          ...(getPollinationsAppKey()
            ? { "x-app-key": getPollinationsAppKey() }
            : {}),
        },
        body: JSON.stringify({ model, messages, stream: false }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Pollinations API error: ${res.status} ${text}`);
    }
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Pollinations API request timed out (30s)");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
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

export function generatePlaceholderSvg(concept: ThumbnailConcept): string {
  const colorMap: Record<string, string> = {
    red: "#ef4444", blue: "#3b82f6", yellow: "#eab308", green: "#22c55e",
    orange: "#f97316", purple: "#a855f7", pink: "#ec4899", teal: "#14b8a6",
    darkred: "#991b1b", gold: "#d97706",
  };
  const rawColor = concept.colorPsychology.primaryColor;
  const fill = rawColor.startsWith("#") ? rawColor : (colorMap[rawColor.toLowerCase()] || "#f43f5e");
  const name = concept.conceptName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const text = concept.textOverlay.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const face = concept.faceExpression.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hasText = text.trim().length > 0;
  // Build the layout. For text-free thumbnails we drop the big text line and move face up.
  const textLine = hasText
    ? `<text x="640" y="380" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${text}</text>`
    : "";
  const faceY = hasText ? 480 : 410;
  const noteY = hasText ? 580 : 520;
  const textFreeNote = hasText
    ? ""
    : `<text x="640" y="370" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="22" font-weight="600" fill="#a1a1aa" letter-spacing="2">TEXT-FREE THUMBNAIL</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0f0f0f"/><rect x="60" y="60" width="1160" height="600" rx="24" fill="${fill}" opacity="0.12"/><text x="640" y="280" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="42" font-weight="700" fill="#e5e5e5">${name}</text>${textFreeNote}${textLine}<text x="640" y="${faceY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="28" fill="#a1a1aa">${face}</text><text x="640" y="${noteY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="20" fill="#52525b">Preview unavailable • Pollinations image API</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function buildThumbnailImageUrl(prompt: string, key?: string, model = "flux", retryCount = 0): string {
  const maxPromptChars = 1500;
  const safePrompt = prompt.length > maxPromptChars ? prompt.slice(0, maxPromptChars) + "..." : prompt;
  const base = `${POLLINATIONS_BASE_URL}/image/prompt/`;
  const encoded = encodeURIComponent(safePrompt);
  const seed = Math.floor(Math.random() * 1000000) + retryCount * 1000000;
  const url = `${base}${encoded}?width=1280&height=720&seed=${seed}&model=${encodeURIComponent(model)}`;
  if (key) return `${url}&key=${encodeURIComponent(key)}`;
  return url;
}

function conceptPromptBuilder(brief: ThumbnailBrief): string {
  const wantsText = brief.textOverlay !== false; // default true
  const textRules = wantsText
    ? `Text overlay requirements:
- For each concept, supply a textOverlay object with concrete text (3-5 words max) and a specific placement (top-left, center, bottom-center, top-right, etc.).
- Text must be a bold sans-serif, instantly readable at 150px.
- Never place critical text in the bottom-right quadrant (blocked by YouTube timestamp overlay).
- Vary the text across the 6 concepts so the A/B plan can pair text-heavy vs text-light variants.`
    : `Text overlay requirements:
- The user has explicitly opted out of text overlays. Do NOT include any text on the thumbnail.
- The imagePrompt must not reference text, words, letters, or typography. Describe only the visual scene.
- For textOverlay in the JSON, use { "text": "", "placement": "none" } and explain in platformNotes that the thumbnail is text-free.
- Lean into stronger subject expression, prop clarity, and color contrast to compensate for the missing text.`;

  return `You are a YouTube thumbnail strategist. Generate 6 thumbnail concepts for this video. Each concept must be designed specifically for YouTube's 16:9 format and must work at 150px wide on mobile.

Video Title: ${brief.videoTitle}
Angle / Topic: ${brief.angle}
Category: ${brief.topicCategory}
Target Audience: ${brief.targetAudience}
Tone: ${brief.tone}
Text overlay on thumbnail: ${wantsText ? "YES - include text on each concept" : "NO - text-free thumbnails only"}
${brief.channelContext ? `Channel Context: ${brief.channelContext}` : ""}
${brief.constraints ? `Constraints: ${brief.constraints}` : ""}

Rules for image prompts:
- 50–120 words each.
- NO generic adjectives: "vibrant", "eye-catching", "stunning", "amazing", "beautiful", "dynamic", "professional".
- NO AI-slop terms: "4K", "unreal engine", "octane render", "highly detailed", "masterpiece", "professional quality", "stunning", "beautiful".
- Use specific props, exact camera angles, lighting directions, and background descriptions.
- Must feel like a real YouTuber's thumbnail, not a stock photo or studio poster.
- Faces should be close-up, expressions exaggerated, readable at small size.
- Background must have strong contrast against white (YouTube's UI background).
- Include 1 specific prop or object that anchors the story.

Visual hierarchy rules:
- Foreground: face or hands are the dominant element (60-70% of frame).
- Mid-ground: 1 anchoring prop that tells the story.
- Background: flat color or subtle gradient; never busy scenery or detailed rooms.
- Keep at least 30% of the frame as negative space for text readability.

Face expression taxonomy by tone:
- dramatic: shocked wide eyes, mouth slightly open, raised eyebrows, tense jaw.
- funny: squinted playful eyes, open-mouth laugh, head tilted, exaggerated surprise.
- educational: curious raised eyebrow, slight knowing smile, eyes looking up/right (thinking).
- controversial: skeptical side-eye, furrowed brow, tight-lipped or smirk, challenging gaze.
- emotional: soft teary eyes, gentle smile, vulnerable open expression, hands near face.
- curiosity: intrigued half-smile, head tilt, eyes wide with eyebrows raised, finger to lips.
- fear: wide-eyed stare, clenched jaw, pupils small, hand partially covering mouth.
- aspirational: confident chin-up smile, relaxed shoulders, direct eye contact, glow of success.
If the topic does not logically include a face, use an extreme close-up of hands, an object in dramatic motion, or a bold typographic shape as the dominant element instead.

${textRules}

YouTube-specific CTR best practices:
- Thumbnails are judged in 0.5 seconds at 150px wide on mobile.
- High contrast between subject and background.
- Single clear focal point - no collage layouts.
- Colors that pop on white/light backgrounds: red, yellow, teal, orange, saturated blue.
- Avoid placing the subject's face in the exact center; use rule of thirds for visual tension.
- Test close-up face versus wider shot with prop context.
${wantsText ? "- Test text-heavy versus text-light variants." : "- Since this is text-free, the A/B plan should test different expressions, prop compositions, or color treatments instead."}

For each concept, provide:
- id: "1" through "6"
- conceptName: 3-5 words
- imagePrompt: detailed prompt following the rules above
- faceExpression: describe the expression or reaction shown
- textOverlay: { text: exact text on thumbnail (5 words max), placement: specific position (top-left, center, bottom-right, etc.) }${wantsText ? "" : " - use empty text and placement 'none' since the user opted out of text overlays"}
- colorPsychology: { primaryColor: dominant color (hex or name), contrastNote: why it pops on YouTube white background, emotion: emotional trigger }
- abVariantHint: one specific change for an A/B test variant
- platformNotes: note about mobile vs desktop visibility${wantsText ? "" : " - explicitly note that the thumbnail is text-free"}

Also provide:
- abPlan: a concise 3-step A/B testing plan tailored to this video's topic and tone. Each step must pair two specific concepts from the generated set and state exactly what visual variable differs between them (e.g., face close-up vs. prop context, text-heavy vs. text-light${wantsText ? "" : ", expression A vs expression B, prop A vs prop B, color palette A vs B"}). Do not use generic steps like "choose top 2 concepts."

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
  const wantsText = brief.textOverlay !== false;
  const wordVariants = ["Face Drop", "Split Shock", "Text Punch", "Color Pop", "Prop Reveal", "Angle Flip"];
  const placements = ["bottom-center", "top-left", "center", "bottom-right", "top-center", "bottom-left"];
  const concepts = Array.from({ length: 6 }, (_, i) => {
    const words = brief.videoTitle.split(/\s+/).filter(w => w.length > 2);
    const keyword = words.slice(0, 2).join(" ");
    const conceptName = `${keyword || brief.tone} ${wordVariants[i] || `Variant ${i + 1}`}`;
    const overlayText = i % 2 === 0
      ? brief.videoTitle.split(" ").slice(0, 3).join(" ").toUpperCase()
      : "WATCH THIS";
    return {
      id: String(i + 1),
      conceptName,
      imagePrompt: wantsText
        ? `YouTube thumbnail, 16:9, close-up face with ${toneInfo.expr}, ${toneInfo.color} background with strong gradient, bold text overlay, high contrast, designed for mobile 150px readability, single prop anchoring the story, studio lighting from left side, realistic skin texture, sharp focus on eyes, depth of field on background`
        : `YouTube thumbnail, 16:9, close-up face with ${toneInfo.expr}, ${toneInfo.color} background with strong gradient, NO TEXT NO WORDS NO LETTERS typography-free composition, high contrast, designed for mobile 150px readability, single prop anchoring the story, studio lighting from left side, realistic skin texture, sharp focus on eyes, depth of field on background`,
      faceExpression: toneInfo.expr,
      textOverlay: wantsText
        ? { text: overlayText, placement: placements[i] }
        : { text: "", placement: "none" },
      colorPsychology: {
        primaryColor: toneInfo.color,
        contrastNote: toneInfo.contrast,
        emotion: toneInfo.emotion,
      },
      abVariantHint: wantsText
        ? `Swap ${toneInfo.color} background for its complementary color`
        : `Swap expression to a wider-eyed variant of the same ${toneInfo.color} palette`,
      platformNotes: wantsText
        ? "Readable at 150px on mobile; text kept under 5 words for scanability."
        : "Text-free thumbnail; relies on subject expression and color contrast for 0.5s judgment.",
    };
  });
  const abPlan = wantsText
    ? `1. Test concept #1 (${toneInfo.color} close-up) vs #3 (curiosity angle) for 48h each.\n2. If #1 wins, run a ${toneInfo.color} vs complementary color background A/B.\n3. Apply winner and measure CTR uplift against channel average.`
    : `1. Test concept #1 (${toneInfo.color} close-up) vs #3 (text-free prop focus) for 48h each.\n2. If #1 wins, run a ${toneInfo.color} vs complementary color background A/B.\n3. Apply winner and measure CTR uplift against channel average.`;
  return JSON.stringify({ concepts, abPlan });
}

export async function generateThumbnailConcepts(
  brief: ThumbnailBrief,
  clientKey?: string,
  signal?: AbortSignal
): Promise<ConceptGenerationResult> {
  const key = getApiKey(clientKey);
  if (key === "mock") {
    const parsed = extractJson(buildMockConcepts(brief));
    return finalizeResult(brief, parsed);
  }
  const prompt = conceptPromptBuilder(brief);
  const text = await pollinationsText(
    [{ role: "user", content: prompt }],
    clientKey,
    signal
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
