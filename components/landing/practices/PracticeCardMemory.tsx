// Planned structure:
// <PracticeCardMemory>
//   PastelCard (mint)
//   Icon kicker header, Bricolage title, concise description
//   Inner memory progress breakdown white card
import PastelCard from "@/components/layout/PastelCard";
import { Brain } from "lucide-react";

export function PracticeCardMemory() {
  return (
    <PastelCard tone="mint" className="flex flex-col justify-between gap-5 p-6 sm:p-7">
      <div>
        {/* Header Icon + Kicker */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10 text-black select-none dark:bg-white/10 dark:text-white">
            <Brain className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-secondary">
            Memoria
          </span>
        </div>

        <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-snug">
          Cuatro memorias, no una.
        </h3>

        <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary text-pretty">
          Cada aspecto del idioma se repasa por separado y a su propio ritmo.
        </p>

        {/* 4 Memory Tracks Card */}
        <div className="mt-5 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xs">
          <div className="flex flex-col gap-3">
            {/* Track 1 */}
            <div>
              <div className="flex items-center justify-between font-sans text-xs font-bold text-neutral-800">
                <span>Vocabulario</span>
                <span className="font-mono text-[10px] font-semibold text-neutral-400">
                  hoy
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[78%] rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Track 2 */}
            <div>
              <div className="flex items-center justify-between font-sans text-xs font-bold text-neutral-800">
                <span>Sonidos</span>
                <span className="font-mono text-[10px] font-semibold text-neutral-400">
                  hoy
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[42%] rounded-full bg-rose-400" />
              </div>
            </div>

            {/* Track 3 */}
            <div>
              <div className="flex items-center justify-between font-sans text-xs font-bold text-neutral-800">
                <span>Gramática</span>
                <span className="font-mono text-[10px] font-semibold text-neutral-400">
                  mañana
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[55%] rounded-full bg-sky-400" />
              </div>
            </div>

            {/* Track 4 */}
            <div>
              <div className="flex items-center justify-between font-sans text-xs font-bold text-neutral-800">
                <span>Errores que repites</span>
                <span className="font-mono text-[10px] font-semibold text-neutral-400">
                  hoy
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full w-[25%] rounded-full bg-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PastelCard>
  );
}
