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
  isExpanded?: boolean;
}

export default function HomeHeroStepList({
  steps,
  getStepStatus,
  activeStepIndex,
  needsPlacement = false,
  needsPronunciation = false,
  isExpanded = true,
}: HomeHeroStepListProps) {
  const visibleSteps = isExpanded ? steps : steps.slice(0, 2);

  return (
    <div className="flex flex-col gap-2">
      <ol className="mt-2 flex flex-col gap-2">
        {visibleSteps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isDone = status === "done" || status === "resolved";
          const isCurrent = idx === activeStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center justify-between gap-3.5 rounded-xl px-3.5 py-2.5 text-body-sm transition-all duration-150",
                isCurrent
                  ? "bg-primary/5 border border-primary/20 text-fg shadow-2xs"
                  : isDone
                    ? "text-fg-muted/80 bg-transparent opacity-85 hover:opacity-100"
                    : "text-fg bg-surface-sunken/30 hover:bg-surface-sunken/60 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Cuadrado redondeado con el número de paso tal cual el diseño */}
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold select-none transition-colors",
                    isCurrent
                      ? "bg-surface border-2 border-primary/30 text-primary shadow-xs"
                      : isDone
                        ? "bg-success/10 border border-success/20 text-success"
                        : "bg-surface border border-border-subtle/80 text-fg-muted"
                  )}
                >
                  {idx + 1}
                </span>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn("truncate font-semibold text-fg", isDone && "line-through opacity-75")}>
                    {localizeDailyStepTitle(step.title)}
                  </span>
                  {isCurrent ? (
                    <span className="truncate font-caption font-medium text-primary">
                      Paso actual · {step.subtitle ? localizeDailyStepSubtitle(step.subtitle) : "Por aquí empiezas hoy"}
                    </span>
                  ) : step.subtitle ? (
                    <span className="truncate font-caption font-normal text-fg-muted">
                      {localizeDailyStepSubtitle(step.subtitle)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 font-caption text-success font-semibold select-none">
                    <Check size={14} aria-hidden /> Hecho
                  </span>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <Badge label="En curso" variant="default" size="sm" />
                    ) : null}
                    {step.id === "journal_entry" || step.href === "/journal" ? (
                      <Badge label="Opcional" variant="neutral" size="sm" />
                    ) : null}
                    <span className="font-caption tabular-nums text-fg-muted select-none">
                      {step.estMinutes} min
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}

        {/* Recompensa final: Ejercicios extra bloqueados (solo al expandir) */}
        {isExpanded ? (
          <li className="flex items-center justify-between gap-3.5 rounded-xl border border-dashed border-border-subtle bg-surface-sunken/20 px-3.5 py-2.5 text-body-sm text-fg-muted transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-sunken/60 font-mono text-sm font-semibold text-fg-muted border border-border-subtle/50 select-none">
                {steps.length + 1}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium text-fg-muted">
                  Ejercicios extra
                </span>
                <span className="truncate font-caption text-fg-muted/80">
                  Se desbloquean al completar tu sesión de hoy
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Lock size={14} className="text-fg-muted" aria-hidden />
            </div>
          </li>
        ) : null}
      </ol>

      {/* Afinar la ruta contextual dentro del plan del día (solo al expandir) */}
      {isExpanded && (needsPlacement || needsPronunciation) ? (
        <div className="mt-1 rounded-xl border border-border-subtle bg-surface-sunken/40 px-3.5 py-2.5 text-caption text-fg-muted">
          <span>¿El nivel no se ajusta a ti? </span>
          {needsPlacement ? (
            <Link
              href="/assessment"
              className="focus-ring font-medium text-primary underline underline-offset-2 hover:text-primary-hover transition-colors"
            >
              Prueba de nivel
            </Link>
          ) : null}
          {needsPlacement && needsPronunciation ? " · " : null}
          {needsPronunciation ? (
            <Link
              href="/assessment/pronunciation"
              className="focus-ring font-medium text-primary underline underline-offset-2 hover:text-primary-hover transition-colors"
            >
              Diagnóstico oral
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


