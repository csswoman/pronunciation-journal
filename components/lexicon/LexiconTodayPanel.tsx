import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LexiconTodayPanelProps {
  dueForReview: number;
  nextLesson: LessonViewModel | null;
  progressUnavailable?: boolean;
}

export function LexiconTodayPanel({ dueForReview, nextLesson, progressUnavailable = false }: LexiconTodayPanelProps) {
  const hasReview = dueForReview > 0;
  const href = progressUnavailable
    ? "/words"
    : hasReview
    ? "/practice/review"
    : nextLesson
    ? `/lexicon/${nextLesson.id}/practice`
    : "/words";
  const title = progressUnavailable
    ? "Explora mientras cargamos tu progreso"
    : hasReview
    ? `Tienes ${dueForReview} ${dueForReview === 1 ? "palabra" : "palabras"} para repasar`
    : nextLesson
      ? nextLesson.progress > 0 ? `Continúa con ${nextLesson.title}` : `Empieza con ${nextLesson.title}`
      : "Elige una categoría para empezar";
  const description = progressUnavailable
    ? "Puedes consultar el diccionario. Reintenta cuando quieras volver a ver tu avance."
    : hasReview
    ? "Una revisión breve hoy ayuda a recordar mañana."
    : nextLesson
      ? `${nextLesson.wordsCompleted} de ${nextLesson.totalWords} palabras en esta ruta.`
      : "Explora el léxico y elige un tema que quieras usar.";
  const note = progressUnavailable
    ? "Tu avance sigue a salvo."
    : hasReview
    ? "Cada repaso hace que la palabra dure un poco más."
    : nextLesson?.progress
      ? "Retomar también cuenta."
      : nextLesson
        ? "Tu primera sesión puede ser breve."
        : "Empieza por una palabra que quieras usar.";
  return (
    <section className="words-lexicon__today" aria-labelledby="words-today-title">
      <div className="words-lexicon__today-main">
        <div className="words-lexicon__today-copy">
          <p className="words-lexicon__today-kicker">Para hoy</p>
          <h2 id="words-today-title">{title}</h2>
          <p>{description}</p>
          <span className="words-lexicon__today-note">{note}</span>
        </div>
      </div>
      <Link href={href} className="words-lexicon__today-cta">
        {progressUnavailable ? "Abrir diccionario" : hasReview ? "Repasar palabras" : nextLesson ? nextLesson.progress > 0 ? "Continuar ruta" : "Aprender palabras nuevas" : "Explorar palabras"}
        <ArrowRight size={17} aria-hidden />
      </Link>
    </section>
  );
}
