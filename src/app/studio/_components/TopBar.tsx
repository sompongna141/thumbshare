"use client";

import Link from "next/link";
import React from "react";
import type { ByopState } from "@/lib/types";

interface TopBarProps {
  byop: ByopState;
  loginUrl: string;
  onDisconnect: () => void;
  title: string;
}

export function TopBar({
  byop,
  loginUrl,
  onDisconnect,
  title,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <Link className="logo" href="/" title={title} aria-label="Go to ThumbSnare homepage">
          <span className="logo-accent">Thumb</span>Snare
        </Link>
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
        {byop.status !== "connected" && (
          loginUrl ? (
            <a className="btn primary small" href={loginUrl}>
              Connect
            </a>
          ) : (
            <button className="btn primary small" disabled title="Loading Pollinations connection">
              Connect
            </button>
          )
        )}
        {byop.status === "connected" && (
          <button className="btn secondary small" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}
