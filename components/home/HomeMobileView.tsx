"use client";

// Planned structure:
// <HomeMobileView>
//   slim utility bar         mono date · name + optional streak pill
//   <HomeReviewBanner />     due counts + review CTA
//   {dailyCard}
//   grid cols-2              <Core1000ProgressCard /> + <WeakSoundCard />
//   Quick access section     <PrimaryActionTile /> x2 + <SecondaryActionTile /> x4
// </HomeMobileView>

import { BookOpen, MicVocal, Layers, BarChart2, Grid2x2, GraduationCap, Flame } from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { ReactNode } from "react";

interface HomeMobileViewProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
  weakestPhoneme?: WeakestPhonemeHome | null;
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
  weakestPhoneme = null,
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
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <p className="font-mono text-caption text-fg-muted">
          {dateLabel} · {userName.toLowerCase()}
        </p>
        {(streak?.currentStreak ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 font-caption tabular-nums text-fg">
            <Flame
              size={14}
              className={streak?.completedToday ? "text-success" : "text-primary"}
              aria-hidden
            />
            {streak!.currentStreak}
          </span>
        )}
      </div>

      <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />

      {dailyCard}

      <div className="grid grid-cols-2 gap-2">
        <Core1000ProgressCard />
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
      </div>

      <section>
        <p className="font-kicker mb-3">Quick access</p>
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
