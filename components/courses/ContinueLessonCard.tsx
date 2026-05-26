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
      className="relative grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,360px)] overflow-hidden"
      style={{
        background: "#1a1410",
        borderRadius: "var(--radius-lg)",
        gap: "var(--space-6)",
        padding: "var(--space-6)",
      }}
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
    <div className="flex flex-col justify-between" style={{ gap: "var(--space-5)", minHeight: "220px" }}>
      <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
        <span
          className="inline-flex items-center self-start"
          style={{
            gap: "var(--space-2)",
            font: "var(--font-tiny)",
            color: "var(--primary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
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

        <div className="flex flex-col" style={{ gap: "var(--space-1)" }}>
          <span style={{ font: "var(--font-caption)", color: "rgba(255,255,255,0.55)" }}>
            {courseTitle} · {lessonLabel}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-heading), serif",
              fontWeight: 500,
              fontSize: "clamp(1.25rem, 2.4vw, 1.625rem)",
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.95)",
              margin: 0,
              maxWidth: "32ch",
            }}
          >
            {lessonTitle}
          </h2>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
        <div
          style={{
            height: "3px",
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${safe}%`, background: "var(--primary)" }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ gap: "var(--space-3)" }}>
          <span style={{ font: "var(--font-caption)", color: "rgba(255,255,255,0.55)" }}>
            {safe}% · {lessonsDone} of {lessonsTotal} lessons
          </span>
          <span style={{ font: "var(--font-caption)", color: "rgba(255,255,255,0.55)" }}>
            ~{minutesLeft} min left
          </span>
        </div>

        <div className="flex flex-wrap" style={{ gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center"
            style={{
              gap: "var(--space-2)",
              background: "var(--primary)",
              color: "var(--on-primary)",
              borderRadius: "var(--radius-md)",
              height: "36px",
              padding: "0 var(--space-4)",
              font: "var(--font-body-sm)",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Play size={14} fill="currentColor" />
            Resume lesson
          </button>
          {onViewSyllabus && (
            <button
              type="button"
              onClick={onViewSyllabus}
              className="inline-flex items-center"
              style={{
                gap: "var(--space-2)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "var(--radius-md)",
                height: "36px",
                padding: "0 var(--space-4)",
                font: "var(--font-body-sm)",
                cursor: "pointer",
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
          "radial-gradient(ellipse at 30% 35%, color-mix(in srgb, var(--primary) 45%, transparent) 0%, transparent 60%), radial-gradient(ellipse at 70% 75%, #3b2a8c 0%, transparent 55%), #0f0a08",
        minHeight: "220px",
      }}
    >
      <ArrowRight
        size={42}
        strokeWidth={1.25}
        style={{ color: "rgba(255,255,255,0.85)" }}
      />
      {phonemes && phonemes.length > 0 && (
        <div
          className="absolute flex"
          style={{
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            gap: "var(--space-3)",
            font: "var(--font-caption)",
            color: "rgba(255,255,255,0.45)",
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
