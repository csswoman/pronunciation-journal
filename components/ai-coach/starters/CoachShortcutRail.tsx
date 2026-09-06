"use client";

import {
  AlignLeft,
  BriefcaseBusiness,
  Mic,
  Plane,
} from "@/components/icons";
import { AI_COACH_SHORTCUT_PROMPTS } from "@/lib/ai-prompts";
import { cn } from "@/lib/cn";

// Planned structure:
// <CoachShortcutRail>
//   <section aria-label="Atajos populares">
//     <div className="divider" />
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
    label: "Comentar un artículo",
    Icon: AlignLeft,
    prompt: AI_COACH_SHORTCUT_PROMPTS.discussArticle,
  },
  {
    label: "Pronunciación",
    Icon: Mic,
    prompt: AI_COACH_SHORTCUT_PROMPTS.pronunciation,
  },
] as const;

interface CoachShortcutRailProps {
  onSendMessage: (prompt: string) => void;
}

export default function CoachShortcutRail({ onSendMessage }: CoachShortcutRailProps) {
  return (
    <section aria-label="Atajos populares" className="mt-6 w-full @[22rem]:mt-7">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="h-px flex-1 bg-border-subtle" />
        <p className="m-0 font-kicker text-fg-subtle">Atajos populares</p>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SUGGESTION_CHIPS.map(({ label, Icon, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSendMessage(prompt)}
            className={cn(
              "flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle",
              "bg-surface-raised px-3.5 text-caption font-medium whitespace-nowrap text-fg-muted",
              "transition-colors duration-150 focus-ring",
              "hover:border-primary hover:bg-primary-soft hover:text-primary",
              "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
            )}
          >
            <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
