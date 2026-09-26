"use client";

import PastelCard from "@/components/layout/PastelCard";
import { Sparkles } from "@/components/icons";
import { getIllustration } from "@/lib/illustrations/registry";

// Planned structure:
// <CoachGreeting>
//   <PastelCard tone="mint">
//     <IllustrationAvatar />
//     <GreetingTextStack />
//     <SparklesDecoration />
//   </PastelCard>
// </CoachGreeting>

export default function CoachGreeting() {
  const Illustration = getIllustration("categoryAi");

  return (
    <header className="mb-5 w-full @[22rem]:mb-6">
      <PastelCard
        tone="mint"
        className="relative flex flex-col items-start gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7 md:p-8"
      >
        <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-raised p-2 shadow-xs border border-border-subtle sm:size-20 md:size-24">
          <Illustration className="h-11 w-auto text-ink sm:h-14 md:h-16" aria-hidden />
        </div>

        <div className="layout-stack-tight relative z-10 min-w-0 flex-1">
          <span className="font-kicker block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            TU COACH
          </span>
          <h2 className="m-0 font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl md:text-3xl">
            ¡Hola! ¿De qué te gustaría hablar hoy?
          </h2>
          <p className="m-0 text-pretty text-xs leading-relaxed text-ink-secondary sm:text-sm">
            Elige una opción para romper el hielo o escribe tu mensaje abajo.
          </p>
        </div>

        <Sparkles className="absolute top-3 right-3 size-4 text-ink-muted/30 pointer-events-none sm:top-4 sm:right-4 sm:size-5" aria-hidden />
        <Sparkles className="absolute bottom-3 right-6 size-3 text-ink-muted/20 pointer-events-none sm:bottom-4 sm:right-8 sm:size-4" aria-hidden />
      </PastelCard>
    </header>
  );
}
