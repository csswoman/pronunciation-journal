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

  const hasSpanish =
    example.kind === "dialogue" || Boolean(example.es);

  return (
    <div className="pastel-card-inset rounded-2xl p-4 flex flex-col gap-2 mt-1">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="font-kicker text-[12px] uppercase tracking-wider text-ink-secondary font-bold">
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
        <p className="ts-body text-ink whitespace-pre-line">
          {example.en}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {example.turns.map((turn, i) => (
            <p
              key={i}
              className="ts-body text-ink whitespace-pre-line"
            >
              — {turn.en}
            </p>
          ))}
        </div>
      )}

      {hasSpanish && (
        <div className="my-1.5 border-t border-ink/10" aria-hidden="true" />
      )}

      {example.kind === "dialogue" ? (
        <div className="flex flex-col gap-1.5">
          {example.turns.map((turn, i) => (
            <p
              key={i}
              className="ts-body-translation text-ink-secondary whitespace-pre-line"
            >
              — {turn.es}
            </p>
          ))}
        </div>
      ) : example.es ? (
        <p className="ts-body-translation text-ink-secondary whitespace-pre-line">
          {example.es.startsWith("Traducción:") ? null : (
            <span className="text-ink-secondary font-normal">— </span>
          )}
          {example.es.replace(/^Traducción:\s*/, "")}
        </p>
      ) : null}
    </div>
  );
}
