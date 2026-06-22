import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

interface DeckUnavailableProps {
  lessonTitle: string;
  backHref?: string;
}

export default function DeckUnavailable({
  lessonTitle,
  backHref = "/courses",
}: DeckUnavailableProps) {
  return (
    <main className="grammar-deck">
      <div className="grammar-deck__wrap">
        <Link href={backHref} className="grammar-deck__back">
          <ArrowLeft size={16} aria-hidden />
          Volver a la ruta
        </Link>
        <section className="grammar-deck__unavailable" aria-labelledby="deck-unavailable-title">
          <span className="grammar-deck__unavailable-icon" aria-hidden>
            <BookOpen size={24} />
          </span>
          <p className="grammar-deck__unavailable-eyebrow">Contenido en preparación</p>
          <h1 id="deck-unavailable-title">{lessonTitle}</h1>
          <p>
            Esta lección todavía no tiene material de estudio publicado. Puedes explorar otra
            lección y volver más adelante.
          </p>
          <Link href={backHref} className="grammar-deck__unavailable-action">
            Ver otras lecciones
          </Link>
        </section>
      </div>
    </main>
  );
}
