"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveTrackedItem } from "@/lib/tracking/queries";
import type { PersistedTrackedKind } from "@/lib/tracking/types";

interface Props {
  kind: PersistedTrackedKind;
  reference: string;
  title: string;
  payload?: Record<string, unknown>;
}

export function TrackingSaveButton({ kind, reference, title, payload }: Props) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user || saving) return;
    setSaving(true);
    try {
      await saveTrackedItem({ userId: user.id, kind, ref: reference, title, payload });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={() => void save()} disabled={!user || saving || saved}
      className="mini-lessons__btn mini-lessons__btn--ghost">
      {saved ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
      {saved ? "Guardada" : saving ? "Guardando…" : "Guardar en Tracking"}
    </button>
  );
}
