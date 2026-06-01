"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle, lessonSubtitleFromTitle } from "@/lib/sound-lab/display";

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
}

export function SoundLabLessonCard({ lesson, progressPct, isWeak }: Props) {
  const { id, title, words, href } = lesson;
  const ipa = ipaFromLessonTitle(title);
  const subtitle = lessonSubtitleFromTitle(title);
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
        {ipa && <div className="sound-lab__ipa">{ipa}</div>}
        {subtitle && <p className="sound-lab__card-sub">{subtitle}</p>}

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
