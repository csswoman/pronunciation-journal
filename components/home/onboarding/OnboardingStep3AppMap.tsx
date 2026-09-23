"use client";

// Planned structure:
// <OnboardingStep3AppMap>
//   <LeftColumn: kicker, title, description, profileHintCard />
//   <RightCardsGrid: 5 color-coded app area cards (Ruta, Palabras, Frases, Práctica oral, Progreso) />
// </OnboardingStep3AppMap>

import { Settings } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { STEP_3_APP_AREAS } from "../welcome-tour-data";

export default function OnboardingStep3AppMap() {
  const fullWidthArea = STEP_3_APP_AREAS.find((a) => a.fullWidth);
  const gridAreas = STEP_3_APP_AREAS.filter((a) => !a.fullWidth);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Columna izquierda: Descripción del sistema de colores de la app */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-caption text-fg-subtle tracking-wider uppercase font-semibold">
            El mapa
          </span>
          <h2 className="font-heading text-h2 font-extrabold text-fg tracking-tight leading-tight">
            Cinco lugares, un mismo objetivo.
          </h2>
          <p className="text-body-md text-fg-muted">
            Lecciones guiadas, vocabulario, frases reales, práctica oral y tu progreso — todo a un toque.
          </p>
        </div>

        {/* Tarjeta de perfil en la esquina inferior izquierda */}
        <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken p-4 flex items-start gap-3.5 mt-2">
          <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-primary shrink-0">
            <Settings size={20} aria-hidden />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-body-sm font-bold text-fg">Y en Perfil, lo tuyo</h3>
            <p className="text-caption text-fg-muted leading-relaxed">
              Cambia tu nivel, personaliza la app o crea una cuenta para no perder nada.
            </p>
          </div>
        </div>
      </div>

      {/* Columna derecha: Cuadrícula de 5 funciones por color */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        {/* Tarjeta superior completa (Ruta - Sky) */}
        {fullWidthArea && (
          <PastelCard
            key={fullWidthArea.id}
            tone={fullWidthArea.tone}
            className="p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-ink/10 text-ink shrink-0">
                <fullWidthArea.icon size={22} aria-hidden />
              </div>
              <div className="flex flex-col">
                <h3 className="font-heading text-body-md font-bold text-ink">{fullWidthArea.title}</h3>
                <p className="text-caption text-ink-secondary">{fullWidthArea.desc}</p>
              </div>
            </div>

            {fullWidthArea.badge && (
              <div className="hidden sm:flex flex-col gap-1.5 rounded-xl bg-paper/80 p-2.5 border border-ink/5 shrink-0 w-36">
                <span className="text-[11px] font-bold text-ink-muted text-center">{fullWidthArea.badge}</span>
                <div className="h-1.5 w-full rounded-full bg-ink/15 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-ink" />
                </div>
              </div>
            )}
          </PastelCard>
        )}

        {/* 4 Tarjetas secundarias en cuadrícula de 2x2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gridAreas.map((area) => {
            const Icon = area.icon;
            return (
              <PastelCard
                key={area.id}
                tone={area.tone}
                className="p-4 rounded-2xl flex items-start gap-3 shadow-xs"
              >
                <div className="p-2.5 rounded-xl bg-ink/10 text-ink shrink-0 mt-0.5">
                  <Icon size={20} aria-hidden />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h3 className="font-heading text-body-md font-bold text-ink">{area.title}</h3>
                  <p className="text-caption text-ink-secondary leading-snug">{area.desc}</p>
                </div>
              </PastelCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
