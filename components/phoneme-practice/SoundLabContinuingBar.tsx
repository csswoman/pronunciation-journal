"use client";

import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";

interface Props {
  lesson: Lesson | null;
  progress: number;
  onResume?: () => void;
}

export function SoundLabContinuingBar({ lesson, progress, onResume }: Props) {
  if (!lesson) return null;

  const ipa = ipaFromLessonTitle(lesson.title);
  const heroWord = lesson.words[0]?.word ?? null;
  const ariaLabel = [ipa, heroWord].filter(Boolean).join(" — ");

  return (
    <button
      type="button"
      className="sound-lab__resume flex w-full cursor-pointer flex-col justify-between text-left sm:w-[280px] sm:h-full"
      onClick={onResume}
      aria-label={`Continue: ${ariaLabel}`}
    >
      {/* Label row */}
      <span className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[color:oklch(60%_0.01_none)]">
        Continue where you left off
      </span>

      {/* Identity row: play + IPA + keyword + pct */}
      <div className="flex items-center gap-3">
        <span
          className="sound-lab__resume-play flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>

        <span className="min-w-0 flex-1 truncate">
          {ipa && (
            <span className="sound-lab__resume-ipa mr-1.5">{ipa}</span>
          )}
          {heroWord && (
            <span className="sound-lab__resume-sub font-semibold text-[color:oklch(90%_0.005_none)]">
              {heroWord}
            </span>
          )}
        </span>

        <span className="sound-lab__resume-pct shrink-0">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="sound-lab__resume-track mt-3" aria-hidden>
        <span className="sound-lab__resume-fill" style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}
