"use client";

// Sub-components:
// <HomeImmersionCard>
//   <ImmersionHeader /> (Title, subtitle, +2 XP badge)
//   <ImmersionCategoryChips /> (Video o serie, Podcast, Lectura chips con circulo de icono pastel)
//   <ImmersionFooter /> (7-day streak dots con círculos punteados inactivos, CTA "Registrar →")
//   <ImmersionStepperControls /> (conditional details panel when open)
// </HomeImmersionCard>

import { useState } from "react";
import { Video, Headphones, BookOpen, Check, ArrowRight } from "@/components/icons";
import { useAuthOptional } from "@/components/auth/AuthProvider";
import { logExternalImmersion } from "@/lib/immersion/external-log";
import type { ImmersionMediaType } from "@/lib/progress/activity-types";
import { cn } from "@/lib/cn";

interface CategoryOption {
  id: ImmersionMediaType;
  label: string;
  icon: React.ElementType;
  badgeBg: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "video",
    label: "Video o serie",
    icon: Video,
    badgeBg: "bg-coral text-ink",
  },
  {
    id: "podcast",
    label: "Podcast",
    icon: Headphones,
    badgeBg: "bg-lilac text-ink",
  },
  {
    id: "reading",
    label: "Lectura",
    icon: BookOpen,
    badgeBg: "bg-butter text-ink",
  },
];

export default function HomeImmersionCard() {
  const auth = useAuthOptional();
  const userId = auth?.user?.id ?? null;
  const [selectedCategory, setSelectedCategory] = useState<ImmersionMediaType>("video");
  const [minutes, setMinutes] = useState(30);
  const [registered, setRegistered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleRegister = async () => {
    if (!isOpen && !registered) {
      setIsOpen(true);
      return;
    }
    if (userId) {
      try {
        await logExternalImmersion(userId, {
          type: selectedCategory,
          minutes,
        });
      } catch (err) {
        console.error("[HomeImmersionCard] Error logging immersion:", err);
      }
    }
    setRegistered(true);
    setIsOpen(false);
    setTimeout(() => setRegistered(false), 3000);
  };

  return (
    <section
      aria-label="Registrar inmersión"
      className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-border-default bg-surface-raised p-4 sm:p-5 shadow-sm"
    >
      {/* Encabezado: Título + Subtítulo + Badge +2 XP */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="font-heading text-h4 font-bold text-fg leading-tight">
            ¿Viste algo en inglés hoy?
          </h2>
          <p className="font-sans text-body-sm text-fg-muted">
            Anótalo y lo convierto en práctica.{" "}
            <span className="sr-only">Video, serie, podcast, lectura</span>
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-mint px-2.5 py-1 font-mono text-caption font-bold text-ink shadow-xs shrink-0 select-none">
          +2 XP
        </span>
      </div>

      {/* Chips con circulo de icono pastel */}
      <div
        className="flex flex-wrap items-center gap-2.5"
        role="group"
        aria-label="Categorías de inmersión"
      >
        {CATEGORY_OPTIONS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "focus-ring inline-flex min-h-11 items-center gap-3 rounded-full border px-2 py-1.5 pr-4 font-sans text-body-sm transition-all select-none",
                isSelected
                  ? "border-primary bg-primary/10 text-fg ring-1 ring-primary font-bold"
                  : "border-border-default bg-surface-sunken/80 text-fg hover:bg-surface-raised hover:border-border-strong",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform",
                  cat.badgeBg,
                )}
              >
                <Icon className="size-4 text-ink" aria-hidden />
              </span>
              <span className="font-heading font-semibold text-fg">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selector desplegable de minutos (stepper) si el usuario abre para ajustar */}
      {isOpen && (
        <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <span className="font-sans text-caption font-medium text-fg-muted">
            Duración de la sesión:
          </span>
          <div className="flex min-h-9 items-center rounded-xl border border-border-default bg-surface-sunken px-1.5 font-sans text-caption font-medium tabular-nums text-fg">
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.max(5, m - 5))}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-body-sm font-bold text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
              aria-label="Disminuir tiempo 5 minutos"
            >
              −
            </button>
            <span className="min-w-[4ch] px-1.5 text-center font-bold text-fg">
              {minutes}
              <span className="ml-0.5 text-fg-muted font-normal">min</span>
            </span>
            <button
              type="button"
              onClick={() => setMinutes((m) => Math.min(180, m + 5))}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-body-sm font-bold text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
              aria-label="Aumentar tiempo 5 minutos"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Feedback para lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {registered
          ? `Se han registrado ${minutes} minutos de inmersión en ${selectedCategory}`
          : ""}
      </div>

      {/* Fila inferior: Racha de 7 días y Botón de acción */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Tracker de racha con círculos desmarcados en borde punteado */}
        <div className="flex items-center gap-2 select-none">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "size-3 rounded-full transition-colors",
                  idx < 4
                    ? "bg-mint"
                    : "border border-dashed border-fg-muted/40 bg-transparent",
                )}
              />
            ))}
          </div>
          <span className="font-sans text-caption font-medium text-fg-muted">
            4 días
          </span>
        </div>

        {/* Botón CTA principal */}
        <button
          type="button"
          onClick={handleRegister}
          className={cn(
            "focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 py-2 font-label text-body-sm font-semibold transition-all select-none shrink-0",
            registered
              ? "bg-success text-paper"
              : "bg-primary text-on-primary hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]",
          )}
        >
          {registered ? (
            <>
              <Check className="size-4 shrink-0 text-paper" aria-hidden />
              <span>¡Registrado!</span>
            </>
          ) : (
            <>
              <span>{isOpen ? "Guardar" : "Registrar"}</span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
