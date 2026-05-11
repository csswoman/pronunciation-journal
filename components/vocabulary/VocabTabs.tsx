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
    <div style={{ display: "flex", width: "100%", borderBottom: "1px solid var(--border)" }}>
      {VOCAB_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px 0",
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--primary)" : "transparent"}`,
              marginBottom: -1,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 150ms",
            }}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
