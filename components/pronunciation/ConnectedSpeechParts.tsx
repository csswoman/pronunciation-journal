"use client";

// Planned structure:
// <ConnectedSpeechCategoryPills />
// <ConnectedSpeechPhraseCard />
//   linking visual + IPA comparison + tip + mic

import Button from "@/components/ui/Button";
import { Volume2, Mic, ArrowRight, Sparkles } from "@/components/icons";
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
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-label text-xs transition-colors",
            activeCategory === cat.id
              ? "bg-primary text-on-primary font-semibold shadow-sm"
              : "bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken",
          )}
        >
          {cat.label}
        </button>
      ))}
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
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-raised p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
            {phrase.categoryNameEs}
          </span>
          <h2 className="text-h2 font-bold text-fg mt-1 text-pretty">
            &ldquo;{phrase.phrase}&rdquo;
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlaySlow}
            disabled={isPlayingSlow || isPlayingAudio}
            className={cn(
              "flex h-11 px-3.5 items-center gap-1.5 rounded-full border border-border-default bg-surface-base text-fg text-xs font-medium transition-transform hover:scale-105 active:scale-95",
              isPlayingSlow && "border-primary text-primary",
            )}
            title="Escuchar a velocidad lenta y articulada"
          >
            <Volume2 size={16} />
            <span>Lento (0.65x)</span>
          </button>

          <button
            type="button"
            onClick={onPlayConnected}
            disabled={isPlayingSlow || isPlayingAudio}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border border-border-default bg-surface-base text-primary transition-transform hover:scale-105 active:scale-95",
              isPlayingAudio && "animate-pulse border-primary",
            )}
            title="Escuchar habla conectada nativa (1.0x)"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border-default bg-surface-base p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
            Enlace Fonético en Acción
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-body-lg font-bold text-fg py-2">
          {phrase.phrase.split(" ").map((w, idx, arr) => {
            const isLinked =
              phrase.linkedWords.includes(w.replace(/[^a-zA-Z]/g, "")) && idx < arr.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-default shadow-xs">
                  {w}
                </span>
                {isLinked && (
                  <span className="inline-flex items-center gap-1 text-primary font-mono text-xs px-2 py-0.5 rounded-full bg-primary-soft border border-primary/30 animate-pulse">
                    <span>🔗</span>
                    <span>/{phrase.linkSound}/</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/60 text-body-sm">
          <div>
            <span className="font-caption text-xs text-fg-muted block">
              Pronunciación aislada (antinatural):
            </span>
            <span className="font-ipa text-fg-muted line-through">{phrase.isolatedIpa}</span>
          </div>
          <div>
            <span className="font-caption text-xs text-primary font-semibold block">
              Habla conectada nativa:
            </span>
            <span className="font-ipa text-primary font-bold text-base">{phrase.connectedIpa}</span>
          </div>
        </div>
      </div>

      <RhythmicSentenceDisplay
        sentence={phrase.phrase}
        showAudio={false}
      />

      <div className="rounded-xl border border-border-subtle bg-surface-base p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-caption text-xs font-semibold text-fg-muted">Cómo suena al oído:</span>
          <span className="font-label text-sm font-bold text-fg bg-surface-raised px-2 py-0.5 rounded border border-border-subtle">
            {phrase.howItSoundsEs}
          </span>
        </div>
        <p className="text-body-sm text-fg-muted mt-2 text-pretty">{phrase.explanationEs}</p>
      </div>

      {isSupported && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

            <Button type="button" variant="secondary" size="md" onClick={onNext} className="w-full sm:w-auto">
              Siguiente frase
              <ArrowRight size={16} />
            </Button>
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
