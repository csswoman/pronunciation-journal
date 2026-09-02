"use client";

import { useState } from "react";
import { Clapperboard } from "@/components/icons";

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
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-fg-muted">
          <Clapperboard size={18} aria-hidden />
        </div>
        <div className="flex flex-col">
          <h2 className="font-heading text-body-md font-bold text-fg">
            Registrar inmersión
          </h2>
          <p className="font-body-sm text-fg-muted">
            ¿Viste algo en inglés hoy? Cuenta para tu exposición real.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Chips de categoría */}
        <div className="flex flex-wrap items-center gap-2">
          {IMMERSION_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`focus-ring rounded-lg px-3 py-1.5 font-body-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-fg shadow-xs"
                    : "bg-surface-sunken text-fg-muted hover:bg-surface-sunken/80 hover:text-fg"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Input de tiempo + Botón registrar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-sunken px-2 py-1 font-sans text-body-sm font-medium tabular-nums text-fg">
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.max(5, m - 5))}
              className="focus-ring px-1 text-fg-muted hover:text-fg font-bold"
              aria-label="Disminuir tiempo"
            >
              -
            </button>
            <span>{minutes}</span>
            <span className="text-fg-muted">min</span>
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.min(180, m + 5))}
              className="focus-ring px-1 text-fg-muted hover:text-fg font-bold"
              aria-label="Aumentar tiempo"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleRegister}
            className="focus-ring rounded-lg border border-border-default bg-surface px-4 py-1.5 font-body-sm font-semibold text-fg transition-all hover:bg-surface-sunken hover:border-border-strong"
          >
            {registered ? "¡Registrado!" : "Registrar"}
          </button>
        </div>
      </div>
    </section>
  );
}
