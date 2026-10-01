"use client";

// Planned structure:
// <IPAReferenceDialog>
//   <backdrop>
//     <dialog>
//       <IPAModalContent />
//     </dialog>
//   </backdrop>
// </IPAReferenceDialog>

import { IPAModalContent } from "@/components/ipa/IPAModalContent";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { Lesson } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  lessons?: Lesson[];
}

export function IPAReferenceDialog({ open, onClose }: Props) {
  const { dialogRef } = useDialogFocus<HTMLDivElement>(
    open,
    onClose,
    '[aria-label="Cerrar tabla IPA"]'
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-4xl bg-surface-raised border border-border-subtle rounded-3xl shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ipa-reference-dialog-title"
        tabIndex={-1}
      >
        <IPAModalContent onClose={onClose} />
      </div>
    </div>
  );
}
