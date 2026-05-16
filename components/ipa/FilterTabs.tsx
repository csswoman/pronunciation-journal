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
          variant="chip"
          size="sm"
          selected={activeTab === tab.id}
          className="rounded-full"
        >
          {TAB_ICONS[tab.id]}
          {tab.label}
          {counts?.[tab.id] !== undefined && (
            <span
              className={`ml-1 rounded-full px-1.5 py-0.5 text-tiny font-bold leading-none ${
                activeTab === tab.id
                  ? "bg-[var(--overlay-light)] text-[var(--on-primary)]"
                  : "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)]"
              }`}
            >
              {counts[tab.id]}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
