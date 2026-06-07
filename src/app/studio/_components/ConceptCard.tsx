"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ThumbnailBrief, ThumbnailConcept } from "@/lib/types";
import {
  buildPreviewImagePrompt,
  buildThumbnailImageUrl,
  generatePlaceholderSvg,
} from "@/lib/pollinations";
import {
  getConceptTextStyle,
  getTextMode,
  getTextModeLabel,
} from "@/lib/text-overlay";

const COLOR_MAP: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", yellow: "#eab308", green: "#22c55e",
  orange: "#f97316", purple: "#a855f7", pink: "#ec4899", teal: "#14b8a6",
  darkred: "#991b1b", gold: "#d97706",
};

function swatchColor(c: string): string {
  if (c.startsWith("#")) return c;
  return COLOR_MAP[c.toLowerCase()] || "#666";
}

function overlayPlacementClass(placement: string): string {
  const normalized = placement
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const aliases: Record<string, string> = {
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
  const supported = new Set([
    "top-left", "top-center", "top-right",
    "left-center", "center", "right-center",
    "bottom-left", "bottom-center", "bottom-right",
  ]);
  const candidate = aliases[normalized] || normalized;
  return supported.has(candidate) ? candidate : "bottom-center";
}

interface Props {
  concept: ThumbnailConcept;
  brief: ThumbnailBrief;
  clientKey?: string;
  imageModel: string;
  imageError: boolean;
  onImageError: () => void;
  onRetryImage: () => void;
  onRegenerate: (id: string) => void;
  regenerating: boolean;
  onCopy: (c: ThumbnailConcept) => void;
  copied: boolean;
  starred: boolean;
  onToggleStar: () => void;
  density: "comfortable" | "compact";
}

export function ConceptCard({
  concept,
  brief,
  clientKey,
  imageModel,
  imageError,
  onImageError,
  onRetryImage,
  onRegenerate,
  regenerating,
  onCopy,
  copied,
  starred,
  onToggleStar,
  density,
}: Props) {
  const [retryCount, setRetryCount] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    setShowPlaceholder(false);
    setRetryCount(0);
  }, [concept.imagePrompt, concept.conceptName]);

  const hasText = concept.textOverlay.text.trim().length > 0;
  const textMode = getTextMode(brief);
  const textStyle = getConceptTextStyle(concept, brief);
  const placementClass = overlayPlacementClass(concept.textOverlay.placement);

  const imageUrl = useMemo(
    () =>
      buildThumbnailImageUrl(
        buildPreviewImagePrompt(concept, brief),
        clientKey,
        imageModel,
        retryCount
      ),
    [concept, brief, clientKey, imageModel, retryCount]
  );

  return (
    <div className={`concept-card ${density === "compact" ? "compact" : ""}`}>
      <div className="card-img-wrap">
        {!imageError && !showPlaceholder ? (
          <img
            src={imageUrl}
            alt={concept.conceptName}
            loading="lazy"
            onError={onImageError}
          />
        ) : showPlaceholder ? (
          <img
            src={generatePlaceholderSvg(concept)}
            alt={concept.conceptName}
            loading="lazy"
            className="placeholder-preview"
          />
        ) : (
          <div className="img-fallback">
            <div className="img-fallback-icon">IMG</div>
            <div className="img-fallback-text">Image preview unavailable</div>
            <div className="img-fallback-hint">
              {clientKey
                ? `Model: ${imageModel}. Try switching models or regenerate.`
                : "Connect Pollinations to generate previews."}
            </div>
            <div className="img-fallback-actions">
              <button
                className="btn small"
                onClick={() => {
                  setRetryCount((p) => p + 1);
                  onRetryImage();
                }}
              >
                Retry
              </button>
              <button
                className="btn secondary small"
                onClick={() => setShowPlaceholder(true)}
              >
                Placeholder
              </button>
            </div>
          </div>
        )}
        {hasText && textMode === "post-process" && !imageError && !showPlaceholder && (
          <div
            className={`preview-text-overlay text-style-${textStyle} placement-${placementClass}`}
            aria-hidden="true"
          >
            {concept.textOverlay.text}
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-header">
          <span className="concept-num">#{concept.id}</span>
          <span className="name">{concept.conceptName}</span>
          {concept.textOverlay.placement === "none" && (
            <span className="tag text-free-tag" title="User opted out of text overlay">No text</span>
          )}
          {hasText && (
            <span className={`tag text-mode-tag ${textMode === "generated" ? "experimental" : ""}`}>
              {getTextModeLabel(textMode)}
            </span>
          )}
        </div>
        <span className="tag">{concept.faceExpression}</span>

        {hasText ? (
          <>
            <div className="section-title">Text Overlay</div>
            <div className="text-overlay">
              &ldquo;{concept.textOverlay.text}&rdquo;{" "}
              <span className="placement">
                — {concept.textOverlay.placement} · {textStyle}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="section-title">Text Overlay</div>
            <div className="text-overlay text-overlay-empty">
              Text-free thumbnail — relies on expression and color
            </div>
          </>
        )}

        <div className="section-title">Color Psychology</div>
        <div className="color-row">
          <span
            className="color-swatch"
            style={{ backgroundColor: swatchColor(concept.colorPsychology.primaryColor) }}
          />
          <div>
            <div className="color-emotion">{concept.colorPsychology.emotion}</div>
            <div className="color-note">{concept.colorPsychology.contrastNote}</div>
          </div>
        </div>

        <div className="section-title">A/B Variant</div>
        <div className="prompt">{concept.abVariantHint}</div>

        <div className="section-title">Platform Notes</div>
        <div className="prompt">{concept.platformNotes}</div>

        <details className="prompt-details">
          <summary>Image Prompt</summary>
          <div className="prompt-full">{concept.imagePrompt}</div>
        </details>

        <div className="card-actions">
          <button
            className={`btn small star-btn ${starred ? "starred" : ""}`}
            onClick={onToggleStar}
            title={starred ? "Unstar" : "Star this concept"}
            aria-label={starred ? "Unstar concept" : "Star concept"}
            aria-pressed={starred}
          >
            {starred ? "★" : "☆"}
          </button>
          <button className="btn secondary small" onClick={() => onCopy(concept)}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className="btn secondary small"
            onClick={() => onRegenerate(concept.id)}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}
