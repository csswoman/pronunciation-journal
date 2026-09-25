// Planned structure:
// <SuccessToast>
//   mint-soft container (rounded 14px, bottom margin to float comfortably)
//   mint-deep circle with check icon
//   toast message text
import { Check } from "lucide-react";

interface SuccessToastProps {
  message: string;
  delaySeconds: number;
}

export function SuccessToast({ message, delaySeconds }: SuccessToastProps) {
  return (
    <div
      style={{ animationDelay: `${delaySeconds}s` }}
      className="ej-pop mt-3 sm:mt-4 mb-3 sm:mb-4 flex items-center gap-3.5 rounded-[14px] border border-[var(--mint-deep)]/40 dark:border-[var(--mint-deep)]/60 bg-[var(--mint-soft)] dark:bg-[var(--surface-raised)] p-3.5 text-xs sm:text-sm font-medium text-[var(--ink)] dark:text-[var(--mint)] shadow-xs transition-colors duration-200"
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--mint-deep)] text-[var(--ink)] shadow-2xs"
      >
        <Check className="size-4" strokeWidth={2.5} />
      </span>
      <p className="leading-snug">{message}</p>
    </div>
  );
}
