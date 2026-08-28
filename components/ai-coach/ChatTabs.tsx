"use client";

import { MessageCircle, BriefcaseBusiness, Mic } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <ChatTabs>
//   <TabList> — equal tabs (icon + label)
//   <ActiveTabHint> — shared description under the strip
// </ChatTabs>

export const TABS = [
  { id: "chat", label: "Chat", desc: "Pregunta o practica escribiendo", icon: MessageCircle },
  { id: "missions", label: "Misiones", desc: "Lee un guion en voz alta", icon: BriefcaseBusiness },
  { id: "pronunciation", label: "Pronunciación", desc: "Practica un sonido concreto", icon: Mic },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface ChatTabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function ChatTabs({ active, onChange }: ChatTabsProps) {
  const activeTab = TABS.find((tab) => tab.id === active) ?? TABS[0];

  return (
    <div className="@container flex w-full flex-col">
      <div
        role="tablist"
        aria-label="Modos del asistente"
        className="grid w-full grid-cols-3 border-b border-border-subtle"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={label}
              onClick={() => onChange(id)}
              className={cn(
                // Narrow panel/phone: icon above label. Wider coach chrome: one row.
                "flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-2",
                "@[22rem]:flex-row @[22rem]:gap-1.5 @[22rem]:px-2",
                "cursor-pointer border-none border-b-2 -mb-px bg-transparent",
                "text-caption transition-colors duration-(--transition-fast) focus-ring",
                "motion-reduce:transition-none",
                isActive
                  ? "border-b-primary font-medium text-fg"
                  : "border-b-transparent font-normal text-fg-subtle hover:text-fg-muted",
              )}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.6}
                className="shrink-0"
                aria-hidden
              />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="border-b border-border-subtle px-3 py-1.5 text-center text-caption text-pretty text-fg-subtle"
      >
        {activeTab.desc}
      </p>
    </div>
  );
}
