"use client";

import React from "react";
import { useThumbnailStudio } from "./_hooks/useThumbnailStudio";
import { TopBar } from "./_components/TopBar";
import { StepIndicator } from "./_components/StepIndicator";
import { ManualKeyBand } from "./_components/ManualKeyBand";
import { HookStep } from "./_components/HookStep";
import { AudienceStep } from "./_components/AudienceStep";
import { DirectionStep } from "./_components/DirectionStep";
import { ResultsStep } from "./_components/ResultsStep";

export default function StudioPage() {
  const s = useThumbnailStudio();

  return (
    <div className="app-shell">
      <TopBar
        byop={s.byop}
        loginUrl={s.loginUrl}
        onDisconnect={s.handleDisconnect}
        title="ThumbSnare — YouTube Thumbnail Studio"
      />

      <ManualKeyBand
        visible={s.byop.status !== "connected"}
        value={s.manualKeyInput}
        onChange={s.setManualKeyInput}
        onUse={() => s.handleConnectKey(s.manualKeyInput)}
      />

      <StepIndicator current={s.step} />

      <main className="wizard-main">
        {s.step === 1 && (
          <HookStep
            brief={s.brief}
            setBrief={s.setBrief}
            briefHistory={s.briefHistory}
            onLoadSample={s.loadSample}
            onLoadHistory={s.loadHistory}
            onDeleteHistory={s.deleteHistoryEntry}
            onClearHistory={s.clearHistory}
            showSamples={s.showSamples}
            showHistory={s.showHistory}
            setShowSamples={s.setShowSamples}
            setShowHistory={s.setShowHistory}
            onNext={() => {
              if (s.brief.videoTitle.trim().length < 3 || s.brief.angle.trim().length < 5) {
                return;
              }
              s.setStep(2);
            }}
            error={s.error}
            onClearDraft={s.clearDraftAction}
            hasStoredDraft={s.hasStoredDraft}
          />
        )}

        {s.step === 2 && (
          <AudienceStep
            brief={s.brief}
            setBrief={s.setBrief}
            onBack={() => s.setStep(1)}
            onNext={() => s.setStep(3)}
            error={s.error}
          />
        )}

        {s.step === 3 && (
          <DirectionStep
            brief={s.brief}
            setBrief={s.setBrief}
            onBack={() => s.setStep(2)}
            onGenerate={() => void s.handleGenerate()}
            loading={s.loading}
            hasKey={!!s.byop.key}
            imageModels={s.imageModels}
            selectedModel={s.selectedModel}
            onSelectModel={s.setSelectedModel}
            error={s.error}
          />
        )}

        {s.step === 4 && (
          <ResultsStep
            brief={s.brief}
            result={s.result}
            loading={s.loading}
            error={s.error}
            regenId={s.regenId}
            copied={s.copied}
            imgErrorMap={s.imgErrorMap}
            fallbackModelMap={s.fallbackModelMap}
            selectedModel={s.selectedModel}
            starred={s.starred}
            density={s.density}
            byopKey={s.byop.key}
            onRetry={s.handleRetry}
            onEditAudience={() => s.setStep(2)}
            onEditDirection={() => s.setStep(3)}
            onRegenerate={(id) => void s.handleRegenerate(id)}
            onRegenerateAll={() => void s.handleGenerate()}
            onCopyConcept={s.handleCopyConcept}
            onCopyAll={s.handleCopyAll}
            onCopyStarred={s.handleCopyStarred}
            onExportJson={s.handleExportJson}
            onExportStarredJson={s.handleExportStarredJson}
            onExportMarkdown={s.handleExportMarkdown}
            onExportStarredMarkdown={s.handleExportStarredMarkdown}
            onPrint={s.handlePrint}
            onToggleStar={s.toggleStar}
            onImageError={s.handleImageError}
            onRetryImage={s.handleRetryImage}
            onDensityChange={s.setDensity}
            onStartBrief={() => s.setStep(1)}
            onClearShortlist={s.clearShortlistAction}
          />
        )}
      </main>
    </div>
  );
}
