"use client";

import Button from "@/components/ui/Button";
import type { FilterType } from "./data";

export default function FilterTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: FilterType; label: string; icon: string }[];
  activeTab: FilterType;
  onChange: (tab: FilterType) => void;
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
          <span>{tab.icon}</span>
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
