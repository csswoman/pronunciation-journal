"use client";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface DrawerHeaderProps {
  onClose: () => void;
}

export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--line-divider)] bg-[var(--card-bg)]">
      <h2 className="font-semibold text-[var(--deep-text)]">Manage Deck</h2>
      <Button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] text-[var(--text-tertiary)] transition-colors"
      >
        <X size={20} />
      </Button>
    </div>
  );
}
