// Planned structure:
// <ContinueLessonCard>
//   <ContinueCopy />      (eyebrow, course · lesson, title, progress bar, CTAs)
//   <ContinueVisual />    (dark gradient panel with arrow + phonemes)
// </ContinueLessonCard>

"use client";

import { Play, List, ArrowRight } from "lucide-react";

export interface ContinueLesson {
  courseTitle: string;
  lessonLabel: string;
  lessonTitle: string;
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
  minutesLeft: number;
  phonemes?: string[];
  onResume: () => void;
  onViewSyllabus?: () => void;
}

export default function ContinueLessonCard(props: ContinueLesson) {
  return (
    <div
      className="relative grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,360px)] overflow-hidden rounded-[var(--radius-lg)] gap-[var(--space-6)] p-[var(--space-6)]"
      style={{ background: "var(--surface-code)" }}
    >
      <ContinueCopy {...props} />
      <ContinueVisual phonemes={props.phonemes} />
    </div>
  );
}

function ContinueCopy({
  courseTitle,
  lessonLabel,
  lessonTitle,
  progress,
  lessonsDone,
  lessonsTotal,
  minutesLeft,
  onResume,
  onViewSyllabus,
}: ContinueLesson) {
  const safe = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="flex flex-col justify-between gap-[var(--space-5)] min-h-[220px]">
      <div className="flex flex-col gap-[var(--space-3)]">
        <span
          className="inline-flex items-center self-start gap-[var(--space-2)] uppercase tracking-[0.12em]"
          style={{ font: "var(--font-tiny)", color: "var(--primary)" }}
        >
          <span
            aria-hidden
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary)",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          />
          Continue where you left off
        </span>

        <div className="flex flex-col gap-[var(--space-1)]">
          <span style={{ font: "var(--font-caption)", color: "var(--overlay-medium)" }}>
            {courseTitle} · {lessonLabel}
          </span>
          <h2
            className="m-0 max-w-[32ch]"
            style={{
              font: "var(--font-h3)",
              color: "var(--overlay-darker)",
            }}
          >
            {lessonTitle}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-3)]">
        <div
          className="rounded-full overflow-hidden"
          style={{ height: "3px", background: "var(--overlay-subtle)" }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${safe}%`, background: "var(--primary)" }}
          />
        </div>
        <div className="flex items-center justify-between gap-[var(--space-3)]">
          <span style={{ font: "var(--font-caption)", color: "var(--overlay-medium)" }}>
            {safe}% · {lessonsDone} of {lessonsTotal} lessons
          </span>
          <span style={{ font: "var(--font-caption)", color: "var(--overlay-medium)" }}>
            ~{minutesLeft} min left
          </span>
        </div>

        <div className="flex flex-wrap gap-[var(--space-2)] mt-[var(--space-2)]">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-[var(--space-2)] h-9 px-[var(--space-4)] rounded-[var(--radius-md)] cursor-pointer border-none font-medium"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
              font: "var(--font-body-sm)",
            }}
          >
            <Play size={14} fill="currentColor" />
            Resume lesson
          </button>
          {onViewSyllabus && (
            <button
              type="button"
              onClick={onViewSyllabus}
              className="inline-flex items-center gap-[var(--space-2)] h-9 px-[var(--space-4)] rounded-[var(--radius-md)] cursor-pointer"
              style={{
                background: "var(--overlay-subtle)",
                color: "var(--overlay-darker)",
                border: "1px solid var(--overlay-weak)",
                font: "var(--font-body-sm)",
              }}
            >
              <List size={14} />
              View syllabus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContinueVisual({ phonemes }: { phonemes?: string[] }) {
  return (
    <div
      className="relative hidden lg:flex items-center justify-center overflow-hidden"
      style={{
        borderRadius: "var(--radius-md)",
        background:
          "radial-gradient(ellipse at 30% 35%, color-mix(in oklch, var(--primary) 45%, transparent) 0%, transparent 60%), radial-gradient(ellipse at 70% 75%, color-mix(in oklch, var(--primary-800) 80%, var(--surface-code)) 0%, transparent 55%), var(--surface-code)",
        minHeight: "220px",
      }}
    >
      <ArrowRight
        size={42}
        strokeWidth={1.25}
        style={{ color: "var(--overlay-darker)" }}
      />
      {phonemes && phonemes.length > 0 && (
        <div
          className="absolute flex"
          style={{
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            gap: "var(--space-3)",
            font: "var(--font-caption)",
            color: "var(--overlay-light)",
            fontFamily: "var(--font-ipa), 'Noto Serif', serif",
          }}
        >
          {phonemes.map((p) => (
            <span key={p}>/{p}/</span>
          ))}
        </div>
      )}
    </div>
  );
}
