"use client";

import { useState } from "react";
import { Lock, ChevronDown } from "@/components/icons";

interface HomeExtraExercisesAccordionProps {
  unlocked?: boolean;
}

export default function HomeExtraExercisesAccordion({
  unlocked = false,
}: HomeExtraExercisesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised transition-all">
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`focus-ring flex w-full items-center justify-between gap-4 p-5 text-left transition-opacity ${
          !unlocked ? "cursor-not-allowed opacity-75" : "hover:opacity-90"
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-fg-muted">
            <Lock size={16} aria-hidden />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-body-md font-bold text-fg">
              Ejercicios extra
            </span>
            <span className="font-body-sm text-fg-muted">
              {unlocked
                ? "Explora ejercicios adicionales de práctica"
                : "Se abren al terminar el plan de hoy"}
            </span>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-fg-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {isOpen && unlocked ? (
        <div className="border-t border-border-subtle p-5 pt-3">
          <p className="font-body-sm text-fg-muted">
            Aquí estarán tus ejercicios extra desbloqueados.
          </p>
        </div>
      ) : null}
    </div>
  );
}
