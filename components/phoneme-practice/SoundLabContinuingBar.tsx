"use client";

import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle, lessonSubtitleFromTitle } from "@/lib/sound-lab/display";

interface Props {
  lesson: Lesson | null;
  progress: number;
  onResume?: () => void;
}

export function SoundLabContinuingBar({ lesson, progress, onResume }: Props) {
  if (!lesson) return null;

  const ipa = ipaFromLessonTitle(lesson.title);
  const subtitle = lessonSubtitleFromTitle(lesson.title);

  return (
    <button type="button" className="sound-lab__resume" onClick={onResume}>
      <span className="sound-lab__resume-play" aria-hidden>
        <Play className="h-5 w-5 fill-current" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="sound-lab__resume-label">Continúa donde lo dejaste</span>
        <div className="sound-lab__resume-title">
          {ipa && <span className="sound-lab__resume-ipa">{ipa}</span>}
          {subtitle && <span className="sound-lab__resume-sub">{subtitle}</span>}
        </div>
      </span>
      <span className="sound-lab__resume-pct">{progress}%</span>
    </button>
  );
}
