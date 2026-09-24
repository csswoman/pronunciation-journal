"use client";

// Planned structure:
// <ProfileStudyCard>
//   <StudyHeader />
//   <StartingLevelSection>
//     <CefrLevelPills />
//     <AssessmentLink />
//   </StartingLevelSection>
//   <DailyGoalSection>
//     <DailyGoalPills />
//   </DailyGoalSection>
// </ProfileStudyCard>

import Link from "next/link";
import type { CefrLevel } from "@/lib/essential-words/types";

interface Props {
  level: CefrLevel;
  dailyGoal: string;
  onLevelChange: (next: CefrLevel) => void;
  onDailyGoalChange: (goal: string) => void;
}

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const DAILY_GOALS = ["5 min", "10 min", "20 min", "30 min"];

export default function ProfileStudyCard({
  level,
  dailyGoal,
  onLevelChange,
  onDailyGoalChange,
}: Props) {
  return (
    <section
      aria-labelledby="profile-study-title"
      className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs"
    >
      <div className="layout-stack-tight">
        <h2 id="profile-study-title" className="m-0 font-display text-h3 font-bold text-fg">
          Cómo estudias
        </h2>
        <p className="m-0 font-display text-body-sm text-fg-muted">
          Ajusta lo que te recomendamos. Tu progreso no se pierde al cambiar nada de esto.
        </p>
      </div>

      <div className="layout-stack gap-5 pt-2">
        {/* Nivel de partida */}
        <div className="layout-stack-tight">
          <span className="font-caption font-medium text-fg-muted">Nivel de partida</span>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {CEFR_LEVELS.map((l) => {
              const isSelected = level === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLevelChange(l)}
                  aria-pressed={isSelected}
                  className={`rounded-full px-4 py-1.5 font-label text-body-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-xs"
                      : "border border-border-default bg-surface-sunken text-fg-muted hover:border-primary/40 hover:text-fg"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/assessment"
              className="font-caption font-semibold text-primary transition-colors hover:text-primary-hover hover:underline"
            >
              Hacer la prueba de nivel →
            </Link>
          </div>
        </div>

        {/* Objetivo diario */}
        <div className="layout-stack-tight">
          <span className="font-caption font-medium text-fg-muted">Objetivo diario</span>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {DAILY_GOALS.map((goal) => {
              const isSelected = dailyGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onDailyGoalChange(goal)}
                  aria-pressed={isSelected}
                  className={`rounded-full px-4 py-1.5 font-label text-body-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary shadow-xs"
                      : "border border-border-default bg-surface-sunken text-fg-muted hover:border-primary/40 hover:text-fg"
                  }`}
                >
                  {goal}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
