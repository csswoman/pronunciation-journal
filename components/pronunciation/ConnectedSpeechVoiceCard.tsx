"use client";

// Planned structure:
// <ConnectedSpeechVoiceCard>
//   <VoiceHeaderBar />
//   <VoicePhraseHeader />
//   <VoiceAudioControls />
//   <VoiceRecordingOrCompareInset: ConnectedSpeechMicPanel | CompareRows />
// </ConnectedSpeechVoiceCard>

import PastelCard from "@/components/layout/PastelCard";
import { Mic, Play } from "@/components/icons";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import type { SpeechErrorCode, SpeechStatus } from "@/hooks/useSpeechRecognition";
import { ConnectedSpeechCategoryDropdown } from "./ConnectedSpeechParts";
import { ConnectedSpeechMicPanel } from "./ConnectedSpeechMicPanel";

interface Props {
  phrase: ConnectedPhrase;
  safeIndex: number;
  totalPhrases: number;
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  isPlayingAudio: boolean;
  isPlayingSlow: boolean;
  status: SpeechStatus;
  errorCode: SpeechErrorCode | null;
  isSupported: boolean;
  hasAttemptAudio: boolean;
  onPlaySlow: () => void;
  onPlayConnected: () => void;
  onPlayAttempt: () => void;
  onToggleMic: () => void;
  onResetRecording: () => void;
}

function SimulatedWaveform({ colorClass }: { colorClass: string }) {
  const heights = [12, 20, 28, 16, 24, 32, 22, 14, 26, 30, 18, 24, 12, 28, 20, 16, 8];
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 h-8 px-2 flex-1 overflow-hidden">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${colorClass}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

export function ConnectedSpeechVoiceCard({
  phrase,
  safeIndex,
  totalPhrases,
  activeCategory,
  onSelectCategory,
  isPlayingAudio,
  isPlayingSlow,
  status,
  errorCode,
  isSupported,
  hasAttemptAudio,
  onPlaySlow,
  onPlayConnected,
  onPlayAttempt,
  onToggleMic,
  onResetRecording,
}: Props) {
  const currentStep = safeIndex + 1;
  const progressPercent = Math.min(100, Math.round((currentStep / Math.max(1, totalPhrases)) * 100));

  return (
    <PastelCard tone="coral" className="flex flex-col gap-6 shadow-xs animate-fadeIn">
      {/* Header Bar: Dropdown + Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <ConnectedSpeechCategoryDropdown
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
        />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-28 h-2.5 rounded-full bg-ink/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-ink-muted">
            {currentStep} de {totalPhrases}
          </span>
        </div>
      </div>

      {/* Main Phrase Title & Explanation */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest block">
          ESCUCHA Y REPITE
        </span>
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
          &ldquo;{phrase.phrase}&rdquo;
        </h2>
        <p className="text-body-sm text-ink-muted font-medium m-0 max-w-lg leading-relaxed">
          {phrase.explanationEs ? `${phrase.explanationEs}. ` : ""}Dilo de un tirón, como si fuera una sola palabra.
        </p>
      </div>

      {/* Audio Playback Controls */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onPlayConnected}
          disabled={isPlayingSlow || isPlayingAudio}
          className="w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center hover:opacity-90 focus-ring cursor-pointer shadow-2xs shrink-0"
          title="Reproducir frase nativa"
          aria-label="Reproducir frase nativa"
        >
          <Play size={18} className="fill-current ml-0.5" />
        </button>

        <button
          type="button"
          onClick={onPlayConnected}
          disabled={isPlayingSlow || isPlayingAudio}
          className="inline-flex min-h-[44px] px-5 items-center gap-2 rounded-full bg-ink text-white font-heading font-extrabold text-sm hover:opacity-90 focus-ring cursor-pointer shadow-2xs"
        >
          <span>Nativa 1.0x</span>
        </button>

        <button
          type="button"
          onClick={onPlaySlow}
          disabled={isPlayingSlow || isPlayingAudio}
          className="inline-flex min-h-[44px] px-5 items-center gap-2 rounded-full border border-ink/20 bg-white/80 dark:bg-slate-900/80 text-ink font-heading font-bold text-sm hover:bg-white focus-ring cursor-pointer shadow-2xs"
        >
          <span>Lenta 0.65x</span>
        </button>
      </div>

      {/* Peach/Coral Inset Card: Mic Recording vs. Waveform Comparison */}
      <div className="bg-coral-soft/80 dark:bg-rose-950/40 border border-ink/10 dark:border-rose-800/30 rounded-3xl p-6 sm:p-7 flex flex-col shadow-xs transition-colors">
        {status !== "done" ? (
          <ConnectedSpeechMicPanel
            status={status}
            errorCode={errorCode}
            isSupported={isSupported}
            onToggleMic={onToggleMic}
          />
        ) : (
          /* Evaluated State: COMPARA Waveform Card */
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest block">
              COMPARA
            </span>

            {/* Row 1: Nativo Audio */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPlayConnected}
                className="w-10 h-10 rounded-full bg-text text-surface flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer focus-ring"
                aria-label="Escuchar audio nativo"
              >
                <Play size={16} className="fill-current ml-0.5" />
              </button>
              <span className="font-heading font-extrabold text-sm text-ink min-w-[64px]">
                Nativo
              </span>
              <SimulatedWaveform colorClass="bg-ink" />
            </div>

            {/* Row 2: Tu intento Audio */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPlayAttempt}
                disabled={!hasAttemptAudio}
                className="w-10 h-10 rounded-full border border-ink/20 bg-white text-ink flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer focus-ring shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Escuchar tu intento de audio"
              >
                <Play size={16} className="fill-current ml-0.5 text-ink" />
              </button>
              <span className="font-heading font-extrabold text-sm text-ink min-w-[64px]">
                Tu intento
              </span>
              <SimulatedWaveform colorClass="bg-coral-deep" />
            </div>

            {/* Re-record action button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onResetRecording}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 rounded-full border border-ink/20 bg-white text-ink font-heading font-extrabold text-xs hover:bg-white/90 transition-all cursor-pointer focus-ring shadow-2xs"
              >
                <Mic size={15} />
                <span>Grabar otra vez</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </PastelCard>
  );
}
