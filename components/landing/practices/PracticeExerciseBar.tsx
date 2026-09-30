// Planned structure:
// <PracticeExerciseBar>
//   Horizontal bar container
//   Left side: "OCHO FORMATOS DE EJERCICIO" kicker + grid of 8 pill buttons
//   Right side: Purple card "La IA explica los errores. No los califica."
import { Sparkles } from "lucide-react";
import { LANDING_EXERCISE_MODES } from "@/lib/landing/content";

export function PracticeExerciseBar() {
  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-black/5 bg-white p-6 shadow-xs dark:border-[var(--border)] dark:bg-[var(--surface-raised)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      {/* Left side: 8 Exercise modes */}
      <div className="flex flex-1 flex-col gap-3.5">
        <span className="font-mono text-xs sm:text-sm font-bold tracking-widest uppercase text-[var(--text-tertiary)]">
          Ocho formatos de ejercicio
        </span>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {LANDING_EXERCISE_MODES.map((mode) => (
            <li
              key={mode}
              className="flex items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50 px-3.5 py-2.5 text-center text-xs sm:text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100"
            >
              {mode}
            </li>
          ))}
        </ul>
      </div>

      {/* Right side: AI Explanation banner */}
      <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-purple-200/80 bg-purple-100/70 p-4.5 dark:border-purple-900/60 dark:bg-purple-950/40 lg:max-w-xs">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-900 text-purple-100 shadow-xs dark:bg-purple-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-purple-950 dark:text-purple-100 leading-tight">
            La IA explica los errores. No los califica.
          </p>
          <p className="mt-1 text-xs sm:text-sm text-purple-800/90 dark:text-purple-300/90 leading-snug">
            El resultado no depende del humor del modelo.
          </p>
        </div>
      </div>
    </div>
  );
}
