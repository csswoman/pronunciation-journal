"use client";

import Link from "next/link";
import { Play, CheckCircle2 } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { MASTERY_DISPLAY_THRESHOLD } from "@/lib/phoneme-practice/mastery-pct";
import { useSpeakWord } from "@/hooks/useSpeakWord";

const CARD_PALETTES = [
  {
    glyph: "var(--primary)",
    tint:  "color-mix(in oklch, var(--primary) 7%, var(--surface-raised))",
    pill:  "color-mix(in oklch, var(--primary) 12%, transparent)",
    pillBorder: "color-mix(in oklch, var(--primary) 25%, transparent)",
    pillText: "var(--primary)",
    pbar:  "var(--primary)",
  },
  {
    glyph: "var(--accent-analog-1)",
    tint:  "color-mix(in oklch, var(--accent-analog-1) 7%, var(--surface-raised))",
    pill:  "color-mix(in oklch, var(--accent-analog-1) 12%, transparent)",
    pillBorder: "color-mix(in oklch, var(--accent-analog-1) 25%, transparent)",
    pillText: "var(--accent-analog-1)",
    pbar:  "var(--accent-analog-1)",
  },
  {
    glyph: "var(--accent-analog-2)",
    tint:  "color-mix(in oklch, var(--accent-analog-2) 7%, var(--surface-raised))",
    pill:  "color-mix(in oklch, var(--accent-analog-2) 12%, transparent)",
    pillBorder: "color-mix(in oklch, var(--accent-analog-2) 25%, transparent)",
    pillText: "var(--accent-analog-2)",
    pbar:  "var(--accent-analog-2)",
  },
  {
    glyph: "var(--stage-pairs)",
    tint:  "color-mix(in oklch, var(--stage-pairs) 7%, var(--surface-raised))",
    pill:  "color-mix(in oklch, var(--stage-pairs) 12%, transparent)",
    pillBorder: "color-mix(in oklch, var(--stage-pairs) 25%, transparent)",
    pillText: "var(--stage-pairs)",
    pbar:  "var(--stage-pairs)",
  },
  {
    glyph: "var(--stage-dictation)",
    tint:  "color-mix(in oklch, var(--stage-dictation) 7%, var(--surface-raised))",
    pill:  "color-mix(in oklch, var(--stage-dictation) 12%, transparent)",
    pillBorder: "color-mix(in oklch, var(--stage-dictation) 25%, transparent)",
    pillText: "var(--stage-dictation)",
    pbar:  "var(--stage-dictation)",
  },
] as const;

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

function hashIpa(ipa: string): number {
  let h = 0;
  for (let i = 0; i < ipa.length; i++) {
    h = (h * 31 + ipa.charCodeAt(i)) >>> 0;
  }
  return h % CARD_PALETTES.length;
}

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  staggerIndex?: number;
}

export function SoundLabLessonCard({ lesson, progressPct, isWeak, staggerIndex = 0 }: Props) {
  const { id, title, words, href, difficulty, description } = lesson;
  const { speaking, speak } = useSpeakWord();
  const ipa = ipaFromLessonTitle(title);
  const subtitle = description?.trim() || null;
  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
  const examples = words.length > 0 ? words.slice(0, 2).map((w) => w.word) : [];
  const delayMs = Math.min(staggerIndex * 30, 400);

  const isDone         = progressPct !== undefined && progressPct >= MASTERY_DISPLAY_THRESHOLD;
  const isInProgress   = progressPct !== undefined && progressPct > 0 && progressPct < MASTERY_DISPLAY_THRESHOLD;
  const isNearComplete = isInProgress && progressPct >= MASTERY_DISPLAY_THRESHOLD - 5;

  const palette = CARD_PALETTES[hashIpa(ipa ?? title)];

  const cardBg = isWeak || isNearComplete || isDone ? undefined : palette.tint;

  const heroWord = examples[0];
  const restWords = examples.slice(1);

  return (
    <Link href={linkHref} className="block no-underline">
      <article
        className={[
          "sound-lab__card relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-4",
          isWeak         && "sound-lab__card--weak",
          isNearComplete && !isWeak && "sound-lab__card--near-complete",
          isDone         && "sound-lab__card--done",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={[ipa, subtitle, isDone ? "Completed" : isWeak ? "Review" : undefined].filter(Boolean).join(" — ")}
        style={{ animationDelay: `${delayMs}ms`, background: cardBg }}
      >
        {/* Top row: difficulty badge + done check */}
        <div className="mb-3 flex items-center justify-between">
          {difficulty && (
            <span
              className="sound-lab__difficulty-badge"
              style={{ color: palette.glyph }}
            >
              {isWeak ? "Review" : DIFFICULTY_LABEL[difficulty] ?? difficulty}
            </span>
          )}
          {isDone && (
            <CheckCircle2 size={14} style={{ color: "var(--success)" }} aria-label="Completed" />
          )}
          {isNearComplete && !isWeak && (
            <span className="sound-lab__near-badge">Almost!</span>
          )}
        </div>

        {/* IPA glyph — dominant, no wrap */}
        {ipa && (
          <div className="sound-lab__ipa" style={{ color: palette.glyph }}>{ipa}</div>
        )}

        {/* Hero word — bold, prominent */}
        {heroWord && (
          <p className="sound-lab__hero-word m-0">{heroWord}</p>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="sound-lab__card-sub m-0">{subtitle}</p>
        )}

        {/* Divider + pct inline — bar as divider, pct label to the right when in progress */}
        <div className="mt-auto flex items-center gap-2">
          <div
            className="sound-lab__divider-track flex-1"
            role={isInProgress ? "progressbar" : undefined}
            aria-valuenow={isInProgress ? progressPct : undefined}
            aria-valuemin={isInProgress ? 0 : undefined}
            aria-valuemax={isInProgress ? 100 : undefined}
            aria-label={isInProgress ? `${progressPct}% completed` : undefined}
          >
            <span
              className="sound-lab__divider-fill"
              style={{
                width: isDone ? "100%" : isInProgress ? `${progressPct}%` : "0%",
                background: isDone ? "var(--success)" : palette.pbar,
              }}
            />
          </div>
          {isInProgress && (
            <span className="shrink-0 text-xs font-semibold" style={{ color: palette.glyph }}>
              {progressPct}%
            </span>
          )}
        </div>

        {/* Example pills — tap to hear via SpeechSynthesis */}
        {examples.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3">
            {[heroWord, ...restWords].filter(Boolean).map((word) => (
              <button
                key={word}
                type="button"
                onClick={(e) => speak(word!, e)}
                className={[
                  "sound-lab__example-pill cursor-pointer",
                  speaking === word && "sound-lab__example-pill--speaking",
                ].filter(Boolean).join(" ")}
                style={{
                  background: palette.pill,
                  borderColor: speaking === word ? palette.glyph : palette.pillBorder,
                  color: palette.pillText,
                }}
                aria-label={`Pronounce ${word}`}
              >
                <Play size={8} className="fill-current" aria-hidden />
                {word}
              </button>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
