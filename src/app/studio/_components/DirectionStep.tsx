"use client";

import React from "react";
import type { ThumbnailBrief } from "@/lib/types";
import { TONE_OPTIONS } from "../_lib/tone";
import type { PollinationsModel } from "@/lib/pollinations-models";
import {
  getRecommendedTextStyle,
  getResolvedTextStyle,
  getTextMode,
  getTextModeLabel,
  TEXT_STYLE_OPTIONS,
} from "@/lib/text-overlay";

interface Props {
  brief: ThumbnailBrief;
  setBrief: React.Dispatch<React.SetStateAction<ThumbnailBrief>>;
  onBack: () => void;
  onGenerate: () => void;
  loading: boolean;
  hasKey: boolean;
  imageModels: PollinationsModel[];
  selectedModel: string;
  onSelectModel: (m: string) => void;
  error: string | null;
}

const CONCEPT_COUNTS: Array<{ value: 3 | 4 | 6 | 8; label: string; hint: string }> = [
  { value: 3, label: "3", hint: "Quick scan" },
  { value: 4, label: "4", hint: "A/B pair" },
  { value: 6, label: "6", hint: "Default" },
  { value: 8, label: "8", hint: "Deep compare" },
];

export function DirectionStep({
  brief,
  setBrief,
  onBack,
  onGenerate,
  loading,
  hasKey,
  imageModels,
  selectedModel,
  onSelectModel,
  error,
}: Props) {
  const toneLabel = TONE_OPTIONS.find((t) => t.value === brief.tone)?.label || brief.tone;
  const conceptCount: 3 | 4 | 6 | 8 = brief.conceptCount ?? 6;
  const textMode = getTextMode(brief);
  const resolvedStyle = getResolvedTextStyle(brief);
  const recommendedStyle = getRecommendedTextStyle(brief.tone);
  return (
    <div className="step-panel" key="step3">
      <h2 className="step-title">Set the visual direction</h2>
      <p className="step-subtitle">
        Choose the click emotion, set production details, and pick the model and concept count before generating.
      </p>

      <div className="field">
        <label>Tone</label>
        <div className="tone-grid">
          {TONE_OPTIONS.map((t) => (
            <button
              key={t.value}
              className={`tone-btn ${brief.tone === t.value ? "selected" : ""}`}
              onClick={() => setBrief((b) => ({ ...b, tone: t.value }))}
              type="button"
              aria-pressed={brief.tone === t.value}
            >
              <span className="tone-cue">{t.cue}</span>
              <span className="tone-name">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Thumbnail text</label>
        <div className="text-mode-grid">
          <button
            type="button"
            className={`text-mode-btn ${textMode === "post-process" ? "selected" : ""}`}
            onClick={() => setBrief((b) => ({ ...b, textOverlay: true, textMode: "post-process" }))}
            aria-pressed={textMode === "post-process"}
          >
            <span className="text-mode-title">
              Post-process
              <span className="recommended-badge">Recommended</span>
            </span>
            <span className="text-mode-description">Exact spelling, editable style and placement</span>
          </button>
          <button
            type="button"
            className={`text-mode-btn ${textMode === "generated" ? "selected" : ""}`}
            onClick={() => setBrief((b) => ({ ...b, textOverlay: true, textMode: "generated" }))}
            aria-pressed={textMode === "generated"}
          >
            <span className="text-mode-title">
              Generate in image
              <span className="experimental-badge">Experimental</span>
            </span>
            <span className="text-mode-description">Model draws the lettering as part of the image</span>
          </button>
          <button
            type="button"
            className={`text-mode-btn ${textMode === "none" ? "selected" : ""}`}
            onClick={() => setBrief((b) => ({ ...b, textOverlay: false, textMode: "none" }))}
            aria-pressed={textMode === "none"}
          >
            <span className="text-mode-title">No text</span>
            <span className="text-mode-description">Expression, props and color carry the hook</span>
          </button>
        </div>
        <p className="field-hint">
          {textMode === "post-process"
            ? "ThumbSnare adds the exact lettering after image generation. This is the reliable choice."
            : textMode === "generated"
              ? "The image model attempts the text directly. Check spelling before publishing."
              : "Thumbnails remain text-free from prompt through preview."}
        </p>
      </div>

      {textMode !== "none" && (
        <div className="field">
          <label>Text style</label>
          <div className="text-style-grid">
            {TEXT_STYLE_OPTIONS.map((style) => (
              <button
                key={style.value}
                type="button"
                className={`text-style-btn text-style-sample-${style.value === "recommended" ? recommendedStyle : style.value} ${(brief.textStyle || "recommended") === style.value ? "selected" : ""}`}
                onClick={() => setBrief((b) => ({ ...b, textStyle: style.value }))}
                aria-pressed={(brief.textStyle || "recommended") === style.value}
              >
                <span className="text-style-name">{style.label}</span>
                <span className="text-style-description">
                  {style.value === "recommended"
                    ? `${style.description}; ${recommendedStyle} fallback`
                    : style.description}
                </span>
              </button>
            ))}
          </div>
          <p className="field-hint">
            {(brief.textStyle || "recommended") === "recommended"
              ? `AI chooses a style for each concept. ${recommendedStyle} is used if no recommendation is returned.`
              : <>Selected treatment: <strong>{resolvedStyle}</strong>.</>}
          </p>
        </div>
      )}

      <div className="field">
        <label>How many concepts to generate?</label>
        <div className="count-grid">
          {CONCEPT_COUNTS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`count-btn ${conceptCount === c.value ? "selected" : ""}`}
              onClick={() => setBrief((b) => ({ ...b, conceptCount: c.value }))}
              aria-pressed={conceptCount === c.value}
            >
              <span className="count-num">{c.label}</span>
              <span className="count-hint">{c.hint}</span>
            </button>
          ))}
        </div>
        <p className="field-hint">
          More concepts = more variety but more API cost. 6 is the default.
        </p>
      </div>

      <div className="field">
        <label>
          Constraints <span className="optional-label">(optional)</span>
        </label>
        <input
          value={brief.constraints}
          onChange={(e) => setBrief((b) => ({ ...b, constraints: e.target.value }))}
          placeholder="e.g., Avoid dollar bills; focus on laptop"
        />
      </div>

      {imageModels.length > 0 && (
        <div className="field">
          <label>Image model</label>
          <select
            className="model-select model-select-block"
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            aria-label="Image model"
          >
            {imageModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
                {m.description ? ` — ${m.description.slice(0, 60)}` : ""}
              </option>
            ))}
          </select>
          <p className="field-hint">
            Pollinations image model used to render previews. If one model fails, we auto-fall back through the list.
          </p>
        </div>
      )}

      <div className="brief-summary">
        <span className="ab-label">Brief Summary</span>
        <ul className="brief-summary-list">
          <li>
            <span className="brief-summary-key">Title</span>
            <span className="brief-summary-val">{brief.videoTitle || "Not set"}</span>
          </li>
          <li>
            <span className="brief-summary-key">Angle</span>
            <span className="brief-summary-val">{brief.angle || "Not set"}</span>
          </li>
          <li>
            <span className="brief-summary-key">Audience</span>
            <span className="brief-summary-val">{brief.targetAudience || "General creator audience"}</span>
          </li>
          <li>
            <span className="brief-summary-key">Category</span>
            <span className="brief-summary-val">{brief.topicCategory || "Uncategorized"}</span>
          </li>
          <li>
            <span className="brief-summary-key">Tone</span>
            <span className="brief-summary-val">{toneLabel}</span>
          </li>
          <li>
            <span className="brief-summary-key">Text overlay</span>
            <span className="brief-summary-val">
              {getTextModeLabel(textMode)}
              {textMode !== "none" ? ` · ${resolvedStyle}` : ""}
            </span>
          </li>
          <li>
            <span className="brief-summary-key">Concept count</span>
            <span className="brief-summary-val">{conceptCount}</span>
          </li>
          <li>
            <span className="brief-summary-key">Model</span>
            <span className="brief-summary-val">{selectedModel}</span>
          </li>
        </ul>
      </div>

      <div className="nav-row">
        <button className="btn secondary" onClick={onBack}>
          Back
        </button>
        <span className="nav-spacer" />
        <button
          className="btn primary"
          onClick={onGenerate}
          disabled={loading || !hasKey}
        >
          {loading ? (
            <>
              <span className="spinner" /> Generating...
            </>
          ) : (
            `Generate ${conceptCount} Concepts`
          )}
        </button>
      </div>

      {!hasKey && (
        <div className="error-banner">
          Connect Pollinations or paste a key above before generating.
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
