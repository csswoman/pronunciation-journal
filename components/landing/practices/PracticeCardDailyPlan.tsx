// Planned structure:
// <PracticeCardDailyPlan>
//   PastelCard (butter)
//   Left column: icon kicker, Bricolage title, concise description, week streak, dark callout
//   Right column: "TU PLAN DE HOY" schedule card with 5 interactive step items
import PastelCard from "@/components/layout/PastelCard";
import { CalendarCheck, Check } from "lucide-react";

export function PracticeCardDailyPlan() {
  return (
    <PastelCard tone="butter" className="flex flex-col gap-5 lg:flex-row lg:gap-6 p-6 sm:p-7">
      {/* Left Column: Overview, Streak & Callout */}
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div>
          {/* Header Icon + Kicker */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10 text-black select-none dark:bg-white/10 dark:text-white">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-secondary">
              Plan diario
            </span>
          </div>

          <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-snug">
            Abres la app y tu sesión ya está hecha.
          </h3>

          <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary text-pretty">
            La app revisa tus memorias cada mañana y te arma una sesión
            personalizada de 10 a 15 minutos.
          </p>

          {/* Week Streak Tracker */}
          <div className="mt-4 rounded-2xl bg-white/45 p-3.5 dark:bg-black/10">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-ink-secondary">
              <span className="tracking-wider uppercase">
                Esta semana
              </span>
              <span className="inline-flex items-center gap-1 font-sans text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                misión oral
              </span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-1">
              {[
                { day: "L", state: "done" },
                { day: "M", state: "done" },
                { day: "X", state: "done" },
                { day: "J", state: "today" },
                { day: "V", state: "future-mission" },
                { day: "S", state: "future" },
                { day: "D", state: "future" },
              ].map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[10px] font-bold text-neutral-600">
                    {d.day}
                  </span>
                  {d.state === "done" && (
                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-black text-white">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                  {d.state === "today" && (
                    <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full border-2 border-black bg-white font-mono text-[10px] font-bold text-black shadow-xs">
                      hoy
                    </div>
                  )}
                  {d.state === "future-mission" && (
                    <div className="relative flex h-6.5 w-6.5 items-center justify-center rounded-full border border-black/20 bg-white">
                      <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-purple-500" />
                    </div>
                  )}
                  {d.state === "future" && (
                    <div className="h-6.5 w-6.5 rounded-full border border-black/20 bg-white" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Dark Box */}
        <div className="rounded-2xl bg-[var(--ink)] p-3.5 text-white shadow-xs">
          <p className="font-display text-xs sm:text-sm font-bold">Nada que decidir.</p>
          <p className="mt-0.5 font-sans text-xs leading-relaxed text-neutral-300">
            Si ayer fallaste la concordancia en tu diario, hoy toca repararla.
          </p>
        </div>
      </div>

      {/* Right Column: "TU PLAN DE HOY" Schedule Card */}
      <div className="flex flex-1 flex-col justify-between rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold tracking-wider uppercase text-neutral-800">
            Tu plan de hoy
          </span>
          <span className="rounded-full bg-amber-100 border border-amber-200/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-900">
            10–15 min
          </span>
        </div>

        <div className="mt-3 flex flex-col divide-y divide-neutral-100">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-[11px] font-bold text-emerald-900">
              1
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="font-sans text-xs font-bold text-neutral-900">Repaso de vocabulario</p>
                <p className="font-sans text-[11px] text-neutral-500">Palabras que tocan hoy.</p>
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                MEMORIA
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 font-mono text-[11px] font-bold text-rose-900">
              2
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="font-sans text-xs font-bold text-neutral-900">Tu sonido más débil</p>
                <p className="text-[11px] text-neutral-500 font-ipa">
                  ship /ɪ/ frente a sheep /iː/
                </p>
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                OÍDO
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-[11px] font-bold text-emerald-900">
              3
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="font-sans text-xs font-bold text-neutral-900">Reparar un error</p>
                <p className="font-sans text-[11px] text-neutral-500">
                  Concordancia de tu diario.
                </p>
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                MEMORIA
              </span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 font-mono text-[11px] font-bold text-purple-900">
              4
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="font-sans text-xs font-bold text-neutral-900">Misión oral</p>
                <p className="font-sans text-[11px] text-neutral-500">
                  Negociar una fecha límite.
                </p>
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                HABLA
              </span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-center gap-2.5 py-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 font-mono text-[11px] font-bold text-sky-900">
              5
            </div>
            <div className="flex flex-1 items-center justify-between gap-2">
              <div>
                <p className="font-sans text-xs font-bold text-neutral-900">Lectura</p>
                <p className="font-sans text-[11px] text-neutral-500">
                  Texto con tu vocabulario.
                </p>
              </div>
              <span className="font-mono text-[9px] font-bold tracking-wider text-neutral-400 uppercase">
                LECTURA
              </span>
            </div>
          </div>
        </div>
      </div>
    </PastelCard>
  );
}
