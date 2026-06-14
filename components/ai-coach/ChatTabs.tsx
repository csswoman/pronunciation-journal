"use client";

import { MessageCircle, BriefcaseBusiness, Mic } from "lucide-react";
import { cn } from "@/lib/cn";

export const TABS = [
  { id: "chat", label: "Chat", desc: "Ask anything", icon: MessageCircle },
  { id: "interview", label: "Interview", desc: "Practice real scenarios", icon: BriefcaseBusiness },
  { id: "pronunciation", label: "Pronunciation", desc: "Work a specific sound", icon: Mic },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface ChatTabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function ChatTabs({ active, onChange }: ChatTabsProps) {
  return (
    <div className="flex w-full border-b border-[var(--border)]">
      {TABS.map(({ id, label, desc, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-3 px-0",
              "text-[13px] font-normal whitespace-nowrap cursor-pointer",
              "bg-transparent border-none border-b-2 -mb-px",
              "transition-colors duration-[var(--transition-fast)]",
              isActive
                ? "text-[var(--text-primary)] font-medium border-b-[var(--primary)]"
                : "text-[var(--text-tertiary)] border-b-transparent hover:text-[var(--text-secondary)]"
            )}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
              <span>{label}</span>
            </div>
            {isActive && (
              <span
                className={cn(
                  "text-[11px] text-[var(--text-tertiary)] transition-opacity",
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
