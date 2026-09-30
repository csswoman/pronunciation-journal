"use client";

import {
  ArrowUpRight,
  MessageCircle,
  Music,
  RotateCcw,
  Sparkles,
} from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";
import { cn } from "@/lib/cn";

// Planned structure:
// <CoachStarterList>
//   <section aria-label="Modos de práctica">
//     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
//       <StarterCard key={...} />
//     </div>
//   </section>
// </CoachStarterList>

const CARD_CONFIGS: Record<
  StarterId,
  {
    tone: "coral" | "butter" | "lilac" | null;
    Icon: typeof RotateCcw;
    Watermark: () => React.ReactNode;
    isDark?: boolean;
    defaultBadges: string[];
  }
> = {
  review: {
    tone: "coral",
    Icon: RotateCcw,
    Watermark: () => (
      <span
        className="absolute top-2 right-3 select-none font-mono text-4xl font-bold text-black/[0.07] pointer-events-none sm:right-4 sm:text-5xl md:text-6xl"
        aria-hidden
      >
        2
      </span>
    ),
    defaultBadges: ["Vocabulario", "2 errores"],
  },
  learn: {
    tone: "butter",
    Icon: Sparkles,
    Watermark: () => (
      <span
        className="absolute top-2 right-3 select-none font-phoneme text-3xl font-light text-black/[0.08] pointer-events-none sm:right-4 sm:text-4xl md:text-5xl"
        aria-hidden
      >
        /ɹ/
      </span>
    ),
    defaultBadges: ["La erre americana /ɹ/", "A1"],
  },
  world: {
    tone: "lilac",
    Icon: Music,
    Watermark: () => (
      <svg
        className="absolute top-3 right-3 size-12 text-black/[0.07] pointer-events-none select-none sm:right-4 sm:size-14 md:size-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
    ),
    defaultBadges: ["Tu interés", "Conversación"],
  },
  free: {
    tone: null,
    Icon: MessageCircle,
    Watermark: () => null,
    isDark: true,
    defaultBadges: ["Tú empiezas"],
  },
};

const SKELETON_IDS: StarterId[] = ["review", "learn", "world", "free"];

interface CoachStarterListProps {
  starters: ResolvedStarter[] | null;
  loading: boolean;
  onSelect: (starter: ResolvedStarter) => void;
}

export default function CoachStarterList({ starters, loading, onSelect }: CoachStarterListProps) {
  const rows = loading || !starters
    ? SKELETON_IDS.map((id) => ({ id, title: "", subtitle: "", prompt: "", angle: "" }))
    : starters;

  return (
    <section aria-label="Modos de práctica" className="w-full">
      <div className="grid grid-cols-1 gap-3 @[28rem]:grid-cols-2 @[28rem]:gap-4">
        {rows.map((starter, index) => {
          const config = CARD_CONFIGS[starter.id] ?? CARD_CONFIGS.free;
          const { Icon, Watermark, tone, isDark, defaultBadges } = config;

          const rawSub = starter.subtitle?.trim();
          const parsedBadges = rawSub
            ? rawSub.includes("·")
              ? rawSub.split("·").map((b) => b.trim())
              : [rawSub]
            : defaultBadges;

          const CardComponent = isDark
            ? ({ children, className, ...props }: React.ComponentPropsWithoutRef<"button">) => (
                <button
                  type="button"
                  className={cn(
                    "group relative flex h-full min-h-[135px] flex-col justify-between overflow-hidden rounded-2xl @[28rem]:min-h-[155px] @[28rem]:rounded-3xl",
                    "border border-border-subtle bg-surface-raised p-4 text-left transition-all duration-200 ease-out @[28rem]:p-5",
                    "hover:-translate-y-0.5 hover:border-border-default hover:shadow-md",
                    "focus-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 min-h-[44px]",
                    loading && "animate-pulse cursor-default",
                    className,
                  )}
                  {...props}
                >
                  {children}
                </button>
              )
            : ({ children, className, ...props }: React.ComponentPropsWithoutRef<"button">) => (
                <button
                  type="button"
                  className={cn(
                    "w-full h-full text-left focus-ring rounded-2xl @[28rem]:rounded-3xl active:scale-[0.99] motion-reduce:active:scale-100 min-h-[44px]",
                    loading && "animate-pulse cursor-default",
                  )}
                  {...props}
                >
                  <PastelCard
                    tone={tone!}
                    className={cn(
                      "group relative flex h-full min-h-[135px] flex-col justify-between overflow-hidden rounded-2xl p-4 transition-transform duration-200 ease-out @[28rem]:min-h-[155px] @[28rem]:rounded-3xl @[28rem]:p-5",
                      "hover:-translate-y-0.5 hover:shadow-sm",
                      className,
                    )}
                  >
                    {children}
                  </PastelCard>
                </button>
              );

          return (
            <CardComponent
              key={`${starter.id}-${index}`}
              disabled={loading}
              onClick={() => !loading && onSelect(starter as ResolvedStarter)}
            >
              <Watermark />

              <div className="relative z-10 flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full shadow-xs @[28rem]:size-10",
                    isDark ? "bg-white/10 text-fg" : "bg-black/5 text-ink",
                  )}
                >
                  <Icon size={18} strokeWidth={2} className="@[28rem]:size-5" aria-hidden />
                </span>
              </div>

              <div className="relative z-10 my-2.5 flex-1 @[28rem]:my-4">
                <h3
                  className={cn(
                    "m-0 font-display text-base font-bold tracking-tight text-balance @[28rem]:text-lg",
                    isDark ? "text-fg" : "text-ink",
                  )}
                >
                  {starter.title || "\u00A0"}
                </h3>
              </div>

              <div className="relative z-10 flex flex-wrap items-end justify-between gap-2 pt-1 @[28rem]:gap-3 @[28rem]:pt-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                  {rawSub && <span className="sr-only">{rawSub}</span>}
                  {parsedBadges.map((badge, bIdx) => {
                    const isHighlight =
                      badge.toLowerCase().includes("error") || badge.toLowerCase().includes("fallo");
                    return (
                      <span
                        key={bIdx}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight transition-colors @[28rem]:px-2.5 @[28rem]:py-1 @[28rem]:text-xs line-clamp-2 break-words max-w-full",
                          isDark
                            ? "bg-white/10 text-fg-muted"
                            : isHighlight
                              ? "bg-ink text-paper"
                              : "pastel-card-chip",
                        )}
                      >
                        {badge}
                      </span>
                    );
                  })}
                </div>

                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:scale-105 @[28rem]:size-10 ml-auto",
                    isDark ? "bg-primary text-white" : "bg-ink text-paper",
                  )}
                >
                  <ArrowUpRight size={15} strokeWidth={2.5} className="@[28rem]:size-4.5" aria-hidden />
                </span>
              </div>
            </CardComponent>
          );
        })}
      </div>
    </section>
  );
}
