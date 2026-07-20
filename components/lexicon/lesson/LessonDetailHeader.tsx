"use client";

import Link from "next/link";
interface LessonDetailHeaderProps {
  title: string;
  blurb: string;
}

export function LessonDetailHeader({
  title,
  blurb,
}: LessonDetailHeaderProps) {
  return (
    <header className="lexicon-area__head">
      <nav className="lexicon-area__crumb" aria-label="Ruta de navegación">
        <Link href="/dictionary">Diccionario</Link>
        <span className="lexicon-area__crumb-separator" aria-hidden>/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <div className="lexicon-area__head-copy">
        <h1 className="lexicon-area__title">{title}</h1>
        <p className="lexicon-area__sub">{blurb}</p>
      </div>
    </header>
  );
}
