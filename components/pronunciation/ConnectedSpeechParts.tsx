"use client";

// Planned structure:
// <ConnectedSpeechCategoryPills />
// <ConnectedSpeechPhraseCard>
//   - Header & audio actions
//   - Phonetic linking breakdown & IPA comparison
//   - Rhythmic display & acoustic notes
//   - Shadowing recording controls & feedback
// </ConnectedSpeechPhraseCard>

import Button from "@/components/ui/Button";
import { Volume2, Mic, ArrowRight, ArrowLeft, Sparkles } from "@/components/icons";
import { SelfPlaybackAudioBar } from "./SelfPlaybackAudioBar";
import { RhythmicSentenceDisplay } from "./RhythmicSentenceDisplay";
import { CONNECTED_SPEECH_DATA, type ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  { id: "all", label: "Todos los enlaces" },
  { id: "linking-cv", label: "Consonante + Vocal" },
  { id: "flap-t", label: "Flap T (/ɾ/)" },
  { id: "intrusion", label: "Intrusión (/w/ y /j/)" },
  { id: "weak-forms", label: "Formas Débiles" },
  { id: "silent-letters", label: "Letras Mudas" },
] as const;

export function ConnectedSpeechCategoryPills({
  activeCategory,
  onSelect,
}: {
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Categorías de habla conectada"
      className="flex flex-wrap gap-2"
    >
      {CATEGORIES.map((cat) => {
        const isSelected = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 font-label text-xs sm:text-body-sm transition-all focus-ring cursor-pointer",
              isSelected
                ? "bg-primary text-on-primary font-semibold shadow-xs"
                : "bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken",
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConnectedSpeechPhraseCard({
  phrase,
  isPlayingAudio,
  isPlayingSlow,
  isListening,
  isDone,
  isSupported,
  transcript,
  userAudioUrl,
  isSaved,
  onPlaySlow,
  onPlayConnected,
  onToggleMic,
  onNext,
  onPrev,
  hasPrev = false,
}: {
  phrase: ConnectedPhrase;
  isPlayingAudio: boolean;
  isPlayingSlow: boolean;
  isListening: boolean;
  isDone: boolean;
  isSupported: boolean;
  transcript?: string;
  userAudioUrl: string | null;
  isSaved?: boolean;
  onPlaySlow: () => void;
  onPlayConnected: () => void;
  onToggleMic: () => void;
  onNext: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-default bg-surface-raised p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
            {phrase.categoryNameEs}
          </span>
          <h2 className="text-h2 font-bold text-fg mt-1 text-pretty">
            &ldquo;{phrase.phrase}&rdquo;
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPlaySlow}
            disabled={isPlayingSlow || isPlayingAudio}
            className={cn(
              "inline-flex min-h-[44px] px-3.5 items-center gap-1.5 rounded-full border border-border-default bg-surface-base text-fg text-xs font-medium transition-all hover:bg-surface-sunken active:scale-95 focus-ring cursor-pointer disabled:opacity-50",
              isPlayingSlow && "border-primary text-primary bg-primary-soft/30",
            )}
            title="Escuchar a velocidad lenta y articulada"
            aria-label="Escuchar a velocidad lenta 0.65x"
          >
            <Volume2 size={16} />
            <span>Lento (0.65x)</span>
          </button>

          <button
            type="button"
            onClick={onPlayConnected}
            disabled={isPlayingSlow || isPlayingAudio}
            className={cn(
              "inline-flex min-h-[44px] px-3.5 items-center gap-1.5 rounded-full border border-border-default bg-surface-base text-primary text-xs font-semibold transition-all hover:bg-surface-sunken active:scale-95 focus-ring cursor-pointer disabled:opacity-50",
              isPlayingAudio && "border-primary bg-primary-soft/40 shadow-xs",
            )}
            title="Escuchar habla conectada nativa (1.0x)"
            aria-label="Escuchar habla conectada nativa 1.0x"
          >
            <Volume2 size={18} className={isPlayingAudio ? "animate-pulse" : ""} />
            <span>Nativa (1.0x)</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border-default bg-surface-base p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
            Enlace Fonético en Acción
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-body-lg font-bold text-fg py-1">
          {phrase.phrase.split(" ").map((w, idx, arr) => {
            const isLinked =
              phrase.linkedWords.includes(w.replace(/[^a-zA-Z]/g, "")) && idx < arr.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-surface-raised border border-border-default shadow-2xs">
                  {w}
                </span>
                {isLinked && (
                  <span className="inline-flex items-center gap-1 text-primary font-mono text-xs px-2.5 py-1 rounded-full bg-primary-soft border border-primary/30 font-medium">
                    <Sparkles className="size-3 text-primary shrink-0" />
                    <span>/{phrase.linkSound}/</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/60 text-body-sm">
          <div className="rounded-md border border-border-subtle bg-surface-sunken/50 p-3">
            <span className="font-caption text-xs text-fg-muted font-medium block mb-0.5">
              Pronunciación aislada (antinatural):
            </span>
            <span className="font-ipa text-fg-muted text-sm sm:text-base">{phrase.isolatedIpa}</span>
          </div>
          <div className="rounded-md border border-primary/30 bg-primary-soft/30 p-3">
            <span className="font-caption text-xs text-primary font-semibold block mb-0.5">
              Habla conectada nativa:
            </span>
            <span className="font-ipa text-primary font-bold text-base">{phrase.connectedIpa}</span>
          </div>
        </div>
      </div>

      <RhythmicSentenceDisplay sentence={phrase.phrase} showAudio={false} />

      <div className="rounded-lg border border-border-subtle bg-surface-base p-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-caption text-xs font-semibold text-fg-muted">Cómo suena al oído:</span>
          <span className="font-label text-sm font-bold text-fg bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
            {phrase.howItSoundsEs}
          </span>
        </div>
        <p className="text-body-sm text-fg-muted mt-2 text-pretty">{phrase.explanationEs}</p>
      </div>

      {isSupported && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant={isListening ? "error" : "primary"}
              size="lg"
              onClick={onToggleMic}
              className="w-full sm:w-auto min-w-[200px]"
            >
              <Mic size={18} className={isListening ? "animate-pulse" : ""} />
              {isListening ? "Detener grabación" : "Grabar mi repetición (Shadowing)"}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {onPrev && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft size={16} />
                  <span>Anterior</span>
                </Button>
              )}
              <Button type="button" variant="secondary" size="md" onClick={onNext} className="w-full sm:w-auto">
                <span>Siguiente frase</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>

          {isDone && (
            <div className="pt-2">
              <SelfPlaybackAudioBar targetWord={phrase.phrase} userAudioUrl={userAudioUrl} />
              {transcript && (
                <div className="mt-2 flex items-center justify-between gap-2 text-body-sm text-fg">
                  <p>
                    Reconocido:{" "}
                    <strong className="font-medium text-primary">&ldquo;{transcript}&rdquo;</strong>
                  </p>
                  {isSaved && (
                    <span className="font-caption text-xs font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success shrink-0">
                      ✓ Guardado (+XP)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function firstIndexForCategory(categoryId: string): number {
  return CONNECTED_SPEECH_DATA.findIndex(
    (p) => categoryId === "all" || p.category === categoryId,
  );
}

