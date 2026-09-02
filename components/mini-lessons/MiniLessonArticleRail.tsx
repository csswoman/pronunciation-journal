import Link from "next/link";
import MiniLessonDeckCta from "@/components/mini-lessons/MiniLessonDeckCta";
import type { MiniLessonDeckLink } from "@/lib/learning-loop/mini-lesson-deck-link";

// Planned structure:
// <MiniLessonArticleRail>
//   <TOCNav />
//   <MiniLessonDeckCta? />
//   <ExploreNav />
// </MiniLessonArticleRail>

interface TocItem {
  href: string;
  label: string;
}

interface ExploreLesson {
  slug: string;
  title: string;
}

interface MiniLessonArticleRailProps {
  tocItems: TocItem[];
  deckLink: MiniLessonDeckLink | null;
  nextLesson?: ExploreLesson;
  previousLesson?: ExploreLesson;
}

export default function MiniLessonArticleRail({
  tocItems,
  deckLink,
  nextLesson,
  previousLesson,
}: MiniLessonArticleRailProps) {
  return (
    <>
      <nav className="mini-lessons__contents">
        <span className="mini-lessons__aside-kicker">En esta lección</span>
        <ol className="mini-lessons__contents-list">
          {tocItems.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mini-lessons__aside-divider" />
      {deckLink && (
        <>
          <MiniLessonDeckCta
            href={deckLink.href}
            deckTitle={deckLink.title}
            viaRoute={deckLink.viaRoute}
          />
          <div className="mini-lessons__aside-divider" />
        </>
      )}
      <div className="mini-lessons__lesson-nav">
        <span className="mini-lessons__aside-kicker">Sigue explorando</span>
        {nextLesson ? (
          <Link href={`/mini-lessons/${nextLesson.slug}`} className="mini-lessons__lesson-link">
            <span>Siguiente lección</span>
            <strong>{nextLesson.title}</strong>
            <span aria-hidden>→</span>
          </Link>
        ) : previousLesson ? (
          <Link
            href={`/mini-lessons/${previousLesson.slug}`}
            className="mini-lessons__lesson-link"
          >
            <span>Lección anterior</span>
            <strong>{previousLesson.title}</strong>
            <span aria-hidden>←</span>
          </Link>
        ) : (
          <Link href="/mini-lessons" className="mini-lessons__lesson-link">
            <span>Ver todas</span>
            <strong>Mini lecciones</strong>
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </>
  );
}
