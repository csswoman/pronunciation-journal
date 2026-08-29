"use client";

import type { CSSProperties } from "react";
import { Heart, Plus, Check } from "@/components/icons";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { ListenButton } from "@/components/ui/ListenButton";
import { PillButton } from "@/components/ui/PillButton";
import { speak } from "@/lib/phoneme-practice/tts";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { cn } from "@/lib/cn";

interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
  ipa?: string;
  translation?: string;
  example?: string;
  status: "learned" | "reviewing" | "new";
  difficulty: number;
  view?: "grid" | "list";
  onMarkLearned?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isInMyWords?: boolean;
  onAddToMyWords?: () => void;
}

const STATUS_CONFIG: Record<
  "learned" | "reviewing" | "new",
  { label: string; variant: BadgeVariant; stateColor: string }
> = {
  learned: {
    label: "Aprendida",
    variant: "success",
    stateColor: "var(--success)",
  },
  reviewing: {
    label: "En repaso",
    variant: "warning",
    stateColor: "var(--warning)",
  },
  new: {
    label: "Nueva",
    variant: "neutral",
    stateColor: "var(--text-tertiary)",
  },
};

/**
 * WordCard - Tarjeta individual de palabra del diccionario.
 *
 * Sub-componentes:
 * - ListenButton (Reproducción de pronunciación por síntesis TTS)
 * - Badge (Estado semántico de aprendizaje: Aprendida, En repaso, Nueva)
 * - PillButton (Acción de marcado de aprendizaje y controles de favoritos)
 */
export function WordCard({
  word,
  partOfSpeech,
  definition,
  ipa,
  translation,
  example,
  status,
  difficulty,
  view = "grid",
  onMarkLearned,
  isFavorite,
  onToggleFavorite,
  isInMyWords,
  onAddToMyWords,
}: WordCardProps) {
  const cfg = STATUS_CONFIG[status];
  const isLearned = status === "learned";
  const cardStateColor = cfg.stateColor;

  return (
    <article
      className={cn(
        "bg-surface-raised border border-border-subtle rounded-md p-5 flex flex-col justify-between gap-4 transition-all duration-150 ease-out-quart hover:border-border-default hover:shadow-xs",
        view === "list" && "md:flex-row md:items-center"
      )}
      style={{ "--card-state": cardStateColor } as CSSProperties}
    >
      <div className="flex flex-col gap-2.5 min-w-0 flex-1">
        {/* Encabezado: Palabra + Categoría Gramatical + IPA */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="text-h4 font-bold text-fg tracking-tight truncate">{word}</h3>
            {ipa ? (
              <span className="font-ipa text-body-sm font-medium text-primary tracking-wide">
                {formatIpaDisplay(ipa)}
              </span>
            ) : null}
          </div>
          <span className="text-caption italic text-fg-subtle shrink-0 pt-0.5">{partOfSpeech}</span>
        </div>

        {/* Contenido: Traducción en español + Definición en inglés + Oración de ejemplo */}
        <div className="flex flex-col gap-1.5 pt-1 text-body-sm">
          {translation ? (
            <p className="font-semibold text-fg leading-snug">{translation}</p>
          ) : null}
          <p className="text-fg-muted leading-relaxed">{definition}</p>
          {example ? (
            <p className="text-caption italic text-fg-subtle bg-surface-sunken px-3 py-2 rounded-sm border-l-2 border-primary-soft mt-1">
              &ldquo;{example}&rdquo;
            </p>
          ) : null}
        </div>
      </div>

      {/* Pie de tarjeta organizado en 2 niveles */}
      <div className="flex flex-col gap-3 pt-3 border-t border-border-subtle shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={cfg.variant} label={cfg.label} dot={status !== "new"} />
          <span className="text-tiny font-mono text-fg-subtle">
            Dif: {difficulty}/5
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ListenButton
              iconOnly
              onPlay={() => {
                const text = [word, definition, example ? `For example: ${example}` : ""]
                  .filter(Boolean)
                  .join(". ");
                speak(text, { rate: 0.9 });
              }}
              aria-label={`Escuchar ${word}`}
            />

            {onToggleFavorite ? (
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-border-subtle bg-transparent text-fg-muted cursor-pointer transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-sunken",
                  isFavorite && "text-error border-error-soft bg-error-soft"
                )}
              >
                <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            ) : null}

            {onAddToMyWords ? (
              <button
                type="button"
                onClick={isInMyWords ? undefined : onAddToMyWords}
                disabled={isInMyWords}
                aria-label={isInMyWords ? "En mis palabras" : "Agregar a mis palabras"}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-border-subtle bg-transparent text-fg-muted cursor-pointer transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {isInMyWords ? <Check size={14} /> : <Plus size={14} />}
              </button>
            ) : null}
          </div>

          {onMarkLearned ? (
            <PillButton
              variant={isLearned ? "quiet" : "outline"}
              size="sm"
              icon={<Check size={14} />}
              onClick={onMarkLearned}
              disabled={isLearned}
              aria-label={isLearned ? "Marcada como aprendida" : "Marcar como aprendida"}
            >
              {isLearned ? "Aprendida" : "Marcar"}
            </PillButton>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export type { WordCardProps };


