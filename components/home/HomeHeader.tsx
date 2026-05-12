"use client";

import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import Button from "@/components/ui/Button";

const COMPLETED = 2;
const TOTAL = 5;
const CARDS_DUE = 12;
const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function TaskProgressRing() {
  const progress = COMPLETED / TOTAL;
  const dash = CIRCUMFERENCE * progress;
  const gap = CIRCUMFERENCE - dash;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-24 h-24"
        style={{ filter: "drop-shadow(0 0 12px color-mix(in oklch, var(--primary) 45%, transparent))" }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44" cy="44" r={RADIUS}
            fill="none"
            stroke="color-mix(in oklch, var(--primary) 15%, transparent)"
            strokeWidth="6"
          />
          <circle
            cx="44" cy="44" r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[var(--text-primary)] leading-none">{COMPLETED}/{TOTAL}</span>
          <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">tasks done</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = fullName.split(" ")[0];
  const hasStartedLearning = progressList.length > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-gradient-to-br from-surface-raised to-surface-sunken"
    >
      {/* LEFT */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Greeting */}
        <div>
          <p className="text-sm font-normal text-[var(--text-secondary)]">Welcome back,</p>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            {userName}!
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {COMPLETED}/{TOTAL} tasks done · {CARDS_DUE} cards due today
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => router.push("/courses")}
            size="sm"
            icon={<Play size={14} className="fill-current" />}
            className="shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]"
            style={{ padding: "var(--space-2) var(--space-4)" }}
          >
            {hasStartedLearning ? "Continue Learning" : "Start Learning"}
          </Button>
          <Button
            onClick={() => router.push("/practice")}
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} />}
            style={{ padding: "var(--space-2) var(--space-4)" }}
          >
            Practice with AI
          </Button>
        </div>
      </div>

      {/* RIGHT — progress ring */}
      <div className="relative z-10 flex items-center justify-center">
        <TaskProgressRing />
      </div>
    </div>
  );
}
