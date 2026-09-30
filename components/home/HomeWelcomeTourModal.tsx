"use client";

// Planned structure:
// <HomeWelcomeTourModal>
//   <BackdropOverlay />
//   <ModalContainer>
//     <Header: kicker, stepIndicatorPills (1-4), title, closeBtn />
//     <StepContent: Step1Welcome | Step2Level | Step3AppMap | Step4FirstMission />
//     <FooterActions: BackBtn / SkipBtn, NextBtn / StartPracticeBtn />
//   </ModalContainer>
// </HomeWelcomeTourModal>

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/icons";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { markWelcomeTourCompleted } from "@/lib/home/onboarding";
import type { CefrLevel } from "@/lib/essential-words/types";
import OnboardingStep1Welcome from "./onboarding/OnboardingStep1Welcome";
import OnboardingStep2Level from "./onboarding/OnboardingStep2Level";
import OnboardingStep3AppMap from "./onboarding/OnboardingStep3AppMap";
import OnboardingStep4FirstMission from "./onboarding/OnboardingStep4FirstMission";

export interface HomeWelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLevelSelected?: (level: CefrLevel) => void;
  onStartPractice?: () => void;
}

const STEP_TITLES: Record<number, string> = {
  1: "Bienvenida",
  2: "Tu nivel",
  3: "Funciones de la app",
  4: "Primera misión",
};

export default function HomeWelcomeTourModal({
  isOpen,
  onClose,
  onLevelSelected,
  onStartPractice,
}: HomeWelcomeTourModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("A1");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedLevel(readGuestStudyLevel());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleFinish();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSelectLevel(level: CefrLevel) {
    setSelectedLevel(level);
    saveGuestStudyLevel(level);
    onLevelSelected?.(level);
  }

  function handleFinish() {
    saveGuestStudyLevel(selectedLevel);
    markWelcomeTourCompleted();
    onClose();
  }

  function handleStartPracticeAction() {
    handleFinish();
    if (onStartPractice) {
      onStartPractice();
    } else {
      router.push("/daily");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-raised text-fg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con barra de progreso de 4 pasos */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4 shrink-0 bg-surface-raised">
          <div className="flex items-center gap-3">
            {/* Indicadores de 4 píldoras de progreso */}
            <div className="flex items-center gap-1.5" aria-label={`Paso ${step} de 4`}>
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === step
                      ? "w-8 bg-primary"
                      : i < step
                        ? "w-3 bg-primary/40"
                        : "w-3 bg-border-subtle"
                  )}
                />
              ))}
            </div>

            <span className="text-caption font-bold text-fg-subtle uppercase tracking-wider pl-1">
              Paso {step} de 4 <span className="text-border-strong font-normal">·</span> {STEP_TITLES[step]}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            aria-label="Cerrar tour"
            className="rounded-full p-2 text-fg-subtle hover:bg-surface-sunken hover:text-fg transition-colors cursor-pointer"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Contenido principal según el paso activo */}
        <div className="p-6 sm:p-8 overflow-y-auto min-h-[380px] flex flex-col justify-center">
          {step === 1 && <OnboardingStep1Welcome />}
          {step === 2 && (
            <OnboardingStep2Level
              selectedLevel={selectedLevel}
              onSelectLevel={handleSelectLevel}
              onFinishTour={handleFinish}
            />
          )}
          {step === 3 && <OnboardingStep3AppMap />}
          {step === 4 && <OnboardingStep4FirstMission />}
        </div>

        {/* Footer de navegación */}
        <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4 bg-surface-base shrink-0">
          {step > 1 ? (
            <Button variant="secondary" size="md" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
              ← Atrás
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="text-body-sm text-fg-subtle hover:text-fg font-medium transition-colors cursor-pointer"
            >
              Saltar introducción
            </button>
          )}

            {step < 4 ? (
              <Button variant="primary" size="md" onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}>
                Siguiente →
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleStartPracticeAction}>
                Empezar a practicar →
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
