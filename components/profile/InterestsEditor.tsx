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
        <h3 id="interests-title" className="font-kicker text-fg-muted m-0">
          Intereses
        </h3>
        <p className="font-caption text-fg-muted m-0">
          Personalizan futuras lecturas y práctica. Máximo 10.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => (
          <button
            key={interest}
            type="button"
            aria-pressed={selected.includes(interest)}
            onClick={() => toggle(interest)}
            className={cn(
              "focus-ring rounded-full px-3 py-1 font-caption transition-colors",
              selected.includes(interest)
                ? "bg-primary font-medium text-on-primary"
                : "border border-border-default text-fg hover:bg-surface-sunken",
            )}
          >
            {labels[interest]}
          </button>
        ))}
      </div>
      {error && <p className="font-caption text-error m-0">{error}</p>}
      <Button type="button" variant="primary" size="sm" disabled={saving} onClick={save}>
        {saving ? "Guardando…" : "Guardar intereses"}
      </Button>
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
