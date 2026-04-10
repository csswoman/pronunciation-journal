"use client";

import type { ReactNode } from "react";
import { Play } from "lucide-react";

interface HeroHeaderProps {
  title: string;
  subtitle: string;
  progress: number;
  lessonTitle: string;
  onContinue: () => void;
  illustration?: ReactNode;
}

export default function HeroHeader({
  title,
  subtitle,
  progress,
  lessonTitle,
  onContinue,
  illustration,
}: HeroHeaderProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[var(--line-divider)] bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)] p-8 lg:p-10 mb-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center"
      style={{
        boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent)_0%,transparent_34%),linear-gradient(120deg,transparent_0%,color-mix(in_oklch,var(--primary)_8%,transparent)_48%,transparent_100%)] opacity-90" />

      <div className="relative">
        <div className="max-w-2xl">
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-0.5 w-5 rounded-full bg-[var(--primary)]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
                Sound Lab
              </span>
            </div>

            <h1 className="mb-3 font-display text-4xl leading-tight tracking-tight text-[var(--deep-text)] lg:text-[42px]">
              {title}
              <br />
              <em className="not-italic text-[var(--primary)]">{subtitle}</em>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
              Short drills. Clear feedback. Real progress.
            </p>
          </div>

          <div className="mt-7 max-w-xl space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm sm:text-base">
                <span className="font-medium text-[var(--deep-text)]">{lessonTitle}</span>
                <span className="text-[var(--text-tertiary)]">-</span>
                <span className="text-[var(--text-secondary)]">{safeProgress}% complete</span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line-divider)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500 ease-out"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--accent-text)] shadow-[0_12px_30px_color-mix(in_oklch,var(--primary)_28%,transparent)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)]"
            >
              <Play size={16} className="fill-current" />
              <span>Resume Lesson</span>
            </button>
          </div>
        </div>

        {illustration ? (
          <div className="hidden lg:flex items-center justify-center">
            {illustration}
          </div>
        ) : null}
      </div>
    </section>
  );
}
