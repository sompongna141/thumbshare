"use client";

import React, { useEffect, useRef } from "react";
import { sampleBriefs, sampleBriefLabels } from "@/lib/sample-brief";

interface Props {
  show: boolean;
  onToggle: () => void;
  onSelect: (idx: number) => void;
}

export function SampleMenu({ show, onToggle, onSelect }: Props) {
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
        <span className="chip-tag">Examples</span> Load a sample
      </button>
      {show && (
        <div className="dropdown-menu" role="menu">
          {sampleBriefs.map((b, i) => (
            <button
              key={i}
              className="dropdown-item"
              onClick={() => onSelect(i)}
              role="menuitem"
            >
              <span className="chip-tag">{sampleBriefLabels[i]}</span>
              <span className="dropdown-item-text">{b.videoTitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
