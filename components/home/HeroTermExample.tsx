"use client";

// Planned structure:
// <HeroTermExample>
//   filete (border-l) wrapper
//   header row:
//     example body — either a single sentence or a dashed dialogue (2 turns)
//     ListenButton (anchored to the first line via items-start + mt)
//   translation toggle (only for `sentence` — dialogue turns carry their own es)
// </HeroTermExample>

import { ListenButton } from "@/components/ui/ListenButton";
import type { Example } from "@/lib/chunk-of-day/types";
import { speakText } from "@/lib/speech/synthesis";

interface HeroTermExampleProps {
  example: Example;
  resetKey?: string;
}

/**
 * Inset "EJEMPLO" block. Always sits inside a PastelCard, so it never needs
 * its own tone — pastel-card-inset is a relative white layer over whatever
 * --card the parent set, and ink/ink-muted are already remapped in scope.
 */
export function HeroTermExample({ example }: HeroTermExampleProps) {
  const speakSource =
    example.kind === "sentence"
      ? example.en
      : example.turns.map((t) => t.en).join(" ");

  return (
    <div className="pastel-card-inset rounded-2xl p-4 flex flex-col gap-2.5 mt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-kicker uppercase tracking-wider text-secondary">
          EJEMPLO
        </span>
        <ListenButton
          iconOnly
          aria-label="Escuchar ejemplo"
          className="shrink-0 text-ink-muted hover:text-ink transition-colors"
          onPlay={() => speakText(speakSource)}
        />
      </div>

      {example.kind === "sentence" ? (
        <p className="font-body-md text-ink font-medium leading-relaxed whitespace-pre-line">
          {example.en}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {example.turns.map((turn, i) => (
            <p
              key={i}
              className="font-body-md text-ink font-medium leading-relaxed whitespace-pre-line"
            >
              — {turn.en}
            </p>
          ))}
        </div>
      )}

      {example.kind === "dialogue" ? (
        <div className="flex flex-col gap-1 pt-1">
          {example.turns.map((turn, i) => (
            <p
              key={i}
              className="font-body-sm text-ink-muted font-medium leading-normal whitespace-pre-line"
            >
              — {turn.es}
            </p>
          ))}
        </div>
      ) : example.es ? (
        <p className="font-body-sm text-ink-muted font-medium leading-normal whitespace-pre-line">
          {example.es.startsWith("Traducción:") ? null : (
            <span className="text-ink-muted font-normal">Traducción: </span>
          )}
          {example.es.replace(/^Traducción:\s*/, "")}
        </p>
      ) : null}
    </div>
  );
}
