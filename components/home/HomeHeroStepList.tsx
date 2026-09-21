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
import { ArrowRight, Check, Lock } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
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
  onStartStep?: (step: DailyStep) => void;
}

export default function HomeHeroStepList({
  steps,
  getStepStatus,
  activeStepIndex,
  needsPlacement = false,
  needsPronunciation = false,
  isExpanded = true,
  onStartStep,
}: HomeHeroStepListProps) {
  const visibleSteps = isExpanded ? steps : steps.slice(0, 2);

  return (
    <div className="flex flex-col gap-2">
      <ol className="mt-2 flex flex-col gap-2">
        {visibleSteps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isDone = status === "done" || status === "resolved";
          const isCurrent = idx === activeStepIndex;

          const rowClass = cn(
            "group flex w-full items-center justify-between gap-3.5 rounded-xl px-3.5 py-2.5 text-body-sm text-left transition-all duration-150",
            isCurrent
              ? "pastel-card-row-active text-ink"
              : isDone
                ? "text-ink-secondary bg-transparent opacity-85"
                : "text-ink bg-transparent hover:bg-ink/8 focus-ring press-feedback cursor-pointer"
          );

          const stepNumber = (
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold select-none transition-colors",
                isCurrent
                  ? "bg-paper text-accent"
                  : isDone
                    ? "bg-success/10 border border-success/20 text-success"
                    : "bg-ink/10 text-ink-secondary group-hover:text-ink"
              )}
            >
              {idx + 1}
            </span>
          );

          const content = (
            <>
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {stepNumber}

                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn("truncate font-semibold text-ink", isDone && "line-through opacity-75")}>
                    {localizeDailyStepTitle(step.title)}
                  </span>
                  {isCurrent ? (
                    <span className="truncate font-caption font-medium text-ink">
                      Paso actual · {step.subtitle ? localizeDailyStepSubtitle(step.subtitle) : "Por aquí empiezas hoy"}
                    </span>
                  ) : step.subtitle ? (
                    <span className="truncate font-caption font-normal text-ink-secondary">
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
                    {isCurrent ? <Chip variant="status">En curso</Chip> : null}
                    {step.id === "journal_entry" || step.href === "/journal" ? (
                      <Badge label="Opcional" variant="neutral" size="sm" />
                    ) : null}
                    <span className="font-caption tabular-nums text-ink-secondary select-none">
                      {step.estMinutes} min
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className={cn(
                        "shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
                        isCurrent ? "text-ink" : "text-ink-secondary group-hover:text-ink"
                      )}
                    />
                  </div>
                )}
              </div>
            </>
          );

          if (isDone) {
            return (
              <li key={step.id} className={rowClass}>
                {content}
              </li>
            );
          }

          if (step.href) {
            return (
              <li key={step.id}>
                <Link href={step.href} className={rowClass}>
                  {content}
                </Link>
              </li>
            );
          }

          return (
            <li key={step.id}>
              <button
                type="button"
                className={rowClass}
                onClick={() => onStartStep?.(step)}
              >
                {content}
              </button>
            </li>
          );
        })}

        {/* Recompensa final: Ejercicios extra bloqueados (solo al expandir) */}
        {isExpanded ? (
          <li className="flex items-center justify-between gap-3.5 rounded-xl border border-dashed border-border-subtle bg-transparent px-3.5 py-2.5 text-body-sm text-ink-secondary transition-colors">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="bg-ink/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold text-ink-secondary select-none">
                {steps.length + 1}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium text-ink-secondary">
                  Ejercicios extra
                </span>
                <span className="truncate font-caption text-ink-secondary">
                  Se desbloquean al completar tu sesión de hoy
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Lock size={14} className="text-ink-secondary" aria-hidden />
            </div>
          </li>
        ) : null}
      </ol>

      {/* Afinar la ruta contextual dentro del plan del día (solo al expandir) */}
      {isExpanded && (needsPlacement || needsPronunciation) ? (
        <div className="pastel-card-chip mt-1 rounded-xl px-3.5 py-2.5 text-caption text-ink-secondary">
          <span>¿El nivel no se ajusta a ti? </span>
          {needsPlacement ? (
            <Link
              href="/assessment"
              className="focus-ring font-medium text-ink underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Prueba de nivel
            </Link>
          ) : null}
          {needsPlacement && needsPronunciation ? " · " : null}
          {needsPronunciation ? (
            <Link
              href="/assessment/pronunciation"
              className="focus-ring font-medium text-ink underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Diagnóstico oral
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


