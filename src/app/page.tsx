"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ThumbnailBrief,
  ThumbnailConcept,
  ConceptGenerationResult,
  ByopState,
} from "@/lib/types";
import { PollinationsModel } from "@/lib/pollinations-models";
import { buildThumbnailImageUrl, generatePlaceholderSvg } from "@/lib/pollinations";
import { getNextFallbackModel, getPreferredModelIndex, pickDefaultModel } from "@/lib/model-fallback";
import { sampleBriefs, sampleBriefLabels } from "@/lib/sample-brief";
import { buildMarkdownPacket } from "@/lib/export";

function getStoredKey(): string | null {
  try {
    return localStorage.getItem("pollinations_key");
  } catch {
    return null;
  }
}

function setStoredKey(key: string) {
  try {
    localStorage.setItem("pollinations_key", key);
  } catch {
    // ignore
  }
}

function clearStoredKey() {
  try {
    localStorage.removeItem("pollinations_key");
  } catch {
    // ignore
  }
}

const LS_MODEL_KEY = "thumbsnare_model";
const LS_HISTORY_KEY = "thumbsnare_history";
const MAX_HISTORY = 10;

function getStoredModel(): string | null {
  try { return localStorage.getItem(LS_MODEL_KEY); } catch { return null; }
}

function setStoredModel(model: string) {
  try { localStorage.setItem(LS_MODEL_KEY, model); } catch { /* ignore */ }
}

interface BriefHistoryEntry {
  brief: ThumbnailBrief;
  savedAt: string;
  videoTitle: string;
}

function getBriefHistory(): BriefHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBriefHistory(brief: ThumbnailBrief) {
  try {
    const history = getBriefHistory();
    const next = [
      { brief, savedAt: new Date().toISOString(), videoTitle: brief.videoTitle },
      ...history.filter((h) => h.videoTitle !== brief.videoTitle),
    ].slice(0, MAX_HISTORY);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function parseHashKey(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/api_key=([^&]+)/);
  if (match) {
    const key = decodeURIComponent(match[1]);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return key;
  }
  return null;
}

function SkeletonCard() {
  return (
    <div className="concept-card skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-bar wide" />
      <div className="skeleton-bar narrow" />
      <div className="skeleton-bar medium" />
      <div className="skeleton-bar wide" />
      <div className="skeleton-bar narrow" />
    </div>
  );
}

export default function HomePage() {
  const [byop, setByop] = useState<ByopState>({ key: null, status: "idle" });
  const [brief, setBrief] = useState<ThumbnailBrief>({
    videoTitle: "",
    angle: "",
    topicCategory: "",
    targetAudience: "",
    tone: "curiosity",
    channelContext: "",
    constraints: "",
  });
  const [result, setResult] = useState<ConceptGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showBriefs, setShowBriefs] = useState(false);
  const [imageModels, setImageModels] = useState<PollinationsModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("sana");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [fallbackModelMap, setFallbackModelMap] = useState<Record<string, string>>({});
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [briefHistory, setBriefHistory] = useState<BriefHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const hashKey = parseHashKey();
    if (hashKey) {
      setStoredKey(hashKey);
      setByop({ key: hashKey, status: "connected" });
    } else {
      const stored = getStoredKey();
      if (stored) setByop({ key: stored, status: "connected" });
    }
  }, []);

  useEffect(() => {
    fetch("/api/pollinations/models")
      .then((r) => r.json())
      .then((d) => {
        const models: PollinationsModel[] = Array.isArray(d.models) ? d.models : [];
        setImageModels(models);
        const savedModel = getStoredModel();
        const availableNames = models.map((m) => m.name);
        const defaultModel = pickDefaultModel(availableNames, savedModel);
        setSelectedModel(defaultModel);
      })
      .catch(() => {
        setImageModels([]);
      });
  }, []);

  useEffect(() => {
    setBriefHistory(getBriefHistory());
  }, []);

  const pollinationsAppKey = useMemo(
    () =>
      typeof window !== "undefined"
        ? (document.querySelector('meta[name="pollinations-app-key"]') as HTMLMetaElement)?.content || ""
        : "",
    []
  );

  const loginUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const appKey = pollinationsAppKey;
    if (!appKey) return "";
    const redirectUri = window.location.origin + "/";
    return `https://auth.pollinations.ai/auth?client_id=${encodeURIComponent(appKey)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api_key&response_type=token`;
  }, [pollinationsAppKey]);

  function isBriefValid(b: ThumbnailBrief): boolean {
    return b.videoTitle.trim().length >= 3 && b.angle.trim().length >= 5;
  }

  const callApi = useCallback(
    async (briefToGenerate: ThumbnailBrief, clientKey: string | undefined, options?: { signal?: AbortSignal }): Promise<ConceptGenerationResult> => {
      const res = await fetch("/api/generate/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: options?.signal,
        body: JSON.stringify({ brief: briefToGenerate, clientKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Generation failed (${res.status})`);
      }
      return res.json();
    },
    []
  );

  async function handleGenerate() {
    if (!byop.key) {
      setError("Connect Pollinations first to generate concepts.");
      return;
    }
    if (!isBriefValid(brief)) {
      setError("Please fill in at least Video Title and Angle.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await callApi(brief, byop.key);
      setResult(res);
      saveBriefHistory(brief);
      setBriefHistory(getBriefHistory());
    } catch (e: any) {
      setError(e?.message || "Failed to generate concepts.");
    } finally {
      setLoading(false);
    }
  }

  function makeRegenBrief(original: ThumbnailBrief, conceptId: string): ThumbnailBrief {
    const extra = `\n[REGENERATE] Only produce concept #${conceptId}, conceptName and imagePrompt must differ from prior version.`;
    return {
      ...original,
      constraints: (original.constraints || "") + extra,
    };
  }

  async function handleRegenerate(id: string) {
    if (!byop.key) return;
    setRegenId(id);
    setImgErrorMap((prev) => ({ ...prev, [id]: false }));
    try {
      const regenBrief = makeRegenBrief(brief, id);
      const res = await callApi(regenBrief, byop.key);
      const idx = parseInt(id, 10) - 1;
      if (result && res.concepts[idx]) {
        const next = { ...result, abPlan: res.abPlan || result.abPlan };
        next.concepts = result.concepts.map((c: ThumbnailConcept, i: number) =>
          i === idx ? res.concepts[idx] : c
        );
        setResult(next);
      } else {
        setResult(res);
      }
    } catch (e: any) {
      setError(e?.message || "Regeneration failed.");
    } finally {
      setRegenId(null);
    }
  }

  function toggleStar(id: string) {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleCopyStarred() {
    if (!result) return;
    const starredConcepts = result.concepts.filter((c) => starred.has(c.id));
    if (starredConcepts.length === 0) return;
    const text = starredConcepts
      .map(
        (c: ThumbnailConcept, i: number) =>
          `# ${i + 1}. ${c.conceptName}\n` +
          `Prompt: ${c.imagePrompt}\n` +
          `Face: ${c.faceExpression}\n` +
          `Text: ${c.textOverlay.text} (${c.textOverlay.placement})\n` +
          `Color: ${c.colorPsychology.primaryColor} — ${c.colorPsychology.emotion}\n` +
          `A/B: ${c.abVariantHint}\n`
      )
      .join("\n---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied("starred");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleExportStarredJson() {
    if (!result) return;
    const starredConcepts = result.concepts.filter((c) => starred.has(c.id));
    if (starredConcepts.length === 0) return;
    const payload = {
      concepts: starredConcepts,
      brief: result.brief,
      abPlan: result.abPlan,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}-starred.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyAll() {
    if (!result) return;
    const text = result.concepts
      .map(
        (c: ThumbnailConcept, i: number) =>
          `# ${i + 1}. ${c.conceptName}\n` +
          `Prompt: ${c.imagePrompt}\n` +
          `Face: ${c.faceExpression}\n` +
          `Text: ${c.textOverlay.text} (${c.textOverlay.placement})\n` +
          `Color: ${c.colorPsychology.primaryColor} — ${c.colorPsychology.emotion}\n` +
          `A/B: ${c.abVariantHint}\n`
      )
      .join("\n---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied("all");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleCopyConcept(c: ThumbnailConcept) {
    const text =
      `${c.conceptName}\n` +
      `Prompt: ${c.imagePrompt}\n` +
      `Face: ${c.faceExpression}\n` +
      `Text: ${c.textOverlay.text} (${c.textOverlay.placement})\n` +
      `Color: ${c.colorPsychology.primaryColor} — ${c.colorPsychology.emotion}\n` +
      `A/B: ${c.abVariantHint}\n` +
      `Platform: ${c.platformNotes}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(c.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleImageError(id: string) {
    const currentModel = fallbackModelMap[id] || selectedModel;
    const availableNames = imageModels.map((m) => m.name);
    const nextModel = getNextFallbackModel(currentModel, availableNames);
    if (nextModel) {
      setFallbackModelMap((prev) => ({ ...prev, [id]: nextModel }));
    } else {
      setImgErrorMap((prev) => ({ ...prev, [id]: true }));
    }
  }

  function handleRetryImage(id: string) {
    setImgErrorMap((prev) => ({ ...prev, [id]: false }));
    setFallbackModelMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleExportMarkdown() {
    if (!result) return;
    const md = buildMarkdownPacket(result);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${result.brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportStarredMarkdown() {
    if (!result) return;
    if (starred.size === 0) return;
    const md = buildMarkdownPacket(result, starred);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${result.brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}-starred.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}-concepts.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadSample(idx: number) {
    setBrief(sampleBriefs[idx]);
    setResult(null);
    setError(null);
    setShowBriefs(false);
    setShowHistory(false);
  }

  function loadHistory(entry: BriefHistoryEntry) {
    setBrief(entry.brief);
    setResult(null);
    setError(null);
    setShowHistory(false);
    setShowBriefs(false);
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>
          <span className="logo-accent">Thumb</span>Snare
        </h1>
        <p>
          YouTube Thumbnail Studio — 6 scroll-stopping concept packs with
          psychology, A/B plans, and ready-to-use prompts.
        </p>
      </div>

      {/* BYOP Auth Panel */}
      <div className="byop-panel">
        <div className="row">
          <div className={`dot ${byop.status === "connected" ? "connected" : ""}`} />
          <span className="byop-label">
            {byop.status === "connected" && byop.key
              ? "Pollinations connected"
              : "Connect Pollinations to generate"}
          </span>
          {byop.status !== "connected" && loginUrl && (
            <a className="btn" href={loginUrl}>
              Connect Pollinations
            </a>
          )}
          {byop.status === "connected" && (
            <button
              className="btn secondary"
              onClick={() => {
                clearStoredKey();
                setByop({ key: null, status: "idle" });
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Brief Form */}
      <div className="form">
        <div className="form-header">
          <h2 className="form-title">Video Brief</h2>
          <div className="form-header-actions">
            <div className="sample-dropdown">
              <button
                className="btn secondary sample-toggle"
                onClick={() => { setShowBriefs(!showBriefs); setShowHistory(false); }}
              >
                Load example ▾
              </button>
              {showBriefs && (
                <div className="sample-menu">
                  {sampleBriefs.map((b, i) => (
                    <button key={i} className="sample-item" onClick={() => loadSample(i)}>
                      <span className="sample-tag">{sampleBriefLabels[i]}</span>
                      <span className="sample-title">{b.videoTitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {briefHistory.length > 0 && (
              <div className="sample-dropdown">
                <button
                  className="btn secondary sample-toggle"
                  onClick={() => { setShowHistory(!showHistory); setShowBriefs(false); }}
                >
                  History ▾
                </button>
                {showHistory && (
                  <div className="sample-menu">
                    {briefHistory.map((entry, i) => (
                      <button key={i} className="sample-item" onClick={() => loadHistory(entry)}>
                        <span className="sample-tag">{new Date(entry.savedAt).toLocaleDateString()}</span>
                        <span className="sample-title">{entry.videoTitle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label>
            Video Title <span className="required">*</span>
          </label>
          <input
            value={brief.videoTitle}
            onChange={(e) => setBrief((b) => ({ ...b, videoTitle: e.target.value }))}
            placeholder="e.g., I Spent $10,000 on TikTok Ads So You Don't Have To"
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
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Topic Category</label>
            <input
              value={brief.topicCategory}
              onChange={(e) => setBrief((b) => ({ ...b, topicCategory: e.target.value }))}
              placeholder="e.g., Marketing / Business"
            />
          </div>
          <div className="field">
            <label>Tone</label>
            <select
              value={brief.tone}
              onChange={(e) => setBrief((b) => ({ ...b, tone: e.target.value as any }))}
            >
              <option value="dramatic">Dramatic</option>
              <option value="funny">Funny</option>
              <option value="educational">Educational</option>
              <option value="controversial">Controversial</option>
              <option value="emotional">Emotional</option>
              <option value="curiosity">Curiosity</option>
              <option value="fear">Fear</option>
              <option value="aspirational">Aspirational</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Target Audience</label>
          <input
            value={brief.targetAudience}
            onChange={(e) => setBrief((b) => ({ ...b, targetAudience: e.target.value }))}
            placeholder="e.g., Small business owners considering TikTok ads"
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Channel Context (optional)</label>
            <input
              value={brief.channelContext}
              onChange={(e) => setBrief((b) => ({ ...b, channelContext: e.target.value }))}
              placeholder="e.g., Channel covers paid media strategy"
            />
          </div>
          <div className="field">
            <label>Constraints (optional)</label>
            <input
              value={brief.constraints}
              onChange={(e) => setBrief((b) => ({ ...b, constraints: e.target.value }))}
              placeholder="e.g., Avoid dollar bills; focus on laptop"
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating 6 concepts…" : "Generate 6 Concepts"}
          </button>
          {imageModels.length > 0 && (
            <div className="model-picker">
              <label htmlFor="model">Image model</label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setStoredModel(e.target.value);
                  setImgErrorMap({});
                }}
              >
                {imageModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {result && (
            <>
              <button className="btn secondary" onClick={handleCopyAll}>
                {copied === "all" ? "✓ Copied!" : "Copy All"}
              </button>
              <button className="btn secondary" onClick={handleExportJson}>
                Export JSON
              </button>
              <button className="btn secondary" onClick={handleExportMarkdown}>
                Export Markdown
              </button>
              <button className="btn secondary" onClick={() => window.print()}>
                Print
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Loading skeleton */}
      {loading && !result && (
        <div className="concepts-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="results">
          <div className="results-header">
            <h2 className="results-title">
              6 Thumbnail Concepts for &ldquo;{result.brief.videoTitle}&rdquo;
            </h2>
            <div className="ab-plan">
              <span className="ab-label">A/B Test Plan</span>
              <p>{result.abPlan}</p>
            </div>
          </div>
          {starred.size > 0 && (
            <div className="shortlist-bar">
              <span className="shortlist-label">★ {starred.size} starred</span>
              <button
                className="btn secondary small"
                onClick={handleCopyStarred}
              >
                Copy starred
              </button>
              <button
                className="btn secondary small"
                onClick={handleExportStarredJson}
              >
                Export starred JSON
              </button>
              <button
                className="btn secondary small"
                onClick={handleExportStarredMarkdown}
              >
                Export starred Markdown
              </button>
            </div>
          )}
          <div className={`concepts-grid ${loading ? "loading" : ""}`}>
            {result.concepts.map((c) => (
              <ConceptCard
                key={c.id}
                concept={c}
                clientKey={byop.key || undefined}
                imageModel={fallbackModelMap[c.id] || selectedModel}
                imageError={imgErrorMap[c.id] || false}
                onImageError={() => handleImageError(c.id)}
                onRetryImage={() => handleRetryImage(c.id)}
                onRegenerate={handleRegenerate}
                regenerating={regenId === c.id}
                onCopy={handleCopyConcept}
                copied={copied === c.id}
                starred={starred.has(c.id)}
                onToggleStar={() => toggleStar(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="empty">
          <div className="empty-icon">🎯</div>
          <h3>Ready to create thumbnails that stop the scroll</h3>
          <p>
            Fill in the brief above and click <strong>Generate 6 Concepts</strong> to get
            structured thumbnail packs with image prompts, face expressions, color
            psychology, and A/B test plans.
          </p>
          <p className="empty-hint">
            New here? Try <button className="link-btn" onClick={() => loadSample(0)}>loading a sample brief</button> to see it in action.
          </p>
        </div>
      )}
    </div>
  );
}

function ConceptCard({
  concept,
  clientKey,
  imageModel,
  imageError,
  onImageError,
  onRetryImage,
  onRegenerate,
  regenerating,
  onCopy,
  copied,
  starred,
  onToggleStar,
}: {
  concept: ThumbnailConcept;
  clientKey?: string;
  imageModel: string;
  imageError: boolean;
  onImageError: () => void;
  onRetryImage: () => void;
  onRegenerate: (id: string) => void;
  regenerating: boolean;
  onCopy: (c: ThumbnailConcept) => void;
  copied: boolean;
  starred: boolean;
  onToggleStar: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  useEffect(() => { setShowPlaceholder(false); setRetryCount(0); }, [concept.imagePrompt, concept.conceptName]);
  const imageUrl = useMemo(
    () => buildThumbnailImageUrl(concept.imagePrompt, clientKey, imageModel, retryCount),
    [concept.imagePrompt, clientKey, imageModel, retryCount]
  );
  return (
    <div className="concept-card">
      <div className="card-img-wrap">
        {!imageError && !showPlaceholder ? (
          <img
            src={imageUrl}
            alt={concept.conceptName}
            loading="lazy"
            onError={onImageError}
          />
        ) : showPlaceholder ? (
          <img
            src={generatePlaceholderSvg(concept)}
            alt={concept.conceptName}
            loading="lazy"
            style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div className="img-fallback">
            <div className="img-fallback-icon">🖼️</div>
            <div className="img-fallback-text">Image preview unavailable</div>
            <div className="img-fallback-hint">
              {clientKey
                ? `Model: ${imageModel}. Try switching models or regenerate.`
                : "Connect Pollinations to generate previews."}
            </div>
            <div className="img-fallback-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn small" onClick={() => { setRetryCount((prev) => prev + 1); onRetryImage(); }}>Retry image</button>
              <button className="btn small secondary" onClick={() => setShowPlaceholder(true)}>Generate placeholder</button>
            </div>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-header">
          <span className="concept-num">#{concept.id}</span>
          <span className="name">{concept.conceptName}</span>
        </div>
        <span className="tag">{concept.faceExpression}</span>

        <div className="section-title">Text Overlay</div>
        <div className="text-overlay">
          &ldquo;{concept.textOverlay.text}&rdquo;{" "}
          <span className="placement">— {concept.textOverlay.placement}</span>
        </div>

        <div className="section-title">Color Psychology</div>
        <div className="color-row">
          <span
            className="color-swatch"
            style={{
              backgroundColor: concept.colorPsychology.primaryColor.startsWith("#")
                ? concept.colorPsychology.primaryColor
                : concept.colorPsychology.primaryColor === "red"
                  ? "#ef4444"
                  : concept.colorPsychology.primaryColor === "blue"
                    ? "#3b82f6"
                    : concept.colorPsychology.primaryColor === "yellow"
                      ? "#eab308"
                      : concept.colorPsychology.primaryColor === "green"
                        ? "#22c55e"
                        : concept.colorPsychology.primaryColor === "orange"
                          ? "#f97316"
                          : concept.colorPsychology.primaryColor === "purple"
                            ? "#a855f7"
                            : concept.colorPsychology.primaryColor === "pink"
                              ? "#ec4899"
                              : "#666",
            }}
          />
          <div>
            <div className="color-emotion">{concept.colorPsychology.emotion}</div>
            <div className="color-note">{concept.colorPsychology.contrastNote}</div>
          </div>
        </div>

        <div className="section-title">A/B Variant</div>
        <div className="prompt">{concept.abVariantHint}</div>

        <div className="section-title">Platform Notes</div>
        <div className="prompt">{concept.platformNotes}</div>

        <details className="prompt-details">
          <summary>Image Prompt</summary>
          <div className="prompt-full">{concept.imagePrompt}</div>
        </details>

        <div className="card-actions">
          <button
            className={`btn small star-btn ${starred ? "starred" : ""}`}
            onClick={onToggleStar}
            title={starred ? "Unstar" : "Star this concept"}
          >
            {starred ? "★" : "☆"}
          </button>
          <button
            className="btn secondary small"
            onClick={() => onCopy(concept)}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            className="btn secondary small"
            onClick={() => onRegenerate(concept.id)}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}
