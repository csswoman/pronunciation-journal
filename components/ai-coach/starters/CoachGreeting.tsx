"use client";

import LiquidOrb from "../LiquidOrb";

// Planned structure:
// <CoachGreeting>
//   <LiquidOrb />
//   <h2> / <p>
// </CoachGreeting>

export default function CoachGreeting() {
  return (
    <header className="mb-5 flex flex-col items-center gap-3 text-center @[22rem]:mb-6">
      <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-primary-soft p-1.5 shadow-sm border border-primary/20">
        <LiquidOrb size={76} intensity="idle" />
      </div>
      <div className="layout-stack-tight max-w-prose">
        <h2 className="m-0 flex items-center justify-center gap-2 text-balance text-h3 text-fg font-semibold tracking-tight">
          ¡Hola! ¿De qué te gustaría hablar hoy?
        </h2>
        <p className="m-0 text-pretty text-caption leading-relaxed text-fg-muted">
          Elige una opción para romper el hielo o escribe tu mensaje abajo.
        </p>
      </div>
    </header>
  );
}
