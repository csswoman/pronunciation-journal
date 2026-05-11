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
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        background: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", minWidth: 60 }}>
        {count} selected
      </span>
      <div style={{ width: 1, height: 20, background: "var(--line-divider)" }} />
      <Button
        variant="ghost"
        size="sm"
        icon={<FolderInput size={14} />}
        onClick={onAddToExistingDeck}
        style={{ fontSize: 13 }}
      >
        Add to deck
      </Button>
      <Button
        variant="primary"
        size="sm"
        icon={<FolderPlus size={14} />}
        onClick={onCreateDeck}
        style={{ fontSize: 13 }}
      >
        New deck
      </Button>
      <button
        onClick={onClear}
        aria-label="Clear selection"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          padding: 4,
          lineHeight: 0,
          borderRadius: "var(--radius-sm)",
          marginLeft: 2,
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
