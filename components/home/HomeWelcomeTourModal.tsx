"use client";

// Planned structure:
// <HomeWelcomeTourModal>
//   <BackdropOverlay />
//   <ModalContainer>
//     <Header: kicker, title, closeBtn, progressIndicator />
//     <StepContent: Step1Welcome | Step2LevelSelect | Step3AppMap />
//     <FooterActions: BackBtn, NextBtn / FinishBtn />
//   </ModalContainer>
// </HomeWelcomeTourModal>

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "@/components/icons";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { readGuestStudyLevel, saveGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import { markWelcomeTourCompleted } from "@/lib/home/onboarding";
import type { CefrLevel } from "@/lib/essential-words/types";
import { CEFR_OPTIONS, STEP_1_FEATURES, STEP_3_AREAS } from "./welcome-tour-data";

export interface HomeWelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLevelSelected?: (level: CefrLevel) => void;
}

export default function HomeWelcomeTourModal({
  isOpen,
  onClose,
  onLevelSelected,
}: HomeWelcomeTourModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised text-fg shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-caption text-primary font-semibold tracking-wider uppercase">
              Paso {step} de 3
            </span>
            <span className="text-border-default" aria-hidden>·</span>
            <span className="text-caption text-fg-subtle">
              {step === 1 ? "Introducción" : step === 2 ? "Nivel de partida" : "Mapa de la app"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            aria-label="Cerrar tour"
            className="rounded-[var(--radius-sm)] p-1.5 text-fg-subtle hover:bg-surface-sunken hover:text-fg transition-colors"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="font-mono text-caption text-fg-subtle uppercase">Bienvenida</p>
                <h2 id="tour-modal-title" className="text-h3 font-bold text-fg">
                  Domina la pronunciación del inglés
                </h2>
                <p className="text-body-sm text-fg-muted">
                  English Journal es tu espacio de práctica para entrenar el oído, los fonemas clave (IPA) y hablar con mayor seguridad.
                </p>
              </div>

              <div className="grid gap-3 pt-2">
                {STEP_1_FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                        <Icon size={18} aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-body-sm font-semibold text-fg">{item.title}</h3>
                        <p className="text-caption text-fg-muted">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="font-mono text-caption text-fg-subtle uppercase">Personalización</p>
                <h2 id="tour-modal-title" className="text-h3 font-bold text-fg">
                  ¿Cuál es tu nivel aproximado?
                </h2>
                <p className="text-body-sm text-fg-muted">
                  Adaptamos la ruta de cursos y vocabulario. Puedes cambiarlo cuando quieras en tu Perfil.
                </p>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {CEFR_OPTIONS.map((opt) => {
                  const isSelected = selectedLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectLevel(opt.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-[var(--radius-md)] border transition-all flex items-start justify-between gap-3",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border-subtle bg-surface-sunken hover:border-border-default",
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className={cn("text-body-sm font-semibold", isSelected ? "text-primary" : "text-fg")}>{opt.title}</p>
                        <p className="text-caption text-fg-muted">{opt.desc}</p>
                      </div>
                      <div className={cn(
                        "size-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                        isSelected ? "border-primary bg-primary text-primary-fg" : "border-border-default bg-surface-base",
                      )}>
                        {isSelected && <Check size={12} strokeWidth={3} aria-hidden />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-caption text-fg-subtle pt-1">
                ¿No estás seguro de tu nivel?{" "}
                <Link
                  href="/assessment?mode=placement"
                  onClick={handleFinish}
                  className="font-medium text-primary hover:underline"
                >
                  Haz la prueba de nivelación
                </Link>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="font-mono text-caption text-fg-subtle uppercase">Navegación</p>
                <h2 id="tour-modal-title" className="text-h3 font-bold text-fg">
                  Dónde encontrar cada función
                </h2>
                <p className="text-body-sm text-fg-muted">
                  Estas son las 3 áreas clave que utilizarás a diario:
                </p>
              </div>

              <div className="grid gap-3">
                {STEP_3_AREAS.map((area) => {
                  const Icon = area.icon;
                  return (
                    <div key={area.title} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3">
                      <div className="p-2 rounded-md bg-accent-soft text-accent shrink-0">
                        <Icon size={18} aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-body-sm font-semibold text-fg">{area.title}</h3>
                        <p className="text-caption text-fg-muted">{area.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4 bg-surface-base">
          {step > 1 ? (
            <Button variant="secondary" size="sm" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Atrás
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="text-caption text-fg-subtle hover:text-fg font-medium transition-colors"
            >
              Saltar tour
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button variant="primary" size="sm" onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}>
                {step === 2 ? `Continuar con ${selectedLevel}` : "Siguiente"}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleFinish}>
                Comenzar a practicar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
