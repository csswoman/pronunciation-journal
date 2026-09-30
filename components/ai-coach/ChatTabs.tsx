"use client";

import { MessageCircle, BriefcaseBusiness, Mic } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <ChatTabs>
//   <TabList> — pill container with 3 equal tabs (icon + label)
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
  return (
    <div className="@container flex w-full flex-col px-3.5 py-2 sm:px-4 sm:py-2.5">
      <div
        role="tablist"
        aria-label="Modos del asistente"
        className="grid w-full grid-cols-3 items-center rounded-full border border-border-subtle/70 bg-surface-sunken/80 p-1 shadow-inner"
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
                "flex min-h-[38px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold sm:gap-2 sm:px-4",
                "transition-all duration-200 ease-out focus-ring motion-reduce:transition-none",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-fg-muted hover:bg-surface-raised/50 hover:text-fg",
              )}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={cn("shrink-0", isActive ? "text-white" : "text-fg-muted")}
                aria-hidden
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
