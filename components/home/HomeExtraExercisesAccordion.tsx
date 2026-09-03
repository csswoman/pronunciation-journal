"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "@/components/icons";

interface HomeExtraExercisesAccordionProps {
  unlocked?: boolean;
}

export default function HomeExtraExercisesAccordion({
  unlocked = false,
}: HomeExtraExercisesAccordionProps) {
  if (unlocked) {
    return (
      <section
        aria-label="Ejercicios extra"
        className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <h3 className="font-heading text-body-md font-bold text-fg px-1">Ejercicios extra</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/practice/sounds"
            className="group flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-base p-4 shadow-sm transition-colors hover:border-border-hover hover:bg-surface-raised"
          >
            <div className="flex items-center justify-between">
              <span className="font-label font-semibold text-fg">Laboratorio de Sonidos</span>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
            </div>
            <span className="font-body-sm text-fg-muted">Práctica intensiva de fonemas y contrastes</span>
          </Link>
          <Link
            href="/practice/word-search"
            className="group flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-base p-4 shadow-sm transition-colors hover:border-border-hover hover:bg-surface-raised"
          >
            <div className="flex items-center justify-between">
              <span className="font-label font-semibold text-fg">Buscador fonético</span>
              <ArrowRight size={16} className="text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
            </div>
            <span className="font-body-sm text-fg-muted">Busca palabras por su pronunciación</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Ejercicios adicionales bloqueados"
      className="rounded-xl border border-border-subtle bg-surface-raised transition-all"
    >
      <div className="flex w-full items-center justify-between gap-4 p-5 text-left opacity-80 select-none">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-fg-muted"
            aria-hidden
          >
            <Lock size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-body-md font-bold text-fg">
              Ejercicios extra
            </span>
            <span className="font-body-sm text-fg-muted">
              Se desbloquean al completar tu sesión de hoy
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
