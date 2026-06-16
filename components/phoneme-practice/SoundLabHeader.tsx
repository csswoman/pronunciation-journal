"use client";

import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { SoundLabContinuingBar } from "./SoundLabContinuingBar";

// Planned structure:
// <SoundLabHeader>
//   left: headline + stats + continue CTA
//   <SoundLabContinuingBar />
// </SoundLabHeader>

interface Props {
  totalCount: number;
  inProgressCount: number;
  heroLesson: Lesson | null;
  heroProgress: number;
  onResume?: () => void;
}

function headerStatsLine(inProgressCount: number, totalCount: number): string {
  if (inProgressCount > 0) {
    return `${inProgressCount} of ${totalCount} sounds in progress`;
  }
  if (totalCount === 1) {
    return "1 sound ready to practice";
  }
  return `${totalCount} sounds ready to practice`;
}

function continueCtaLabel(lesson: Lesson | null): string {
  const ipa = lesson ? ipaFromLessonTitle(lesson.title) : null;
  if (ipa) return `Continue ${ipa}`;
  return "Continue lesson";
}

export function SoundLabHeader({
  totalCount,
  inProgressCount,
  heroLesson,
  heroProgress,
  onResume,
}: Props) {
  const showResume = Boolean(heroLesson && onResume);
  const statsLine = headerStatsLine(inProgressCount, totalCount);

  return (
    <div className="sound-lab__hero-card flex flex-col overflow-hidden rounded-[var(--radius-xl)] border sm:flex-row sm:items-stretch">
      <div className="sound-lab__hero-main">
        <div className="sound-lab__hero-intro">
          <h1 className="sound-lab__headline">
            Speak <b>better</b>, <em>one sound</em> at a time.
          </h1>
          <p className="sound-lab__stats-line m-0">
            {inProgressCount > 0 ? (
              <>
                <span className="sound-lab__stats-count">{inProgressCount}</span>
                {" of "}
                {totalCount}
                {" sounds in progress"}
              </>
            ) : (
              statsLine
            )}
          </p>
        </div>

        {showResume && (
          <button
            type="button"
            className="sound-lab__hero-cta"
            onClick={onResume}
            aria-label={`${continueCtaLabel(heroLesson)}. ${heroProgress}% complete.`}
          >
            <span className="sound-lab__hero-cta-icon" aria-hidden>
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            {continueCtaLabel(heroLesson)}
          </button>
        )}
      </div>

      {heroLesson && (
        <SoundLabContinuingBar lesson={heroLesson} progress={heroProgress} />
      )}
    </div>
  );
}
