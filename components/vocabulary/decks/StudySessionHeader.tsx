"use client";

import { ChevronLeft } from "lucide-react";
import Button from "@/components/ui/Button";

interface StudySessionHeaderProps {
  label: string;
  currentIndex: number;
  total: number;
  progress: number;
  onClose: () => void;
}

export function StudySessionHeader({ label, currentIndex, total, progress, onClose }: StudySessionHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
      <Button variant="ghost" size="icon" onClick={onClose} title="Back">
        <ChevronLeft size={20} />
      </Button>
      <span className="font-semibold text-sm shrink-0 text-fg">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--btn-regular-bg)]">
        <div
          className="h-full rounded-full transition-all duration-500 bg-[var(--warning)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono shrink-0 text-fg-subtle">
        {currentIndex + 1}/{total}
      </span>
    </div>
  );
}
