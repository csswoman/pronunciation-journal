import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "@/components/icons";
import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";
import Badge from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import PastelCard from "@/components/layout/PastelCard";
import { AssessmentQuestionFeedbackList } from "./AssessmentQuestionFeedbackList";

export interface AssessmentTopicPreview {
  title: string;
  description?: string;
}

// Planned structure:
// <AssessmentCheckpointResultView>
//   <checkpoint score and next action />
//   <next topics | topic score breakdown />
//   <incorrect answer corrections />
// </AssessmentCheckpointResultView>

interface AssessmentCheckpointResultViewProps {
  result: AssessmentResult;
  level: CefrLevelId;
  nextLevel: CefrLevelId | null;
  userId?: string;
  nextLevelTopics?: AssessmentTopicPreview[];
  canContinueAfterFailure?: boolean;
  onContinue?: () => void;
  onRedo?: () => void;
}

function formatTopicTitle(title: string): string {
  return title.length > 0 ? `${title[0].toLocaleUpperCase("es")}${title.slice(1)}` : title;
}

export function AssessmentCheckpointResultView({
  result,
  level,
  nextLevel,
  userId,
  nextLevelTopics = [],
  canContinueAfterFailure = false,
  onContinue,
  onRedo,
}: AssessmentCheckpointResultViewProps) {
  const passed = result.passed;
  const oralPending = result.oralEvidence?.status === "pending";
  const levelScore = result.levelScores?.find((score) => score.level === level);
  const correctPercent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const answersToThreshold = levelScore ? Math.max(0, levelScore.minimumCorrect - result.score) : 0;
  const listeningToThreshold = levelScore
    ? Math.max(0, levelScore.minimumListeningCorrect - levelScore.listeningCorrect)
    : 0;
  const questionFeedback = result.questionFeedback ?? [];
  const topicsToReview = [...result.topicScores]
    .filter((topic) => topic.correct < topic.total)
    .sort((left, right) => (right.total - right.correct) - (left.total - left.correct));
  const firstReviewSlug = topicsToReview[0]?.lessonSlug;
  const firstReviewHref = result.needsReview.find((topic) => topic.lessonSlug === firstReviewSlug)?.lessonHref
    ?? `/courses?level=${level}`;
  const retryHref = `/assessment?mode=checkpoint&level=${level}`;
  const practiceHref = oralPending
    ? userId ? retryHref : "/login?intent=save"
    : passed
      ? `/courses?level=${(nextLevel ?? result.assignedLevel.toLowerCase()).toLowerCase()}`
      : firstReviewHref;
  const continueLabel = oralPending
    ? userId ? "Completar la parte oral" : "Iniciar sesión y repetir"
    : passed
      ? nextLevel ? `Empezar ${nextLevel.toUpperCase()}` : "Ir a practicar"
    : canContinueAfterFailure && nextLevel
      ? `Continuar con ${nextLevel.toUpperCase()}`
      : "Empezar repaso";
  const outcomeTitle = oralPending
    ? "Falta verificar la tarea oral"
    : passed
      ? nextLevel ? `Ya estás en ${nextLevel.toUpperCase()}` : `Checkpoint ${level.toUpperCase()} aprobado`
    : answersToThreshold > 0
      ? `Te faltaron ${answersToThreshold} ${answersToThreshold === 1 ? "respuesta" : "respuestas"}`
      : "Falta afinar la comprensión auditiva";

  return (
    <div className="assessment-checkpoint-result">
      <div className="assessment-checkpoint-result__top">
        <PastelCard tone={passed ? "mint" : "butter"} className="assessment-checkpoint-hero">
          <div className="assessment-checkpoint-status">
            {passed
              ? <CheckCircle2 className="assessment-result-icon assessment-result-icon--success" size={20} aria-hidden />
              : <AlertCircle className="assessment-result-icon assessment-result-icon--error" size={20} aria-hidden />}
            <Badge
              label={oralPending ? "Parte oral pendiente" : passed ? "Nivel superado" : "Para repasar"}
              variant={passed ? "success" : "warning"}
            />
          </div>
          <h1>{outcomeTitle}</h1>
          <p>
            {oralPending
              ? userId
                ? "Tus respuestas escritas y de escucha alcanzaron el mínimo. El nivel no cambia hasta comprobar la tarea oral; puedes reanudar este intento desde tu cuenta durante 24 horas."
                : "Esta sesión sin cuenta no guarda tus respuestas en la nube. Inicia sesión y repite el checkpoint para guardar el intento y completar la parte oral."
              : passed
              ? `Aprobaste el examen de nivel ${level.toUpperCase()}. ${nextLevel ? `Ahora puedes continuar con los temas de ${nextLevel.toUpperCase()}.` : "Puedes seguir practicando este nivel."}`
              : "Ya tienes una base. Repasa las respuestas que fallaste y vuelve a intentarlo cuando estos temas estén más frescos."}
          </p>

          <div className="assessment-checkpoint-score">
            <strong>{correctPercent}%</strong>
            <div>
              <b>{result.score} de {result.total} correctas</b>
              {levelScore && (
                <small>
                  Para pasar necesitabas {levelScore.minimumCorrect} aciertos
                  {levelScore.listeningTotal > 0 && (
                    <> y {levelScore.minimumListeningCorrect} de {levelScore.listeningTotal} en escucha</>
                  )}.
                </small>
              )}
            </div>
          </div>

          {result.total > 0 && (
            <progress
              className="assessment-result-progress"
              max={result.total}
              value={result.score}
              aria-label={`${result.score} de ${result.total} respuestas correctas`}
            />
          )}
          {levelScore && !passed && listeningToThreshold > 0 && (
            <p className="assessment-checkpoint-listening-note">
              Te faltan {listeningToThreshold} {listeningToThreshold === 1 ? "acierto" : "aciertos"} de escucha para cumplir el mínimo de este nivel.
            </p>
          )}

          <div className="assessment-result-actions">
            {onContinue ? (
              <PillButton
                variant="primary"
                size="md"
                className="min-h-11 px-5 py-2.5 text-body-sm"
                onClick={onContinue}
              >
                {continueLabel}<span aria-hidden>→</span>
              </PillButton>
            ) : (
              <Link href={practiceHref} className="assessment-result-action assessment-result-action--primary">
                {continueLabel}<span aria-hidden>→</span>
              </Link>
            )}
            {questionFeedback.length > 0 && (
              <Link href="#assessment-question-feedback" className="assessment-result-action assessment-result-action--secondary">
                Ver mis respuestas
              </Link>
            )}
          </div>

          {!passed && !onContinue && (
            onRedo ? (
              <button type="button" onClick={onRedo} className="assessment-checkpoint-retry">
                Volver a intentarlo
              </button>
            ) : (
              <Link href={retryHref} className="assessment-checkpoint-retry">Volver a intentarlo</Link>
            )
          )}
        </PastelCard>

        <section className="assessment-checkpoint-side" aria-labelledby="assessment-checkpoint-side-title">
          {passed ? (
            <>
              <div className="assessment-checkpoint-side__heading">
                <h2 id="assessment-checkpoint-side-title">
                  {nextLevel ? `Lo que sigue en ${nextLevel.toUpperCase()}` : "Tu siguiente paso"}
                </h2>
                <Badge label="Listo para explorar" variant="success" />
              </div>
              {nextLevelTopics.length > 0 ? (
                <ol className="assessment-next-topics">
                  {nextLevelTopics.map((topic, index) => (
                    <li key={`${topic.title}-${index}`}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{topic.title}</strong>
                        {topic.description && <p>{topic.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="assessment-checkpoint-empty">
                  Ya puedes abrir las lecciones de {nextLevel?.toUpperCase() ?? level.toUpperCase()} desde Cursos.
                </p>
              )}
            </>
          ) : (
            <>
              <h2 id="assessment-checkpoint-side-title">Cómo te fue por tema</h2>
              {topicsToReview.length > 0 ? (
                <ul className="assessment-topic-breakdown">
                  {topicsToReview.map((topic) => {
                    const incorrect = topic.total - topic.correct;
                    return (
                      <li key={topic.lessonSlug}>
                        <div>
                          <strong>{formatTopicTitle(topic.title)}</strong>
                          <Badge label={`${incorrect} ${incorrect === 1 ? "fallo" : "fallos"}`} variant="error" />
                        </div>
                        <p>{topic.correct} de {topic.total} correctas</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="assessment-checkpoint-empty">
                  Tus respuestas de escucha necesitan un repaso. Revisa cada corrección para ver qué opción correspondía.
                </p>
              )}
            </>
          )}
        </section>
      </div>

      {questionFeedback.length > 0 ? (
        <AssessmentQuestionFeedbackList
          id="assessment-question-feedback"
          title={`${questionFeedback.length} ${questionFeedback.length === 1 ? "detalle para pulir" : "detalles para pulir"}`}
          items={questionFeedback}
        />
      ) : (
        <p className="assessment-checkpoint-no-errors">No hay respuestas incorrectas en este bloque.</p>
      )}
    </div>
  );
}
