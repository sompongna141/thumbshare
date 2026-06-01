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
import { getNextFallbackModel, pickDefaultModel } from "@/lib/model-fallback";
import { sampleBriefs, sampleBriefLabels } from "@/lib/sample-brief";
import { buildMarkdownPacket } from "@/lib/export";

/* Local Storage Helpers */

function getStoredKey(): string | null {
  try { return localStorage.getItem("pollinations_key"); } catch { return null; }
}
function setStoredKey(key: string) {
  try { localStorage.setItem("pollinations_key", key); } catch { /* ignore */ }
}
function clearStoredKey() {
  try { localStorage.removeItem("pollinations_key"); } catch { /* ignore */ }
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
  } catch { return []; }
}

function saveBriefHistory(brief: ThumbnailBrief) {
  try {
    const history = getBriefHistory();
    const next = [
      { brief, savedAt: new Date().toISOString(), videoTitle: brief.videoTitle },
      ...history.filter((h) => h.videoTitle !== brief.videoTitle),
    ].slice(0, MAX_HISTORY);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
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

/* Tone Config */

const TONE_OPTIONS: { value: ThumbnailBrief["tone"]; label: string; cue: string }[] = [
  { value: "dramatic", label: "Dramatic", cue: "High stakes" },
  { value: "funny", label: "Funny", cue: "Comic beat" },
  { value: "educational", label: "Educational", cue: "Clear payoff" },
  { value: "controversial", label: "Controversial", cue: "Tension" },
  { value: "emotional", label: "Emotional", cue: "Story pull" },
  { value: "curiosity", label: "Curiosity", cue: "Open loop" },
  { value: "fear", label: "Fear", cue: "Warning" },
  { value: "aspirational", label: "Aspirational", cue: "Desired state" },
];

/* Step Types */

type Step = 1 | 2 | 3 | 4;

const STEP_META: { label: string }[] = [
  { label: "Hook" },
  { label: "Audience" },
  { label: "Direction" },
  { label: "Concepts" },
];

/* Skeleton Card */

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

/* Concept Card */

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

  useEffect(() => {
    setShowPlaceholder(false);
    setRetryCount(0);
  }, [concept.imagePrompt, concept.conceptName]);

  const imageUrl = useMemo(
    () => buildThumbnailImageUrl(concept.imagePrompt, clientKey, imageModel, retryCount),
    [concept.imagePrompt, clientKey, imageModel, retryCount]
  );

  const colorMap: Record<string, string> = {
    red: "#ef4444", blue: "#3b82f6", yellow: "#eab308", green: "#22c55e",
    orange: "#f97316", purple: "#a855f7", pink: "#ec4899", teal: "#14b8a6",
    darkred: "#991b1b", gold: "#d97706",
  };

  return (
    <div className="concept-card">
      <div className="card-img-wrap">
        {!imageError && !showPlaceholder ? (
          <img src={imageUrl} alt={concept.conceptName} loading="lazy" onError={onImageError} />
        ) : showPlaceholder ? (
          <img
            src={generatePlaceholderSvg(concept)}
            alt={concept.conceptName}
            loading="lazy"
            className="placeholder-preview"
          />
        ) : (
          <div className="img-fallback">
            <div className="img-fallback-icon">IMG</div>
            <div className="img-fallback-text">Image preview unavailable</div>
            <div className="img-fallback-hint">
              {clientKey
                ? `Model: ${imageModel}. Try switching models or regenerate.`
                : "Connect Pollinations to generate previews."}
            </div>
            <div className="img-fallback-actions">
              <button className="btn small" onClick={() => { setRetryCount((p) => p + 1); onRetryImage(); }}>Retry</button>
              <button className="btn secondary small" onClick={() => setShowPlaceholder(true)}>Placeholder</button>
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
          <span className="placement">- {concept.textOverlay.placement}</span>
        </div>

        <div className="section-title">Color Psychology</div>
        <div className="color-row">
          <span
            className="color-swatch"
            style={{
              backgroundColor: concept.colorPsychology.primaryColor.startsWith("#")
                ? concept.colorPsychology.primaryColor
                : colorMap[concept.colorPsychology.primaryColor.toLowerCase()] || "#666",
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
            {starred ? "Saved" : "Save"}
          </button>
          <button className="btn secondary small" onClick={() => onCopy(concept)}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            className="btn secondary small"
            onClick={() => onRegenerate(concept.id)}
            disabled={regenerating}
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Step Indicator */

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="step-indicator">
      {([1, 2, 3, 4] as const).map((s, i) => (
        <React.Fragment key={s}>
          <div className={`step-dot-wrap ${s < current ? "complete" : s === current ? "active" : ""}`}>
            <div
              className={`step-dot ${
                s < current ? "complete" : s === current ? "active" : ""
              }`}
            >
              {s < current ? "OK" : s}
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

/* Main Page */

function isBriefValid(b: ThumbnailBrief): boolean {
  return b.videoTitle.trim().length >= 3 && b.angle.trim().length >= 5;
}

export default function HomePage() {
  /* State */
  const [step, setStep] = useState<Step>(1);
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
  const [imageModels, setImageModels] = useState<PollinationsModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("flux");
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [fallbackModelMap, setFallbackModelMap] = useState<Record<string, string>>({});
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [briefHistory, setBriefHistory] = useState<BriefHistoryEntry[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /* Init effects */
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
        let models: PollinationsModel[] = Array.isArray(d.models) ? d.models : [];
        models = models.filter(
          (m) => m.output_modalities?.includes("image") && !m.output_modalities?.includes("video")
        );
        setImageModels(models);
        const savedModel = getStoredModel();
        const availableNames = models.map((m) => m.name);
        const defaultModel = pickDefaultModel(availableNames, savedModel);
        setSelectedModel(defaultModel);
      })
      .catch(() => {
        setImageModels([]);
        setSelectedModel("flux");
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

  /* API call */
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

  /* Handlers */
  async function handleGenerate() {
    if (!byop.key) {
      setError("Connect Pollinations first to generate concepts.");
      setStep(3);
      return;
    }
    if (!isBriefValid(brief)) {
      setError("Please fill in at least Video Title and Angle.");
      return;
    }
    setLoading(true);
    setError(null);
    setStep(4);
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
    return { ...original, constraints: (original.constraints || "") + extra };
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
    if (!result || starred.size === 0) return;
    const text = buildMarkdownPacket(result, starred);
    navigator.clipboard.writeText(text).then(() => {
      setCopied("starred");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleExportStarredJson() {
    if (!result) return;
    const starredConcepts = result.concepts.filter((c) => starred.has(c.id));
    if (starredConcepts.length === 0) return;
    const payload = { concepts: starredConcepts, brief: result.brief, abPlan: result.abPlan };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}-starred.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportStarredMarkdown() {
    if (!result || starred.size === 0) return;
    const md = buildMarkdownPacket(result, starred);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbsnare-${brief.videoTitle.replace(/\s+/g, "-").toLowerCase()}-starred.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyAll() {
    if (!result) return;
    const text = buildMarkdownPacket(result);
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
      `Color: ${c.colorPsychology.primaryColor} - ${c.colorPsychology.emotion}\n` +
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

  function handleExportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
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
    setShowSamples(false);
    setShowHistory(false);
  }

  function loadHistory(entry: BriefHistoryEntry) {
    setBrief(entry.brief);
    setResult(null);
    setError(null);
    setShowHistory(false);
    setShowSamples(false);
  }

  /* Render */
  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo">
            <span className="logo-accent">Thumb</span>Snare
          </div>
        </div>
        <div className="top-bar-right">
          {/* Auth */}
          <div className="auth-chip">
            <span className={`auth-dot ${byop.status === "connected" ? "connected" : ""}`} />
            <span>
              {byop.status === "connected" && byop.key
                ? "Pollinations connected"
                : "Not connected"}
            </span>
          </div>
          {byop.status !== "connected" && loginUrl && (
            <a className="btn primary small" href={loginUrl}>Connect</a>
          )}
          {byop.status === "connected" && (
            <button
              className="btn secondary small"
              onClick={() => {
                clearStoredKey();
                setByop({ key: null, status: "idle" });
                setManualKeyInput("");
              }}
            >
              Disconnect
            </button>
          )}
          {/* Model picker */}
          {imageModels.length > 0 && (
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setStoredModel(e.target.value);
                setImgErrorMap({});
              }}
              aria-label="Image model"
            >
              {imageModels.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Manual key (shown below top bar when not connected) */}
      {byop.status !== "connected" && (
        <div className="manual-key-band">
          <div className="manual-key-row">
            <input
              type="text"
              value={manualKeyInput}
              onChange={(e) => setManualKeyInput(e.target.value)}
              placeholder="Or paste Pollinations API key..."
            />
            <button
              className="btn secondary small"
              onClick={() => {
                const key = manualKeyInput.trim();
                if (!key) return;
                setStoredKey(key);
                setByop({ key, status: "connected" });
              }}
              disabled={!manualKeyInput.trim()}
            >
              Use key
            </button>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* Main Content */}
      <main className="wizard-main">

        {/* STEP 1: Your Video */}
        {step === 1 && (
          <div className="step-panel" key="step1">
            <h2 className="step-title">What&apos;s your video about?</h2>
            <p className="step-subtitle">
              Start with the essentials: your title and the angle that hooks viewers.
            </p>

            {/* Quick-access chips */}
            <div className="quick-chips">
              <div className="dropdown-anchor">
                <button
                  className="chip"
                  onClick={() => { setShowSamples(!showSamples); setShowHistory(false); }}
                >
                  <span className="chip-tag">Examples</span> Load a sample
                </button>
                {showSamples && (
                  <div className="dropdown-menu">
                    {sampleBriefs.map((b, i) => (
                      <button key={i} className="dropdown-item" onClick={() => loadSample(i)}>
                        <span className="chip-tag">{sampleBriefLabels[i]}</span>
                        <span className="dropdown-item-text">{b.videoTitle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {briefHistory.length > 0 && (
                <div className="dropdown-anchor">
                  <button
                    className="chip"
                    onClick={() => { setShowHistory(!showHistory); setShowSamples(false); }}
                  >
                    <span className="chip-tag">History</span> Recent briefs
                  </button>
                  {showHistory && (
                    <div className="dropdown-menu">
                      {briefHistory.map((entry, i) => (
                        <button key={i} className="dropdown-item" onClick={() => loadHistory(entry)}>
                          <span className="chip-tag">{new Date(entry.savedAt).toLocaleDateString()}</span>
                          <span className="dropdown-item-text">{entry.videoTitle}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Video Title */}
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

            {/* Angle */}
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

            {/* Nav */}
            <div className="nav-row">
              <span className="nav-spacer" />
              <button
                className="btn primary"
                onClick={() => {
                  if (!isBriefValid(brief)) {
                    setError("Video Title (3+ chars) and Angle (5+ chars) are required.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                disabled={!isBriefValid(brief)}
              >
                Next
              </button>
            </div>

            {error && <div className="error-banner">{error}</div>}
          </div>
        )}

        {/* STEP 2: Audience */}
        {step === 2 && (
          <div className="step-panel" key="step2">
            <h2 className="step-title">Who needs to click?</h2>
            <p className="step-subtitle">
              Define the viewer, the category, and the channel context before choosing a visual direction.
            </p>

            {/* Audience + Category */}
            <div className="field-row">
              <div className="field">
                <label>Target Audience</label>
                <input
                  value={brief.targetAudience}
                  onChange={(e) => setBrief((b) => ({ ...b, targetAudience: e.target.value }))}
                  placeholder="e.g., Small business owners considering TikTok ads"
                />
              </div>
              <div className="field">
                <label>Topic Category</label>
                <input
                  value={brief.topicCategory}
                  onChange={(e) => setBrief((b) => ({ ...b, topicCategory: e.target.value }))}
                  placeholder="e.g., Marketing / Business"
                />
              </div>
            </div>

            {/* Context */}
            <div className="field">
              <label>Channel Context <span className="optional-label">(optional)</span></label>
              <input
                value={brief.channelContext}
                onChange={(e) => setBrief((b) => ({ ...b, channelContext: e.target.value }))}
                placeholder="e.g., Channel covers paid media strategy"
              />
            </div>

            {/* Nav */}
            <div className="nav-row">
              <button className="btn secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <span className="nav-spacer" />
              <button className="btn primary" onClick={() => setStep(3)}>
                Next
              </button>
            </div>

            {error && <div className="error-banner">{error}</div>}
          </div>
        )}

        {/* STEP 3: Direction */}
        {step === 3 && (
          <div className="step-panel" key="step3">
            <h2 className="step-title">Set the visual direction</h2>
            <p className="step-subtitle">
              Choose the click emotion, note visual guardrails, then generate from a reviewed brief.
            </p>

            <div className="field">
              <label>Tone</label>
              <div className="tone-grid">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    className={`tone-btn ${brief.tone === t.value ? "selected" : ""}`}
                    onClick={() => setBrief((b) => ({ ...b, tone: t.value }))}
                    type="button"
                  >
                    <span className="tone-cue">{t.cue}</span>
                    <span className="tone-name">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Constraints <span className="optional-label">(optional)</span></label>
              <input
                value={brief.constraints}
                onChange={(e) => setBrief((b) => ({ ...b, constraints: e.target.value }))}
                placeholder="e.g., Avoid dollar bills; focus on laptop"
              />
            </div>

            <div className="brief-review">
              <div>
                <span className="review-label">Title</span>
                <strong>{brief.videoTitle || "Not set"}</strong>
              </div>
              <div>
                <span className="review-label">Angle</span>
                <p>{brief.angle || "Not set"}</p>
              </div>
              <div className="review-grid">
                <div>
                  <span className="review-label">Audience</span>
                  <p>{brief.targetAudience || "General creator audience"}</p>
                </div>
                <div>
                  <span className="review-label">Category</span>
                  <p>{brief.topicCategory || "Uncategorized"}</p>
                </div>
                <div>
                  <span className="review-label">Tone</span>
                  <p>{TONE_OPTIONS.find((t) => t.value === brief.tone)?.label || brief.tone}</p>
                </div>
                <div>
                  <span className="review-label">Model</span>
                  <p>{selectedModel}</p>
                </div>
              </div>
            </div>

            <div className="nav-row">
              <button className="btn secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <span className="nav-spacer" />
              <button
                className="btn primary"
                onClick={handleGenerate}
                disabled={loading || !byop.key}
              >
                {loading ? <><span className="spinner" /> Generating...</> : "Generate 6 Concepts"}
              </button>
            </div>

            {!byop.key && (
              <div className="error-banner">
                Connect Pollinations or paste a key above before generating.
              </div>
            )}
            {error && <div className="error-banner">{error}</div>}
          </div>
        )}

        {/* STEP 4: Results */}
        {step === 4 && (
          <div className="step-panel" key="step4">
            <h2 className="step-title">
              {loading && !result
                ? "Generating your concepts..."
                : result
                  ? <>6 concepts for &ldquo;{result.brief.videoTitle}&rdquo;</>
                  : "Your thumbnail concepts"}
            </h2>
            <p className="step-subtitle">
              Star your favorites, regenerate ones that miss, and export your picks.
            </p>

            {/* Back to edit */}
            {!loading && (
              <div className="edit-brief-row">
                <button className="btn secondary small" onClick={() => setStep(2)}>
                  Edit audience
                </button>
                <button className="btn secondary small" onClick={() => setStep(3)}>
                  Edit direction
                </button>
              </div>
            )}

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Loading skeleton */}
            {loading && !result && (
              <div className="concepts-grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="results-section">
                {/* Export toolbar */}
                <div className="export-bar">
                  <button className="btn secondary small" onClick={handleCopyAll}>
                    {copied === "all" ? "Copied" : "Copy All"}
                  </button>
                  <button className="btn secondary small" onClick={handleExportJson}>
                    JSON
                  </button>
                  <button className="btn secondary small" onClick={handleExportMarkdown}>
                    Markdown
                  </button>
                  <button className="btn secondary small" onClick={() => window.print()}>
                    Print
                  </button>
                  <button className="btn primary small" onClick={handleGenerate} disabled={loading}>
                    {loading ? <><span className="spinner" /> Regenerating...</> : "Regenerate All"}
                  </button>
                </div>

                {/* A/B Plan */}
                <div className="ab-plan">
                  <span className="ab-label">A/B Test Plan</span>
                  <p>{result.abPlan}</p>
                </div>

                {/* Shortlist bar */}
                {starred.size > 0 && (
                  <div className="shortlist-bar">
                    <span className="shortlist-label">{starred.size} saved</span>
                    <button className="btn secondary small" onClick={handleCopyStarred}>
                      Copy starred
                    </button>
                    <button className="btn secondary small" onClick={handleExportStarredJson}>
                      Starred JSON
                    </button>
                    <button className="btn secondary small" onClick={handleExportStarredMarkdown}>
                      Starred Markdown
                    </button>
                  </div>
                )}

                {/* Concepts Grid */}
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

            {/* Empty / no result yet (user navigated to step 3 without generating) */}
            {!result && !loading && !error && (
              <div className="empty-state">
                <h3>No concepts yet</h3>
                <p>
                  Go back and fill in your brief, then hit Generate to get 6 thumbnail concepts.
                </p>
                <p className="empty-action">
                  <button className="btn primary" onClick={() => setStep(1)}>
                    Start your brief
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
