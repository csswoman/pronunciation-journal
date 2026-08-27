"use client";

import EmptyState from "@/components/EmptyState";
import { getIllustration } from "@/lib/illustrations/registry";
import Button from "@/components/ui/Button";

const Illustration = getIllustration("emptyVocabulario");

export function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      illustration={<Illustration />}
      title="Tu vocabulario está vacío"
      description="Agrega tu primera palabra y empieza a construir tu lista"
      action={<Button onClick={onAdd}>Agregar palabra</Button>}
    />
  );
}
