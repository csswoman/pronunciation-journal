"use client";

import Button from "@/components/ui/Button";
import { Infinity, Mic2, MessageSquare, Waves } from "lucide-react";
import type { FilterType } from "./data";

const TAB_ICONS: Record<FilterType, React.ReactNode> = {
  all: <Infinity size={14} />,
  vowel: <Mic2 size={14} />,
  consonant: <MessageSquare size={14} />,
  diphthong: <Waves size={14} />,
};

export default function FilterTabs({
  tabs,
  activeTab,
  onChange,
  counts,
}: {
  tabs: { id: FilterType; label: string; icon: string }[];
  activeTab: FilterType;
  onChange: (tab: FilterType) => void;
  counts?: Partial<Record<FilterType, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          variant={activeTab === tab.id ? "primary" : "chip"}
          size="sm"
          selected={activeTab === tab.id}
          className="rounded-full"
        >
          {TAB_ICONS[tab.id]}
          {tab.label}
          {counts?.[tab.id] !== undefined && (
            <span
              className="ml-1 text-tiny font-bold px-1.5 py-0.5 rounded-full leading-none"
              style={{
                backgroundColor: activeTab === tab.id ? "var(--overlay-light)" : "var(--btn-regular-bg)",
                color: activeTab === tab.id ? "var(--on-primary)" : "var(--text-secondary)",
              }}
            >
              {counts[tab.id]}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
