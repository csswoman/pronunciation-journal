"use client";

import {
  ArrowUpRight,
  Globe,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "@/components/icons";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";
import { cn } from "@/lib/cn";

// Planned structure:
// <CoachStarterList>
//   <section aria-label="Modos de práctica">
//     <button key={...}>
//       <Icon />
//       <Title /> + <Subtitle />
//       <ArrowUpRight />
//     </button>
//   </section>
// </CoachStarterList>

const ICONS: Record<StarterId, { Icon: typeof MessageCircle; colorVar: string }> = {
  review: { Icon: RotateCcw, colorVar: "var(--warning)" },
  learn: { Icon: Sparkles, colorVar: "var(--primary)" },
  world: { Icon: Globe, colorVar: "var(--success)" },
  free: { Icon: MessageCircle, colorVar: "var(--fg-subtle)" },
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
    <section aria-label="Modos de práctica" className="layout-stack-tight w-full">
      {rows.map((starter, index) => {
        const { Icon, colorVar } = ICONS[starter.id];
        return (
          <button
            key={`${starter.id}-${index}`}
            type="button"
            disabled={loading}
            onClick={() => !loading && onSelect(starter as ResolvedStarter)}
            className={cn(
              "group layout-card-pad-compact flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md",
              "border border-border-subtle bg-surface-raised text-left",
              "transition-[border-color,background-color,transform] duration-150 ease-out",
              "hover:border-border-default hover:bg-surface-base",
              "focus-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
              loading && "animate-pulse cursor-default",
            )}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor: `color-mix(in oklch, ${colorVar} 14%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${colorVar} 18%, transparent)`,
                color: colorVar,
              }}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
            </span>

            <span className="layout-stack-tight min-w-0 flex-1">
              <span className="block text-body-sm font-semibold leading-snug text-fg">
                {starter.title || "\u00A0"}
              </span>
              {starter.subtitle && (
                <span className="block text-pretty text-caption leading-snug text-fg-subtle">
                  {starter.subtitle}
                </span>
              )}
            </span>

            <ArrowUpRight
              size={16}
              strokeWidth={2}
              className="shrink-0 text-fg-subtle transition-colors duration-150 group-hover:text-fg-muted motion-reduce:transition-none"
              aria-hidden
            />
          </button>
        );
      })}
    </section>
  );
}
