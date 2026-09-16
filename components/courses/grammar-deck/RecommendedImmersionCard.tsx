"use client";

// Planned structure:
// <RecommendedImmersionCard>
//   <ImmersionCardBadgeRow />
//   <ImmersionCardTitleAndMeta />
//   <ImmersionCardReason />
//   <ImmersionCardAction />
// </RecommendedImmersionCard>

import Link from "next/link";
import { ArrowRight, Play } from "@/components/icons";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface RecommendedImmersionCardProps {
  lesson: ImmersionLesson;
  className?: string;
}

export function RecommendedImmersionCard({ lesson, className = "" }: RecommendedImmersionCardProps) {
  const isExact = lesson.metadata?.relation === "exact";
  const badgeLabel = isExact ? "Video canónico" : "Video relacionado";
  const reason = lesson.metadata?.reason;

  return (
    <div
      className={`flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-border-default bg-surface-raised p-5 text-left shadow-xs transition-all hover:border-accent/60 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-kicker text-caption font-semibold uppercase tracking-wider text-accent">
          Inmersión recomendada
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
            isExact
              ? "border border-success/30 bg-success-soft text-success"
              : "border border-accent/30 bg-accent-soft text-accent"
          }`}
        >
          {badgeLabel}
        </span>
      </div>

      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Play size={20} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h4 className="text-body font-semibold text-fg line-clamp-2">
            {lesson.title}
          </h4>
          <p className="text-caption text-fg-muted">
            {lesson.teacher} · {lesson.durationMinutes} min · Nivel {lesson.level}
          </p>
        </div>
      </div>

      {reason && (
        <p className="text-body-sm text-fg-muted line-clamp-2 border-l-2 border-accent/30 pl-3">
          {reason}
        </p>
      )}

      <div className="mt-1 flex justify-end">
        <Link
          href={`/practice/immersion/${lesson.slug}`}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-sunken px-4 py-2 text-body-sm font-semibold text-fg transition-colors hover:bg-accent-soft hover:text-accent"
        >
          <span>Practicar con este video</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
