"use client";

import { useId } from "react";
import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { cn } from "@/lib/cn";
import { useSpeakWord } from "@/hooks/useSpeakWord";

interface Props {
  lesson: Lesson | null;
  progress: number;
}

function progressAriaLabel(ipa: string | null, heroWord: string | null, progress: number): string {
  const sound = [ipa, heroWord].filter(Boolean).join(", as in ");
  if (sound) return `${sound}, ${progress}% complete`;
  return `${progress}% complete`;
}

export function SoundLabContinuingBar({ lesson, progress }: Props) {
  const labelId = useId();
  const examplesGroupId = useId();
  const { speaking, speak } = useSpeakWord();

  if (!lesson) return null;

  const ipa = ipaFromLessonTitle(lesson.title);
  const heroWord = lesson.words[0]?.word ?? null;
  const exampleWords = lesson.words.slice(0, 2).map((w) => w.word);
  const progressLabel = progressAriaLabel(ipa, heroWord, progress);

  return (
    <section
      className="sound-lab__resume"
      aria-labelledby={labelId}
    >
      <div className="sound-lab__resume-split">
        <div className="sound-lab__resume-focus">
          <span id={labelId} className="sound-lab__chrome-label sound-lab__chrome-label--section">
            Pick up here
          </span>

          <div className="sound-lab__resume-identity">
            {ipa && <span className="sound-lab__resume-ipa">{ipa}</span>}
            {heroWord && (
              <>
                <span className="sound-lab__resume-as-in" aria-hidden>
                  as in
                </span>
                <span className="sound-lab__resume-hero-word truncate">{heroWord}</span>
              </>
            )}
          </div>

          <div className="sound-lab__resume-progress">
            <div
              className="sound-lab__resume-track min-w-0 flex-1"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={progressLabel}
            >
              <span className="sound-lab__resume-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="sound-lab__resume-pct shrink-0 tabular-nums" aria-hidden>
              {progress}%
            </span>
          </div>
        </div>

        {exampleWords.length > 0 && (
          <div className="sound-lab__resume-examples">
            <span id={examplesGroupId} className="sound-lab__chrome-label sound-lab__chrome-label--section">
              Hear examples
            </span>
            <div
              className="sound-lab__resume-examples-pills"
              role="group"
              aria-labelledby={examplesGroupId}
            >
              {exampleWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  className={cn(
                    "sound-lab__resume-pill sound-lab__resume-pill--side",
                    speaking === word && "sound-lab__resume-pill--speaking",
                  )}
                  onClick={(e) => speak(word, e)}
                  aria-label={`Play pronunciation of "${word}"`}
                  aria-pressed={speaking === word}
                >
                  <Play className="sound-lab__resume-pill-icon" aria-hidden />
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
