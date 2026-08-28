"use client";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

interface LessonDetailHeaderProps {
  title: string;
  blurb: string;
}

/**
 * LessonDetailHeader - Cabecera de lección/tema del diccionario.
 *
 * Sub-componentes:
 * - Link (Navegación de miga de pan al Diccionario)
 * - PageHeader (Cabecera canónica con Kicker, Título y Subtítulo)
 */
export function LessonDetailHeader({
  title,
  blurb,
}: LessonDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <nav className="flex items-center gap-1.5 font-mono text-tiny text-fg-subtle" aria-label="Ruta de navegación">
        <Link href="/words" className="hover:text-fg-muted transition-colors">Diccionario</Link>
        <span aria-hidden>/</span>
        <span aria-current="page" className="text-fg-muted">{title}</span>
      </nav>
      <PageHeader
        kicker="TEMA DEL DICCIONARIO"
        title={title}
        subtitle={blurb}
      />
    </div>
  );
}

