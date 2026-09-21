import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface StepItem {
  id: string | number;
  label?: string;
}

interface StepperProps {
  steps: readonly StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export default function Stepper({
  steps,
  currentStepIndex,
  onStepClick,
  className,
}: StepperProps) {
  const total = steps.length;
  const progressPercent = total > 1 ? (currentStepIndex / (total - 1)) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <div className="relative flex items-center justify-between w-full">
        {/* Track line behind step nodes */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-surface-raised rounded-full z-0">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300 ease-out-quart"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step nodes */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isFuture = index > currentStepIndex;
          const isInteractive = Boolean(onStepClick);

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isInteractive}
              onClick={() => onStepClick?.(index)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-caption font-bold transition-all duration-200 focus-ring",
                isInteractive ? "cursor-pointer press-feedback" : "cursor-default",
                isCurrent && "bg-accent text-on-accent scale-110 shadow-md",
                isCompleted && "bg-ink text-paper",
                isFuture && "bg-surface-raised border border-border-strong text-fg-muted"
              )}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} aria-hidden />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Step label if available for current step */}
      {steps[currentStepIndex]?.label && (
        <p className="text-center font-caption text-caption font-semibold text-fg-muted">
          Paso {currentStepIndex + 1} de {total}: <span className="text-fg">{steps[currentStepIndex].label}</span>
        </p>
      )}
    </div>
  );
}
