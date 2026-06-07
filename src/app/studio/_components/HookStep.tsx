"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ThumbnailBrief } from "@/lib/types";
import type { BriefHistoryEntry } from "../_lib/studio-storage";
import { isBriefValid, briefCompletion } from "../_lib/brief-validation";
import { SampleMenu } from "./SampleMenu";
import { HistoryMenu } from "./HistoryMenu";

interface Props {
  brief: ThumbnailBrief;
  setBrief: React.Dispatch<React.SetStateAction<ThumbnailBrief>>;
  briefHistory: BriefHistoryEntry[];
  onLoadSample: (idx: number) => void;
  onLoadHistory: (entry: BriefHistoryEntry) => void;
  onDeleteHistory: (title: string) => void;
  onClearHistory: () => void;
  showSamples: boolean;
  showHistory: boolean;
  setShowSamples: (v: boolean) => void;
  setShowHistory: (v: boolean) => void;
  onNext: () => void;
  error: string | null;
  onClearDraft: () => void;
  hasStoredDraft: boolean;
}

export function HookStep(props: Props) {
  const {
    brief,
    setBrief,
    briefHistory,
    onLoadSample,
    onLoadHistory,
    onDeleteHistory,
    onClearHistory,
    showSamples,
    showHistory,
    setShowSamples,
    setShowHistory,
    onNext,
    error,
    onClearDraft,
    hasStoredDraft,
  } = props;

  const valid = isBriefValid(brief);
  const completion = briefCompletion(brief);

  return (
    <div className="step-panel" key="step1">
      <h2 className="step-title">What&apos;s your video about?</h2>
      <p className="step-subtitle">
        Start with the essentials: your title and the angle that hooks viewers.
      </p>

      <div className="quick-chips">
        <SampleMenu
          show={showSamples}
          onToggle={() => { setShowSamples(!showSamples); setShowHistory(false); }}
          onSelect={(i) => { onLoadSample(i); }}
        />
        {briefHistory.length > 0 && (
          <HistoryMenu
            show={showHistory}
            entries={briefHistory}
            onToggle={() => { setShowHistory(!showHistory); setShowSamples(false); }}
            onSelect={(e) => onLoadHistory(e)}
            onDelete={(t) => onDeleteHistory(t)}
            onClear={() => onClearHistory()}
          />
        )}
        {hasStoredDraft && (
          <button
            className="chip"
            onClick={onClearDraft}
            title="Start a new brief from scratch"
          >
            <span className="chip-tag">Reset</span> Start fresh
          </button>
        )}
      </div>

      <div className="brief-progress" aria-live="polite">
        <span className="brief-progress-label">Brief {Math.round(completion.ratio * 100)}%</span>
        <span className="brief-progress-bar" aria-hidden="true">
          <span
            className="brief-progress-fill"
            style={{ width: `${Math.round(completion.ratio * 100)}%` }}
          />
        </span>
      </div>

      <div className="field">
        <label>
          Video Title <span className="required">*</span>
        </label>
        <input
          value={brief.videoTitle}
          onChange={(e) => setBrief((b) => ({ ...b, videoTitle: e.target.value }))}
          placeholder="e.g., I Spent $10,000 on TikTok Ads So You Don't Have To"
          aria-required="true"
        />
      </div>

      <div className="field">
        <label>
          Angle / What the video is about <span className="required">*</span>
        </label>
        <textarea
          value={brief.angle}
          onChange={(e) => setBrief((b) => ({ ...b, angle: e.target.value }))}
          placeholder="e.g., Expose the real cost and mistakes behind TikTok ad campaigns"
          aria-required="true"
        />
      </div>

      <div className="nav-row">
        <span className="nav-spacer" />
        <button
          className="btn primary"
          onClick={onNext}
          disabled={!valid}
        >
          Next
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
