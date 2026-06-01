"use client";

import { Play } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson | null;
  progress: number;
  onResume?: () => void;
}

function extractIpa(title: string): string | null {
  const m = title.match(/^\/([^/]+)\//);
  return m ? `/${m[1]}/` : null;
}

function displayTitle(title: string): string {
  return title.replace(/^\/[^/]+\/\s*[—–-]\s*/, "");
}

export function SoundLabContinuingBar({ lesson, progress, onResume }: Props) {
  if (!lesson) return null;

  const ipa = extractIpa(lesson.title);
  const label = displayTitle(lesson.title);

  return (
    <button type="button" className="sound-lab__resume" onClick={onResume}>
      <span className="sound-lab__resume-play" aria-hidden>
        <Play className="h-5 w-5 fill-current" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="sound-lab__resume-label">Pick up where you left off</span>
        <div className="sound-lab__resume-title">
          {ipa && <span className="sound-lab__resume-ipa">{ipa} </span>}
          {label}
        </div>
      </span>
      <span className="sound-lab__resume-pct">{progress}%</span>
    </button>
  );
}
