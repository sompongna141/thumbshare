import type { ThumbnailBrief, ThumbnailConcept } from "./types";
import { getConceptTextStyle, getTextMode } from "./text-overlay";

export type OverlayPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const SUPPORTED_PLACEMENTS = new Set<OverlayPlacement>([
  "top-left",
  "top-center",
  "top-right",
  "left-center",
  "center",
  "right-center",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]);

export function normalizeOverlayPlacement(placement: string): OverlayPlacement {
  const normalized = placement
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const aliases: Record<string, OverlayPlacement> = {
    top: "top-center",
    bottom: "bottom-center",
    left: "left-center",
    right: "right-center",
    "upper-left": "top-left",
    "upper-center": "top-center",
    "upper-right": "top-right",
    "lower-left": "bottom-left",
    "lower-center": "bottom-center",
    "lower-right": "bottom-right",
  };
  const candidate = aliases[normalized] || normalized;
  return SUPPORTED_PLACEMENTS.has(candidate as OverlayPlacement)
    ? (candidate as OverlayPlacement)
    : "bottom-center";
}

export function buildThumbnailFilename(concept: ThumbnailConcept): string {
  const slug = concept.conceptName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "concept";
  const id = concept.id.replace(/[^a-z0-9]+/gi, "").slice(0, 8) || "image";
  return `thumbsnare-${id}-${slug}.png`;
}

interface TextAppearance {
  family: string;
  weight: number;
  startSize: number;
  minSize: number;
  uppercase: boolean;
  strokeWidth: number;
  banner: boolean;
  lineHeight: number;
}

function getTextAppearance(
  style: ReturnType<typeof getConceptTextStyle>
): TextAppearance {
  switch (style) {
    case "editorial":
      return {
        family: 'Georgia, "Times New Roman", serif',
        weight: 800,
        startSize: 88,
        minSize: 46,
        uppercase: false,
        strokeWidth: 5,
        banner: false,
        lineHeight: 1,
      };
    case "minimal":
      return {
        family: '"Segoe UI", Arial, sans-serif',
        weight: 700,
        startSize: 74,
        minSize: 42,
        uppercase: false,
        strokeWidth: 0,
        banner: false,
        lineHeight: 1.08,
      };
    case "banner":
      return {
        family: '"Arial Black", "Segoe UI", Arial, sans-serif',
        weight: 900,
        startSize: 80,
        minSize: 42,
        uppercase: true,
        strokeWidth: 0,
        banner: true,
        lineHeight: 1,
      };
    case "impact":
      return {
        family: '"Arial Black", "Segoe UI", Arial, sans-serif',
        weight: 900,
        startSize: 100,
        minSize: 48,
        uppercase: true,
        strokeWidth: 12,
        banner: false,
        lineHeight: 0.96,
      };
  }
}

function getBestLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1 || context.measureText(text).width <= maxWidth) return [text];

  let best = [text];
  let bestWidth = Number.POSITIVE_INFINITY;
  for (let split = 1; split < words.length; split++) {
    const lines = [words.slice(0, split).join(" "), words.slice(split).join(" ")];
    const widest = Math.max(...lines.map((line) => context.measureText(line).width));
    if (widest < bestWidth) {
      best = lines;
      bestWidth = widest;
    }
  }
  return best;
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  appearance: TextAppearance,
  maxWidth: number
) {
  for (let size = appearance.startSize; size >= appearance.minSize; size -= 2) {
    context.font = `${appearance.weight} ${size}px ${appearance.family}`;
    const lines = getBestLines(context, text, maxWidth);
    if (Math.max(...lines.map((line) => context.measureText(line).width)) <= maxWidth) {
      return { lines, size };
    }
  }

  context.font = `${appearance.weight} ${appearance.minSize}px ${appearance.family}`;
  return {
    lines: getBestLines(context, text, maxWidth),
    size: appearance.minSize,
  };
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else if (sourceRatio < targetRatio) {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height
  );
}

function drawOverlay(
  context: CanvasRenderingContext2D,
  concept: ThumbnailConcept,
  brief: ThumbnailBrief,
  width: number,
  height: number
) {
  const style = getConceptTextStyle(concept, brief);
  const appearance = getTextAppearance(style);
  const placement = normalizeOverlayPlacement(concept.textOverlay.placement);
  const text = appearance.uppercase
    ? concept.textOverlay.text.toUpperCase()
    : concept.textOverlay.text;
  const horizontal = placement.includes("left")
    ? "left"
    : placement.includes("right")
      ? "right"
      : "center";
  const maxWidth = width * 0.74;
  const { lines, size } = fitText(context, text, appearance, maxWidth);
  const lineHeight = size * appearance.lineHeight;
  const blockHeight = lineHeight * lines.length;
  const paddingX = appearance.banner ? 28 : 0;
  const paddingY = appearance.banner ? 18 : 0;
  const widestLine = Math.max(...lines.map((line) => context.measureText(line).width));
  const blockWidth = widestLine + paddingX * 2;
  const outerHeight = blockHeight + paddingY * 2;
  const edgeX = 72;
  const topY = 58;
  const bottomPadding = placement === "bottom-right" ? 112 : 58;

  const anchorX = horizontal === "left"
    ? edgeX
    : horizontal === "right"
      ? width - edgeX
      : width / 2;
  const blockX = horizontal === "left"
    ? anchorX
    : horizontal === "right"
      ? anchorX - blockWidth
      : anchorX - blockWidth / 2;
  const isVerticallyCentered = placement === "left-center" ||
    placement === "center" ||
    placement === "right-center";
  const blockY = placement.startsWith("top")
    ? topY
    : isVerticallyCentered
      ? (height - outerHeight) / 2
      : height - bottomPadding - outerHeight;

  context.save();
  context.font = `${appearance.weight} ${size}px ${appearance.family}`;
  context.textAlign = horizontal;
  context.textBaseline = "top";
  context.lineJoin = "round";

  if (appearance.banner) {
    context.fillStyle = "#f43f5e";
    context.fillRect(blockX, blockY, blockWidth, outerHeight);
  }

  const textX = horizontal === "left"
    ? blockX + paddingX
    : horizontal === "right"
      ? blockX + blockWidth - paddingX
      : blockX + blockWidth / 2;
  const textY = blockY + paddingY;

  context.fillStyle = "#ffffff";
  context.strokeStyle = "rgba(0, 0, 0, 0.96)";
  context.lineWidth = appearance.strokeWidth;
  context.shadowColor = style === "minimal" ? "rgba(0, 0, 0, 0.92)" : "rgba(0, 0, 0, 0.75)";
  context.shadowBlur = style === "minimal" ? 12 : 9;
  context.shadowOffsetY = 5;

  lines.forEach((line, index) => {
    const y = textY + index * lineHeight;
    if (appearance.strokeWidth > 0) context.strokeText(line, textX, y);
    context.fillText(line, textX, y);
  });
  context.restore();
}

function loadImage(blob: Blob): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Downloaded image could not be decoded"));
    };
    image.src = objectUrl;
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Browser could not create the PNG"));
    }, "image/png");
  });
}

export async function createThumbnailPng(
  imageUrl: string,
  concept: ThumbnailConcept,
  brief: ThumbnailBrief
): Promise<Blob> {
  const response = await fetch("/api/image/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Could not download the generated image");
  }

  const sourceBlob = await response.blob();
  const { image, objectUrl } = await loadImage(sourceBlob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser");

    drawCover(context, image, canvas.width, canvas.height);
    if (
      getTextMode(brief) === "post-process" &&
      concept.textOverlay.text.trim().length > 0
    ) {
      drawOverlay(context, concept, brief, canvas.width, canvas.height);
    }
    return await canvasToPng(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
