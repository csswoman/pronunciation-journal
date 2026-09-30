"use client";

// Planned structure:
// <ConnectedSpeechUnpackingCard>
//   <UnpackingHeader />
//   <AudioControlsRow />
//   <OptionsRadioGroup />
//   <ConnectedSpeechAudioCompare />
//   <RevealAction />
// </ConnectedSpeechUnpackingCard>

import PastelCard from "@/components/layout/PastelCard";
import { Play } from "@/components/icons";
import type { ConnectedPhrase } from "@/lib/pronunciation/connected-speech-data";
import { getPhraseOptions, ConnectedSpeechCategoryDropdown } from "./ConnectedSpeechParts";
import { ConnectedSpeechAudioCompare } from "./ConnectedSpeechAudioCompare";
import { cn } from "@/lib/cn";

export function ConnectedSpeechUnpackingCard({
  phrase,
  safeIndex,
  totalPhrases,
  activeCategory,
  onSelectCategory,
  isPlayingAudio,
  isPlayingSlow,
  selectedOption,
  isRevealed,
  onPlayNormal,
  onPlaySlow,
  onSelectOption,
}: {
  phrase: ConnectedPhrase;
  safeIndex: number;
  totalPhrases: number;
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  isPlayingAudio: boolean;
  isPlayingSlow: boolean;
  selectedOption: number | null;
  isRevealed: boolean;
  onPlayNormal: () => void;
  onPlaySlow: () => void;
  onSelectOption: (idx: number) => void;
}) {
  const options = getPhraseOptions(phrase);
  const isAnswered = selectedOption !== null || isRevealed;

  const isUserIncorrect =
    selectedOption !== null && !options[selectedOption]?.isCorrect;

  const selectedText =
    selectedOption !== null ? options[selectedOption]?.text : phrase.phrase;

  return (
    <PastelCard tone="sky" className="rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
      {/* Top Header inside Sky Card */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ConnectedSpeechCategoryDropdown
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
        />

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden sm:flex items-center gap-1 max-w-[200px] flex-1" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full flex-1 transition-all",
                  i === safeIndex % 10 ? "bg-slate-950" : "bg-slate-950/20",
                )}
              />
            ))}
          </div>
          <span className="font-bold text-sm text-slate-950 shrink-0">
            {safeIndex + 1} de {totalPhrases}
          </span>
        </div>
      </div>

      {/* Main Question & Subtitle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-950 tracking-tight">
            {!isAnswered
              ? "¿Qué frase escuchaste?"
              : isUserIncorrect
                ? `Casi. Dijo «${phrase.phrase}»`
                : `¡Eso es! Dijo «${phrase.phrase}»`}
          </h2>
          <p className="text-body text-slate-800 font-medium mt-1">
            {!isAnswered
              ? "Suena como una sola palabra. Escúchala las veces que quieras."
              : isUserIncorrect
                ? "Escucha la diferencia entre tu respuesta y lo que realmente se pronunció."
                : "Revisa abajo los enlaces fonéticos y el ritmo de esta frase."}
          </p>
        </div>

        {isAnswered && (
          <span className="font-semibold text-xs px-3.5 py-1.5 rounded-full bg-slate-950/10 text-slate-950 shrink-0">
            {isUserIncorrect ? "Volverá en tu repaso" : "Guardada en tu repaso"}
          </span>
        )}
      </div>

      {/* Audio Controls Row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPlayNormal}
          disabled={isPlayingAudio}
          className="w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50 focus-ring"
          title="Escuchar habla conectada nativa (1.0x)"
          aria-label="Reproducir frase a velocidad nativa"
        >
          <Play size={20} className="fill-current ml-0.5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlayNormal}
            disabled={isPlayingAudio}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold transition-all focus-ring cursor-pointer",
              isPlayingAudio
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-slate-950 text-white hover:bg-slate-900",
            )}
          >
            Nativa 1.0x
          </button>
          <button
            type="button"
            onClick={onPlaySlow}
            disabled={isPlayingSlow}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-all focus-ring cursor-pointer border border-slate-300",
              isPlayingSlow
                ? "bg-slate-950 text-white"
                : "bg-white/90 text-slate-900 hover:bg-white",
            )}
          >
            Lenta 0.65x
          </button>
        </div>
      </div>

      {/* Options List (3 Cards) */}
      <div className="grid gap-3" role="radiogroup" aria-label="Opciones de frase">
        {options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = opt.isCorrect;

          if (isAnswered) {
            if (isSelected && !isCorrect) {
              return (
                <div
                  key={i}
                  className="bg-error-soft border-2 border-ink text-ink font-bold p-4 rounded-2xl shadow-xs flex items-center justify-between min-h-[56px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-error text-white flex items-center justify-center font-bold text-sm shrink-0">
                      ✕
                    </div>
                    <span className="font-heading font-extrabold text-lg text-ink">{opt.text}</span>
                  </div>
                  <span className="font-bold text-sm text-ink">Tu respuesta</span>
                </div>
              );
            }

            if (isCorrect) {
              return (
                <div
                  key={i}
                  className="bg-success-soft border-2 border-ink text-ink font-bold p-4 rounded-2xl shadow-xs flex items-center justify-between min-h-[56px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-success text-white flex items-center justify-center font-bold text-sm shrink-0">
                      ✓
                    </div>
                    <span className="font-heading font-extrabold text-lg text-ink">{opt.text}</span>
                  </div>
                  <span className="font-bold text-sm text-ink">
                    {isUserIncorrect ? "Era esta" : "Correcto"}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={i}
                className="bg-white/60 border border-transparent text-ink-muted font-medium p-4 rounded-2xl opacity-60 flex items-center justify-between min-h-[56px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-ink/10 font-bold text-ink-muted flex items-center justify-center text-sm shrink-0">
                    {i + 1}
                  </div>
                  <span className="font-heading font-extrabold text-lg text-ink/70">{opt.text}</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={false}
              onClick={() => onSelectOption(i)}
              className="bg-white border-2 border-transparent hover:border-ink/20 text-ink p-4 rounded-2xl hover:shadow-sm flex items-center justify-between transition-all cursor-pointer text-left min-h-[56px] focus-ring"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-ink/10 font-bold text-ink flex items-center justify-center text-sm shrink-0">
                  {i + 1}
                </div>
                <span className="font-heading font-extrabold text-lg text-ink">{opt.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Audio Comparison Section when Incorrect */}
      {isUserIncorrect && (
        <ConnectedSpeechAudioCompare phrase={phrase} selectedText={selectedText} />
      )}
    </PastelCard>
  );
}
