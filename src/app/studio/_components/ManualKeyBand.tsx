"use client";

import React from "react";

interface Props {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onUse: () => void;
}

export function ManualKeyBand({ visible, value, onChange, onUse }: Props) {
  if (!visible) return null;
  return (
    <div className="manual-key-band">
      <div className="manual-key-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste Pollinations API key..."
          onKeyDown={(e) => {
            if (e.key === "Enter") onUse();
          }}
        />
        <button
          className="btn secondary small"
          onClick={onUse}
          disabled={!value.trim()}
        >
          Use key
        </button>
      </div>
    </div>
  );
}
