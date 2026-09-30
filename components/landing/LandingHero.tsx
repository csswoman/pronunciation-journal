// Planned structure:
// <LandingHero>
//   <PastelCard tone="sky">
//     decorative vector wave
//     copy column (kicker, Bricolage H1, description, CTA row, guest note)
//     <LandingHeroCard />
"use client";

import Link from "next/link";
import PastelCard from "@/components/layout/PastelCard";
import { LandingHeroCard } from "@/components/landing/LandingHeroCard";

export function LandingHero() {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    } else {
      window.location.href = `/landing#${id}`;
    }
  };

  return (
    <section aria-labelledby="hero-title" className="w-full">
      <PastelCard
        tone="sky"
        className="relative overflow-hidden p-8 sm:p-12 lg:p-16 rounded-3xl"
      >
        {/* Soft decorative bottom-left sketch curve */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-48 text-black/10"
          viewBox="0 0 200 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M 0 90 Q 60 50, 110 85 T 200 80" />
          <path d="M -10 105 Q 50 65, 100 100 T 190 95" />
        </svg>

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Copy Column */}
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center rounded-full bg-black px-3.5 py-1 font-mono text-xs font-semibold tracking-widest uppercase text-white shadow-2xs">
              Pronunciación · A1 a C2
            </span>

            <h1
              id="hero-title"
              className="mt-5 text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl lg:leading-[1.04]"
            >
              Lees inglés
              <br />
              sin problema.
              <br />
              Ahora que te
              <br />
              entiendan.
            </h1>

            <p className="mt-6 max-w-[50ch] text-pretty text-base text-ink-secondary sm:text-lg sm:leading-relaxed">
              Un diario de pronunciación que escucha cómo hablas, detecta qué
              sonido se te escapa y decide qué practicas mañana. Sin mascotas,
              sin vidas, sin premios vacíos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-95 sm:text-base font-display focus-ring"
              >
                Empezar en 5 minutos
                <span aria-hidden="true">→</span>
              </Link>

              <a
                href="#como-funciona"
                onClick={(e) => handleNavClick(e, "como-funciona")}
                className="rounded-full border border-black/25 px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-black/5 active:scale-95 sm:text-base focus-ring cursor-pointer"
              >
                Ver cómo funciona
              </a>
            </div>

            <p className="mt-5 text-xs text-ink-muted sm:text-sm leading-normal">
              Entras como invitado. Si te sirve, guardas tu progreso después.
            </p>
          </div>

          {/* Word Specimen Card */}
          <LandingHeroCard />
        </div>
      </PastelCard>
    </section>
  );
}
