"use client";

interface NavButtonsProps {
  onPrev?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextAccent?: boolean;
}

export function NavButtons({
  onPrev,
  onNext,
  nextLabel,
  nextDisabled,
  nextAccent = true,
}: NavButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {onPrev && (
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all hover:opacity-70"
          style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
        >
          ← Previous
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
        style={
          nextAccent
            ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
            : { backgroundColor: "var(--btn-regular-bg-active)", color: "var(--text-primary)" }
        }
      >
        {nextLabel}
      </button>
    </div>
  );
}
