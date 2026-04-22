"use client";

import { MessageCircle, UserRound, Mic } from "lucide-react";

export const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "roleplay", label: "Roleplay", icon: UserRound },
  { id: "pronunciation", label: "Pronunciation", icon: Mic },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface ChatTabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function ChatTabs({ active, onChange }: ChatTabsProps) {
  return (
    <div
      className="flex items-center gap-0.5 px-3 border-b flex-shrink-0"
      style={{ borderColor: "var(--line-divider)" }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: isActive ? "var(--primary)" : "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
            {label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--primary)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
