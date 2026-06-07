"use client";

import React from "react";
import type {
  ThumbnailBrief,
  ThumbnailConcept,
  ConceptGenerationResult,
} from "@/lib/types";
import { ConceptCard } from "./ConceptCard";
import { ExportToolbar } from "./ExportToolbar";
import { getTextMode, getTextModeLabel } from "@/lib/text-overlay";

interface Props {
  brief: ThumbnailBrief;
  result: ConceptGenerationResult | null;
  loading: boolean;
  error: string | null;
  regenId: string | null;
  copied: string | null;
  imgErrorMap: Record<string, boolean>;
  fallbackModelMap: Record<string, string>;
  selectedModel: string;
  starred: Set<string>;
  density: "comfortable" | "compact";
  byopKey: string | null;
  onRetry: () => void;
  onEditAudience: () => void;
  onEditDirection: () => void;
  onRegenerate: (id: string) => void;
  onRegenerateAll: () => void;
  onCopyConcept: (c: ThumbnailConcept) => void;
  onCopyAll: () => void;
  onCopyStarred: () => void;
  onExportJson: () => void;
  onExportStarredJson: () => void;
  onExportMarkdown: () => void;
  onExportStarredMarkdown: () => void;
  onPrint: () => void;
  onToggleStar: (id: string) => void;
  onImageError: (id: string) => void;
  onRetryImage: (id: string) => void;
  onDensityChange: (d: "comfortable" | "compact") => void;
  onStartBrief: () => void;
  onClearShortlist: () => void;
}

export function ResultsStep(props: Props) {
  const {
    brief,
    result,
    loading,
    error,
    regenId,
    copied,
    imgErrorMap,
    fallbackModelMap,
    selectedModel,
    starred,
    density,
    byopKey,
    onRetry,
    onEditAudience,
    onEditDirection,
    onRegenerate,
    onRegenerateAll,
    onCopyConcept,
    onCopyAll,
    onCopyStarred,
    onExportJson,
    onExportStarredJson,
    onExportMarkdown,
    onExportStarredMarkdown,
    onPrint,
    onToggleStar,
    onImageError,
    onRetryImage,
    onDensityChange,
    onStartBrief,
    onClearShortlist,
  } = props;
  const textMode = getTextMode(brief);

  return (
    <div className="step-panel" key="step4">
      <h2 className="step-title">
        {loading && !result
          ? "Generating your concepts..."
          : result
            ? `${result.concepts.length} concepts for \u201C${result.brief.videoTitle}\u201D`
            : "Your thumbnail concepts"}
      </h2>
      <p className="step-subtitle">
        Star your favorites, regenerate ones that miss, and export your picks.
      </p>

      {!loading && (
        <div className="edit-brief-row">
          <button className="btn secondary small" onClick={onEditAudience}>
            Edit audience
          </button>
          <button className="btn secondary small" onClick={onEditDirection}>
            Edit direction
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="btn secondary small" onClick={onRetry} style={{ marginLeft: "auto" }}>
            Retry
          </button>
        </div>
      )}

      {loading && !result && (
        <div className="concepts-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="concept-card skeleton" key={i}>
              <div className="skeleton-img" />
              <div className="skeleton-bar wide" />
              <div className="skeleton-bar narrow" />
              <div className="skeleton-bar medium" />
              <div className="skeleton-bar wide" />
              <div className="skeleton-bar narrow" />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="results-section">
          <ExportToolbar
            copiedAll={copied === "all"}
            loading={loading}
            onCopyAll={onCopyAll}
            onExportJson={onExportJson}
            onExportMarkdown={onExportMarkdown}
            onPrint={onPrint}
            onRegenerateAll={onRegenerateAll}
            density={density}
            onDensityChange={onDensityChange}
          />

          <div className="ab-plan">
            <span className="ab-label">A/B Test Plan</span>
            <p>{result.abPlan}</p>
          </div>

          {starred.size > 0 && (
            <div className="shortlist-bar">
              <span className="shortlist-label">
                {starred.size} saved
                {` · ${getTextModeLabel(textMode).toLowerCase()}`}
              </span>
              <button className="btn secondary small" onClick={onCopyStarred}>
                {copied === "starred" ? "Copied" : "Copy starred"}
              </button>
              <button className="btn secondary small" onClick={onExportStarredJson}>
                Starred JSON
              </button>
              <button className="btn secondary small" onClick={onExportStarredMarkdown}>
                Starred Markdown
              </button>
              <button
                className="btn secondary small"
                onClick={() => {
                  if (confirm("Clear all saved concepts?")) onClearShortlist();
                }}
                title="Remove all saved concepts"
              >
                Clear
              </button>
            </div>
          )}

          <div className={`concepts-grid density-${density} ${loading ? "loading" : ""}`}>
            {result.concepts.map((c) => (
              <ConceptCard
                key={c.id}
                concept={c}
                brief={result.brief}
                clientKey={byopKey || undefined}
                imageModel={fallbackModelMap[c.id] || selectedModel}
                imageError={imgErrorMap[c.id] || false}
                onImageError={() => onImageError(c.id)}
                onRetryImage={() => onRetryImage(c.id)}
                onRegenerate={onRegenerate}
                regenerating={regenId === c.id}
                onCopy={onCopyConcept}
                copied={copied === c.id}
                starred={starred.has(c.id)}
                onToggleStar={() => onToggleStar(c.id)}
                density={density}
              />
            ))}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="empty-state">
          <h3>No concepts yet</h3>
          <p>
            Go back and fill in your brief, then generate the number of concepts you need.
          </p>
          <p className="empty-action">
            <button className="btn primary" onClick={onStartBrief}>
              Start your brief
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
