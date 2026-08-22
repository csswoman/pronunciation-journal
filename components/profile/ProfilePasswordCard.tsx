"use client";

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
    "w-full px-3 py-2 text-body-sm rounded-sm bg-surface-sunken border border-border-default text-fg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-kicker text-fg-subtle">
          Contraseña
        </span>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Cambiar
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="py-1 text-body-sm tracking-[0.2em] text-fg-subtle">••••••••</p>
      ) : (
        <form onSubmit={handleSave} className="mt-2 space-y-2">
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
          {error && <p className="text-caption text-error">{error}</p>}
          <div className="flex gap-2">
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
