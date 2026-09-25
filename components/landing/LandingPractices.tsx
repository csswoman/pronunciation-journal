// Planned structure:
// <LandingPractices>
//   Asymmetric Section Header (Kicker, Bricolage Title, Description)
//   Asymmetric 2x2 Bento Grid:
//     Row 1: PracticeCardPhonetics (Coral) + PracticeCardSpeaking (Lilac)
//     Row 2: PracticeCardMemory (Mint) + PracticeCardDailyPlan (Butter)
//   PracticeExerciseBar (8 exercise modes + IA note)
import { PracticeCardPhonetics } from "@/components/landing/practices/PracticeCardPhonetics";
import { PracticeCardSpeaking } from "@/components/landing/practices/PracticeCardSpeaking";
import { PracticeCardMemory } from "@/components/landing/practices/PracticeCardMemory";
import { PracticeCardDailyPlan } from "@/components/landing/practices/PracticeCardDailyPlan";
import { PracticeExerciseBar } from "@/components/landing/practices/PracticeExerciseBar";

export function LandingPractices() {
  return (
    <section id="que-incluye" aria-labelledby="practices-title" className="w-full">
      {/* Asymmetric Section Header */}
      <div className="flex flex-col gap-4">
        <span className="font-mono text-xs font-semibold tracking-widest text-[var(--text-tertiary)] uppercase">
          Qué incluye
        </span>
        <h2
          id="practices-title"
          className="text-balance font-display text-3xl font-extrabold tracking-tight text-[var(--text-strong)] sm:text-4xl lg:text-5xl lg:leading-[1.1]"
        >
          Cuatro pilares. Un solo perfil de tu voz.
        </h2>
        <p className="max-w-[65ch] text-pretty text-sm text-[var(--text-secondary)] sm:text-base leading-relaxed">
          Oyes lo que el español no te enseñó a oír, lo dices en voz alta, la
          app recuerda cada detalle y cada mañana te arma el plan.
        </p>
      </div>

      {/* Asymmetric 2x2 Bento Grid */}
      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12 sm:mt-12 sm:gap-6">
        {/* Row 1 */}
        <div className="lg:col-span-7">
          <PracticeCardPhonetics />
        </div>
        <div className="lg:col-span-5">
          <PracticeCardSpeaking />
        </div>

        {/* Row 2 */}
        <div className="lg:col-span-5">
          <PracticeCardMemory />
        </div>
        <div className="lg:col-span-7">
          <PracticeCardDailyPlan />
        </div>
      </div>

      {/* 8 Exercise Modes Horizontal Bar */}
      <div className="mt-6 sm:mt-8">
        <PracticeExerciseBar />
      </div>
    </section>
  );
}
