import Link from "next/link";
import type { AssessmentQuestionFeedback, AssessmentResult } from "@/lib/courses/assessment";
import Badge from "@/components/ui/Badge";
import PastelCard from "@/components/layout/PastelCard";
import { AssessmentLevelBreakdown } from "./AssessmentLevelBreakdown";
import { AssessmentQuestionFeedbackList } from "./AssessmentQuestionFeedbackList";

// Planned structure:
// <AssessmentPlacementResultView>
//   <starting level summary + level breakdown />
//   <review topics sorted by evaluated errors />
// </AssessmentPlacementResultView>

interface AssessmentPlacementResultViewProps {
  result: AssessmentResult;
}

function formatTopicTitle(title: string): string {
  return title.length > 0 ? `${title[0].toLocaleUpperCase("es")}${title.slice(1)}` : title;
}

function getTopicFeedback(
  result: AssessmentResult,
  lessonSlug: string,
): AssessmentQuestionFeedback[] {
  return (result.questionFeedback ?? []).filter((item) => item.lessonSlug === lessonSlug);
}

export function AssessmentPlacementResultView({ result }: AssessmentPlacementResultViewProps) {
  const planOnly = result.total === 0 && result.conceptSignals.some((signal) => signal.status === "learn");
  const questionFeedback = result.questionFeedback ?? [];
  const reviewTopics = result.needsReview
    .map((topic) => {
      const score = result.topicScores.find((item) => item.lessonSlug === topic.lessonSlug);
      const feedback = getTopicFeedback(result, topic.lessonSlug);
      const concept = result.conceptSignals.find((item) => item.lessonSlug === topic.lessonSlug);
      return {
        ...topic,
        level: feedback[0]?.level ?? concept?.level,
        incorrect: score ? score.total - score.correct : feedback.length,
        feedback,
      };
    })
    .sort((left, right) => right.incorrect - left.incorrect || left.title.localeCompare(right.title));
  const firstReviewHref = reviewTopics[0]
    ? reviewTopics[0].lessonHref ?? `/courses?level=${(reviewTopics[0].level ?? result.assignedLevel).toLowerCase()}`
    : `/courses?level=${result.assignedLevel.toLowerCase()}`;
  const correctPercent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="assessment-placement-result">
      <div className="assessment-placement-result__summary">
        <PastelCard tone="lilac" className="assessment-placement-hero">
          <Badge label="Tu punto de partida" variant="info" />
          <h1>{planOnly ? "Empezamos por aquí" : `Empiezas en ${result.assignedLevel}`}</h1>
          <p>
            {planOnly
              ? "Marcaste estos temas como nuevos. Puedes empezar por una lección corta y volver a evaluar tu nivel más adelante."
              : "Tus respuestas sitúan tu punto de partida aquí. El resultado orienta tu ruta y no es una certificación."}
          </p>

          {result.total > 0 && (
            <div className="assessment-placement-score">
              <strong>{correctPercent}%</strong>
              <div>
                <b>{result.score} de {result.total} correctas</b>
                <small>
                  {questionFeedback.length} {questionFeedback.length === 1 ? "respuesta para repasar" : "respuestas para repasar"}
                </small>
              </div>
            </div>
          )}

          {result.total > 0 && (
            <progress
              className="assessment-result-progress"
              max={result.total}
              value={result.score}
              aria-label={`${result.score} de ${result.total} respuestas correctas`}
            />
          )}

          <div className="assessment-result-actions">
            <Link href={firstReviewHref} className="assessment-result-action assessment-result-action--primary">
              {reviewTopics.length > 0 ? "Ir a practicar" : "Ver mi ruta"}<span aria-hidden>→</span>
            </Link>
            {questionFeedback.length > 0 && (
              <Link href="#assessment-placement-reviews" className="assessment-result-action assessment-result-action--secondary">
                Ver qué repasar
              </Link>
            )}
          </div>
        </PastelCard>

        {result.total > 0 && <AssessmentLevelBreakdown result={result} />}
      </div>

      <section id="assessment-placement-reviews" className="assessment-placement-reviews" aria-labelledby="assessment-placement-reviews-title">
        <div className="assessment-placement-reviews__heading">
          <div>
            <h2 id="assessment-placement-reviews-title">Qué repasar primero</h2>
            <p>
              {planOnly
                ? "Ordenado por los temas que marcaste como nuevos."
                : "Ordenado por los temas con más respuestas incorrectas."}
            </p>
          </div>
          {reviewTopics.length > 0 && (
            <span className="assessment-placement-reviews__count">
              {reviewTopics.length} {reviewTopics.length === 1 ? "tema" : "temas"}
            </span>
          )}
        </div>

        {reviewTopics.length > 0 ? (
          <div className="assessment-placement-topics">
            {reviewTopics.map((topic) => (
              <article className="assessment-placement-topic" key={topic.lessonSlug}>
                <div className="assessment-placement-topic__badges">
                  <Badge
                    label={topic.incorrect > 0
                      ? `${topic.incorrect} ${topic.incorrect === 1 ? "fallo" : "fallos"}`
                      : "Para empezar"}
                    variant={topic.incorrect > 0 ? "error" : "info"}
                  />
                  {topic.level && <Badge label={`nivel · ${topic.level.toUpperCase()}`} variant="neutral" />}
                </div>
                <h3>{formatTopicTitle(topic.title)}</h3>
                {topic.feedback[0]?.explanation && (
                  <p className="assessment-placement-topic__hint">{topic.feedback[0].explanation}</p>
                )}
                <div className="assessment-placement-topic__actions">
                  <Link
                    href={topic.lessonHref ?? `/courses?level=${(topic.level ?? result.assignedLevel).toLowerCase()}`}
                    className="assessment-placement-topic__practice"
                  >
                    Practicar este tema
                  </Link>
                  {topic.feedback.length > 0 && (
                    <details className="assessment-placement-topic__details">
                      <summary>
                        Ver {topic.feedback.length === 1 ? "corrección" : `${topic.feedback.length} correcciones`}
                      </summary>
                      <AssessmentQuestionFeedbackList
                        items={topic.feedback}
                        title={`Correcciones: ${formatTopicTitle(topic.title)}`}
                        compact
                        showHeading={false}
                      />
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="assessment-placement-reviews__empty">
            No hay temas pendientes en las respuestas evaluadas. Puedes seguir practicando tu nivel cuando quieras.
          </p>
        )}
      </section>
    </div>
  );
}
