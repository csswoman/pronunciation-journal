"use client";

import EmptyState from "@/components/EmptyState";
import { BookOpen } from "@/components/icons";
import Button from "@/components/ui/Button";

// TODO(illustration-system): temporary icon placeholder. Replace with the
// Koboyo-sourced `emptyVocabulario` registry entry once
// docs/superpowers/specs/2026-08-24-illustration-system-design.md ships.
export function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      illustration={<BookOpen size={96} strokeWidth={1.25} aria-hidden />}
      title="Tu vocabulario está vacío"
      description="Agrega tu primera palabra y empieza a construir tu lista"
      action={<Button onClick={onAdd}>Agregar palabra</Button>}
    />
  );
}
