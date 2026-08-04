"use client";

// Planned structure:
// <IPAReferenceDialog>
//   <backdrop>
//     <dialog>
//       <header /> (title + close button)
//       <IPAChart />
//     </dialog>
//   </backdrop>
// </IPAReferenceDialog>

import { X } from "@/components/icons";
import IPAChart from "@/components/ipa/IPAChart";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import type { Lesson } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  lessons: Lesson[];
}

export function IPAReferenceDialog({ open, onClose, lessons }: Props) {
  const { dialogRef } = useDialogFocus<HTMLDivElement>(
    open,
    onClose,
    '[aria-label="Cerrar tabla IPA"]',
  );

  if (!open) return null;

  return (
    <div
      className="sound-lab__ipa-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="sound-lab__ipa-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ipa-reference-dialog-title"
        tabIndex={-1}
      >
        <div className="sound-lab__ipa-dialog-header">
          <h2 id="ipa-reference-dialog-title" className="font-h4 text-fg">
            Tabla IPA
          </h2>
          <button
            type="button"
            className="sound-lab__ipa-dialog-close"
            onClick={onClose}
            aria-label="Cerrar tabla IPA"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="sound-lab__ipa-dialog-body">
          <IPAChart lessons={lessons} />
        </div>
      </div>
    </div>
  );
}
