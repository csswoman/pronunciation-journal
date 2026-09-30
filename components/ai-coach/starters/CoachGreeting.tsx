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
    <header className="mb-4 w-full @[22rem]:mb-5 @[28rem]:mb-6">
      <PastelCard
        tone="mint"
        className="relative flex flex-col items-start gap-4 overflow-hidden p-4.5 @[28rem]:flex-row @[28rem]:items-center @[28rem]:gap-6 @[28rem]:p-7"
      >
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-raised p-2 shadow-xs border border-border-subtle @[28rem]:size-20">
          <Illustration className="h-10 w-auto text-ink @[28rem]:h-14" aria-hidden />
        </div>

        <div className="layout-stack-tight relative z-10 min-w-0 flex-1">
          <span className="font-kicker block text-xs font-semibold uppercase tracking-wider text-ink-muted">
            TU COACH
          </span>
          <h2 className="m-0 font-display text-lg font-extrabold tracking-tight text-ink @[28rem]:text-2xl">
            ¡Hola! ¿De qué te gustaría hablar hoy?
          </h2>
          <p className="m-0 text-pretty text-xs leading-relaxed text-ink-secondary @[28rem]:text-sm">
            Elige una opción para romper el hielo o escribe tu mensaje abajo.
          </p>
        </div>

        <Sparkles className="absolute top-3 right-3 size-4 text-ink-muted/30 pointer-events-none @[28rem]:top-4 @[28rem]:right-4 @[28rem]:size-5" aria-hidden />
        <Sparkles className="absolute bottom-3 right-6 size-3 text-ink-muted/20 pointer-events-none @[28rem]:bottom-4 @[28rem]:right-8 @[28rem]:size-4" aria-hidden />
      </PastelCard>
    </header>
  );
}
