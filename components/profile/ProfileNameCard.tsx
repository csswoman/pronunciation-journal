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
    if (!value.trim()) { setError("Name cannot be empty"); return; }
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
      <div className="flex items-center justify-between mb-1">
      <span className="font-kicker text-fg-subtle">
          Display name
        </span>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="text-body-sm font-medium py-1 text-fg">
          {currentName || <span className="text-fg-subtle">Not set</span>}
        </p>
      ) : (
        <form onSubmit={handleSave} className="mt-2 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your full name"
            autoFocus
            className="w-full px-3 py-2 text-body-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-surface-sunken border border-border-default text-fg"
          />
          {error && <p className="text-caption text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
