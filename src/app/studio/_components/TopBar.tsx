"use client";

import React from "react";
import type { ByopState } from "@/lib/types";
import type { PollinationsModel } from "@/lib/pollinations-models";

interface TopBarProps {
  byop: ByopState;
  loginUrl: string;
  onDisconnect: () => void;
  imageModels: PollinationsModel[];
  selectedModel: string;
  onSelectModel: (m: string) => void;
  manualKeyInput: string;
  onManualKeyInputChange: (s: string) => void;
  onUseKey: () => void;
  title: string;
}

export function TopBar({
  byop,
  loginUrl,
  onDisconnect,
  imageModels,
  selectedModel,
  onSelectModel,
  manualKeyInput,
  onManualKeyInputChange,
  onUseKey,
  title,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="logo" title={title}>
          <span className="logo-accent">Thumb</span>Snare
        </div>
      </div>
      <div className="top-bar-right">
        <div className="auth-chip">
          <span className={`auth-dot ${byop.status === "connected" ? "connected" : ""}`} />
          <span>
            {byop.status === "connected" && byop.key
              ? "Pollinations connected"
              : "Not connected"}
          </span>
        </div>
        {byop.status !== "connected" && loginUrl && (
          <a className="btn primary small" href={loginUrl}>
            Connect
          </a>
        )}
        {byop.status === "connected" && (
          <button className="btn secondary small" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
        {imageModels.length > 0 && (
          <select
            className="model-select"
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            aria-label="Image model"
          >
            {imageModels.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}
