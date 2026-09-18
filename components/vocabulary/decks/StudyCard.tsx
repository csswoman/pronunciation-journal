"use client";

import { Bookmark, Volume2 } from "@/components/icons";
import { cn } from "@/lib/cn";
import { speakWord } from "./study-utils";

interface Meaning {
  partOfSpeech?: string;
  definitions?: { definition?: string; example?: string }[];
}

interface StudyCardProps {
  word: string;
  deckName?: string;
  ipa?: string | null;
  levelLabel: string | null;
  firstMeaning?: Meaning;
  firstDef?: { definition?: string; example?: string };
  flipped: boolean;
  onFlip: () => void;
  onSkip: () => void;
}

export function StudyCard({
  word,
  deckName = "Creativity Mind",
  ipa,
  levelLabel = "A1",
  firstMeaning,
  firstDef,
  flipped,
  onFlip,
}: StudyCardProps) {
  const partOfSpeech = firstMeaning?.partOfSpeech;

  const cardFace = (content: React.ReactNode, isBack = false) => (
    <div
      className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 rounded-3xl border border-border-default bg-surface-raised shadow-xl overflow-hidden"
      style={{
        backfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : undefined,
      }}
    >
      {/* Encabezado superior dentro de la tarjeta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-butter text-stone-900 font-extrabold text-caption border-none shadow-2xs">
            {levelLabel ?? "A1"}
          </span>
          {deckName && (
            <span className="px-3 py-1 rounded-full bg-surface-sunken text-fg-muted font-semibold text-caption truncate max-w-[140px] sm:max-w-[200px] border-none">
              {deckName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakWord(word);
            }}
            aria-label="Pronunciar"
            className="focus-ring flex size-9 items-center justify-center rounded-full bg-fg text-surface-raised hover:bg-fg/90 transition-colors shadow-2xs"
          >
            <Volume2 size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="Guardar marcador"
            className="focus-ring flex size-9 items-center justify-center rounded-full border border-border-default bg-surface-sunken hover:bg-surface-raised text-fg-subtle hover:text-fg transition-colors"
          >
            <Bookmark size={16} />
          </button>
        </div>
      </div>

      {/* Centro de la tarjeta */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 text-center">
        {content}
      </div>

      {/* Pie de la tarjeta con pista y tecla */}
      <div className="border-t border-border-subtle pt-4 text-center">
        {!isBack ? (
          <p className="font-sans text-caption text-fg-muted">
            Piensa el significado y pulsa{" "}
            <kbd className="px-2 py-0.5 rounded-md border border-border-strong bg-surface-sunken font-mono text-tiny font-bold text-fg uppercase">
              ESPACIO
            </kbd>{" "}
            para girar
          </p>
        ) : (
          <p className="font-sans text-caption text-fg-muted">
            Pulsa{" "}
            <kbd className="px-2 py-0.5 rounded-md border border-border-strong bg-surface-sunken font-mono text-tiny font-bold text-fg uppercase">
              ESPACIO
            </kbd>{" "}
            para voltear al frente
          </p>
        )}
      </div>
    </div>
  );

  return (
    <button
      type="button"
      className="flip-card-perspective w-full max-w-xl sm:max-w-2xl min-h-[360px] sm:min-h-[380px] cursor-pointer select-none text-left"
      onClick={onFlip}
      aria-label={flipped ? "Ver frente de la tarjeta" : "Ver respuesta de la tarjeta"}
    >
      <div className={cn("flip-card-inner h-full w-full", flipped && "flip-card-inner--flipped")}>
        {/* Frente */}
        {cardFace(
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-fg tracking-tight">
              {word}
            </h2>
            {ipa && <p className="font-phoneme text-body-md text-fg-muted">/{ipa}/</p>}
          </div>
        )}

        {/* Reverso */}
        {cardFace(
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            {partOfSpeech && (
              <span className="px-3 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary font-bold text-tiny uppercase tracking-wider">
                {partOfSpeech}
              </span>
            )}
            {firstDef?.definition && (
              <p className="font-sans text-body-md font-semibold text-fg text-center leading-snug">
                {firstDef.definition}
              </p>
            )}
            {firstDef?.example && (
              <p className="font-sans text-body-sm italic text-fg-muted text-center bg-surface-sunken p-3 rounded-2xl border border-border-subtle w-full mt-1">
                "{firstDef.example}"
              </p>
            )}
          </div>,
          true
        )}
      </div>
    </button>
  );
}
