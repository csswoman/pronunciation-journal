"use client";

import Link from "next/link";
import { Play } from "@/components/icons";
import PastelCard, { type PastelTone } from "@/components/layout/PastelCard";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { MASTERY_DISPLAY_THRESHOLD } from "@/lib/phoneme-practice/mastery-pct";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { cn } from "@/lib/cn";
import { getCanonicalSound, SOUND_CLASS_SINGULAR_LABELS } from "@/lib/sounds/inventory";
import { getSpanishContrast } from "@/lib/sounds/spanish-contrast";

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  isContinuing?: boolean;
  isToday?: boolean;
  staggerIndex?: number;
  onSelect?: () => void;
}

export function SoundLabLessonCard({
  lesson,
  progressPct,
  isWeak,
  isContinuing,
  isToday,
  staggerIndex = 0,
  onSelect,
}: Props) {
  const { id, title, words, href } = lesson;
  const { speaking, speak } = useSpeakWord();
  const ipa = ipaFromLessonTitle(title);
  const canonical = ipa ? getCanonicalSound(ipa) : undefined;
  const contrastInfo = ipa ? getSpanishContrast(ipa) : undefined;

  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
  const canonicalExamples = canonical?.examples ?? [];
  const examples = [...new Set(
    (canonicalExamples.length > 0 ? canonicalExamples : words.map((w) => w.word))
      .filter(Boolean),
  )].slice(0, 2);
  const heroWord = examples[0];
  const delayMs = Math.min(staggerIndex * 20, 300);

  const isDone = progressPct !== undefined && progressPct >= MASTERY_DISPLAY_THRESHOLD;
  const isInProgress = isContinuing || (progressPct !== undefined && progressPct > 0 && progressPct < MASTERY_DISPLAY_THRESHOLD);

  // Determine sound type label (e.g. "vocal", "vocal neutra", "consonante")
  let soundTypeLabel = canonical ? SOUND_CLASS_SINGULAR_LABELS[canonical.type]?.toLowerCase() : "sonido";
  if (ipa === "/ə/") {
    soundTypeLabel = "vocal neutra";
  }

  // Determine card pastel tone
  let tone: PastelTone = "sky";
  if (isToday || (ipa === "/ə/" && !isDone)) {
    tone = "butter";
  } else if (isInProgress || isWeak || contrastInfo?.level === "missing") {
    tone = "lilac";
  } else if (contrastInfo?.level === "confusable") {
    tone = "coral";
  } else if (isDone) {
    tone = "sky";
  }

  // Determine top badge
  let badgeLabel = "";
  let badgeClass = "";

  if (isContinuing || isInProgress) {
    badgeLabel = "EN CURSO";
    badgeClass = "bg-ink text-paper text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider";
  } else if (isToday) {
    badgeLabel = "HOY";
    badgeClass = "bg-ink text-paper text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider";
  } else if (isDone) {
    badgeLabel = "DOMINADO";
    badgeClass = "bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider";
  } else {
    badgeLabel = "Sin practicar";
    badgeClass = "bg-ink/10 dark:bg-paper/10 text-ink-muted text-[11px] font-semibold px-2.5 py-0.5 rounded-full";
  }

  const content = (
    <div className="flex flex-col justify-between h-full min-h-[180px]">
      {/* Top Bar: Badge + Play sound circle button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={badgeClass}>{badgeLabel}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (heroWord) speak(heroWord);
          }}
          className="h-8 w-8 rounded-full bg-ink text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-2xs shrink-0"
          aria-label={`Escuchar el sonido ${ipa || title}`}
          title="Escuchar sonido"
        >
          <Play size={12} className="fill-paper text-paper ml-0.5" aria-hidden />
        </button>
      </div>

      {/* Main Phoneme Symbol */}
      {ipa && (
        <span className="font-ipa text-4xl sm:text-5xl font-bold tracking-tight text-ink my-1 block group-hover:scale-105 transition-transform origin-left">
          {ipa}
        </span>
      )}

      {/* Anchor Word & Sound Type description */}
      <p className="text-body-sm text-ink-secondary mb-3 font-medium">
        {heroWord ? (
          <>
            como en <span className="font-bold text-ink">{heroWord}</span> · {soundTypeLabel}
          </>
        ) : (
          soundTypeLabel
        )}
      </p>

      {/* Progress / Status Info */}
      <div className="mt-auto pt-1 mb-4">
        {isInProgress ? (
          <div className="flex flex-col gap-1.5">
            {/* 5-segment progress bar */}
            <div className="flex items-center gap-1 w-full" role="progressbar" aria-valuenow={progressPct || 40} aria-valuemin={0} aria-valuemax={100}>
              {[1, 2, 3, 4, 5].map((segment) => {
                const filledCount = Math.max(1, Math.round(((progressPct || 40) / 100) * 5));
                const isFilled = segment <= filledCount;
                return (
                  <div
                    key={segment}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      isFilled ? "bg-ink" : "bg-ink/20",
                    )}
                  />
                );
              })}
            </div>
            <span className="text-caption font-semibold text-ink-muted mt-0.5">
              {Math.max(1, Math.round(((progressPct || 40) / 100) * 5))} de 5 ejercicios
            </span>
          </div>
        ) : isDone ? (
          <span className="text-caption font-semibold text-ink-muted">
            5 de 5 · repaso en 4 días
          </span>
        ) : isToday ? (
          <span className="text-caption font-semibold text-ink-muted">
            El sonido del plan de hoy
          </span>
        ) : (
          <span className="text-caption font-semibold text-ink-muted">
            5 ejercicios · 3 min
          </span>
        )}
      </div>
    </div>
  );

  return (
    <article
      className="sound-lab__card group relative flex flex-col justify-between transition-all duration-200"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <PastelCard
        tone={tone}
        className="rounded-3xl p-5 sm:p-6 flex flex-col justify-between h-full border border-ink/10 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
      >
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="flex flex-col text-left outline-none h-full w-full cursor-pointer"
            aria-label={`Ver detalles de ${[ipa, heroWord].filter(Boolean).join(" — ")}`}
          >
            {content}
          </button>
        ) : (
          <Link
            href={linkHref}
            className="flex flex-col no-underline outline-none h-full w-full"
            aria-label={[ipa, heroWord].filter(Boolean).join(" — ")}
          >
            {content}
          </Link>
        )}

        {/* Bottom Example Word Audio Pills */}
        {examples.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-ink/15 mt-2"
            role="group"
            aria-label={`Escuchar ejemplos de ${ipa ?? "este sonido"}`}
          >
            {examples.map((word, i) => (
              <button
                key={`${word}-${i}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-paper px-3 py-1 text-xs font-semibold text-ink hover:bg-paper/90 active:scale-95 transition-all cursor-pointer shadow-2xs",
                  speaking === word && "border-primary bg-primary text-on-primary",
                )}
                aria-label={`Escuchar ${word}`}
                title={`Escuchar pronunciación de "${word}"`}
              >
                <Play
                  size={10}
                  className={cn(
                    "fill-ink text-ink shrink-0",
                    speaking === word && "fill-on-primary text-on-primary animate-pulse",
                  )}
                  aria-hidden
                />
                <span className="truncate max-w-[100px]">{word}</span>
              </button>
            ))}
          </div>
        )}
      </PastelCard>
    </article>
  );
}
