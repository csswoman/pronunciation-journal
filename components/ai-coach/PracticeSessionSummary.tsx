import Button from "@/components/ui/Button";

// Planned structure:
// <PracticeSessionSummary>
//   <ResultHeading />
//   <ReviewList />
//   <CoachDiscussionAction />
// </PracticeSessionSummary>

export interface ExerciseSessionSummary {
  total: number;
  correct: number;
  reviewItems: string[];
}

interface Props {
  summary: ExerciseSessionSummary;
  onDiscuss?: (summary: ExerciseSessionSummary) => void;
}

export default function PracticeSessionSummary({ summary, onDiscuss }: Props) {
  const isAllCorrect = summary.correct === summary.total;

  return (
    <div className="layout-stack w-full rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div>
        <p className="m-0 text-caption font-semibold text-fg">¡Práctica finalizada!</p>
        <p className="m-0 text-tiny font-medium text-fg-muted">
          {summary.correct} de {summary.total} ejercicio{summary.total > 1 ? "s" : ""} correcto{summary.total > 1 ? "s" : ""}
        </p>
      </div>

      <p className="m-0 text-body-sm text-fg-secondary">
        {isAllCorrect
          ? "¡Excelente trabajo! Has completado la práctica con éxito."
          : "Repasa estas pistas antes de continuar:"}
      </p>

      {summary.reviewItems.length > 0 ? (
        <ul className="m-0 space-y-1 pl-5 text-body-sm text-fg-secondary">
          {summary.reviewItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}

      {onDiscuss ? (
        <Button variant="secondary" size="md" fullWidth onClick={() => onDiscuss(summary)}>
          Comentar con el Coach
        </Button>
      ) : null}
    </div>
  );
}
