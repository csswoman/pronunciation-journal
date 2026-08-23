"use client";

import EmptyState from "@/components/EmptyState";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import Button from "@/components/ui/Button";

export function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      illustration={<EmptyVocabulario />}
      title="Tu vocabulario está vacío"
      description="Agrega tu primera palabra y empieza a construir tu lista"
      action={<Button onClick={onAdd}>Agregar palabra</Button>}
    />
  );
}
