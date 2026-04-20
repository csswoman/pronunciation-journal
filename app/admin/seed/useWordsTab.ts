"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Sound, Word, WordForm } from "@/lib/admin/seed/types";
import { fetchSoundsAndWords, insertWord } from "@/lib/admin/seed/services";

type Status = { ok: boolean; msg: string } | null;

export function useWordsTab({
  form,
  setForm,
}: {
  form: WordForm;
  setForm: (form: WordForm) => void;
}) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [filterSound, setFilterSound] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { sounds: s, words: w } = await fetchSoundsAndWords();
    setSounds(s);
    setWords(w);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.word.trim()) return;

    setSaving(true);
    setStatus(null);

    const { error } = await insertWord({
      word: form.word.trim(),
      ipa: form.ipa.trim() || null,
      sound_id: form.soundId ? Number(form.soundId) : null,
      sound_focus: form.soundFocus.trim() || null,
      difficulty: form.difficulty ? Number(form.difficulty) : null,
      audio_url: null,
    });

    setSaving(false);

    if (error) {
      setStatus({ ok: false, msg: error.message });
      return;
    }

    setStatus({ ok: true, msg: `"${form.word.trim()}" added.` });
    setForm({ word: "", ipa: "", soundId: "", soundFocus: "", difficulty: "1" });
    load();
  }

  const displayed = filterSound ? words.filter((w) => String(w.sound_id) === filterSound) : words;
  const soundOptions = [
    { value: "", label: "— none —" },
    ...sounds.map((s) => ({ value: String(s.id), label: `/${s.ipa}/ (${s.category ?? s.type})` })),
  ];

  const setExternalForm = setForm;

  return {
    form,
    setForm,
    setExternalForm,
    sounds,
    words,
    filterSound,
    setFilterSound,
    status,
    saving,
    displayed,
    soundOptions,
    load,
    handleSubmit,
  };
}
