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

// Planned structure:
// <SoundLabLessonCard>
//   <PastelCard>
//     <CardHeader> (Badge + Top Main Audio Button)
//     <PhonemeHero> (Bricolage font IPA symbol)
//     <SoundDescription> (Anchor word + type)
//     <ProgressSection> (5-segment progress bar + exercise count)
//     <WordAudioPills> (Example word player pills with black circle play icons)
//   </PastelCard>
// </SoundLabLessonCard>

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
    badgeClass = "bg-ink text-paper text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider";
  } else if (isToday) {
    badgeLabel = "HOY";
    badgeClass = "bg-ink text-paper text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider";
  } else if (isDone) {
    badgeLabel = "DOMINADO";
    badgeClass = "bg-emerald-300 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider";
  } else {
    badgeLabel = "Sin practicar";
    badgeClass = "bg-ink/10 dark:bg-paper/10 text-ink-muted text-xs font-bold px-3 py-1 rounded-full";
  }

  const content = (
    <div className="flex flex-col justify-between h-full min-h-[170px]">
      {/* Top Bar: Badge + Play sound circle button */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={badgeClass}>{badgeLabel}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (heroWord) speak(heroWord);
          }}
          className={cn(
            "h-9 w-9 rounded-full bg-ink text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-2xs shrink-0",
            speaking === heroWord && "bg-primary text-on-primary animate-pulse",
          )}
          aria-label={`Escuchar el sonido ${ipa || title}`}
          title="Escuchar sonido"
        >
          <Play size={12} className="fill-paper text-paper ml-0.5" aria-hidden />
        </button>
      </div>

      {/* Main Phoneme Symbol — Bricolage Grotesque typography */}
      {ipa && (
        <span className="font-display font-extrabold text-3xl sm:text-4xl text-ink my-1.5 block group-hover:scale-105 transition-transform origin-left tracking-tight">
          {ipa}
        </span>
      )}

      {/* Anchor Word & Sound Type description */}
      <p className="text-body font-medium text-ink mb-3">
        {heroWord ? (
          <>
            como en <span className="font-bold text-ink">{heroWord}</span> · {soundTypeLabel}
          </>
        ) : (
          soundTypeLabel
        )}
      </p>

      {/* Progress / Status Info */}
      <div className="mt-auto pt-1 mb-2">
        {isInProgress ? (
          <div className="flex flex-col gap-1.5">
            {/* 5-segment progress bar */}
            <div className="flex items-center gap-1.5 w-full" role="progressbar" aria-valuenow={progressPct || 40} aria-valuemin={0} aria-valuemax={100}>
              {[1, 2, 3, 4, 5].map((segment) => {
                const filledCount = Math.max(1, Math.round(((progressPct || 40) / 100) * 5));
                const isFilled = segment <= filledCount;
                return (
                  <div
                    key={segment}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      isFilled ? "bg-ink" : "bg-ink/20",
                    )}
                  />
                );
              })}
            </div>
            <span className="text-body-sm font-medium text-ink-secondary mt-0.5">
              {Math.max(1, Math.round(((progressPct || 40) / 100) * 5))} de 5 ejercicios
            </span>
          </div>
        ) : isDone ? (
          <span className="text-body-sm font-medium text-ink-secondary">
            5 de 5 · repaso en 4 días
          </span>
        ) : isToday ? (
          <span className="text-body-sm font-medium text-ink-secondary">
            El sonido del plan de hoy
          </span>
        ) : (
          <span className="text-body-sm font-medium text-ink-secondary">
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
            className="flex flex-wrap items-center gap-2 pt-2 mt-1"
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
                  "inline-flex items-center gap-2 rounded-full border border-ink bg-paper pl-1 pr-3.5 py-1 text-body-sm font-bold text-ink shadow-2xs hover:bg-paper/90 active:scale-95 transition-all cursor-pointer",
                  speaking === word && "border-accent bg-paper text-accent",
                )}
                aria-label={`Escuchar ${word}`}
                title={`Escuchar pronunciación de "${word}"`}
              >
                <span
                  className={cn(
                    "h-6 w-6 rounded-full bg-ink text-paper flex items-center justify-center shrink-0 transition-colors",
                    speaking === word && "bg-accent text-on-accent animate-pulse",
                  )}
                >
                  <Play
                    size={10}
                    className={cn(
                      "fill-paper text-paper ml-0.5 shrink-0",
                      speaking === word && "fill-on-accent text-on-accent",
                    )}
                    aria-hidden
                  />
                </span>
                <span className="truncate max-w-[100px]">{word}</span>
              </button>
            ))}
          </div>
        )}
      </PastelCard>
    </article>
  );
}
