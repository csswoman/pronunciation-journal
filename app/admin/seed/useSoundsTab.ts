"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Sound, SoundForm } from "@/lib/admin/seed/types";
import { fetchSounds, insertSound } from "@/lib/admin/seed/services";

type Status = { ok: boolean; msg: string } | null;

export function useSoundsTab({
  form,
  setForm,
}: {
  form: SoundForm;
  setForm: (form: SoundForm) => void;
}) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchSounds();
    setSounds(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.ipa.trim()) return;

    setSaving(true);
    setStatus(null);

    const { error } = await insertSound({
      ipa: form.ipa.trim(),
      type: form.type as Sound["type"],
      category: form.category.trim() || null,
      example: form.example.trim() || null,
      difficulty: form.difficulty ? Number(form.difficulty) : null,
    });

    setSaving(false);

    if (error) {
      setStatus({ ok: false, msg: error.message });
      return;
    }

    setStatus({ ok: true, msg: `Sound /${form.ipa.trim()}/ added.` });
    setForm({ ipa: "", type: "vowel", category: "", example: "", difficulty: "1" });
    load();
  }

  const setExternalForm = setForm;

  return { form, setForm, setExternalForm, sounds, status, saving, load, handleSubmit };
}
