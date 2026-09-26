"use client";

import {
  AlignLeft,
  BriefcaseBusiness,
  ChevronRight,
  Plane,
} from "@/components/icons";
import { AI_COACH_SHORTCUT_PROMPTS } from "@/lib/ai-prompts";
import { cn } from "@/lib/cn";

// Planned structure:
// <CoachShortcutRail>
//   <section aria-label="Atajos populares">
//     <p className="font-kicker">ATAJOS POPULARES</p>
//     <div className="chip-list">
//       <button className="chip" />
//     </div>
//   </section>
// </CoachShortcutRail>

const SUGGESTION_CHIPS = [
  {
    label: "Viaje a Nueva York",
    Icon: Plane,
    prompt: AI_COACH_SHORTCUT_PROMPTS.newYorkTrip,
  },
  {
    label: "Entrevista de trabajo",
    Icon: BriefcaseBusiness,
    prompt: AI_COACH_SHORTCUT_PROMPTS.jobInterview,
  },
  {
    label: "Comentar [TEMA]",
    Icon: AlignLeft,
    prompt: AI_COACH_SHORTCUT_PROMPTS.discussArticle,
  },
] as const;

interface CoachShortcutRailProps {
  onSendMessage: (prompt: string) => void;
}

export default function CoachShortcutRail({ onSendMessage }: CoachShortcutRailProps) {
  return (
    <section aria-label="Atajos populares" className="mt-6 w-full sm:mt-7">
      <p className="font-kicker mb-2.5 block text-xs font-semibold uppercase tracking-wider text-fg-subtle sm:mb-3">
        ATAJOS POPULARES
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {SUGGESTION_CHIPS.map(({ label, Icon, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSendMessage(prompt)}
            className={cn(
              "group flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-border-subtle",
              "bg-surface-raised px-3.5 text-xs font-medium text-fg sm:px-4",
              "transition-colors duration-150 focus-ring",
              "hover:border-primary hover:bg-surface-base hover:text-primary",
              "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg-muted transition-colors group-hover:bg-primary-soft group-hover:text-primary">
              <Icon size={12} strokeWidth={2} aria-hidden />
            </span>
            <span className="whitespace-normal text-left">{label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onSendMessage("Ver todos los atajos")}
          className={cn(
            "flex min-h-[44px] cursor-pointer items-center gap-1 rounded-full border border-border-subtle",
            "bg-surface-raised px-3.5 text-xs font-medium text-fg-muted sm:px-4",
            "transition-colors duration-150 focus-ring",
            "hover:border-border-default hover:text-fg",
            "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          )}
        >
          <span className="whitespace-nowrap">Ver todos</span>
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </section>
  );
}
