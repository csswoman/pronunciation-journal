"use client";

// Planned structure:
// <TriageSummary>
//   <SummaryHeader />
//   <SummaryStatsGrid />
//   <SummaryActions />
// </TriageSummary>

import Link from "next/link";
import { Check, RotateCcw, ArrowRight } from "@/components/icons";
import Button from "@/components/ui/Button";

interface TriageSummaryProps {
  counts: { known: number; skipped: number };
  onResetOrChangeLevels: () => void;
}

export function TriageSummary({ counts, onResetOrChangeLevels }: TriageSummaryProps) {
  const total = counts.known + counts.skipped;

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-surface-raised border border-border-default gap-6">
      {/* Icon & Title */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center size-16 rounded-2xl bg-success/15 text-success">
          <Check size={32} />
        </div>
        <h2 className="text-h2 font-extrabold text-fg tracking-tight m-0">
          ¡Revisión completada!
        </h2>
        <p className="text-sm text-fg-muted max-w-xs m-0">
          Has revisado {total} {total === 1 ? "palabra" : "palabras"} de los niveles seleccionados.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="p-4 rounded-2xl bg-surface-sunken border border-border-subtle flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-success">
            {counts.known}
          </span>
          <span className="text-xs font-semibold text-fg-muted mt-1">
            Marcadas como familiares
          </span>
          <span className="text-[11px] text-fg-subtle">
            Verificación desde el día 4
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-sunken border border-border-subtle flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-primary">
            {counts.skipped}
          </span>
          <span className="text-xs font-semibold text-fg-muted mt-1">
            Pendientes de práctica
          </span>
          <span className="text-[11px] text-fg-subtle">
            En cola de estudio
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full pt-2">
        <Link href="/practice/essential-words" className="w-full">
          <Button variant="primary" className="w-full flex items-center justify-center gap-2 py-3">
            <span>Comenzar práctica</span>
            <ArrowRight size={16} />
          </Button>
        </Link>

        <button
          type="button"
          onClick={onResetOrChangeLevels}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors motion-reduce:transition-none cursor-pointer"
        >
          <RotateCcw size={16} />
          <span>Elegir otros niveles</span>
        </button>
      </div>
    </div>
  );
}
