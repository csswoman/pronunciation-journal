import Link from "next/link";
import { FileText, ArrowRight, BookOpen, Flame } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { DailyStreakResult } from "@/lib/daily/streak";
import { DAILY_SESSION_LENGTH } from "@/lib/practice/daily-plan";

interface HomeTodoProps {
  dueWords?: WordBankEntry[];
  streak?: DailyStreakResult;
}

export default function HomeTodo({ dueWords = [], streak }: HomeTodoProps) {
  const hasWords = dueWords.length > 0;

  if (!hasWords) {
    return (
      <Card variant="compact" className="gap-4">
        <CardHeader
          icon={<FileText size={18} className="text-[var(--primary)]" />}
          title="Today's plan"
        />
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <BookOpen size={28} className="text-[var(--text-tertiary)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Your word bank is empty
          </p>
          <p className="text-xs text-[var(--text-tertiary)] max-w-48">
            Add words from the Lexicon to unlock your daily practice.
          </p>
          <Link
            href="/lexicon"
            className="mt-1 inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Lexicon <ArrowRight size={13} />
          </Link>
        </div>
      </Card>
    );
  }

  const wordCount = dueWords.length;
  const currentStreak = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<FileText size={18} className="text-[var(--primary)]" />}
        title="Today's plan"
      />

      <div className="flex flex-col gap-3">
        {/* Stats row */}
        <div className="flex items-stretch gap-3">
          {/* Exercise count */}
          <div className="flex flex-1 flex-col justify-center rounded-lg bg-[var(--surface-sunken)] px-4 py-3">
            <p className="text-2xl font-bold leading-none text-[var(--text-primary)]">
              {DAILY_SESSION_LENGTH}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">exercises ready</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {wordCount} word{wordCount !== 1 ? "s" : ""} due · fill-blank · dictation
            </p>
          </div>

          {/* Streak */}
          <div
            className="flex flex-col items-center justify-center rounded-lg px-4 py-3 min-w-[80px]"
            style={{
              backgroundColor: currentStreak > 0 ? "var(--warning-soft, #fff7ed)" : "var(--surface-sunken)",
            }}
          >
            <Flame
              size={20}
              className={currentStreak > 0 ? "text-[var(--warning-value,#f97316)]" : "text-[var(--text-tertiary)]"}
            />
            <p
              className="mt-1 text-2xl font-bold leading-none"
              style={{ color: currentStreak > 0 ? "var(--warning-value,#f97316)" : "var(--text-tertiary)" }}
            >
              {currentStreak}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {currentStreak === 1 ? "day" : "days"}
            </p>
            {completedToday && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--warning-value,#f97316)]">
                Done ✓
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/daily"
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {completedToday ? "Practice again" : "Start today's plan"} <ArrowRight size={15} />
        </Link>
      </div>
    </Card>
  );
}
