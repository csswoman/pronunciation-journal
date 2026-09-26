// Planned structure:
// <PracticeCardSpeaking>
//   PastelCard (lilac)
//   Icon kicker header, Bricolage title, concise description
//   Interactive rule-guided output demo white card
//   Bottom pills list (3 feature badges)
import PastelCard from "@/components/layout/PastelCard";
import { MessageSquareText } from "lucide-react";

export function PracticeCardSpeaking() {
  return (
    <PastelCard tone="lilac" className="flex flex-col justify-between gap-5 p-6 sm:p-7">
      <div>
        {/* Header Icon + Kicker */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/10 text-black select-none dark:bg-white/10 dark:text-white">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-ink-secondary">
            Habla
          </span>
        </div>

        <h3 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink leading-snug">
          Hablas desde el primer día.
        </h3>

        <p className="mt-2 font-sans text-xs sm:text-sm leading-relaxed text-ink-secondary text-pretty">
          Respondes con una regla obligatoria y la IA te explica qué falló.
        </p>

        {/* Demo White Card */}
        <div className="mt-5 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xs">
          <div className="inline-flex rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 font-mono text-[11px] font-bold text-purple-900 tracking-wide uppercase">
            Usa: present perfect + since
          </div>

          <p className="mt-2.5 font-sans text-xs sm:text-sm font-bold text-neutral-900">
            ¿Desde cuándo vives en tu ciudad?
          </p>

          <p className="mt-2 font-sans text-xs sm:text-sm font-medium text-neutral-800">
            I{" "}
            <span className="line-through text-neutral-400 font-normal mr-1">
              live
            </span>
            <span className="rounded bg-emerald-200 px-1.5 py-0.5 font-sans font-bold text-emerald-950 mr-1">
              &apos;ve lived
            </span>{" "}
            here since 2019.
          </p>

          <p className="mt-3 border-t border-neutral-100 pt-2 font-sans text-xs leading-relaxed text-neutral-500">
            Con <span className="font-bold text-neutral-800">since</span> la
            acción sigue hasta hoy: present perfect.
          </p>
        </div>
      </div>

      {/* Feature Badges Stack */}
      <ul className="flex flex-col gap-2">
        <li className="rounded-full bg-white/60 px-3.5 py-1.5 font-sans text-xs text-ink dark:bg-black/20">
          <span className="font-bold">Producción guiada</span> · regla gramatical
        </li>
        <li className="rounded-full bg-white/60 px-3.5 py-1.5 font-sans text-xs text-ink dark:bg-black/20">
          <span className="font-bold">Misiones orales</span> · 3 a 5 turnos
        </li>
        <li className="rounded-full bg-white/60 px-3.5 py-1.5 font-sans text-xs text-ink dark:bg-black/20">
          <span className="font-bold">Shadowing</span> · imitas al lector
        </li>
      </ul>
    </PastelCard>
  );
}
