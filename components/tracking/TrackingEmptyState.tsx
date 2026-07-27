"use client";

import { BookmarkPlus, Plus } from "@/components/icons";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Props {
  filter: "all" | "word" | "phrase" | "lesson";
  onAddWord: () => void;
  onAddPhrase: () => void;
}

export function TrackingEmptyState({ filter, onAddWord, onAddPhrase }: Props) {
  const isWords = filter === "word";
  const isPhrases = filter === "phrase";
  const title = isWords ? "Aún no guardaste palabras" : isPhrases ? "Aún no guardaste frases" : "Tu Tracking está listo para empezar";
  const action = isPhrases ? onAddPhrase : onAddWord;
  const label = isPhrases ? "Agregar una frase" : "Agregar una palabra";
  if (filter === "lesson") {
    return <Card className="p-12 text-center"><div className="flex flex-col items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-primary"><BookmarkPlus size={28} aria-hidden /></div><div><p className="text-body-sm font-semibold text-fg">Aún no guardaste lecciones</p><p className="mt-1 max-w-sm text-body-sm text-fg-muted">Explora la Ruta y guarda las lecciones a las que quieras volver.</p></div><Link href="/courses" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--cta-bg)] px-5 text-body-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[var(--cta-bg-hover)]"><Plus size={16} aria-hidden />Explorar Ruta</Link></div></Card>;
  }
  return <Card className="p-12 text-center"><div className="flex flex-col items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-primary-soft text-primary"><BookmarkPlus size={28} aria-hidden /></div><div><p className="text-body-sm font-semibold text-fg">{title}</p><p className="mt-1 max-w-sm text-body-sm text-fg-muted">Guarda contenido que quieras volver a practicar y encuéntralo aquí.</p></div><Button onClick={action} icon={<Plus size={16} />}>{label}</Button></div></Card>;
}
