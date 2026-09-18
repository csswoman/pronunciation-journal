"use client";

// Structure:
// <HomeHeroCard>
//   <HeroContentRow>
//     <MainContent>
//       <HeroHeader>
//         <KickerAndTitle />
//         <SessionMetrics />
//       </HeroHeader>
//       <SubTitleAndMeta />
//       <PedagogicalContextBanner />
//       <PrimaryCTA />
//     </MainContent>
//     <RightIllustration />
//   </HeroContentRow>
//   <SubordinateStepListToggle />
// </HomeHeroCard>

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import type { DailyStep, DailyStepStatus } from "@/hooks/useDailyPlan";
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from "@/lib/daily/localize-step-copy";
import { stepMeta } from "@/components/daily/daily-step-list-helpers";
import type { SessionArc } from "@/lib/practice/types";
import { PedagogicalContextBanner } from "@/components/daily/PedagogicalContextBanner";
import { getIllustration } from "@/lib/illustrations/registry";
import { getHeroIllustrationKey } from "@/lib/home/hero-illustration";
import HomeHeroStepList from "@/components/home/HomeHeroStepList";

interface HomeHeroCardProps {
  steps: DailyStep[];
  getStepStatus: (stepId: string) => DailyStepStatus;
  completedCount: number;
  allDone: boolean;
  onStartStep: (step: DailyStep) => void;
  inProgressStepId?: string | null;
  primaryActionHref?: string;
  arc?: SessionArc;
  needsPlacement?: boolean;
  needsPronunciation?: boolean;
}

export default function HomeHeroCard({
  steps,
  getStepStatus,
  allDone,
  onStartStep,
  inProgressStepId = null,
  arc,
  needsPlacement = false,
  needsPronunciation = false,
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

  const isRequiredStep = (s: DailyStep) =>
    s.id !== "journal_entry" && s.href !== "/journal";
  const requiredSteps = steps.filter(isRequiredStep);
  const requiredCount = requiredSteps.length;
  const isCurrentOptional = currentStep ? !isRequiredStep(currentStep) : false;
  const currentRequiredIndex = currentStep
    ? requiredSteps.findIndex((s) => s.id === currentStep.id)
    : 0;

  const totalMinutes = steps.reduce((sum, s) => sum + (s.estMinutes || 0), 0);

  const stepTitle = currentStep
    ? localizeDailyStepTitle(currentStep.title)
    : "Sesión diaria";
  const stepSubtitle = currentStep
    ? localizeDailyStepSubtitle(currentStep.subtitle)
    : "";
  const metaText = currentStep ? stepMeta(currentStep) : null;
  const currentStepMinutes = currentStep?.estMinutes ?? 7;

  const ctaLabel = isMidSession
    ? `Continuar · ${currentStepMinutes} min`
    : `Empezar · ${currentStepMinutes} min`;

  const handleStartCurrentStep = () => {
    if (!currentStep) return;
    if (currentStep.kind === "concept" && currentStep.href) {
      return;
    }
    onStartStep(currentStep);
  };

  const isReadingConcept = currentStep?.kind === "concept" && currentStep?.href;

  const illustrationKey = getHeroIllustrationKey(currentStep, allDone);
  const HeroIllustration = getIllustration(illustrationKey);

  return (
    <section aria-label="Sesión de hoy" className="w-full">
      <PastelCard tone="sky" className="flex flex-col gap-5 p-5 sm:p-6 motion-reduce:shadow-none">
        {/* Contenido principal superior (Texto + Ilustración a la derecha) */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-4 min-w-0 flex-1">
            {/* Header: Kicker de actividad con chip + Métricas de la sesión */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 font-sans text-caption font-bold text-paper select-none">
                  {allDone
                    ? "Sesión completada"
                    : isMidSession
                      ? "Sesión en curso"
                      : "Sesión de hoy"}
                </span>
                {!allDone ? (
                  <span className="inline-flex items-center rounded-full border border-ink/40 bg-transparent px-3 py-1 font-sans text-caption font-medium text-ink select-none">
                    {isCurrentOptional
                      ? "Actividad opcional"
                      : `Actividad ${Math.max(1, currentRequiredIndex + 1)} de ${requiredCount}`}
                  </span>
                ) : null}
                {isMidSession && !allDone ? (
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 font-sans text-caption font-bold text-on-primary select-none">
                    En curso
                  </span>
                ) : null}
              </div>
              <h2 className="font-heading text-h1 font-bold text-ink text-balance">
                {allDone ? "¡Todo listo por hoy!" : stepTitle}
              </h2>
            </div>

            {/* Subtítulo y Metadatos de la actividad hero */}
            {!allDone && (stepSubtitle || metaText || currentStepMinutes) ? (
              <p className="font-body-sm text-ink-secondary text-pretty">
                {[
                  stepSubtitle,
                  metaText,
                  currentStepMinutes ? `${currentStepMinutes} min` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}

            {/* Contexto pedagógico del foco del día */}
            {!allDone && <PedagogicalContextBanner arc={arc} />}

            {/* Botón Principal de Acción (CTA) de la pantalla */}
            {!allDone && currentStep ? (
              <div className="pt-1">
                {isReadingConcept ? (
                  <Link
                    href={currentStep.href!}
                    className="focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent py-3.5 px-7 text-center font-label text-body font-semibold text-on-accent shadow-sm transition-colors hover:bg-primary-hover sm:w-auto"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight size={18} aria-hidden />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCurrentStep}
                    className="press-feedback focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-accent py-3.5 px-7 text-center font-label text-body font-semibold text-on-accent shadow-sm transition-colors hover:bg-primary-hover sm:w-auto"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight size={18} aria-hidden />
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Ilustración de lado derecho */}
          <div
            className="hidden sm:flex shrink-0 items-center justify-center self-center p-2 text-ink opacity-90 transition-opacity hover:opacity-100 [&>svg]:h-28 md:[&>svg]:h-32 [&>svg]:w-auto select-none"
            aria-hidden="true"
            data-testid="hero-illustration"
          >
            <HeroIllustration />
          </div>
        </div>

        {/* Lista de actividades: 2 visibles por defecto, expandible a todas */}
        {steps.length > 0 ? (
          <div className="pastel-card-panel flex flex-col gap-2 rounded-2xl p-3 shadow-sm sm:p-4">
            <HomeHeroStepList
              steps={steps}
              getStepStatus={getStepStatus}
              activeStepIndex={activeStepIndex}
              needsPlacement={needsPlacement}
              needsPronunciation={needsPronunciation}
              isExpanded={showSecondarySteps || steps.length <= 2}
              onStartStep={onStartStep}
            />

            {steps.length > 2 ? (
              <button
                type="button"
                onClick={() => setShowSecondarySteps((prev) => !prev)}
                aria-expanded={showSecondarySteps}
                className="press-feedback focus-ring inline-flex items-center justify-between w-full pt-1 pb-0.5 text-left font-body-sm font-medium text-ink-secondary transition-colors hover:text-ink"
              >
                <span>
                  {showSecondarySteps
                    ? "Ver menos actividades"
                    : `Ver todas las actividades (${steps.length}) · ${totalMinutes} min`}
                </span>
                {showSecondarySteps ? (
                  <ChevronUp size={18} aria-hidden />
                ) : (
                  <ChevronDown size={18} aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        ) : null}
      </PastelCard>
    </section>
  );
}

