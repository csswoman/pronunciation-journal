"use client";

// Planned structure:
// <AcousticUnpackingCard>
//   <UnpackingHeader />
//   <AudioPlayerRow />
//   <UnpackingChallenge />
//   <AcousticMapReveal />
// </AcousticUnpackingCard>

import { useState, useCallback, useMemo } from "react";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import Button from "@/components/ui/Button";
import { Volume2, Sparkles, Check, X } from "@/components/icons";
import { RhythmicSentenceDisplay } from "./RhythmicSentenceDisplay";
import { cn } from "@/lib/cn";

interface Props {
  phrase: ConnectedPhrase;
  onComplete?: (isCorrect: boolean) => void;
  isSaved?: boolean;
}

export function AcousticUnpackingCard({ phrase, onComplete, isSaved }: Props) {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Generate plausible options for the acoustic unpacking question
  const options = useMemo(() => {
    const correct = phrase.phrase;
    const distractor1 = phrase.phrase
      .split(" ")
      .map((w) => w.toUpperCase())
      .join(" ... ");
    const distractor2 = phrase.howItSoundsEs
      .replace(/[«»]/g, "")
      .trim();

    return [
      { text: correct, isCorrect: true, label: `«${correct}» (habla conectada natural)` },
      { text: distractor1, isCorrect: false, label: `«${phrase.phrase}» (palabra por palabra, sin enlaces)` },
      { text: distractor2, isCorrect: false, label: `«${distractor2}» (interpretación literal aislada)` },
    ].sort((a, b) => a.text.localeCompare(b.text));
  }, [phrase]);

  const handlePlayNormal = useCallback(() => {
    cancelSpeech();
    setIsPlayingNormal(true);
    speakText(phrase.phrase, {
      rate: 1.0,
      onEnd: () => setIsPlayingNormal(false),
      onError: () => setIsPlayingNormal(false),
    });
  }, [phrase.phrase]);

  const handlePlaySlow = useCallback(() => {
    cancelSpeech();
    setIsPlayingSlow(true);
    speakText(phrase.phrase, {
      rate: 0.65,
      onEnd: () => setIsPlayingSlow(false),
      onError: () => setIsPlayingSlow(false),
    });
  }, [phrase.phrase]);

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setIsRevealed(true);
    const chosen = options[idx];
    onComplete?.(chosen.isCorrect);
  };

  const handleDirectReveal = () => {
    setIsRevealed(true);
  };

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption !== null && options[selectedOption]?.isCorrect;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-default bg-surface-raised p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div>
          <span className="font-caption uppercase tracking-wider text-xs font-semibold text-primary">
            {phrase.categoryNameEs}
          </span>
          <h2 className="text-h3 font-bold text-fg mt-0.5">
            Desempaquetado Acústico
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="font-caption text-xs font-semibold px-2.5 py-1 rounded-full bg-success/20 text-success">
              ✓ Guardado (+XP)
            </span>
          )}
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-surface-base text-fg-muted border border-border-subtle">
            Oído Rápido
          </span>
        </div>
      </div>

      {/* Audio Player Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-surface-base border border-border-default">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handlePlayNormal}
          disabled={isPlayingNormal}
          className="min-h-[44px] flex items-center gap-2"
        >
          <Volume2 size={18} className={isPlayingNormal ? "animate-pulse" : ""} />
          <span>{isPlayingNormal ? "Reproduciendo..." : "Velocidad nativa (1.0x)"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={handlePlaySlow}
          disabled={isPlayingSlow}
          className="min-h-[44px] flex items-center gap-2"
        >
          <Volume2 size={16} className={isPlayingSlow ? "animate-pulse" : ""} />
          <span>{isPlayingSlow ? "Desacelerando..." : "Desacelerar (0.65x)"}</span>
        </Button>
      </div>

      {/* Acoustic Unpacking Question */}
      <div className="flex flex-col gap-3">
        <p className="font-label text-sm font-semibold text-fg">
          Escucha el micro-clip y selecciona qué frase completa se articuló:
        </p>

        <div className="grid gap-2.5" role="radiogroup" aria-label="Opciones de frase articulada">
          {options.map((opt, i) => {
            const isSelected = selectedOption === i;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectOption(i)}
                disabled={isAnswered}
                className={cn(
                  "min-h-[48px] rounded-lg border p-3.5 text-left text-body-sm font-medium transition-all focus-ring cursor-pointer",
                  !isAnswered && "border-border-default bg-surface hover:border-primary/60 hover:bg-surface-base",
                  isAnswered && opt.isCorrect && "border-success/60 bg-success-soft text-fg font-bold",
                  isAnswered && isSelected && !opt.isCorrect && "border-error/60 bg-error-soft text-fg",
                  isAnswered && !isSelected && !opt.isCorrect && "border-border-subtle opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{opt.label}</span>
                  {isAnswered && opt.isCorrect && (
                    <Check size={18} className="text-success shrink-0" aria-label="Correcto" />
                  )}
                  {isAnswered && isSelected && !opt.isCorrect && (
                    <X size={18} className="text-error shrink-0" aria-label="Incorrecto" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <p className={cn("text-body-sm font-semibold pt-1", isCorrect ? "text-success" : "text-warning")}>
            {isCorrect
              ? "✓ ¡Excelente! Has identificado el patrón acústico nativo."
              : "⚠ Revisa la comparativa a continuación para contrastar la pronunciación conectada."}
          </p>
        )}

        {!isRevealed && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleDirectReveal}
              className="min-h-[44px] px-2 text-caption font-medium text-primary hover:underline cursor-pointer focus-ring inline-flex items-center"
            >
              Revelar mapa acústico sin responder →
            </button>
          </div>
        )}
      </div>

      {/* Acoustic Map Reveal */}
      {isRevealed && (
        <div className="animate-fadeIn flex flex-col gap-4 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-caption text-xs font-bold text-primary uppercase tracking-wider">
              Mapa Acústico del Habla Conectada
            </span>
          </div>

          <RhythmicSentenceDisplay sentence={phrase.phrase} showAudio={false} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-subtle bg-surface-base p-3.5">
              <span className="font-caption text-xs text-fg-muted font-semibold block mb-0.5">
                Palabra por palabra aislada:
              </span>
              <span className="font-ipa text-fg-muted text-sm">{phrase.isolatedIpa}</span>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary-soft/40 p-3.5">
              <span className="font-caption text-xs text-primary font-semibold block mb-0.5">
                Cómo suena al oído (enlace nativo):
              </span>
              <span className="font-label font-bold text-fg text-sm">{phrase.howItSoundsEs}</span>
              <span className="font-ipa font-bold text-primary text-sm ml-2">({phrase.connectedIpa})</span>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-surface-base p-3.5">
            <p className="text-body-sm text-fg-muted text-pretty">
              💡 {phrase.explanationEs}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

