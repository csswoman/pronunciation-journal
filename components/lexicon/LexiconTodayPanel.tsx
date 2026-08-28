import Link from "next/link";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LexiconTodayPanelProps {
  dueForReview: number;
  nextLesson: LessonViewModel | null;
  dueWordLabels?: string[];
  progressUnavailable?: boolean;
}

export function LexiconTodayPanel({
  dueForReview,
  nextLesson,
  dueWordLabels = [],
  progressUnavailable = false,
}: LexiconTodayPanelProps) {
  const hasReview = dueForReview > 0;
  if (!hasReview && !nextLesson && !progressUnavailable) return null;

  const href = progressUnavailable
    ? "/words"
    : hasReview
    ? "/practice/review"
    : nextLesson
    ? `/lexicon/${nextLesson.id}/practice`
    : "/words";

  const title = progressUnavailable
    ? "Explora el diccionario mientras cargamos tu progreso"
    : hasReview
    ? `${dueForReview} ${dueForReview === 1 ? "palabra te espera" : "palabras te esperan"} hoy`
    : nextLesson
    ? nextLesson.progress > 0
      ? `Continúa con ${nextLesson.title}`
      : `Empieza con ${nextLesson.title}`
    : "Elige una categoría para empezar";

  const estMinutes = Math.max(1, Math.ceil(dueForReview * 0.2));
  const description = progressUnavailable
    ? "Puedes consultar cualquier término o buscar por tema."
    : hasReview
    ? `Unos ${estMinutes} ${estMinutes === 1 ? "minuto" : "minutos"}. Las que falles vuelven mañana.`
    : nextLesson
    ? `${nextLesson.wordsCompleted} de ${nextLesson.totalWords} palabras dominadas en esta ruta.`
    : "Explora el léxico por categorías.";

  const buttonLabel = progressUnavailable
    ? "Abrir diccionario"
    : hasReview
    ? "Repasar ahora"
    : "Empezar ruta";

  const visibleChips = dueWordLabels.slice(0, 4);
  const remainingCount = Math.max(0, dueForReview - visibleChips.length);

  return (
    <section className="words-lexicon__review-hero" aria-labelledby="words-today-title">
      <div className="words-lexicon__review-hero-body space-y-3">
        <div className="space-y-1">
          <h2 id="words-today-title" className="words-lexicon__review-hero-title">
            {title}
          </h2>
          <p className="words-lexicon__review-hero-sub">{description}</p>
        </div>

        {hasReview && visibleChips.length > 0 ? (
          <div className="words-lexicon__review-hero-chips flex flex-wrap items-center gap-2 pt-1">
            {visibleChips.map((word) => (
              <span key={word} className="words-lexicon__review-chip">
                {word}
              </span>
            ))}
            {remainingCount > 0 ? (
              <span className="words-lexicon__review-chip words-lexicon__review-chip--more">
                +{remainingCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="words-lexicon__review-hero-action shrink-0">
        <Link href={href} className="words-lexicon__review-hero-btn">
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
