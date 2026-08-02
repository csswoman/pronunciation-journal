"use client";

import { Plus } from "@/components/icons";
import Link from "next/link";

interface Props {
  filter: "all" | "word" | "phrase" | "lesson";
}

export function TrackingEmptyState({ filter }: Props) {
  const isWords = filter === "word";
  const isPhrases = filter === "phrase";
  const title = isWords ? "Todavía no hay palabras aquí" : isPhrases ? "Todavía no hay frases aquí" : "Empieza con una palabra";
  if (filter === "lesson") {
    return <section className="tracking-empty"><div className="tracking-empty__body"><p className="font-kicker text-fg-subtle">LECCIONES</p><h3 className="mt-1 text-h4 text-fg">Aún no guardaste lecciones</h3><p className="mt-1 text-body-sm text-fg-muted">Explora la Ruta y guarda las lecciones a las que quieras volver.</p><Link href="/courses" className="mt-[var(--layout-stack)] inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--cta-bg)] px-5 text-body-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[var(--cta-bg-hover)]"><Plus size={16} aria-hidden />Explorar Ruta</Link></div></section>;
  }
  return <section className="tracking-empty"><div className="tracking-empty__body"><h2 className="text-h3 text-fg">{title}</h2><p className="mt-1 text-body-sm text-fg-muted">No hace falta organizarla ahora. Vuelve a ella cuando quieras.</p></div></section>;
}
