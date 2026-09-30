"use client";

// Planned structure:
// <ProfileAccountCard>
//   <AccountTitleHeader />
//   <AccountDetailsList>
//     <EmailRow />
//     <PasswordRow />
//     <ExportVocabularyRow />
//     <DeleteAccountRow />
//   </AccountDetailsList>
//   <DeleteAccountModal />
// </ProfileAccountCard>

import { useState } from "react";
import ProfilePasswordCard from "./ProfilePasswordCard";
import DeleteAccountModal from "./DeleteAccountModal";

interface Props {
  email?: string;
  isGuest?: boolean;
  onPasswordSave: (password: string) => Promise<void>;
  onExportVocabulary: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export default function ProfileAccountCard({
  email,
  isGuest = false,
  onPasswordSave,
  onExportVocabulary,
  onDeleteAccount,
}: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await onExportVocabulary();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={onDeleteAccount}
      />

      <section
        aria-labelledby="profile-account-title"
        className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs"
      >
        <h2 id="profile-account-title" className="m-0 font-display text-h3 font-bold text-fg">
          Cuenta y seguridad
        </h2>

        <div className="divide-y divide-border-subtle pt-2">
          {/* Row 1: Correo */}
          <div className="flex items-center justify-between gap-3 py-3.5">
            <span className="shrink-0 whitespace-nowrap font-caption text-fg-muted">Correo</span>
            <span className="truncate font-label text-body-sm font-semibold text-fg">
              {isGuest ? "Invitado (Local)" : email || "Sin correo"}
            </span>
          </div>

          {/* Row 2: Contraseña */}
          <div className="py-3.5">
            <ProfilePasswordCard onSave={onPasswordSave} />
          </div>

          {/* Row 3: Tus datos */}
          <div className="flex flex-col gap-2 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 whitespace-nowrap font-caption text-fg-muted">Tus datos</span>
              <button
                onClick={() => void handleExport()}
                disabled={isExporting}
                className="shrink-0 whitespace-nowrap rounded-full border border-border-default px-3.5 py-1.5 font-label text-caption font-semibold text-fg transition-colors hover:bg-surface-sunken disabled:opacity-50"
                type="button"
              >
                {isExporting ? "Exportando…" : "Exportar mi vocabulario"}
              </button>
            </div>
          </div>

          {/* Row 4: Eliminar mi cuenta */}
          <div className="pt-4 text-center">
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="font-caption font-semibold text-error transition-colors hover:underline"
              type="button"
            >
              Eliminar mi cuenta
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
