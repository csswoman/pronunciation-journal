"use client";

import Link from "next/link";
import { Play, CheckCircle2 } from "@/components/icons";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { MASTERY_DISPLAY_THRESHOLD } from "@/lib/phoneme-practice/mastery-pct";
import { useSpeakWord } from "@/hooks/useSpeakWord";
import { cn } from "@/lib/cn";
import { parseSoundDuration } from "@/lib/sounds/duration";
import { getCanonicalSound } from "@/lib/sounds/inventory";

// Planned structure:
// <SoundLabLessonCard>
//   <Link> badge row + IPA + hero + subtitle + progress </Link>
//   <example play buttons /> (sibling, not nested in Link)
// </SoundLabLessonCard>

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  isContinuing?: boolean;
  staggerIndex?: number;
  onSelect?: () => void;
}

export function SoundLabLessonCard({
  lesson,
  progressPct,
  isWeak,
  isContinuing,
  staggerIndex = 0,
  onSelect,
}: Props) {
  const { id, title, words, href, difficulty, description } = lesson;
  const { speaking, speak } = useSpeakWord();
  const ipa = ipaFromLessonTitle(title);
  const subtitle = parseSoundDuration(description) ? null : description?.trim() || null;
  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
  const canonicalExamples = getCanonicalSound(ipa ?? "")?.examples ?? [];
  const examples = [...new Set(
    (canonicalExamples.length > 0 ? canonicalExamples : words.map((w) => w.word))
      .filter(Boolean),
  )].slice(0, 2);
  const delayMs = Math.min(staggerIndex * 30, 400);

  const isDone =
    progressPct !== undefined && progressPct >= MASTERY_DISPLAY_THRESHOLD;
  const isInProgress =
    progressPct !== undefined &&
    progressPct > 0 &&
    progressPct < MASTERY_DISPLAY_THRESHOLD;
  const isNearComplete =
    isInProgress && progressPct >= MASTERY_DISPLAY_THRESHOLD - 5;

  const heroWord = examples[0];

  const stateLabel = isContinuing
    ? "En curso"
    : isDone
      ? "Completado"
      : isWeak
        ? "Repaso"
        : isNearComplete
          ? "Casi listo"
          : undefined;

  return (
    <article
      className={cn( "sound-lab__card relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-raised", isWeak && "sound-lab__card--weak", isNearComplete && !isWeak && "sound-lab__card--near-complete", isDone && "sound-lab__card--done", isContinuing && "sound-lab__card--continuing", )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="sound-lab__card-trigger flex min-h-0 flex-1 flex-col p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
          aria-label={`Ver detalles de ${[ipa, subtitle, stateLabel].filter(Boolean).join(" — ")}`}
        >
          <CardBody
            difficulty={difficulty}
            isContinuing={isContinuing}
            isWeak={isWeak}
            isDone={isDone}
            isNearComplete={isNearComplete}
            ipa={ipa}
            heroWord={heroWord}
            subtitle={subtitle}
            progressPct={progressPct}
            isInProgress={isInProgress}
          />
        </button>
      ) : (
        <Link
          href={linkHref}
          className="flex min-h-0 flex-1 flex-col p-4 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
          aria-label={[ipa, subtitle, stateLabel].filter(Boolean).join(" — ")}
        >
          <CardBody
            difficulty={difficulty}
            isContinuing={isContinuing}
            isWeak={isWeak}
            isDone={isDone}
            isNearComplete={isNearComplete}
            ipa={ipa}
            heroWord={heroWord}
            subtitle={subtitle}
            progressPct={progressPct}
            isInProgress={isInProgress}
          />
        </Link>
      )}

      {examples.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-4 pt-0">
          {examples.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              onClick={() => speak(word)}
              className={cn( "sound-lab__example-pill cursor-pointer", speaking === word && "sound-lab__example-pill--speaking", )}
              aria-label={`Pronunciar ${word}`}
            >
              <Play size={8} className="fill-current" aria-hidden />
              {word}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function CardBody({
  difficulty,
  isContinuing,
  isWeak,
  isDone,
  isNearComplete,
  ipa,
  heroWord,
  subtitle,
  progressPct,
  isInProgress,
}: {
  difficulty: Lesson["difficulty"];
  isContinuing?: boolean;
  isWeak?: boolean;
  isDone: boolean;
  isNearComplete: boolean;
  ipa: string | null;
  heroWord?: string;
  subtitle: string | null;
  progressPct?: number;
  isInProgress: boolean;
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        {difficulty && (
          <span className="sound-lab__difficulty-badge">
            {DIFFICULTY_LABEL[difficulty] ?? difficulty}
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {isContinuing && (
            <span className="sound-lab__continuing-badge">En curso</span>
          )}
          {isWeak && !isContinuing && (
            <span className="sound-lab__weak-badge">Repaso</span>
          )}
          {isDone && (
            <CheckCircle2
              size={14}
              className="sound-lab__done-icon"
              aria-label="Completado"
            />
          )}
          {isNearComplete && !isWeak && !isContinuing && (
            <span className="sound-lab__near-badge">¡Casi!</span>
          )}
        </div>
      </div>

      {ipa && <div className="sound-lab__ipa">{ipa}</div>}
      {heroWord && <p className="sound-lab__hero-word m-0">{heroWord}</p>}
      {subtitle && <p className="sound-lab__card-sub m-0">{subtitle}</p>}

      <div className="mt-auto flex items-center gap-2 pt-3">
        {isDone || isInProgress ? (
          <>
            <div
              className="sound-lab__divider-track flex-1"
              role={isInProgress ? "progressbar" : undefined}
              aria-valuenow={isInProgress ? progressPct : undefined}
              aria-valuemin={isInProgress ? 0 : undefined}
              aria-valuemax={isInProgress ? 100 : undefined}
              aria-label={isInProgress ? `${progressPct}% completado` : undefined}
            >
              <span
                className={cn(
                  "sound-lab__divider-fill",
                  isDone && "sound-lab__divider-fill--done",
                )}
                style={{
                  transform: isDone
                    ? "scaleX(1)"
                    : `scaleX(${(progressPct ?? 0) / 100})`,
                }}
              />
            </div>
            {isInProgress && (
              <span className="sound-lab__card-pct shrink-0 tabular-nums">
                {progressPct}%
              </span>
            )}
          </>
        ) : (
          <span className="sound-lab__card-status">Sin practicar</span>
        )}
      </div>
    </>
  );
}
