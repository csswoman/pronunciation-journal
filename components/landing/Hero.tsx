// Planned structure:
// <Hero>
//   96px Header bar (Logo, links, ThemeToggle, sign in & test buttons)
//   Sky pastel Hero card (2-col grid: copy column + ExerciseShowcase)
//   4-card stats row below (Superficie cards with Bricolage 46px numbers)
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ExerciseShowcase } from "@/components/landing/ExerciseShowcase";

const STATS = [
  { value: "2.800", label: "palabras con su forma débil real" },
  { value: "110", label: "sonidos con audio de referencia" },
  { value: "66", label: "mini lecciones de A1 a C2" },
  { value: "276", label: "mazos de patrones gramaticales" },
] as const;

export function Hero() {
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
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      {/* 1. Header (96px height) */}
      <header className="mx-auto flex h-[96px] w-full max-w-[1440px] items-center justify-between px-5 sm:px-[40px]">
        {/* Brand Mark */}
        <Link
          href="/landing"
          className="flex items-center gap-3 transition-opacity hover:opacity-90 focus-ring"
        >
          <span
            aria-hidden="true"
            className="font-display flex size-10 items-center justify-center rounded-full bg-[var(--butter)] text-sm font-extrabold text-[var(--ink)] select-none"
          >
            Aa
          </span>
          <span className="font-display text-[19px] font-extrabold tracking-tight text-[var(--text)]">
            English Journal
          </span>
        </Link>

        {/* Right Nav Options */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#como-funciona"
            onClick={(e) => handleNavClick(e, "como-funciona")}
            className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)] sm:inline-block cursor-pointer"
          >
            Cómo funciona
          </a>
          <a
            href="#que-incluye"
            onClick={(e) => handleNavClick(e, "que-incluye")}
            className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)] sm:inline-block cursor-pointer"
          >
            Qué incluye
          </a>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-full border border-[var(--border-strong)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface)] focus-ring"
          >
            Entrar
          </Link>

          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-neutral-100 active:scale-95 focus-ring"
          >
            Probar sin cuenta
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-[40px] sm:pb-24">
        {/* 2. Hero Card (Sky pastel background, rounded 28px) */}
        <section
          aria-labelledby="hero-title"
          className="relative w-full overflow-hidden rounded-[28px] bg-[var(--sky)] p-8 text-[var(--ink)] sm:p-12 lg:p-[64px]"
        >
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-[56px]">
            {/* Left Copy Column */}
            <div className="flex flex-col items-start gap-[28px]">
              {/* Overline Chip */}
              <span className="inline-flex rounded-full bg-[var(--ink)] px-3.5 py-1 font-mono text-[12px] font-bold tracking-[0.14em] text-white uppercase shadow-2xs">
                PRONUNCIACIÓN · A1 A C2
              </span>

              {/* Title H1 */}
              <h1
                id="hero-title"
                className="font-display text-4xl font-extrabold tracking-[-0.03em] text-[var(--ink)] sm:text-5xl lg:text-[64px] lg:leading-[1.08]"
              >
                Lees inglés sin problema.
                <br />
                <span className="mt-2 inline-block w-fit rounded-2xl bg-[var(--butter)] px-3 py-1">
                  Ahora que te entiendan.
                </span>
              </h1>

              {/* Subtitle Description */}
              <p className="max-w-[540px] text-base font-normal text-[var(--ink-secondary)] sm:text-lg lg:text-[19px] leading-relaxed text-pretty">
                Un diario de pronunciación que escucha cómo hablas, detecta qué
                sonido se te escapa y decide qué practicas mañana.
              </p>

              {/* 3 Sky-Deep Chips */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[var(--sky-deep)] px-4 py-2 text-xs font-bold text-[var(--ink)] sm:text-sm">
                  Sin mascotas
                </span>
                <span className="rounded-full bg-[var(--sky-deep)] px-4 py-2 text-xs font-bold text-[var(--ink)] sm:text-sm">
                  Sin vidas
                </span>
                <span className="rounded-full bg-[var(--sky-deep)] px-4 py-2 text-xs font-bold text-[var(--ink)] sm:text-sm">
                  Sin premios vacíos
                </span>
              </div>

              {/* CTAs Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
                <Link
                  href="/login"
                  className="inline-flex h-[56px] items-center gap-2 rounded-full bg-[var(--ink)] px-7 font-display text-base font-bold text-white shadow-sm transition-all hover:bg-[var(--ink-secondary)] active:scale-95 focus-ring"
                >
                  Empezar en 5 minutos
                  <ArrowRight className="size-5" strokeWidth={2} />
                </Link>

                <a
                  href="#como-funciona"
                  onClick={(e) => handleNavClick(e, "como-funciona")}
                  className="text-base font-semibold text-[var(--ink)] underline underline-offset-4 transition-opacity hover:opacity-80 cursor-pointer"
                >
                  Ver cómo funciona
                </a>
              </div>

              {/* Microcopy */}
              <p className="text-xs text-[var(--ink-muted)] sm:text-[14px]">
                Entras como invitado. Si te sirve, guardas tu progreso después.
              </p>
            </div>

            {/* Right Column: Interactive Showcase */}
            <div className="w-full">
              <ExerciseShowcase />
            </div>
          </div>
        </section>

        {/* 3. 4 Stats Cards (Grid 4-columns) */}
        <div className="mt-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col justify-between rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-[28px]"
            >
              <span className="font-display text-[46px] font-extrabold tracking-[-0.03em] leading-tight text-[var(--text)]">
                {stat.value}
              </span>
              <p className="mt-2 text-[15px] font-medium text-[var(--text-muted)] leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
