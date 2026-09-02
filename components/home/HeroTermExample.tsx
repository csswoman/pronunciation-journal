"use client";

// Planned structure:
// <HeroTermExample>
//   filete (border-l) wrapper
//   header row:
//     example body — either a single sentence or a dashed dialogue (2 turns)
//     ListenButton (anchored to the first line via items-start + mt)
//   translation toggle (only for `sentence` — dialogue turns carry their own es)
// </HeroTermExample>

import { useEffect, useState } from "react";
import { ChevronDown } from "@/components/icons";
import { ListenButton } from "@/components/ui/ListenButton";
import type { Example } from "@/lib/chunk-of-day/types";
import { speakText } from "@/lib/speech/synthesis";
import { cn } from "@/lib/cn";

interface HeroTermExampleProps {
  example: Example;
  /** Resets the toggle when the term changes. */
  resetKey?: string;
}

/** Shared example block for the phrase / word home cards. */
export function HeroTermExample({ example, resetKey }: HeroTermExampleProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [resetKey]);

  const speakSource =
    example.kind === "sentence"
      ? example.en
      : example.turns.map((t) => t.en).join(" ");

  return (
    <div className="flex flex-col gap-2 mt-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="focus-ring inline-flex w-fit cursor-pointer items-center gap-1.5 font-label text-body-sm font-semibold text-fg-muted transition-colors hover:text-fg"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={16}
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden
        />
        <span>Ejemplo</span>
      </button>

      {isOpen && (
        <div className="animate-state-in border-l-2 border-border-default pl-3.5 py-0.5 flex flex-col gap-2">
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
      )}
    </div>
  );
}
