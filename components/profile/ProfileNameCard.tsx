"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { publicDataErrorMessage } from "@/lib/degradation/messages";

interface Props {
  currentName: string;
  onSave: (name: string) => Promise<void>;
}
export default function ProfileNameCard({ currentName, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    try {
      setError("");
      setIsSaving(true);
      await onSave(value.trim());
      setIsEditing(false);
    } catch {
      setError(publicDataErrorMessage());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(currentName);
    setIsEditing(false);
    setError("");
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-kicker text-fg-subtle">
          Nombre para mostrar
        </span>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="py-1 text-body-sm font-medium text-fg">
          {currentName || <span className="text-fg-subtle">No configurado</span>}
        </p>
      ) : (
        <form onSubmit={handleSave} className="mt-2 space-y-2">
          <label htmlFor="profile-name-input" className="sr-only">
            Tu nombre completo
          </label>
          <input
            id="profile-name-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tu nombre completo"
            autoComplete="name"
            autoFocus
            className="w-full rounded-sm border border-border-default bg-surface-sunken px-3 py-2 text-body-sm text-fg transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-caption text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? "Guardando…" : "Guardar"}
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
