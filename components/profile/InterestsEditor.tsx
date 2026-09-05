"use client";

// Planned structure:
// <InterestsEditor>
//   <InterestsHeader />
//   <InterestChips />
//   <SaveButton />
// </InterestsEditor>

import { useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { INTEREST_OPTIONS, type Interest } from "@/lib/users/interests";

const labels: Record<Interest, string> = {
  technology: "Tecnología",
  travel: "Viajes",
  work: "Trabajo",
  food: "Comida",
  music: "Música",
  films: "Películas",
  books: "Libros",
  sports: "Deportes",
  health: "Salud",
  science: "Ciencia",
  business: "Negocios",
  gaming: "Videojuegos",
};

interface Props {
  interests: readonly Interest[];
  onSave: (interests: Interest[]) => Promise<void>;
  /** Omit outer card chrome when nested in a preferences panel. */
  bare?: boolean;
}

export default function InterestsEditor({ interests, onSave, bare = false }: Props) {
  const [selected, setSelected] = useState<Interest[]>([...interests]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (interest: Interest) =>
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : current.length < 10
          ? [...current, interest]
          : current,
    );

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await onSave(selected);
    } catch {
      setError("No se pudieron guardar los intereses.");
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <>
      <div className="layout-stack-tight">
        <h3 id="interests-title" className="m-0 font-label text-fg">
          Intereses de práctica
        </h3>
        <p className="m-0 font-caption text-fg-muted">
          Personalizan futuras lecturas y ejercicios recomendados. Selecciona hasta 10.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 py-1">
        {INTEREST_OPTIONS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(interest)}
              className={cn(
                "focus-ring rounded-full px-3.5 py-1.5 font-caption text-body-sm transition-all duration-150 active:scale-95",
                isSelected
                  ? "bg-primary font-medium text-on-primary shadow-xs"
                  : "border border-border-subtle bg-surface-sunken/60 text-fg-muted hover:border-border-default hover:bg-surface-sunken hover:text-fg",
              )}
            >
              {labels[interest]}
            </button>
          );
        })}
      </div>
      {error && <p className="m-0 font-caption text-error">{error}</p>}
      <div className="pt-1">
        <Button type="button" variant="primary" size="sm" disabled={saving} onClick={save}>
          {saving ? "Guardando…" : "Guardar intereses"}
        </Button>
      </div>
    </>
  );

  if (bare) {
    return (
      <div aria-labelledby="interests-title" className="layout-stack">
        {body}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="interests-title"
      className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-5"
    >
      {body}
    </section>
  );
}
