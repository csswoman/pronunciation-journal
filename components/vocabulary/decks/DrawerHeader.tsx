"use client";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";

interface DrawerHeaderProps {
  onClose: () => void;
}

export function DrawerHeader({ onClose }: DrawerHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--line-divider)] bg-[var(--card-bg)]">
      <H2 className="font-semibold">Manage Deck</H2>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X size={20} />
      </Button>
    </div>
  );
}
