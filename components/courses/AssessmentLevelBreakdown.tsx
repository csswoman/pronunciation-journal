import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import type { AssessmentResult } from "@/lib/courses/assessment";
import { cn } from "@/lib/cn";

// Planned structure:
// <AssessmentLevelBreakdown>
//   <level score rows />
//   <question outcome markers />
// </AssessmentLevelBreakdown>

export function AssessmentLevelBreakdown({ result }: { result: AssessmentResult }) {
  return (
    <section className="assessment-level-breakdown" aria-labelledby="assessment-level-breakdown-title">
      <h2 id="assessment-level-breakdown-title">Resultado por nivel</h2>
      <ol>
        {ASSESSMENT_LEVEL_ORDER.map((level) => {
          const score = result.levelScores?.find((item) => item.level === level);
          const evaluated = Boolean(score) || result.evaluatedLevels?.includes(level) === true;
          const outcomes = result.questionOutcomes?.filter((item) => item.level === level) ?? [];
          const status = !evaluated
            ? "No evaluado"
            : score?.thresholdMet
              ? "Umbral alcanzado"
              : score
                ? "Para repasar"
                : "Evaluado";

          return (
            <li key={level}>
              <div className="assessment-level-breakdown__heading">
                <strong>{level.toUpperCase()}</strong>
                <span className={cn(
                  "assessment-level-breakdown__status",
                  score?.thresholdMet && "assessment-level-breakdown__status--passed",
                )}>
                  {status}
                </span>
              </div>
              {score ? (
                <p className="assessment-level-breakdown__score">
                  {score.correct} de {score.total} · {Math.round((score.correct / score.total) * 100)}%
                </p>
              ) : !evaluated ? (
                <p className="assessment-level-breakdown__score">Este nivel aún no se evaluó.</p>
              ) : null}
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
            </li>
          );
        })}
      </ol>
      <p className="assessment-level-breakdown__legend">
        <span><i className="assessment-level-breakdown__mark assessment-level-breakdown__mark--correct" aria-hidden>✓</i> Correcta</span>
        <span><i className="assessment-level-breakdown__mark assessment-level-breakdown__mark--wrong" aria-hidden>×</i> Para repasar</span>
      </p>
    </section>
  );
}
