"use client";

import { MessageCircle, BriefcaseBusiness, Mic } from "lucide-react";
import s from "./ChatTabs.module.css";

export const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "interview", label: "Interview", icon: BriefcaseBusiness },
  { id: "pronunciation", label: "Pronunciation", icon: Mic },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface ChatTabsProps {
  active: TabId;
  onChange: (id: TabId) => void;
}

export default function ChatTabs({ active, onChange }: ChatTabsProps) {
  return (
    <div className={s.tabs}>
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`${s.tab} ${isActive ? s.tabActive : ""}`}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
