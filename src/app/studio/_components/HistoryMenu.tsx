"use client";

import React, { useEffect, useRef } from "react";
import type { BriefHistoryEntry } from "../_lib/studio-storage";

interface Props {
  show: boolean;
  entries: BriefHistoryEntry[];
  onToggle: () => void;
  onSelect: (entry: BriefHistoryEntry) => void;
  onDelete: (videoTitle: string) => void;
  onClear: () => void;
}

export function HistoryMenu({ show, entries, onToggle, onSelect, onDelete, onClear }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!show) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onToggle();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [show, onToggle]);

  return (
    <div className="dropdown-anchor" ref={ref}>
      <button
        className="chip"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={show}
      >
        <span className="chip-tag">History</span> Recent briefs
      </button>
      {show && (
        <div className="dropdown-menu" role="menu">
          {entries.map((entry, i) => (
            <div key={i} className="dropdown-item-row">
              <button
                className="dropdown-item"
                onClick={() => onSelect(entry)}
                role="menuitem"
                style={{ flex: 1 }}
              >
                <span className="chip-tag">
                  {new Date(entry.savedAt).toLocaleDateString()}
                </span>
                <span className="dropdown-item-text">{entry.videoTitle}</span>
              </button>
              <button
                className="dropdown-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.videoTitle);
                }}
                aria-label={`Delete ${entry.videoTitle} from history`}
                title="Remove from history"
              >
                ×
              </button>
            </div>
          ))}
          {entries.length > 1 && (
            <button
              className="dropdown-item"
              onClick={() => {
                if (confirm(`Clear all ${entries.length} history entries?`)) onClear();
              }}
              style={{ color: "var(--muted)", justifyContent: "center" }}
            >
              Clear all history
            </button>
          )}
        </div>
      )}
    </div>
  );
}
