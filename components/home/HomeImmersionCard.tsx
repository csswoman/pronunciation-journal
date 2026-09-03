"use client";

// Sub-components:
// <HomeImmersionCard>
//   <ImmersionBar (icon, title, categories list, CTA button)>
//   <ImmersionControls (category chips, duration stepper)> [conditional when open]
// </HomeImmersionCard>

import { useState } from "react";
import { Tv, Check } from "@/components/icons";
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
  const [isOpen, setIsOpen] = useState(false);

  const handleRegister = () => {
    if (!isOpen && !registered) {
      setIsOpen(true);
      return;
    }
    setRegistered(true);
    setIsOpen(false);
    setTimeout(() => setRegistered(false), 3000);
  };

  return (
    <section
      aria-label="Registrar inmersión"
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3.5 sm:p-4 shadow-xs"
    >
      {/* Bar compacto principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Izquierda: Icono TV + Pregunta y Categorías */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Tv className="size-5 shrink-0 text-fg-muted" aria-hidden />
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-w-0">
            <h2 className="text-body-sm font-semibold text-fg">
              ¿Viste algo en inglés hoy?
            </h2>
            <span className="text-caption text-fg-muted">
              Video, serie, podcast, lectura
            </span>
          </div>
        </div>

        {/* Derecha: Botón de acción */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRegister}
            icon={registered ? <Check size={14} className="text-success" /> : undefined}
          >
            {registered ? "¡Registrado!" : isOpen ? "Guardar" : "Registrar"}
          </Button>
        </div>
      </div>

      {/* Selector desplegable de detalles de inmersión */}
      {isOpen && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-border-subtle/50 pt-3">
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

          {/* Stepper de tiempo */}
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
        </div>
      )}
    </section>
  );
}
