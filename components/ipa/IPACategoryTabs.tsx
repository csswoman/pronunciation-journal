"use client";

import { cn } from "@/lib/cn";

type MatrixCategory = "vowel" | "consonant" | "diphthong";

const TABS: { id: MatrixCategory; label: string }[] = [
  { id: "vowel", label: "Vocales" },
  { id: "consonant", label: "Consonantes" },
  { id: "diphthong", label: "Diptongos" },
];

export default function IPACategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: MatrixCategory;
  onChange: (id: MatrixCategory) => void;
  counts: Record<MatrixCategory, number>;
}) {
  return (
    <div className="ipa-chart__tabs">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn("ipa-chart__tab", isActive && "ipa-chart__tab--on")}
          >
            {tab.label}
            <span className="ipa-chart__tab-count">{counts[tab.id]}</span>
          </button>
        );
      })}

      <span className="ipa-chart__kbd-hint">
        <kbd className="ipa-chart__kbd">←</kbd>
        <kbd className="ipa-chart__kbd">→</kbd>
        navegar · <kbd className="ipa-chart__kbd">Space</kbd> reproducir
      </span>
    </div>
  );
}
