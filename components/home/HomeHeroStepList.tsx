"use client";

// Planned structure:
// <HomeHeroStepList>
//   <ol>
//     <StepItem />
//     <ExtraExercisesLockedItem />
//   </ol>
//   <PlacementHint />
// </HomeHeroStepList>

import Link from "next/link";
import { Check, Lock } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import type { DailyStep, DailyStepStatus } from "@/hooks/useDailyPlan";
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from "@/lib/daily/localize-step-copy";
import { cn } from "@/lib/cn";

interface HomeHeroStepListProps {
  steps: DailyStep[];
  getStepStatus: (stepId: string) => DailyStepStatus;
  activeStepIndex: number;
  needsPlacement?: boolean;
  needsPronunciation?: boolean;
}

export default function HomeHeroStepList({
  steps,
  getStepStatus,
  activeStepIndex,
  needsPlacement = false,
  needsPronunciation = false,
}: HomeHeroStepListProps) {
  return (
    <div className="flex flex-col gap-2">
      <ol className="mt-2 flex flex-col gap-1.5">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isDone = status === "done" || status === "resolved";
          const isCurrent = idx === activeStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors",
                isCurrent
                  ? "bg-primary/10 font-semibold text-fg"
                  : isDone
                    ? "text-fg-muted bg-transparent"
                    : "text-fg hover:bg-surface-sunken/60"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="font-mono text-caption w-4 shrink-0 text-fg-muted">
                  {idx + 1}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium">
                    {localizeDailyStepTitle(step.title)}
                  </span>
                  {isCurrent ? (
                    <span className="truncate font-caption font-normal text-primary">
                      Paso actual · {step.subtitle ? localizeDailyStepSubtitle(step.subtitle) : "Por aquí empiezas hoy"}
                    </span>
                  ) : step.subtitle ? (
                    <span className="truncate font-caption font-normal text-fg-muted">
                      {localizeDailyStepSubtitle(step.subtitle)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 font-caption text-success font-semibold">
                    <Check size={14} aria-hidden /> Hecho
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent ? (
                      <Badge label="En curso" variant="default" size="sm" />
                    ) : null}
                    {step.id === "journal_entry" || step.href === "/journal" ? (
                      <Badge label="Opcional" variant="neutral" size="sm" />
                    ) : null}
                    <span className="font-caption tabular-nums text-fg-muted">
                      {step.estMinutes} min
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}

        {/* Recompensa final: Ejercicios extra bloqueados */}
        <li className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border-subtle px-3 py-2 text-body-sm text-fg-muted">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="font-mono text-caption w-4 shrink-0 text-fg-muted">
              {steps.length + 1}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate font-medium text-fg-muted">
                Ejercicios extra
              </span>
              <span className="truncate font-caption text-fg-muted">
                Se desbloquean al completar tu sesión de hoy
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Lock size={14} className="text-fg-muted" aria-hidden />
          </div>
        </li>
      </ol>

      {/* Afinar la ruta contextual dentro del plan del día */}
      {needsPlacement || needsPronunciation ? (
        <div className="mt-1 rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-caption text-fg-muted">
          <span>¿El nivel no se ajusta a ti? </span>
          {needsPlacement ? (
            <Link
              href="/assessment"
              className="focus-ring font-medium text-primary underline underline-offset-2 hover:underline"
            >
              Prueba de nivel
            </Link>
          ) : null}
          {needsPlacement && needsPronunciation ? " · " : null}
          {needsPronunciation ? (
            <Link
              href="/assessment/pronunciation"
              className="focus-ring font-medium text-primary underline underline-offset-2 hover:underline"
            >
              Diagnóstico oral
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
