"use client";

import React from "react";
import type { ThumbnailBrief } from "@/lib/types";

interface Props {
  brief: ThumbnailBrief;
  setBrief: React.Dispatch<React.SetStateAction<ThumbnailBrief>>;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
}

export function AudienceStep({ brief, setBrief, onBack, onNext, error }: Props) {
  return (
    <div className="step-panel" key="step2">
      <h2 className="step-title">Who needs to click?</h2>
      <p className="step-subtitle">
        Define the viewer, the category, and the channel context before choosing a visual direction.
      </p>

      <div className="field-row">
        <div className="field">
          <label>Target Audience</label>
          <input
            value={brief.targetAudience}
            onChange={(e) => setBrief((b) => ({ ...b, targetAudience: e.target.value }))}
            placeholder="e.g., Small business owners considering TikTok ads"
          />
        </div>
        <div className="field">
          <label>Topic Category</label>
          <input
            value={brief.topicCategory}
            onChange={(e) => setBrief((b) => ({ ...b, topicCategory: e.target.value }))}
            placeholder="e.g., Marketing / Business"
          />
        </div>
      </div>

      <div className="field">
        <label>
          Channel Context <span className="optional-label">(optional)</span>
        </label>
        <input
          value={brief.channelContext}
          onChange={(e) => setBrief((b) => ({ ...b, channelContext: e.target.value }))}
          placeholder="e.g., Channel covers paid media strategy"
        />
      </div>

      <div className="field">
        <label>
          Thumbnail Text Overlay
        </label>
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

      <div className="nav-row">
        <button className="btn secondary" onClick={onBack}>
          Back
        </button>
        <span className="nav-spacer" />
        <button className="btn primary" onClick={onNext}>
          Next
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
