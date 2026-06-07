"use client";

import React from "react";
import type { ThumbnailBrief } from "@/lib/types";
import { TONE_OPTIONS } from "../_lib/tone";
import type { PollinationsModel } from "@/lib/pollinations-models";

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
        <label>Thumbnail Text Overlay</label>
        <div className="text-toggle-row">
          <button
            type="button"
            className={`text-toggle-btn ${brief.textOverlay !== false ? "selected" : ""}`}
            onClick={() => setBrief((b) => ({ ...b, textOverlay: true }))}
            aria-pressed={brief.textOverlay !== false}
          >
            With text
          </button>
          <button
            type="button"
            className={`text-toggle-btn ${brief.textOverlay === false ? "selected" : ""}`}
            onClick={() => setBrief((b) => ({ ...b, textOverlay: false }))}
            aria-pressed={brief.textOverlay === false}
          >
            No text
          </button>
        </div>
        <p className="field-hint">
          {brief.textOverlay === false
            ? "Thumbnails will be text-free. Concepts lean on face expression, props, and color contrast."
            : "Each concept will include a short text overlay and placement."}
        </p>
      </div>

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
            <span className="brief-summary-val">{brief.textOverlay === false ? "No (text-free)" : "Yes"}</span>
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
