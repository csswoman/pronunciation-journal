"use client";

// Planned structure:
// <DeleteAccountModal>
//   <ModalOverlay>
//     <ModalHeader />
//     <ModalBody />
//     <ModalFooter>
//       <ConfirmButton />
//       <CancelButton />
//     </ModalFooter>
//   </ModalOverlay>
// </DeleteAccountModal>

import { useState } from "react";
import Button from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="layout-stack w-full max-w-md rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-lg">
        <div className="layout-stack-tight">
          <h2 id="delete-account-title" className="m-0 font-label text-h3 font-bold text-fg">
            ¿Eliminar mi cuenta?
          </h2>
          <p className="m-0 font-caption text-fg-muted">
            Esta acción cerrará tu sesión y restablecerá los datos locales. Tu progreso no podrá recuperarse tras la eliminación.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
            className="bg-error text-on-primary hover:bg-error/90"
          >
            {isDeleting ? "Eliminando…" : "Sí, eliminar cuenta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
