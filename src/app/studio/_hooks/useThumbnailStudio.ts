"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ThumbnailBrief,
  ThumbnailConcept,
  ConceptGenerationResult,
  ByopState,
} from "@/lib/types";
import { PollinationsModel } from "@/lib/pollinations-models";
import { getNextFallbackModel, pickDefaultModel } from "@/lib/model-fallback";
import { buildMarkdownPacket } from "@/lib/export";
import {
  BriefHistoryEntry,
  WizardDraft,
  WizardStep,
  clearBriefHistory,
  clearStoredKey,
  clearWizardDraft,
  deleteBriefHistoryEntry,
  getBriefHistory,
  getDensity,
  getShortlist,
  getStoredKey,
  getStoredModel,
  getWizardDraft,
  saveBriefHistory,
  setDensity as persistDensity,
  setShortlist as persistShortlist,
  setStoredKey,
  setStoredModel,
  setWizardDraft,
} from "../_lib/studio-storage";
import {
  buildPollinationsLoginUrl,
  extractPollinationsKey,
} from "../_lib/pollinations-auth";

const EMPTY_BRIEF: ThumbnailBrief = {
  videoTitle: "",
  angle: "",
  topicCategory: "",
  targetAudience: "",
  tone: "curiosity",
  textOverlay: true,
  textMode: "post-process",
  textStyle: "recommended",
  conceptCount: 6,
  channelContext: "",
  constraints: "",
};

const DEFAULT_MODEL = "sana";
const DEFAULT_POLLINATIONS_APP_KEY = "pk_4vwdCAbLf8wWIOJE";

interface UseThumbnailStudio {
  /* state */
  step: WizardStep;
  setStep: (s: WizardStep) => void;
  byop: ByopState;
  brief: ThumbnailBrief;
  setBrief: React.Dispatch<React.SetStateAction<ThumbnailBrief>>;
  result: ConceptGenerationResult | null;
  loading: boolean;
  error: string | null;
  regenId: string | null;
  copied: string | null;
  imageModels: PollinationsModel[];
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  imgErrorMap: Record<string, boolean>;
  fallbackModelMap: Record<string, string>;
  starred: Set<string>;
  briefHistory: BriefHistoryEntry[];
  showSamples: boolean;
  showHistory: boolean;
  setShowSamples: (v: boolean) => void;
  setShowHistory: (v: boolean) => void;
  density: "comfortable" | "compact";
  setDensity: (d: "comfortable" | "compact") => void;

  /* derived */
  pollinationsAppKey: string;
  loginUrl: string;
  hasStoredDraft: boolean;

  /* actions */
  handleConnectKey: (key: string) => void;
  handleDisconnect: () => void;
  handleGenerate: () => Promise<void>;
  handleRegenerate: (id: string) => Promise<void>;
  handleRetry: () => void;
  handleCopyConcept: (c: ThumbnailConcept) => void;
  handleCopyAll: () => void;
  handleCopyStarred: () => void;
  handleExportJson: () => void;
  handleExportStarredJson: () => void;
  handleExportMarkdown: () => void;
  handleExportStarredMarkdown: () => void;
  handlePrint: () => void;
  loadSample: (idx: number) => void;
  loadHistory: (entry: BriefHistoryEntry) => void;
  deleteHistoryEntry: (videoTitle: string) => void;
  clearHistory: () => void;
  handleImageError: (id: string) => void;
  handleRetryImage: (id: string) => void;
  toggleStar: (id: string) => void;
  clearShortlistAction: () => void;
  clearDraftAction: () => void;
}

export function useThumbnailStudio(): UseThumbnailStudio {
  /* Core state */
  const [step, _setStep] = useState<WizardStep>(1);
  const [byop, setByop] = useState<ByopState>({ key: null, status: "idle" });
  const [brief, setBrief] = useState<ThumbnailBrief>(EMPTY_BRIEF);
  const [result, setResult] = useState<ConceptGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [imageModels, setImageModels] = useState<PollinationsModel[]>([]);
  const [selectedModel, setSelectedModelState] = useState<string>(DEFAULT_MODEL);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [fallbackModelMap, setFallbackModelMap] = useState<Record<string, string>>({});
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [briefHistory, setBriefHistory] = useState<BriefHistoryEntry[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [density, setDensityState] = useState<"comfortable" | "compact">("comfortable");
  const [hasStoredDraft, setHasStoredDraft] = useState(false);

  /* Wrapper: setStep that also persists the draft on every change. */
  const setStep = useCallback((s: WizardStep) => {
    _setStep(s);
  }, []);

  /* Initialize once: hash key, stored key, stored draft, history, density, model, models list. */
  useEffect(() => {
    // 1. BYOP key
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const key = extractPollinationsKey(hash);
    if (key) {
      setStoredKey(key);
      setByop({ key, status: "connected" });
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } else {
      const stored = getStoredKey();
      if (stored) setByop({ key: stored, status: "connected" });
    }

    // 2. Wizard draft (step + brief)
    const draft = getWizardDraft();
    if (draft) {
      _setStep(draft.step);
      setBrief(draft.brief);
      setHasStoredDraft(true);
    }

    // 3. Brief history
    setBriefHistory(getBriefHistory());

    // 4. Shortlist
    const persistedShortlist = getShortlist();
    if (persistedShortlist.length > 0) setStarred(new Set(persistedShortlist));

    // 5. Density
    setDensityState(getDensity());
  }, []);

  /* Persist draft on every change (step or brief) */
  useEffect(() => {
    if (brief.videoTitle === "" && brief.angle === "" && step === 1) {
      // Empty initial state - don't write
      return;
    }
    const draft: WizardDraft = { step, brief };
    setWizardDraft(draft);
    setHasStoredDraft(true);
  }, [step, brief]);

  /* Persist shortlist on every change */
  useEffect(() => {
    persistShortlist(Array.from(starred));
  }, [starred]);

  /* Fetch image models on mount */
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
        setSelectedModelState(defaultModel);
      })
      .catch(() => setSelectedModelState(DEFAULT_MODEL));
  }, []);

  /* App key + login URL.
   * The app key is a publishable Pollinations client id, not a spend key.
   * Keep a code fallback so Connect still works if deployment env is missing. */
  const bundledPollinationsAppKey =
    process.env.NEXT_PUBLIC_POLLINATIONS_APP_KEY || DEFAULT_POLLINATIONS_APP_KEY;
  const [runtimePollinationsAppKey, setRuntimePollinationsAppKey] = useState("");
  const pollinationsAppKey = bundledPollinationsAppKey || runtimePollinationsAppKey;

  const [siteOrigin, setSiteOrigin] = useState<string>(
    process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://thumbsnare.vercel.app"
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setSiteOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (bundledPollinationsAppKey) return;

    let cancelled = false;
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((config: { appKey?: string } | null) => {
        if (!cancelled && config?.appKey) {
          setRuntimePollinationsAppKey(config.appKey);
        }
      })
      .catch(() => {
        // Keep the Connect action disabled if config cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, [bundledPollinationsAppKey]);

  const loginUrl = useMemo(
    () => buildPollinationsLoginUrl(pollinationsAppKey, siteOrigin),
    [pollinationsAppKey, siteOrigin]
  );

  const setSelectedModel = useCallback((m: string) => {
    setSelectedModelState(m);
    setStoredModel(m);
    setImgErrorMap({});
  }, []);

  const setDensity = useCallback((d: "comfortable" | "compact") => {
    setDensityState(d);
    persistDensity(d);
  }, []);

  /* API call (cancellable) */
  const abortRef = useRef<AbortController | null>(null);
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

  /* Actions */
  const handleConnectKey = useCallback((key: string) => {
    const k = key.trim();
    if (!k) return;
    setStoredKey(k);
    setByop({ key: k, status: "connected" });
  }, []);

  const handleDisconnect = useCallback(() => {
    clearStoredKey();
    setByop({ key: null, status: "idle" });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!byop.key) {
      setError("Connect Pollinations first to generate concepts.");
      setStep(3);
      return;
    }
    if (brief.videoTitle.trim().length < 3 || brief.angle.trim().length < 5) {
      setError("Please fill in at least Video Title and Angle.");
      setStep(1);
      return;
    }
    setLoading(true);
    setError(null);
    setStep(4);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await callApi(brief, byop.key, { signal: controller.signal });
      setResult(res);
      saveBriefHistory(brief);
      setBriefHistory(getBriefHistory());
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Failed to generate concepts.");
    } finally {
      setLoading(false);
    }
  }, [byop.key, brief, callApi, setStep]);

  const handleRetry = useCallback(() => {
    setError(null);
    void handleGenerate();
  }, [handleGenerate]);

  const handleRegenerate = useCallback(
    async (id: string) => {
      if (!byop.key) return;
      setRegenId(id);
      setImgErrorMap((prev) => ({ ...prev, [id]: false }));
      try {
        const regenBrief: ThumbnailBrief = {
          ...brief,
          constraints: `${brief.constraints || ""}\n[REGENERATE] Only produce concept #${id}, conceptName and imagePrompt must differ from prior version.`,
        };
        const res = await callApi(regenBrief, byop.key);
        const idx = parseInt(id, 10) - 1;
        if (result && res.concepts[idx]) {
          setResult((prev) => {
            if (!prev) return res;
            const next = { ...prev, abPlan: res.abPlan || prev.abPlan };
            next.concepts = prev.concepts.map((c, i) => (i === idx ? res.concepts[idx] : c));
            return next;
          });
        } else {
          setResult(res);
        }
      } catch (e: any) {
        setError(e?.message || "Regeneration failed.");
      } finally {
        setRegenId(null);
      }
    },
    [byop.key, brief, callApi, result]
  );

  const handleImageError = useCallback(
    (id: string) => {
      const currentModel = fallbackModelMap[id] || selectedModel;
      const availableNames = imageModels.map((m) => m.name);
      const nextModel = getNextFallbackModel(currentModel, availableNames);
      if (nextModel) {
        setFallbackModelMap((prev) => ({ ...prev, [id]: nextModel }));
      } else {
        setImgErrorMap((prev) => ({ ...prev, [id]: true }));
      }
    },
    [fallbackModelMap, selectedModel, imageModels]
  );

  const handleRetryImage = useCallback((id: string) => {
    setImgErrorMap((prev) => ({ ...prev, [id]: false }));
    setFallbackModelMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearShortlistAction = useCallback(() => {
    setStarred(new Set());
  }, []);

  const clearDraftAction = useCallback(() => {
    clearWizardDraft();
    setHasStoredDraft(false);
    _setStep(1);
    setBrief(EMPTY_BRIEF);
    setResult(null);
    setError(null);
  }, []);

  /* File download helper */
  const downloadBlob = useCallback((content: string | Blob, filename: string, mime: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const slugifyTitle = useCallback(
    (title: string) => title.replace(/\s+/g, "-").toLowerCase() || "untitled",
    []
  );

  /* Export handlers */
  const handleCopyConcept = useCallback(
    (c: ThumbnailConcept) => {
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
    },
    []
  );

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    const text = buildMarkdownPacket(result);
    navigator.clipboard.writeText(text).then(() => {
      setCopied("all");
      setTimeout(() => setCopied(null), 2000);
    });
  }, [result, buildMarkdownPacket]);

  const handleCopyStarred = useCallback(() => {
    if (!result || starred.size === 0) return;
    const text = buildMarkdownPacket(result, starred);
    navigator.clipboard.writeText(text).then(() => {
      setCopied("starred");
      setTimeout(() => setCopied(null), 2000);
    });
  }, [result, starred, buildMarkdownPacket]);

  const handleExportJson = useCallback(() => {
    if (!result) return;
    downloadBlob(JSON.stringify(result, null, 2), `thumbsnare-${slugifyTitle(brief.videoTitle)}-concepts.json`, "application/json");
  }, [result, brief.videoTitle, downloadBlob, slugifyTitle]);

  const handleExportStarredJson = useCallback(() => {
    if (!result) return;
    const starredConcepts = result.concepts.filter((c) => starred.has(c.id));
    if (starredConcepts.length === 0) return;
    const payload = { concepts: starredConcepts, brief: result.brief, abPlan: result.abPlan };
    downloadBlob(JSON.stringify(payload, null, 2), `thumbsnare-${slugifyTitle(brief.videoTitle)}-starred.json`, "application/json");
  }, [result, starred, brief.videoTitle, downloadBlob, slugifyTitle]);

  const handleExportMarkdown = useCallback(() => {
    if (!result) return;
    const md = buildMarkdownPacket(result);
    downloadBlob(md, `thumbsnare-${slugifyTitle(brief.videoTitle)}.md`, "text/markdown");
  }, [result, brief.videoTitle, downloadBlob, slugifyTitle, buildMarkdownPacket]);

  const handleExportStarredMarkdown = useCallback(() => {
    if (!result || starred.size === 0) return;
    const md = buildMarkdownPacket(result, starred);
    downloadBlob(md, `thumbsnare-${slugifyTitle(brief.videoTitle)}-starred.md`, "text/markdown");
  }, [result, starred, brief.videoTitle, downloadBlob, slugifyTitle, buildMarkdownPacket]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* Sample + history */
  const loadSample = useCallback(
    async (idx: number) => {
      const { sampleBriefs } = await import("@/lib/sample-brief");
      setBrief(sampleBriefs[idx]);
      setResult(null);
      setError(null);
      setShowSamples(false);
      setShowHistory(false);
    },
    []
  );

  const loadHistory = useCallback((entry: BriefHistoryEntry) => {
    setBrief(entry.brief);
    setResult(null);
    setError(null);
    setShowHistory(false);
    setShowSamples(false);
  }, []);

  const deleteHistoryEntry = useCallback((videoTitle: string) => {
    deleteBriefHistoryEntry(videoTitle);
    setBriefHistory(getBriefHistory());
  }, []);

  const clearHistory = useCallback(() => {
    clearBriefHistory();
    setBriefHistory([]);
  }, []);

  return {
    step,
    setStep,
    byop,
    brief,
    setBrief,
    result,
    loading,
    error,
    regenId,
    copied,
    imageModels,
    selectedModel,
    setSelectedModel,
    imgErrorMap,
    fallbackModelMap,
    starred,
    briefHistory,
    showSamples,
    showHistory,
    setShowSamples,
    setShowHistory,
    density,
    setDensity,
    pollinationsAppKey,
    loginUrl,
    hasStoredDraft,
    handleConnectKey,
    handleDisconnect,
    handleGenerate,
    handleRegenerate,
    handleRetry,
    handleCopyConcept,
    handleCopyAll,
    handleCopyStarred,
    handleExportJson,
    handleExportStarredJson,
    handleExportMarkdown,
    handleExportStarredMarkdown,
    handlePrint,
    loadSample,
    loadHistory,
    deleteHistoryEntry,
    clearHistory,
    handleImageError,
    handleRetryImage,
    toggleStar,
    clearShortlistAction,
    clearDraftAction,
  };
}
