"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { LessonHero } from "./LessonHero";
import { StageCard } from "./StageCard";
import {
  LESSON_STAGES,
  isLessonStageUnlocked,
  overallLessonMastery,
  type LessonLobbyProps,
  type DifficultyMode,
} from "./lesson-lobby-types";

export type {
  LessonStageId,
  LessonStageDef,
  LessonStageMastery,
  LessonStageMasteryMap,
  DifficultyMode,
  LessonLobbyProps,
} from "./lesson-lobby-types";
export {
  LESSON_STAGES,
  isLessonStageUnlocked,
  overallLessonMastery,
  emptyLessonMastery,
} from "./lesson-lobby-types";

export function LessonLobby({
  lesson,
  totalWords,
  sessionChunk,
  totalChunks,
  mastery,
  onSelectStage,
  backHref,
}: LessonLobbyProps) {
  const overall = overallLessonMastery(mastery);
  const [diffMode, setDiffMode] = useState<DifficultyMode>("chill");

  const chunkLabel =
    totalChunks > 1 ? `Set ${sessionChunk} of ${totalChunks}` : null;

  const nextUnlocked = LESSON_STAGES.find(
    (s) => isLessonStageUnlocked(s.id, mastery) && mastery[s.id].pct < 80,
  );

  const completedCount = LESSON_STAGES.filter(
    (s) => mastery[s.id].pct >= 80,
  ).length;

  return (
    <section>
      <LessonHero
        lesson={lesson}
        totalWords={totalWords}
        chunkLabel={chunkLabel}
        overall={overall}
        diffMode={diffMode}
        onDiffChange={setDiffMode}
        backHref={backHref}
      />

      <div className="px-6 lg:px-10 py-8 pb-14 ">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoPill
            icon="🎯"
            label="Today's goal"
            value={lesson.words[0]?.hint ?? "Master the sound pattern"}
            accent="var(--primary)"
          />
          <InfoPill
            icon="🔥"
            label="Stages done"
            value={
              completedCount > 0
                ? `${completedCount} of ${LESSON_STAGES.length} complete`
                : "None yet — start below"
            }
            accent="#f4a261"
          />
          <InfoPill
            icon="🤖"
            label="AI scoring"
            value="Live mic feedback on every attempt"
            accent="#2ec4b6"
          />
        </div>

        <div className="flex items-end justify-between gap-4 pt-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--text-tertiary)] mt-6">
              Practice modes
            </p>
            <h2 className="mb-6 text-[18px] font-semibold tracking-tight text-[var(--deep-text)]">
              How do you want to practice?
            </h2>
          </div>
          {overall > 0 && (
            <span
              className="rounded-full border px-3 py-1 text-[13px] font-medium"
              style={{
                borderColor: "var(--line-divider)",
                color: "var(--text-secondary)",
              }}
            >
              {overall}% mastered
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
          {LESSON_STAGES.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              mastery={mastery[stage.id]}
              isNext={nextUnlocked?.id === stage.id}
              unlocked={isLessonStageUnlocked(stage.id, mastery)}
              diffMode={diffMode}
              onSelect={(diff) => onSelectStage(stage.id, diff)}
            />
          ))}
        </div>

        {nextUnlocked ? (
          <Button
            onClick={() => onSelectStage(nextUnlocked.id, diffMode)}
            fullWidth
            size="lg"
            className="shadow-lg shadow-[color-mix(in_oklch,var(--primary)_18%,transparent)]"
          >
            Continue — {nextUnlocked.title}
          </Button>
        ) : overall >= 80 ? (
          <div className="rounded-[18px] border border-[color-mix(in_oklch,var(--admonitions-color-tip)_20%,transparent)] bg-[color-mix(in_oklch,var(--admonitions-color-tip)_8%,transparent)] px-4 py-4 text-center">
            <p className="text-[15px] font-semibold text-[var(--admonitions-color-tip)]">
              🎉 All stages mastered — great work!
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Keep practicing to maintain your streak.
            </p>
          </div>
        ) : (
          <Button
            onClick={() => onSelectStage("guided", diffMode)}
            fullWidth
            size="lg"
            className="shadow-lg shadow-[color-mix(in_oklch,var(--primary)_18%,transparent)]"
          >
            Start practice · ~3 min
          </Button>
        )}
      </div>
    </section>
  );
}

function InfoPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 space-y-2"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--line-divider)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[16px] leading-none">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--text-tertiary)]">
          {label}
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span
          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <p className="text-[13px] font-medium leading-snug text-[var(--deep-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}
