"use client";

import { useRouter } from "next/navigation";
import { LogIn, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export function GuestBanner() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Hero empty state */}
      <div
        className="rounded-3xl p-8 flex flex-col items-center text-center gap-4"
        style={{
          background: "linear-gradient(145deg, color-mix(in oklch, var(--primary) 10%, var(--card-bg)), var(--card-bg))",
          border: "1px solid color-mix(in oklch, var(--primary) 16%, var(--line-divider))",
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in oklch, var(--primary) 13%, transparent)", color: "var(--primary)" }}
        >
          <Sparkles size={28} />
        </div>
        <div>
          <h2 className="text-h4 text-fg">
            Track your English journey
          </h2>
          <p className="mt-2 text-sm max-w-sm mx-auto text-fg-muted">
            Sign in to see your streaks, XP, weekly charts, pronunciation accuracy, and personalized insights.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<LogIn size={16} />}
          onClick={() => router.push("/auth/login")}
          className="font-bold px-6 py-3"
        >
          Sign in to get started
        </Button>
      </div>

      {/* Preview tiles — blurred placeholders */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 opacity-40 pointer-events-none select-none blur-[2px]">
        {["Consistency Score", "Current Streak", "Weekly Accuracy", "XP This Week", "Total Words"].map((label) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-3xl p-4"
            style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
          >
            <div className="h-9 w-9 rounded-xl" style={{ background: "var(--line-divider)" }} />
            <div className="space-y-1">
              <p className="text-tiny font-semibold uppercase tracking-[0.2em] text-fg-muted">{label}</p>
              <p className="text-2xl font-black text-fg">—</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-3xl p-8 flex flex-col items-center text-center gap-2 opacity-40 pointer-events-none select-none blur-[2px]"
        style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", height: 200 }}
      >
        <p className="text-base font-bold text-fg">Weekly progress chart</p>
      </div>
    </div>
  );
}

