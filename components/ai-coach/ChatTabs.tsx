"use client";

import { MessageCircle, BriefcaseBusiness, Mic } from "@/components/icons";
import { cn } from "@/lib/cn";

export const TABS = [
  { id: "chat", label: "Chat", desc: "Pregunta lo que necesites", icon: MessageCircle },
  { id: "missions", label: "Misiones", desc: "Completa un objetivo real", icon: BriefcaseBusiness },
  { id: "pronunciation", label: "Pronunciación", desc: "Practica un sonido concreto", icon: Mic },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface ChatTabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function ChatTabs({ active, onChange }: ChatTabsProps) {
  return (
    <div className="flex w-full border-b border-border-subtle">
      {TABS.map(({ id, label, desc, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(id)}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-0 py-2",
              "text-caption font-normal whitespace-nowrap cursor-pointer",
              "bg-transparent border-none border-b-2 -mb-px",
              "transition-colors duration-[var(--transition-fast)]",
              isActive
                ? "text-fg font-medium border-b-primary"
                : "text-fg-subtle border-b-transparent hover:text-fg-muted"
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
              <span>{label}</span>
            </div>
            {isActive && (
              <span
                className={cn(
                  "text-tiny text-fg-subtle transition-opacity",
                  isActive && "opacity-100"
                )}
              >
                {desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
