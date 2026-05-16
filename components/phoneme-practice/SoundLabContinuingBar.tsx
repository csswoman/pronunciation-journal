"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson | null;
  progress: number;
}

function extractIpa(title: string): string | null {
  const m = title.match(/^(\/[^/]+\/)/)
  return m ? m[1] : null
}

function lessonSubtitle(title: string): string {
  const m = title.match(/^(\/[^/]+\/)\s*[—–-]\s*(.+)$/)
  return m ? `${m[1]} — ${m[2]}` : title
}

export function SoundLabContinuingBar({ lesson, progress }: Props) {
  const [barWidth, setBarWidth] = useState(0);

  // Double-rAF so the CSS transition fires after the first paint
  useEffect(() => {
    let f2 = 0;
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => setBarWidth(progress));
    });
    return () => { cancelAnimationFrame(f1); cancelAnimationFrame(f2); };
  }, [progress]);

  if (!lesson) return null;

  const ipa = extractIpa(lesson.title);
  const subtitle = lessonSubtitle(lesson.title);

  return (
    <div className="relative mb-space-6 flex items-center gap-space-6 overflow-hidden rounded-lg border border-border-subtle bg-surface-raised p-space-6">
      {/* left accent stripe */}
      <span className="absolute bottom-0 left-0 top-0 w-[px] rounded-l-lg bg-primary" />

      {/* IPA glyph tile — only for phoneme lessons */}
      {ipa && (
        <div className="ml-space-2 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-primary-100">
          <span className="font-heading text-h2 leading-none text-primary">{ipa}</span>
        </div>
      )}

      {/* Middle */}
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-tiny uppercase tracking-widest text-fg-subtle">Continuing</p>
        <p className="mb-space-3 font-heading text-h4 text-fg">{subtitle}</p>
        <div className="h-[4px] overflow-hidden rounded-full bg-primary-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-shrink-0 items-center gap-space-2">
        <span className="font-heading text-h3 text-primary">{progress}%</span>
        <ArrowRight className="h-5 w-5 text-fg-subtle" />
      </div>
    </div>
  );
}
