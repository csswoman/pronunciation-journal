"use client";

import { BookMarked, Layers } from "lucide-react";

export const VOCAB_TABS = [
  { id: "words", label: "Word Bank", icon: BookMarked },
  { id: "decks", label: "Decks", icon: Layers },
] as const;

export type VocabTabId = (typeof VOCAB_TABS)[number]["id"];

interface VocabTabsProps {
  active: VocabTabId;
  onChange: (id: VocabTabId) => void;
}

export default function VocabTabs({ active, onChange }: VocabTabsProps) {
  return (
    <div className="flex w-full border-b border-border-default">
      {VOCAB_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm -mb-px border-b-2 transition-colors whitespace-nowrap cursor-pointer bg-transparent ${
              isActive
                ? "font-semibold text-fg border-primary"
                : "font-normal text-fg-muted border-transparent"
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
