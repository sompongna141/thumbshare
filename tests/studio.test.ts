import { describe, it, expect, beforeEach, vi } from "vitest";
import { isBriefValid, briefCompletion } from "../src/app/studio/_lib/brief-validation";
import {
  BriefHistoryEntry,
  saveBriefHistory,
  getBriefHistory,
  deleteBriefHistoryEntry,
  clearBriefHistory,
  setWizardDraft,
  getWizardDraft,
  clearWizardDraft,
  setShortlist,
  getShortlist,
  getDensity,
  setDensity,
} from "../src/app/studio/_lib/studio-storage";
import { sampleBriefs } from "../src/lib/sample-brief";
import type { ThumbnailBrief } from "../src/lib/types";

// ── LocalStorage mock for the Node test environment ──
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, String(v)); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
  get length() { return this.store.size; }
}
const memStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: memStorage, configurable: true });

// ── Brief validation ──

describe("isBriefValid", () => {
  it("accepts a brief with a long-enough title and angle", () => {
    expect(isBriefValid(sampleBriefs[0])).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(isBriefValid({ ...sampleBriefs[0], videoTitle: "" })).toBe(false);
  });

  it("rejects a short title (2 chars)", () => {
    expect(isBriefValid({ ...sampleBriefs[0], videoTitle: "ab" })).toBe(false);
  });

  it("rejects a short angle (4 chars)", () => {
    expect(isBriefValid({ ...sampleBriefs[0], angle: "abcd" })).toBe(false);
  });

  it("trims whitespace before validation", () => {
    expect(isBriefValid({ ...sampleBriefs[0], videoTitle: "  ab  " })).toBe(false);
    expect(isBriefValid({ ...sampleBriefs[0], videoTitle: "  abc  " })).toBe(true);
  });
});

// ── Brief completion ──

describe("briefCompletion", () => {
  it("returns 0 ratio for a completely empty brief", () => {
    const empty: ThumbnailBrief = {
      videoTitle: "",
      angle: "",
      topicCategory: "",
      targetAudience: "",
      tone: "curiosity",
    };
    const c = briefCompletion(empty);
    expect(c.filled).toBe(1); // tone is filled (default)
    expect(c.total).toBe(9);
    expect(c.ratio).toBeCloseTo(1 / 9);
  });

  it("returns 1 ratio for a fully filled sample brief", () => {
    const c = briefCompletion(sampleBriefs[0]);
    expect(c.filled).toBe(c.total);
    expect(c.ratio).toBe(1);
  });

  it("counts textOverlay toggle as a filled field", () => {
    const c1 = briefCompletion({ ...sampleBriefs[0], textOverlay: false });
    expect(c1.filled).toBe(c1.total);
    // A brief without textOverlay field set counts it as not filled
    const c2 = briefCompletion({ ...sampleBriefs[0], textOverlay: undefined });
    expect(c2.filled).toBe(c2.total - 1);
  });

  it("counts concept count as a filled field", () => {
    const complete = briefCompletion({ ...sampleBriefs[0], conceptCount: 3 });
    expect(complete.filled).toBe(complete.total);
    const missing = briefCompletion({ ...sampleBriefs[0], conceptCount: undefined });
    expect(missing.filled).toBe(missing.total - 1);
  });
});

// ── Brief history storage ──

describe("brief history storage", () => {
  beforeEach(() => memStorage.clear());

  it("saves and reads back a brief", () => {
    saveBriefHistory(sampleBriefs[0]);
    const hist = getBriefHistory();
    expect(hist).toHaveLength(1);
    expect(hist[0].videoTitle).toBe(sampleBriefs[0].videoTitle);
    expect(hist[0].brief).toEqual(sampleBriefs[0]);
    expect(typeof hist[0].savedAt).toBe("string");
  });

  it("deduplicates by videoTitle (newest first)", () => {
    saveBriefHistory(sampleBriefs[0]);
    saveBriefHistory(sampleBriefs[1]);
    saveBriefHistory(sampleBriefs[0]); // re-save first one, should jump to top
    const hist = getBriefHistory();
    expect(hist).toHaveLength(2);
    expect(hist[0].videoTitle).toBe(sampleBriefs[0].videoTitle);
    expect(hist[1].videoTitle).toBe(sampleBriefs[1].videoTitle);
  });

  it("caps at 10 entries", () => {
    for (let i = 0; i < 12; i++) {
      const brief: ThumbnailBrief = { ...sampleBriefs[0], videoTitle: `Title ${i}` };
      saveBriefHistory(brief);
    }
    expect(getBriefHistory()).toHaveLength(10);
  });

  it("deletes a single entry by title", () => {
    saveBriefHistory(sampleBriefs[0]);
    saveBriefHistory(sampleBriefs[1]);
    deleteBriefHistoryEntry(sampleBriefs[0].videoTitle);
    const hist = getBriefHistory();
    expect(hist).toHaveLength(1);
    expect(hist[0].videoTitle).toBe(sampleBriefs[1].videoTitle);
  });

  it("clears all history", () => {
    saveBriefHistory(sampleBriefs[0]);
    saveBriefHistory(sampleBriefs[1]);
    clearBriefHistory();
    expect(getBriefHistory()).toHaveLength(0);
  });

  it("handles corrupt JSON gracefully", () => {
    memStorage.setItem("thumbsnare.brief_history", "{ not json");
    expect(getBriefHistory()).toEqual([]);
  });
});

// ── Wizard draft storage ──

describe("wizard draft storage", () => {
  beforeEach(() => memStorage.clear());

  it("round-trips a draft", () => {
    setWizardDraft({ step: 3, brief: sampleBriefs[2] });
    const draft = getWizardDraft();
    expect(draft).toBeTruthy();
    expect(draft!.step).toBe(3);
    expect(draft!.brief.videoTitle).toBe(sampleBriefs[2].videoTitle);
  });

  it("returns null when no draft exists", () => {
    expect(getWizardDraft()).toBeNull();
  });

  it("returns null for an invalid step value", () => {
    memStorage.setItem("thumbsnare.wizard_draft", JSON.stringify({ step: 9, brief: sampleBriefs[0] }));
    expect(getWizardDraft()).toBeNull();
  });

  it("clears the draft", () => {
    setWizardDraft({ step: 2, brief: sampleBriefs[0] });
    clearWizardDraft();
    expect(getWizardDraft()).toBeNull();
  });
});

// ── Shortlist storage ──

describe("shortlist storage", () => {
  beforeEach(() => memStorage.clear());

  it("round-trips a shortlist", () => {
    setShortlist(["1", "3", "5"]);
    expect(getShortlist()).toEqual(["1", "3", "5"]);
  });

  it("filters non-string entries on read", () => {
    memStorage.setItem("thumbsnare.shortlist", JSON.stringify(["1", 2, null, "3", { id: "4" }]));
    expect(getShortlist()).toEqual(["1", "3"]);
  });
});

// ── Density storage ──

describe("density storage", () => {
  beforeEach(() => memStorage.clear());

  it("defaults to comfortable", () => {
    expect(getDensity()).toBe("comfortable");
  });

  it("persists compact mode", () => {
    setDensity("compact");
    expect(getDensity()).toBe("compact");
  });

  it("falls back to comfortable on unknown values", () => {
    memStorage.setItem("thumbsnare.results_density", "ultra");
    expect(getDensity()).toBe("comfortable");
  });
});
