import Link from "next/link";
import { RotateCcw } from "@/components/icons";
import type { AssessmentQuestionFeedback, AssessmentResult } from "@/lib/courses/assessment";
import PastelCard from "@/components/layout/PastelCard";
import SpeakButton from "@/components/courses/grammar-deck/SpeakButton";
import { getTopicReviewExample } from "@/lib/courses/assessment-topic-examples";
import { AssessmentLevelBreakdown } from "./AssessmentLevelBreakdown";
import { AssessmentQuestionFeedbackList } from "./AssessmentQuestionFeedbackList";

// Planned structure:
// <AssessmentPlacementResultView>
//   <starting level summary + level breakdown />
//   <review topics sorted by evaluated errors (with sentence examples and audio) />
// </AssessmentPlacementResultView>

interface AssessmentPlacementResultViewProps {
  result: AssessmentResult;
  onRedo?: () => void;
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

export function AssessmentPlacementResultView({ result, onRedo }: AssessmentPlacementResultViewProps) {
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
  const correctPercent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div className="assessment-placement-result">
      <div className="assessment-placement-result__summary">
        <PastelCard tone="lilac" className="assessment-placement-hero">
          <span className="assessment-hero-kicker">TU PUNTO DE PARTIDA</span>
          <h1>{planOnly ? "Empezamos por aquí" : `Empiezas en ${result.assignedLevel}`}</h1>
          <p>
            {planOnly
              ? "Marcaste estos temas como nuevos. Puedes empezar por una lección corta y volver a evaluar tu nivel más adelante."
              : `Tienes una base sólida de ${result.assignedLevel === "A1" ? "fundamentos" : "A1"} y ya entiendes buena parte del ${result.assignedLevel}. Tu plan arranca ahí, reforzando primero lo que más te costó.`}
          </p>

          {result.total > 0 && (
            <div className="assessment-placement-score">
              <strong>{correctPercent} %</strong>
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
            <Link href="/daily" className="assessment-result-action assessment-result-action--primary">
              {reviewTopics.length > 0 ? "Ir a practicar" : "Ver mi ruta"}<span aria-hidden>→</span>
            </Link>
            {questionFeedback.length > 0 && (
              <a href="#assessment-question-feedback" className="assessment-result-action assessment-result-action--secondary">
                Ver mis respuestas
              </a>
            )}
            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                className="assessment-result-action assessment-result-action--secondary assessment-result-action--redo"
              >
                <RotateCcw size={15} aria-hidden />
                Hacer de nuevo
              </button>
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
                ? "Ordenado por los temas que marcaste como nuevos. Cada tema tiene una práctica corta que ya está en tu plan."
                : "Ordenado por lo que más te frenó. Cada tema tiene una práctica corta que ya está en tu plan."}
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
            {reviewTopics.map((topic) => {
              const example = getTopicReviewExample(topic.lessonSlug, topic.feedback[0]);
              return (
                <article className="assessment-placement-topic" key={topic.lessonSlug}>
                  <div className="assessment-placement-topic__badges">
                    <span className="assessment-badge-pill assessment-badge-pill--fallos">
                      {topic.incorrect > 0
                        ? `${topic.incorrect} ${topic.incorrect === 1 ? "fallo" : "fallos"}`
                        : "Para empezar"}
                    </span>
                    {topic.level && (
                      <span className="assessment-badge-pill assessment-badge-pill--neutral">
                        {`gramática · ${topic.level.toUpperCase()}`}
                      </span>
                    )}
                  </div>
                  <h3>{formatTopicTitle(topic.title)}</h3>
                  <p className="assessment-placement-topic__hint">
                    {example.explanation ?? topic.feedback[0]?.explanation ?? "Repasa la estructura y uso principal de este tema."}
                  </p>

                  {example.phrase && (
                    <div className="assessment-topic-example">
                      <div className="assessment-topic-example__top">
                        <strong className="assessment-topic-example__phrase">{example.phrase}</strong>
                        <SpeakButton text={example.phrase} size="sm" className="assessment-topic-example__speak" />
                      </div>
                      {example.ipa && (
                        <span className="assessment-topic-example__ipa font-ipa">{example.ipa}</span>
                      )}
                      {example.translation && (
                        <p className="assessment-topic-example__translation">{example.translation}</p>
                      )}
                    </div>
                  )}

                  <div className="assessment-placement-topic__actions">
                    <Link
                      href={topic.lessonHref ?? `/courses?level=${(topic.level ?? result.assignedLevel).toLowerCase()}`}
                      className="assessment-placement-topic__practice-pill"
                    >
                      Practicar · {example.minutes ?? 5} min
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="assessment-placement-reviews__empty">
            No hay temas pendientes en las respuestas evaluadas. Puedes seguir practicando tu nivel cuando quieras.
          </p>
        )}
      </section>

      {questionFeedback.length > 0 && (
        <AssessmentQuestionFeedbackList
          id="assessment-question-feedback"
          title="Tus respuestas evaluadas"
          items={questionFeedback}
        />
      )}
    </div>
  );
}

