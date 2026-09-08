"use client";

import Link from "next/link";
import { Plus } from "@/components/icons";
import EmptyState from "@/components/EmptyState";
import { getIllustration } from "@/lib/illustrations/registry";
import type { TrackingFilter } from "@/lib/tracking/types";

interface Props {
  filter: TrackingFilter;
}

const Illustration = getIllustration("emptyTracking");

export function TrackingEmptyState({ filter }: Props) {
  const isWords = filter === "word";
  const isPhrases = filter === "phrase";
  const title = isWords
    ? "Todavía no hay palabras aquí"
    : isPhrases
      ? "Todavía no hay frases aquí"
      : "Empieza con una palabra";

  if (filter === "ai_coach") {
    return (
      <EmptyState
        illustration={<Illustration />}
        title="Aún no guardaste nada del coach"
        description="Practica con el AI Coach y guarda palabras o expresiones desde el chat."
      />
    );
  }

  if (filter === "lesson") {
    return (
      <EmptyState
        illustration={<Illustration />}
        title="Aún no guardaste lecciones"
        description="Explora la Ruta y guarda las lecciones a las que quieras volver."
        action={
          <Link
            href="/courses"
            className="mt-[var(--layout-stack)] inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--cta-bg)] px-5 text-body-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[var(--cta-bg-hover)]"
          >
            <Plus size={16} aria-hidden />
            Explorar Ruta
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      illustration={<Illustration />}
      title={title}
      description="No hace falta organizarla ahora. Vuelve a ella cuando quieras."
    />
  );
}
