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

export function HeroTermExample({ example }: HeroTermExampleProps) {
  const speakSource =
    example.kind === "sentence"
      ? example.en
      : example.turns.map((t) => t.en).join(" ");

  return (
    <div className="rounded-2xl border border-border-subtle/50 bg-surface-sunken/60 p-4 flex flex-col gap-2.5 mt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-kicker text-fg-faint">
          EJEMPLO
        </span>
        <ListenButton
          iconOnly
          aria-label="Escuchar ejemplo"
          className="shrink-0 text-fg-muted hover:text-primary transition-colors"
          onPlay={() => speakText(speakSource)}
        />
      </div>

      {example.kind === "sentence" ? (
        <p className="font-body-md text-fg-muted leading-relaxed whitespace-pre-line">
          {example.en}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {example.turns.map((turn, i) => (
            <p
              key={i}
              className="font-body-md text-fg-muted leading-relaxed whitespace-pre-line"
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
              className="font-body-sm text-fg-subtle leading-normal whitespace-pre-line"
            >
              — {turn.es}
            </p>
          ))}
        </div>
      ) : example.es ? (
        <p className="font-body-sm text-fg-subtle leading-normal whitespace-pre-line">
          {example.es.startsWith("Traducción:") ? null : (
            <span className="text-fg-faint font-normal">Traducción: </span>
          )}
          {example.es.replace(/^Traducción:\s*/, "")}
        </p>
      ) : null}
    </div>
  );
}
