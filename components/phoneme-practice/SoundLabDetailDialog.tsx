"use client";

import { useEffect, type RefObject } from "react";
import type { Lesson } from "@/lib/types";
import type { PhonemeData } from "@/components/ipa/data";
import { SoundHeroCard } from "./SoundHeroCard";
import { SoundDetailBody } from "./SoundDetailBody";

// Planned structure:
// <SoundLabDetailDialog>
//   <SoundHeroCard /> (light pastel top section)
//   <SoundDetailBody /> (dark bottom section)
// </SoundLabDetailDialog>

export interface SoundLabDetailDialogProps {
  dialogRef: RefObject<HTMLDivElement | null>;
  phoneme: PhonemeData;
  lesson: Lesson;
  progressPct?: number;
  isWeak?: boolean;
  isContinuing?: boolean;
  practiceHref?: string;
  onPractice: () => void;
  onClose: () => void;
}

export function SoundLabDetailDialog({
  dialogRef,
  phoneme,
  lesson,
  progressPct = 0,
  onPractice,
  onClose,
}: SoundLabDetailDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-[560px] sm:max-w-[620px] max-h-[92vh] overflow-y-auto rounded-3xl text-fg shadow-2xl focus:outline-none flex flex-col gap-3 sm:gap-4 p-0 bg-transparent border-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-dialog-title"
        tabIndex={-1}
      >
        <SoundHeroCard
          phoneme={phoneme}
          lesson={lesson}
          progressPct={progressPct}
          onClose={onClose}
        />

        <SoundDetailBody
          phoneme={phoneme}
          progressPct={progressPct}
          onPractice={onPractice}
        />
      </div>
    </div>
  );
}
