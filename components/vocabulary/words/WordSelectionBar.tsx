"use client";

import { X, FolderPlus, FolderInput } from "lucide-react";
import Button from "@/components/ui/Button";

interface WordSelectionBarProps {
  count: number;
  onClear: () => void;
  onCreateDeck: () => void;
  onAddToExistingDeck: () => void;
}

export function WordSelectionBar({ count, onClear, onCreateDeck, onAddToExistingDeck }: WordSelectionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[var(--radius-lg)] border border-[var(--line-divider)] bg-[var(--card-bg)] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.08)]">
      <span className="min-w-[60px] text-[13px] font-semibold text-[var(--fg)]">
        {count} selected
      </span>
      <div className="h-5 w-px bg-[var(--line-divider)]" />
      <Button
        variant="ghost"
        size="sm"
        icon={<FolderInput size={14} />}
        onClick={onAddToExistingDeck}
        className="text-[13px]"
      >
        Add to deck
      </Button>
      <Button
        variant="primary"
        size="sm"
        icon={<FolderPlus size={14} />}
        onClick={onCreateDeck}
        className="text-[13px]"
      >
        New deck
      </Button>
      <button
        onClick={onClear}
        aria-label="Clear selection"
        className="ml-0.5 cursor-pointer rounded-[var(--radius-sm)] p-1 leading-none text-[var(--text-tertiary)]"
      >
        <X size={15} />
      </button>
    </div>
  );
}
