"use client";

import { MessageCircle, Theater, Mic } from "lucide-react";

export const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "roleplay", label: "Roleplay", icon: Theater },
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
      className="flex items-center gap-1 px-3 py-2 border-b flex-shrink-0"
      style={{ borderColor: "var(--line-divider)" }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: isActive ? "var(--btn-regular-bg-active)" : "transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
