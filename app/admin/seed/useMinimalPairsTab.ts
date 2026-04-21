"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { MinimalPair, MinimalPairForm, Sound } from "@/lib/admin/seed/types";
import { fetchSoundsAndMinimalPairs, insertMinimalPair } from "@/lib/admin/seed/services";

type Status = { ok: boolean; msg: string } | null;

export function useMinimalPairsTab({
  form,
  setForm,
}: {
  form: MinimalPairForm;
  setForm: (form: MinimalPairForm) => void;
}) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [pairs, setPairs] = useState<MinimalPair[]>([]);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { sounds: s, pairs: p } = await fetchSoundsAndMinimalPairs();
    setSounds(s);
    setPairs(p);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.wordA.trim() || !form.wordB.trim()) return;

    setSaving(true);
    setStatus(null);

    const { error } = await insertMinimalPair({
      word_a: form.wordA.trim(),
      word_b: form.wordB.trim(),
      ipa_a: form.ipaA.trim() || null,
      ipa_b: form.ipaB.trim() || null,
      sound_group: form.soundGroup.trim() || null,
      sound_a_id: form.soundAId ? Number(form.soundAId) : null,
      sound_b_id: form.soundBId ? Number(form.soundBId) : null,
      contrast_sound_a_id: form.contrastAId ? Number(form.contrastAId) : null,
      contrast_sound_b_id: form.contrastBId ? Number(form.contrastBId) : null,
      contrast_ipa_a: form.contrastIpaA.trim() || null,
      contrast_ipa_b: form.contrastIpaB.trim() || null,
    });

    setSaving(false);

    if (error) {
      setStatus({ ok: false, msg: error.message });
      return;
    }

    setStatus({ ok: true, msg: `Pair "${form.wordA}" / "${form.wordB}" added.` });
    setForm({
      wordA: "",
      wordB: "",
      ipaA: "",
      ipaB: "",
      soundGroup: "",
      soundAId: "",
      soundBId: "",
      contrastAId: "",
      contrastBId: "",
      contrastIpaA: "",
      contrastIpaB: "",
    });
    load();
  }

  const soundOptions = [
    { value: "", label: "— none —" },
    ...sounds.map((s) => ({
      value: String(s.id),
      label: `/${s.ipa}/ — ${s.category ?? s.type} (id ${s.id})`,
    })),
  ];

  const setExternalForm = setForm;

  return { form, setForm, setExternalForm, sounds, pairs, status, saving, soundOptions, load, handleSubmit };
}
