"use client";

import React from "react";
import type { ThumbnailBrief } from "@/lib/types";
import { TONE_OPTIONS } from "../_lib/tone";

interface Props {
  brief: ThumbnailBrief;
  setBrief: React.Dispatch<React.SetStateAction<ThumbnailBrief>>;
  onBack: () => void;
  onGenerate: () => void;
  loading: boolean;
  hasKey: boolean;
  selectedModel: string;
  error: string | null;
}

export function DirectionStep({ brief, setBrief, onBack, onGenerate, loading, hasKey, selectedModel, error }: Props) {
  const toneLabel = TONE_OPTIONS.find((t) => t.value === brief.tone)?.label || brief.tone;
  return (
    <div className="step-panel" key="step3">
      <h2 className="step-title">Set the visual direction</h2>
      <p className="step-subtitle">
        Choose the click emotion, note visual guardrails, then generate from a reviewed brief.
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
        <label>
          Constraints <span className="optional-label">(optional)</span>
        </label>
        <input
          value={brief.constraints}
          onChange={(e) => setBrief((b) => ({ ...b, constraints: e.target.value }))}
          placeholder="e.g., Avoid dollar bills; focus on laptop"
        />
      </div>

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
            "Generate 6 Concepts"
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
