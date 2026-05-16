"use client";

// Planned structure:
// <LessonContextStrip>
//   <ExpandedView> (lesson title, caption, 3 info chips, skip/know links)
//   <CollapsedBar> (one-line summary + ChevronDown)
// </LessonContextStrip>

import { useEffect, useState } from "react";
import { Target, Flame, Mic, ChevronDown } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  stagesCompleted: number;
  totalStages: number;
  onSkipIntro: () => void;
  onKnowLesson: () => void;
}

export function LessonContextStrip({
  lesson,
  stagesCompleted,
  totalStages,
  onSkipIntro,
  onKnowLesson,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setExpanded(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const estMin = Math.max(3, Math.ceil(lesson.words.length * 0.4));
  const wordPreview = lesson.words.slice(0, 3).map((w) => w.word).join(" · ");
  const goal = lesson.words[0]?.hint ?? "Master the sound pattern";
  const shortGoal = goal.length > 34 ? goal.slice(0, 34) + "…" : goal;

  return (
    <div
      className="overflow-hidden border-b border-border-subtle bg-surface-raised"
      style={{
        maxHeight: expanded ? "220px" : "40px",
        transition: "max-height 300ms ease-out",
      }}
    >
      {/* Expanded view */}
      <div
        className="px-6 py-4 space-y-3"
        style={{ opacity: expanded ? 1 : 0, transition: "opacity 200ms ease-out" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-h3 leading-tight">{lesson.title}</p>
            <p className="text-caption text-fg-muted mt-0.5">
              {lesson.words.length} words · {estMin} min · {wordPreview}
            </p>
          </div>
          <button
            onClick={() => { setExpanded(false); onSkipIntro(); }}
            className="shrink-0 mt-1 text-body-sm text-fg-muted hover:text-fg transition-colors"
          >
            Skip intro →
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <InfoChip icon={<Target size={13} />} label="Today's goal" value={shortGoal} />
          <InfoChip
            icon={<Flame size={13} />}
            label="Stages"
            value={`${stagesCompleted} of ${totalStages} done`}
          />
          <InfoChip
            icon={<Mic size={13} />}
            label="AI Scoring"
            value="Live mic feedback enabled"
          />
        </div>

        <button
          onClick={onKnowLesson}
          className="text-body-sm text-fg-muted hover:text-primary transition-colors"
        >
          I know this lesson → skip to Quick Quiz
        </button>
      </div>

      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between px-6 h-10 text-caption text-fg-muted hover:bg-surface-sunken transition-colors"
        style={{ opacity: expanded ? 0 : 1, transition: "opacity 200ms ease-out 100ms" }}
        tabIndex={expanded ? -1 : 0}
      >
        <span className="truncate">
          🎯 {shortGoal} · 🔥 {stagesCompleted}/{totalStages} stages · 🎤 AI scoring on
        </span>
        <ChevronDown size={14} className="ml-2 shrink-0" />
      </button>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2">
      <span className="text-fg-subtle shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-caption text-fg-subtle leading-none">{label}</p>
        <p className="text-body-sm text-fg leading-snug mt-0.5 truncate max-w-[160px]">{value}</p>
      </div>
    </div>
  );
}
