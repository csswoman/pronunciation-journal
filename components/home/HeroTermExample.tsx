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
    <div className="flex flex-col gap-1.5 mt-1">
      <span className="font-label text-caption font-semibold text-fg-muted">
        Ejemplo
      </span>

      <div className="border-l-2 border-border-default pl-3.5 py-0.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            {example.kind === "sentence" ? (
              <p className="font-body-md text-fg leading-relaxed whitespace-pre-line">
                {example.en}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {example.turns.map((turn, i) => (
                  <p
                    key={i}
                    className="font-body-md text-fg leading-relaxed whitespace-pre-line"
                  >
                    — {turn.en}
                  </p>
                ))}
              </div>
            )}
            <ListenButton
              iconOnly
              aria-label="Escuchar ejemplo"
              className="-mt-1 shrink-0 self-start"
              onPlay={() => speakText(speakSource)}
            />
          </div>

          {example.kind === "dialogue" ? (
            <div className="flex flex-col gap-1">
              {example.turns.map((turn, i) => (
                <p
                  key={i}
                  className="font-body-sm text-fg-muted leading-normal whitespace-pre-line"
                >
                  — {turn.es}
                </p>
              ))}
            </div>
          ) : example.es ? (
            <p className="font-body-sm text-fg-muted leading-normal whitespace-pre-line">
              {example.es}
            </p>
          ) : null}
        </div>
    </div>
  );
}
