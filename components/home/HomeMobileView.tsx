"use client";

// Planned structure:
// <HomeMobileView>
//   <HomeHeaderGreeting />   resolved name via useUserPreferences
//   <PrimaryActionTile />    Practice sounds (accent) + Continue course
//   <SecondaryActionTile />  Decks / Progress / IPA Chart / Lessons (4-column)
//   streak pill              inline flame + count, visible when streak > 0
//   review banner            compact due count + CTA, visible when items due
//   <HomeDailyCard />
// </HomeMobileView>

import { BookOpen, MicVocal, Layers, BarChart2, Grid2x2, GraduationCap, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { ReactNode } from "react";

interface HomeMobileViewProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
  dailyCard: ReactNode;
}

function PrimaryActionTile({
  title,
  href,
  Icon,
  accent,
}: {
  title: string;
  href: string;
  Icon: ElementType;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-[var(--radius-xl)] border p-4 transition-colors focus-ring",
        accent
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
          : "border-border-subtle bg-surface-raised text-[var(--text-primary)] hover:bg-surface-sunken",
      ].join(" ")}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]"
      >
        <Icon size={18} aria-hidden />
      </span>
      <span className="font-label font-semibold">{title}</span>
    </Link>
  );
}

function SecondaryActionTile({
  title,
  href,
  Icon,
}: {
  title: string;
  href: string;
  Icon: ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-3 transition-colors hover:bg-surface-sunken focus-ring"
    >
      <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        <Icon size={16} aria-hidden />
      </span>
      <span className="font-caption text-center font-medium text-[var(--text-secondary)]">{title}</span>
    </Link>
  );
}

export default function HomeMobileView({
  streak,
  wordsDueCount = 0,
  soundsDueCount = 0,
  dailyCard,
}: HomeMobileViewProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "there";
  const userName = fullName.split(" ")[0];

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="animate-home-in">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
      </div>

      {dailyCard}

      {(streak?.currentStreak ?? 0) > 0 && (
        <div className="animate-home-in flex items-center gap-2">
          <Flame
            size={14}
            className={[
              "transition-colors duration-300",
              streak?.completedToday ? "text-[var(--success)]" : "text-[var(--primary)]",
            ].join(" ")}
            aria-hidden
          />
          <span className="font-label tabular-nums text-[var(--text-primary)]">
            {streak!.currentStreak}
          </span>
          <span className="font-caption text-[var(--text-tertiary)]">
            {streak!.currentStreak === 1 ? "day" : "days"} streak
          </span>
        </div>
      )}

      {(wordsDueCount + soundsDueCount) > 0 && (
        <Link
          href="/words?tab=review"
          className="animate-home-in flex items-center gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised px-4 py-3 transition-colors hover:bg-surface-sunken focus-ring"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-label font-semibold text-[var(--text-primary)]">
              {wordsDueCount + soundsDueCount} item{(wordsDueCount + soundsDueCount) === 1 ? "" : "s"} to review
            </p>
            <p className="font-caption text-[var(--text-secondary)]">
              {[
                wordsDueCount > 0 && `${wordsDueCount} word${wordsDueCount === 1 ? "" : "s"}`,
                soundsDueCount > 0 && `${soundsDueCount} sound${soundsDueCount === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <ArrowRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden />
        </Link>
      )}

      <section>
        <p className="mb-3 text-label font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
          Quick access
        </p>
        <div className="flex flex-col gap-2">
          <div className="animate-home-in animate-home-in-d1">
            <PrimaryActionTile title="Practice sounds" href="/practice/sounds" Icon={MicVocal} accent />
          </div>
          <div className="animate-home-in animate-home-in-d2">
            <PrimaryActionTile title="Continue course" href="/courses" Icon={BookOpen} />
          </div>
        </div>
        <div className="animate-home-in animate-home-in-d3 mt-2 grid grid-cols-4 gap-2">
          <SecondaryActionTile title="Decks" href="/practice/decks" Icon={Layers} />
          <SecondaryActionTile title="Progress" href="/progress" Icon={BarChart2} />
          <SecondaryActionTile title="IPA Chart" href="/ipa-chart" Icon={Grid2x2} />
          <SecondaryActionTile title="Lessons" href="/mini-lessons" Icon={GraduationCap} />
        </div>
      </section>
    </div>
  );
}
