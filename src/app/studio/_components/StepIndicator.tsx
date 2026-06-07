"use client";

import React from "react";
import { STEP_META } from "../_lib/tone";
import type { WizardStep } from "../_lib/studio-storage";

export function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="step-indicator">
      {([1, 2, 3, 4] as const).map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`step-dot-wrap ${s < current ? "complete" : s === current ? "active" : ""}`}
          >
            <div
              className={`step-dot ${
                s < current ? "complete" : s === current ? "active" : ""
              }`}
            >
              {s < current ? "✓" : s}
            </div>
            <span className="step-label">{STEP_META[s - 1].label}</span>
          </div>
          {i < 3 && (
            <div className={`step-line ${s < current ? "complete" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
