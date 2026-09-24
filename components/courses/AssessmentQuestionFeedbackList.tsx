import type { AssessmentQuestionFeedback } from "@/lib/courses/assessment";
import { cn } from "@/lib/cn";

// Planned structure:
// <AssessmentQuestionFeedbackList>
//   <heading />
//   <question correction cards />
// </AssessmentQuestionFeedbackList>

interface AssessmentQuestionFeedbackListProps {
  items: AssessmentQuestionFeedback[];
  title?: string;
  id?: string;
  compact?: boolean;
  showHeading?: boolean;
}

export function AssessmentQuestionFeedbackList({
  items,
  title = "Respuestas para revisar",
  id,
  compact = false,
  showHeading = true,
}: AssessmentQuestionFeedbackListProps) {
  if (items.length === 0) return null;

  return (
    <section
      id={id}
      className={cn(
        "assessment-question-feedback",
        compact && "assessment-question-feedback--compact",
      )}
      aria-label={showHeading ? undefined : title}
    >
      {showHeading && <h2>{title}</h2>}
      <ol>
        {items.map((item) => (
          <li key={item.questionId}>
            <p className="assessment-question-feedback__topic">
              Pregunta {item.questionNumber} · {item.topicTitle}
            </p>
            <p className="assessment-question-feedback__prompt">{item.prompt}</p>
            <p className="assessment-question-feedback__answer">
              <span>Tu respuesta</span>
              <span className="assessment-question-feedback__wrong">
                {item.selectedAnswer ?? "Sin respuesta"}
              </span>
            </p>
            <p className="assessment-question-feedback__answer">
              <span>Respuesta correcta</span>
              <strong>{item.correctAnswer}</strong>
            </p>
            {item.explanation && (
              <p className="assessment-question-feedback__explanation">{item.explanation}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
