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
      className="inline-flex items-center gap-0.5 p-0.5 rounded-xl"
      style={{ backgroundColor: "var(--btn-regular-bg)" }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
              backgroundColor: isActive ? "var(--card-bg)" : "transparent",
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
