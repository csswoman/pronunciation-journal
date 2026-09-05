// Planned structure:
// <ProfilePasswordCard>
//   <PasswordDisplayRow />
//   <PasswordEditForm />
// </ProfilePasswordCard>

import { useState } from "react";
import Button from "@/components/ui/Button";
import { publicAuthErrorMessage } from "@/lib/auth/password-policy";

interface Props {
  onSave: (password: string) => Promise<void>;
}

export default function ProfilePasswordCard({ onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError("La contraseña no puede estar vacía");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      setError("");
      setIsSaving(true);
      await onSave(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch {
      setError(publicAuthErrorMessage());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewPassword("");
    setConfirmPassword("");
    setIsEditing(false);
    setError("");
  };

  const inputClass =
    "w-full rounded-md border border-border-default bg-surface-sunken px-3.5 py-2 text-body-sm text-fg transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-caption font-medium text-fg-muted">
          Contraseña
        </span>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Cambiar
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="mt-1 text-body-sm tracking-[0.25em] text-fg-subtle">••••••••</p>
      ) : (
        <form onSubmit={handleSave} className="mt-2.5 space-y-2.5">
          <div>
            <label htmlFor="new-password-input" className="sr-only">
              Nueva contraseña
            </label>
            <input
              id="new-password-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              autoComplete="new-password"
              autoFocus
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm-password-input" className="sr-only">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {error && <p className="font-caption text-error">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? "Guardando…" : "Actualizar contraseña"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
