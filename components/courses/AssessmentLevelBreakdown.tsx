import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";

// Planned structure:
// <AssessmentLevelBreakdown>
//   <section title />
//   <level score rows + outcomes + descriptive feedback />
//   <status legend />
// </AssessmentLevelBreakdown>

const LEVEL_NAMES: Record<CefrLevelId, string> = {
  a1: "Principiante",
  a2: "Básico",
  b1: "Intermedio",
  b2: "Intermedio alto",
  c1: "Avanzado",
  c2: "Maestría",
};

function getLevelFeedbackCopy(
  evaluated: boolean,
  thresholdMet: boolean,
  percent: number,
): string {
  if (!evaluated) {
    return "La prueba se detiene cuando un nivel empieza a costarte, para no hacerte perder tiempo.";
  }
  if (thresholdMet) {
    return "Lo dominas. Volverá de vez en cuando para que no se oxide.";
  }
  if (percent >= 50) {
    return "Ya entiendes más de la mitad. Aquí empieza tu plan.";
  }
  return "Es un buen punto de partida. Aquí están los temas que más te conviene consolidar.";
}

export function AssessmentLevelBreakdown({ result }: { result: AssessmentResult }) {
  return (
    <section className="assessment-level-breakdown" aria-labelledby="assessment-level-breakdown-title">
      <h2 id="assessment-level-breakdown-title">Resultado por nivel</h2>
      <ol className="assessment-level-breakdown__list">
        {ASSESSMENT_LEVEL_ORDER.map((level) => {
          const score = result.levelScores?.find((item) => item.level === level);
          const evaluated = Boolean(score) || result.evaluatedLevels?.includes(level) === true;
          const outcomes = result.questionOutcomes?.filter((item) => item.level === level) ?? [];
          const percent = score && score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
          const levelName = LEVEL_NAMES[level] ?? level.toUpperCase();
          const feedbackCopy = getLevelFeedbackCopy(evaluated, Boolean(score?.thresholdMet), percent);

          return (
            <li key={level} className="assessment-level-breakdown__item">
              <div className="assessment-level-breakdown__heading">
                <strong className="assessment-level-breakdown__name">
                  {level.toUpperCase()} · {levelName}
                </strong>
                {evaluated && score ? (
                  <span className="assessment-level-breakdown__stat">
                    {score.correct} de {score.total} · {percent} %
                  </span>
                ) : (
                  <span className="assessment-level-breakdown__pill-untested">
                    No evaluado
                  </span>
                )}
              </div>

              {outcomes.length > 0 && (
                <ul className="assessment-level-breakdown__questions" aria-label={`Respuestas del nivel ${level.toUpperCase()}`}>
                  {outcomes.map((outcome) => (
                    <li key={outcome.questionId}>
                      <span
                        className={outcome.correct ? "assessment-level-breakdown__mark assessment-level-breakdown__mark--correct" : "assessment-level-breakdown__mark assessment-level-breakdown__mark--wrong"}
                        aria-label={`Pregunta ${outcome.questionNumber}: ${outcome.correct ? "correcta" : "incorrecta"}`}
                        title={`Pregunta ${outcome.questionNumber}: ${outcome.correct ? "correcta" : "incorrecta"}`}
                      >
                        {outcome.correct ? "✓" : "×"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="assessment-level-breakdown__feedback">
                {feedbackCopy}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="assessment-level-breakdown__legend">
        <span className="assessment-level-breakdown__legend-item">
          <i className="assessment-level-breakdown__mark assessment-level-breakdown__mark--correct" aria-hidden>✓</i> Correcta
        </span>
        <span className="assessment-level-breakdown__legend-item">
          <i className="assessment-level-breakdown__mark assessment-level-breakdown__mark--wrong" aria-hidden>×</i> Para repasar
        </span>
      </div>
    </section>
  );
}

