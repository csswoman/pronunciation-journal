import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Check, X, AlertCircle } from "@/components/icons";

export type FeedbackState = "correct" | "wrong" | "hint";

interface FeedbackProps {
  state: FeedbackState;
  title: string;
  expected?: string;
  explanation?: string;
  action?: ReactNode;
  className?: string;
}

const stateStyles: Record<
  FeedbackState,
  { bg: string; border: string; badgeBg: string; badgeFg: string; icon: typeof Check }
> = {
  correct: {
    bg: "bg-mint-soft",
    border: "border-mint-deep",
    badgeBg: "bg-mint-deep",
    badgeFg: "text-ink",
    icon: Check,
  },
  wrong: {
    bg: "bg-coral-soft",
    border: "border-coral-deep",
    badgeBg: "bg-coral-deep",
    badgeFg: "text-ink",
    icon: X,
  },
  hint: {
    bg: "bg-butter-soft",
    border: "border-butter-deep",
    badgeBg: "bg-butter-deep",
    badgeFg: "text-ink",
    icon: AlertCircle,
  },
};

export default function Feedback({
  state,
  title,
  expected,
  explanation,
  action,
  className,
}: FeedbackProps) {
  const styles = stateStyles[state];
  const IconNode = styles.icon;

  return (
    <div
      role={state === "wrong" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-4 text-ink transition-all duration-200",
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid size-7 place-items-center rounded-full font-bold", styles.badgeBg, styles.badgeFg)}>
            <IconNode size={16} aria-hidden strokeWidth={3} />
          </span>
          <span className="font-title text-body-md font-bold text-ink">{title}</span>
        </div>
        {action}
      </div>

      {expected && (
        <p className="font-caption text-caption font-semibold text-ink-secondary">
          Respuesta esperada: <span className="font-mono text-ink">{expected}</span>
        </p>
      )}

      {explanation && (
        <p className="font-body text-body-sm text-ink-secondary">
          {explanation}
        </p>
      )}
    </div>
  );
}
