import Link from "next/link";

// Planned structure:
// <MiniLessonDeckCta>
//   kicker + title + link to Route study or practice deck
// </MiniLessonDeckCta>

interface MiniLessonDeckCtaProps {
  href: string;
  deckTitle: string;
  /** Prefer "ruta" when the deck is on the course path. */
  viaRoute: boolean;
}

export default function MiniLessonDeckCta({
  href,
  deckTitle,
  viaRoute,
}: MiniLessonDeckCtaProps) {
  return (
    <aside className="mini-lessons__deck-cta" aria-label="Estudio completo">
      <span className="mini-lessons__aside-kicker">
        {viaRoute ? "Estudio en la Ruta" : "Estudio completo"}
      </span>
      <p className="mini-lessons__deck-cta-copy">
        Esta mini-lección comparte el mismo tema que el mazo canónico. Ahí está
        la práctica estructurada.
      </p>
      <Link href={href} className="mini-lessons__lesson-link">
        <span>{viaRoute ? "Abrir en la Ruta" : "Abrir mazo"}</span>
        <strong>{deckTitle}</strong>
        <span aria-hidden>→</span>
      </Link>
    </aside>
  );
}
