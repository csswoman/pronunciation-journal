"use client";

interface Props {
  stageIndex: number;
  wordProgress: number; // 0–1 fill of the active segment
  totalStages?: number;
  onJumpStage: (i: number) => void;
}

export default function ExerciseStageBar({
  stageIndex,
  wordProgress,
  totalStages = 3,
  onJumpStage,
}: Props) {
  return (
    <div className="flex w-full gap-0.5 shrink-0" role="progressbar" aria-label="Stage progress">
      {Array.from({ length: totalStages }, (_, i) => {
        const isCompleted = i < stageIndex;
        const isActive = i === stageIndex;
        const fill = isCompleted ? 100 : isActive ? Math.round(wordProgress * 100) : 0;

        return (
          <button
            key={i}
            onClick={() => onJumpStage(i)}
            className="flex-1 h-1 bg-primary-100 overflow-hidden"
            aria-label={`Stage ${i + 1}`}
          >
            <div
              className="h-full bg-primary transition-all duration-400 ease-out"
              style={{ width: `${fill}%` }}
            />
          </button>
        );
      })}
    </div>
  );
}
