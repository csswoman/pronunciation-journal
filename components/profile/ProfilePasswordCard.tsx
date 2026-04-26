"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

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
    if (!newPassword.trim()) { setError("Password cannot be empty"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    try {
      setError("");
      setIsSaving(true);
      await onSave(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
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

  const inputClass = "w-full px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 transition-all";
  const inputStyle = {
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    "--tw-ring-color": "var(--primary)",
  } as React.CSSProperties;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
          Password
        </span>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Change
          </Button>
        )}
      </div>

      {!isEditing ? (
        <p className="text-sm tracking-[0.2em] py-1" style={{ color: "var(--text-tertiary)" }}>••••••••</p>
      ) : (
        <form onSubmit={handleSave} className="mt-2 space-y-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min. 6 characters)"
            autoFocus
            className={inputClass}
            style={inputStyle}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
            style={inputStyle}
          />
          {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : "Update password"}
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
