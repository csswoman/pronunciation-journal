"use client";

import type { RefObject } from "react";
import { SoundDetail } from "@/components/sounds/SoundDetail";
import type { Lesson } from "@/lib/types";
import type { PhonemeData } from "@/components/ipa/data";

// Planned structure:
// <SoundLabDetailDialog>
//   <backdrop />
//   <dialog>
//     <SoundDetail />
//   </dialog>
// </SoundLabDetailDialog>

interface SoundLabDetailDialogProps {
  dialogRef: RefObject<HTMLDivElement | null>;
  phoneme: PhonemeData;
  lesson: Lesson;
  progressPct: number;
  isWeak: boolean;
  isContinuing: boolean;
  practiceHref: string;
  onPractice: () => void;
  onClose: () => void;
}

export function SoundLabDetailDialog({
  dialogRef,
  phoneme,
  lesson,
  progressPct,
  isWeak,
  isContinuing,
  practiceHref,
  onPractice,
  onClose,
}: SoundLabDetailDialogProps) {
  return (
    <div
      className="sound-lab__detail-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="sound-lab__detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-detail-dialog-title"
        tabIndex={-1}
      >
        <SoundDetail
          phoneme={phoneme}
          titleId="sound-detail-dialog-title"
          lesson={lesson}
          progressPct={progressPct}
          isWeak={isWeak}
          isContinuing={isContinuing}
          practiceHref={practiceHref}
          onPractice={onPractice}
          onClose={onClose}
          descriptionId="sound-detail-dialog-description"
          className="sound-lab__detail-sheet"
        />
      </div>
    </div>
  );
}
