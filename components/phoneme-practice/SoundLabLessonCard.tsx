"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  category?: string;
}

const DIFFICULTY_CLASS: Record<string, string> = {
  easy: "sound-lab__diff--easy",
  medium: "sound-lab__diff--medium",
  hard: "sound-lab__diff--hard",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Mid",
  hard: "Hard",
};

function extractIpa(title: string): string | null {
  const m = title.match(/^\/([^/]+)\//);
  return m ? `/${m[1]}/` : null;
}

function displayTitle(title: string): string {
  return title.replace(/^\/[^/]+\/\s*[—–-]\s*/, "");
}

export function SoundLabLessonCard({ lesson, progressPct, isWeak, category }: Props) {
  const { id, title, difficulty, words, exerciseCount, href } = lesson;
  const ipa = extractIpa(title);
  const label = displayTitle(title);
  const wordCount = words.length > 0 ? words.length : (exerciseCount ?? 0);
  const minutes = Math.max(2, Math.ceil(wordCount / 3));
  const repsLabel = wordCount > 0 ? `↻ ${wordCount} · ${minutes}m` : null;
  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
  const examples = words.length > 0 ? words.slice(0, 3).map((w) => w.word) : [];
  const showProgress =
    progressPct !== undefined && progressPct > 0 && progressPct < 100;

  return (
    <Link href={linkHref} className="block no-underline">
      <article
        className={[
          "sound-lab__card",
          isWeak && "sound-lab__card--weak",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sound-lab__card-row1">
          <span
            className={`sound-lab__diff ${DIFFICULTY_CLASS[difficulty] ?? ""}`}
          >
            {DIFFICULTY_LABEL[difficulty] ?? difficulty}
          </span>
          {repsLabel && <span className="sound-lab__reps">{repsLabel}</span>}
        </div>

        {ipa && <div className="sound-lab__ipa">{ipa}</div>}
        <div className="sound-lab__name">{category || label}</div>

        {examples.length > 0 && (
          <div className="sound-lab__ex">
            {examples.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        )}

        {showProgress && (
          <span
            className="sound-lab__pbar"
            style={{ width: `${progressPct}%` }}
            aria-hidden
          />
        )}
      </article>
    </Link>
  );
}
