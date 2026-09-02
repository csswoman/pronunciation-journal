"use client";

// Structure:
// <HomeHeroCard>
//   <HeroHeader>
//     <KickerAndTitle />
//     <SessionMetrics />
//   </HeroHeader>
//   <SubTitleAndMeta />
//   <PlanSegmentProgress />
//   <PrimaryCTA />
//   <SubordinateStepListToggle />
// </HomeHeroCard>

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, Check } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import type { DailyStep, DailyStepStatus } from "@/hooks/useDailyPlan";
import { cn } from "@/lib/cn";
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from "@/lib/daily/localize-step-copy";
import { stepMeta } from "@/components/daily/daily-step-list-helpers";

interface HomeHeroCardProps {
  steps: DailyStep[];
  getStepStatus: (stepId: string) => DailyStepStatus;
  completedCount: number;
  allDone: boolean;
  onStartStep: (step: DailyStep) => void;
  inProgressStepId?: string | null;
  primaryActionHref?: string;
}

export default function HomeHeroCard({
  steps,
  getStepStatus,
  completedCount,
  allDone,
  onStartStep,
  inProgressStepId = null,
}: HomeHeroCardProps) {
  const [showSecondarySteps, setShowSecondarySteps] = useState(false);

  const entryIndex = steps.findIndex((s) => {
    const st = getStepStatus(s.id);
    return st !== "done" && st !== "resolved";
  });

  const activeStepIndex = inProgressStepId
    ? steps.findIndex((s) => s.id === inProgressStepId)
    : entryIndex >= 0
      ? entryIndex
      : 0;

  const currentStep = steps[activeStepIndex] ?? steps[0];
  const isMidSession = Boolean(inProgressStepId) && !allDone;

  const totalMinutes = steps.reduce((sum, s) => sum + (s.estMinutes || 0), 0);
  const remainingMinutes = steps.reduce((sum, s) => {
    const st = getStepStatus(s.id);
    if (st === "done" || st === "resolved") return sum;
    return sum + (s.estMinutes || 0);
  }, 0);

  const stepTitle = currentStep
    ? localizeDailyStepTitle(currentStep.title)
    : "Sesión diaria";
  const stepSubtitle = currentStep
    ? localizeDailyStepSubtitle(currentStep.subtitle)
    : "";
  const metaText = currentStep ? stepMeta(currentStep) : null;
  const currentStepMinutes = currentStep?.estMinutes ?? 7;

  const ctaLabel = isMidSession
    ? "Continuar"
    : `Empezar sesión · ${remainingMinutes > 0 ? remainingMinutes : totalMinutes} min`;

  const handleStartCurrentStep = () => {
    if (!currentStep) return;
    if (currentStep.kind === "concept" && currentStep.href) {
      return;
    }
    onStartStep(currentStep);
  };

  const isReadingConcept = currentStep?.kind === "concept" && currentStep?.href;

  return (
    <section aria-label="Sesión de hoy" className="w-full">
      <div className="flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-raised p-5 shadow-sm sm:p-6 motion-reduce:shadow-none">
        {/* Header: Kicker de actividad + Métricas de la sesión */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-caption font-semibold tracking-wider uppercase text-primary">
              {allDone
                ? "Sesión completada"
                : isMidSession
                  ? "Continuar donde lo dejaste"
                  : "Sesión de hoy"}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-heading text-h2 font-bold text-fg">
                {allDone ? "¡Todo listo por hoy!" : stepTitle}
              </h2>
              {!allDone ? (
                <Badge
                  label={`Actividad ${activeStepIndex + 1} de ${steps.length}`}
                  variant={isMidSession ? "info" : "default"}
                  dot={isMidSession}
                  size="sm"
                />
              ) : (
                <Badge label="Completado" variant="success" dot size="sm" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 font-body-sm font-medium tabular-nums text-fg-muted">
            <span className="rounded-full bg-surface-sunken px-3 py-1 font-caption font-semibold text-fg">
              {completedCount}/{steps.length} actividades
            </span>
            <span>·</span>
            <span>{totalMinutes > 0 ? totalMinutes : 36} min total</span>
          </div>
        </div>

        {/* Subtítulo y Metadatos de la actividad hero */}
        {!allDone && (stepSubtitle || metaText || currentStepMinutes) ? (
          <p className="-mt-2 font-body-sm text-fg-muted text-pretty">
            {[
              stepSubtitle,
              metaText,
              currentStepMinutes ? `${currentStepMinutes} min` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}

        {/* Botón Principal de Acción (CTA) de la pantalla */}
        {!allDone && currentStep ? (
          <div className="pt-1">
            {isReadingConcept ? (
              <Link
                href={currentStep.href!}
                className="focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-cta-bg py-3 px-6 text-center font-label text-body-sm font-semibold text-cta-fg shadow-sm transition-colors hover:bg-cta-bg-hover sm:w-auto"
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={18} aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleStartCurrentStep}
                className="press-feedback focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-cta-bg py-3 px-6 text-center font-label text-body-sm font-semibold text-cta-fg shadow-sm transition-colors hover:bg-cta-bg-hover sm:w-auto"
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={18} aria-hidden />
              </button>
            )}
          </div>
        ) : null}

        {/* Desplegable de Actividades Secundarias del Día */}
        {steps.length > 1 ? (
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <button
              type="button"
              onClick={() => setShowSecondarySteps((prev) => !prev)}
              aria-expanded={showSecondarySteps}
              className="press-feedback focus-ring inline-flex items-center justify-between w-full py-1 text-left font-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              <span>
                {showSecondarySteps
                  ? "Ocultar lista de actividades"
                  : `Ver todas las actividades de hoy (${steps.length})`}
              </span>
              {showSecondarySteps ? (
                <ChevronUp size={18} aria-hidden />
              ) : (
                <ChevronDown size={18} aria-hidden />
              )}
            </button>

            {showSecondarySteps ? (
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
                        <span className="truncate">
                          {localizeDailyStepTitle(step.title)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 font-caption text-success font-semibold">
                            <Check size={14} aria-hidden /> Hecho
                          </span>
                        ) : (
                          <span className="font-caption tabular-nums text-fg-muted">
                            {step.estMinutes} min
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
