"use client";

import React from "react";

interface Props {
  copiedAll: boolean;
  loading: boolean;
  onCopyAll: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onPrint: () => void;
  onRegenerateAll: () => void;
  density: "comfortable" | "compact";
  onDensityChange: (d: "comfortable" | "compact") => void;
}

export function ExportToolbar({
  copiedAll,
  loading,
  onCopyAll,
  onExportJson,
  onExportMarkdown,
  onPrint,
  onRegenerateAll,
  density,
  onDensityChange,
}: Props) {
  return (
    <div className="export-bar">
      <button className="btn secondary small" onClick={onCopyAll}>
        {copiedAll ? "Copied" : "Copy All"}
      </button>
      <button className="btn secondary small" onClick={onExportJson}>
        JSON
      </button>
      <button className="btn secondary small" onClick={onExportMarkdown}>
        Markdown
      </button>
      <button className="btn secondary small" onClick={onPrint}>
        Print
      </button>
      <span className="export-spacer" />
      <div className="density-toggle" role="group" aria-label="Results view density">
        <button
          className={`density-btn ${density === "comfortable" ? "selected" : ""}`}
          onClick={() => onDensityChange("comfortable")}
          aria-pressed={density === "comfortable"}
          title="Comfortable view"
        >
          Comfortable
        </button>
        <button
          className={`density-btn ${density === "compact" ? "selected" : ""}`}
          onClick={() => onDensityChange("compact")}
          aria-pressed={density === "compact"}
          title="Compact view"
        >
          Compact
        </button>
      </div>
      <button className="btn primary small" onClick={onRegenerateAll} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" /> Regenerating...
          </>
        ) : (
          "Regenerate All"
        )}
      </button>
    </div>
  );
}
