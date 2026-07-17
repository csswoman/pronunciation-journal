"use client";

// Planned structure:
// <HomeMobileView>
//   greeting + retention stats
//   <HomeReviewBanner />
//   {dailyCard}
//   grid: Core1000 + WeakSound
//   Quick access
// </HomeMobileView>

import { BookOpen, MicVocal, Layers, BarChart2, Grid2x2, GraduationCap, Flame } from "@/components/icons";
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
  wordsMastered?: number;
  weekMinutes?: number;
  dailyCard: ReactNode;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
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
  wordsMastered = 0,
  weekMinutes = 0,
  dailyCard,
}: HomeMobileViewProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || null;
  const userName = isLoggedIn && fullName ? fullName.split(" ")[0] : null;

  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-1.5 border-b border-border-subtle pb-3">
        <p className="font-label text-fg">
          {greeting}
          {userName ? (
            <>
              , <span className="text-primary">{userName}</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 font-caption tabular-nums text-fg">
            <Flame
              size={14}
              className={
                current === 0
                  ? "text-fg-muted"
                  : completedToday
                    ? "text-success"
                    : "text-primary"
              }
              aria-hidden
            />
            {current === 0
              ? "0 días de racha"
              : `${current} ${current === 1 ? "día seguido" : "días seguidos"}`}
          </span>
          <span className="font-caption tabular-nums text-fg">
            {wordsMastered}{" "}
            {wordsMastered === 1 ? "palabra dominada" : "palabras dominadas"}
          </span>
          {weekMinutes > 0 ? (
            <span className="font-caption tabular-nums text-fg-muted">
              {weekMinutes} min esta semana
            </span>
          ) : null}
        </div>
      </div>

      <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />

      {dailyCard}

      <div className="grid grid-cols-2 gap-2">
        <Core1000ProgressCard />
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
      </div>

      <section>
        <p className="font-kicker mb-3">Acceso rápido</p>
        <div className="flex flex-col gap-2">
          <div className="animate-home-in animate-home-in-d1">
            <PrimaryActionTile title="Practicar sonidos" href="/practice/sounds" Icon={MicVocal} />
          </div>
          <div className="animate-home-in animate-home-in-d2">
            <PrimaryActionTile title="Continuar curso" href="/courses" Icon={BookOpen} />
          </div>
        </div>
        <div className="animate-home-in animate-home-in-d3 mt-2 grid grid-cols-4 gap-2">
          <SecondaryActionTile title="Mazos" href="/practice/decks" Icon={Layers} />
          <SecondaryActionTile title="Progreso" href="/progress" Icon={BarChart2} />
          <SecondaryActionTile title="IPA" href="/ipa-chart" Icon={Grid2x2} />
          <SecondaryActionTile title="Lecciones" href="/mini-lessons" Icon={GraduationCap} />
        </div>
      </section>
    </div>
  );
}
