"use client";

import { useRouter } from "next/navigation";
import ConversationIllustration from "@/components/illustrations/ConversationIllustration";
import { Play, Sparkles } from "lucide-react";

export default function HomeHero() {
  const router = useRouter();

  return (
    <div
      className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--btn-regular-bg)]
        rounded-[20px_20px_0_0] px-8 lg:px-10 py-8
        grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center"
    >
      <div>
        <h1 className="font-display text-3xl lg:text-4xl leading-tight tracking-tight text-[var(--deep-text)] mb-1">
          Welcome back, <em className="not-italic text-[var(--primary)]">Karla!</em> 👋
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] mb-6 leading-relaxed">
          Keep going! You&apos;re doing great with your English journey.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => router.push("/courses")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
              text-sm font-semibold
              bg-[var(--primary)] text-[var(--accent-text)]
              hover:opacity-90 hover:-translate-y-px
              shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_30%,transparent)]
              transition-all duration-200"
          >
            <Play size={14} className="fill-current" />
            Continue Learning
          </button>
          <button
            onClick={() => router.push("/ai-practice")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl
              text-sm font-medium
              bg-[var(--card-bg)] text-[var(--deep-text)]
              border border-[var(--line-color)]
              hover:bg-[var(--btn-plain-bg-hover)] hover:text-[var(--primary)]
              transition-all duration-200"
          >
            <Sparkles size={14} />
            Practice with AI
          </button>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center">
        <ConversationIllustration className="w-[300px] xl:w-[340px]" />
      </div>
    </div>
  );
}
