import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { DailyStreakResult } from "@/lib/daily/streak";
import { DAILY_SESSION_LENGTH } from "@/lib/practice/daily-plan";

interface SessionBreakdown {
  label: string;
  count: number;
  color: string;
}

interface HomeSmartSessionCardProps {
  dueCount?: number;
  streak?: DailyStreakResult;
  wordBankTotal?: number;
}

export default function HomeSmartSessionCard({
  dueCount = 0,
  streak,
  wordBankTotal = 0,
}: HomeSmartSessionCardProps) {
  const wordReviewCount = dueCount;
  const completedToday = streak?.completedToday ?? false;
  const isEmptyBank = wordBankTotal === 0;

  if (isEmptyBank) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-[22px] text-center">
        <BookOpen size={28} className="text-[var(--text-tertiary)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Your word bank is empty</p>
        <p className="max-w-xs text-xs text-[var(--text-tertiary)]">
          Add words from the Lexicon to unlock your daily practice.
        </p>
        <Link href="/words?tab=lexicon">
          <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
            Go to Lexicon
          </Button>
        </Link>
      </div>
    );
  }

  const breakdown: SessionBreakdown[] = [
    {
      label: "Word review (SRS)",
      count: wordReviewCount,
      color: "var(--warning)",
    },
    {
      label: "Pronunciation practice",
      count: Math.min(5, DAILY_SESSION_LENGTH),
      color: "var(--primary)",
    },
    {
      label: "New grammar",
      count: 1,
      color: "var(--success)",
    },
  ].filter(
    (row) =>
      row.count > 0 ||
      row.label.includes("Pronunciation") ||
      row.label.includes("grammar"),
  );

  const totalExercises = breakdown.reduce((sum, row) => sum + row.count, 0) || DAILY_SESSION_LENGTH;
  const estMinutes = Math.max(10, Math.round(totalExercises * 1.1));

  return (
    <div
      className="flex flex-col rounded-[var(--radius-xl)] border p-[22px]"
      style={{
        background:
          "linear-gradient(150deg, color-mix(in oklch, var(--primary) 12%, transparent), var(--surface-raised) 65%)",
        borderColor: "var(--accent-border)",
      }}
    >
      <Badge label="Smart session" variant="default" className="self-start mb-3.5" />

      <h3
        className="text-2xl font-medium text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-display), serif" }}
      >
        Your session today
      </h3>
      <p className="mt-1 text-[15px] text-[var(--text-secondary)] leading-snug">
        A balanced mix of review, your weak sounds, and something new — based on recent practice.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        {breakdown.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-[15px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: row.color }}
              aria-hidden
            />
            <span className="text-[var(--text-primary)]">{row.label}</span>
            <b
              className="ml-auto font-medium text-[var(--text-secondary)]"
              style={{ fontFamily: "var(--font-display), serif" }}
            >
              {row.count}
            </b>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Link href="/daily" className="block w-full">
          <Button
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight size={15} />}
            iconPosition="right"
            className="justify-center py-3.5 text-base"
          >
            {completedToday ? "Practice again" : "Start today's plan"}
          </Button>
        </Link>
        <p className="mt-2.5 text-center text-[13px] text-[var(--text-tertiary)]">
          ≈ {estMinutes} min · {totalExercises} exercises
        </p>
      </div>
    </div>
  );
}
