"use client";

// Planned structure:
// <HomeImmersionCard>
//   <Header (icon, title, hint)>
//   <Controls (category chips, minutes stepper, CTA button)>
// </HomeImmersionCard>

import { useState } from "react";
import { Clapperboard, Check } from "@/components/icons";
import Button from "@/components/ui/Button";

const IMMERSION_CATEGORIES = [
  { id: "video", label: "Video" },
  { id: "series", label: "Serie" },
  { id: "podcast", label: "Podcast" },
  { id: "reading", label: "Lectura" },
];

export default function HomeImmersionCard() {
  const [selectedCategory, setSelectedCategory] = useState("video");
  const [minutes, setMinutes] = useState(30);
  const [registered, setRegistered] = useState(false);

  const handleRegister = () => {
    setRegistered(true);
    setTimeout(() => setRegistered(false), 3000);
  };

  return (
    <section
      aria-label="Registrar inmersión"
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3.5 sm:p-4 shadow-xs"
    >
      {/* Header compacto */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-muted">
          <Clapperboard size={15} aria-hidden />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-body-sm font-semibold text-fg">
            Registrar inmersión
          </h2>
          <span className="text-caption text-fg-muted">
            ¿Viste algo en inglés hoy?
          </span>
        </div>
      </div>

      {/* Fila de controles: categorías + tiempo + acción */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
        {/* Chips de categoría */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Tipo de inmersión"
        >
          {IMMERSION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`focus-ring inline-flex h-8 items-center rounded-lg px-2.5 text-caption font-medium transition-all ${
                  isSelected
                    ? "border border-primary/25 bg-primary-soft text-primary font-semibold"
                    : "border border-border-subtle/60 bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Stepper de tiempo + Botón registrar */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center rounded-lg border border-border-subtle bg-surface-sunken px-1 font-sans text-caption font-medium tabular-nums text-fg">
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.max(5, m - 5))}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
              aria-label="Disminuir tiempo 5 minutos"
            >
              −
            </button>
            <span className="min-w-[3.5ch] px-1 text-center">
              {minutes}
              <span className="ml-0.5 text-fg-muted">m</span>
            </span>
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.min(180, m + 5))}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
              aria-label="Aumentar tiempo 5 minutos"
            >
              +
            </button>
          </div>

          <Button
            size="sm"
            variant={registered ? "secondary" : "primary"}
            onClick={handleRegister}
            icon={registered ? <Check size={14} className="text-success" /> : undefined}
          >
            {registered ? "¡Registrado!" : "Registrar"}
          </Button>
        </div>
      </div>
    </section>
  );
}
