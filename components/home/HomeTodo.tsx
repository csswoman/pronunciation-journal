import Link from "next/link";
import { FileText, ArrowRight, BookOpen, Flame } from "lucide-react";
import Button from "@/components/ui/Button";
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
          <Link href="/words?tab=lexicon">
            <Button variant="primary" size="sm" icon={<ArrowRight size={13} />} iconPosition="right">
              Go to Lexicon
            </Button>
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
        <div className="flex items-stretch gap-3 p-3 rounded-lg" style={{ backgroundColor: "color-mix(in oklch, var(--primary) 5%, transparent)" }}>
          {/* Exercise count */}
          <div className="flex flex-1 flex-col justify-center">
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
            className="flex flex-col items-center justify-center min-w-[80px]"
          >
            <Flame
              size={20}
              className={currentStreak > 0 ? "text-[var(--warning-value)]" : "text-[var(--text-tertiary)]"}
            />
            <p
              className="mt-1 text-2xl font-bold leading-none"
              style={{ color: currentStreak > 0 ? "var(--warning-value)" : "var(--text-tertiary)" }}
            >
              {currentStreak}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {currentStreak === 1 ? "day" : "days"}
            </p>
            {completedToday && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--warning-value)]">
                Done ✓
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link href="/daily" className="w-full">
          <Button
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight size={15} />}
            iconPosition="right"
          >
            {completedToday ? "Practice again" : "Start today's plan"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
