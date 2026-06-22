"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  Pattern,
  PatternForm,
  PatternWord,
  PatternWordForm,
} from "@/lib/admin/seed/types";
import {
  fetchPatternsAndPatternWords,
  insertPattern,
  insertPatternWord,
} from "@/lib/admin/seed/services";

type Status = { ok: boolean; msg: string } | null;

export function usePatternsTab({
  patternForm,
  setPatternForm,
  patternWordForm,
  setPatternWordForm,
}: {
  patternForm: PatternForm;
  setPatternForm: (form: PatternForm) => void;
  patternWordForm: PatternWordForm;
  setPatternWordForm: (form: PatternWordForm) => void;
}) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternWords, setPatternWords] = useState<PatternWord[]>([]);
  const [pStatus, setPStatus] = useState<Status>(null);
  const [pSaving, setPSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const load = useCallback(async () => {
    const { patterns: p, patternWords: pw } = await fetchPatternsAndPatternWords();
    setPatterns(p);
    setPatternWords(pw);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePatternSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patternForm.pattern.trim()) return;

    setPSaving(true);
    setPStatus(null);

    const { error } = await insertPattern({
      pattern: patternForm.pattern.trim(),
      type: patternForm.type || null,
      sound_focus: patternForm.focus.trim() || null,
    });

    setPSaving(false);

    if (error) {
      setPStatus({ ok: false, msg: error.message });
      return;
    }

    setPStatus({ ok: true, msg: `Pattern "${patternForm.pattern.trim()}" added.` });
    setPatternForm({ pattern: "", type: "vowel", focus: "" });
    load();
  }

  async function handlePatternWordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patternWordForm.patternId || !patternWordForm.word.trim()) return;

    setPwSaving(true);
    setPwStatus(null);

    const { error } = await insertPatternWord({
      pattern_id: Number(patternWordForm.patternId),
      word: patternWordForm.word.trim(),
      ipa: patternWordForm.ipa.trim() || null,
    });

    setPwSaving(false);

    if (error) {
      setPwStatus({ ok: false, msg: error.message });
      return;
    }

    setPwStatus({ ok: true, msg: `"${patternWordForm.word.trim()}" added.` });
    setPatternWordForm({ ...patternWordForm, word: "", ipa: "" });
    load();
  }

  const patternOptions = [
    { value: "", label: "— select pattern —" },
    ...patterns.map((p) => ({ value: String(p.id), label: `"${p.pattern}" (${p.type ?? "?"})` })),
  ];

  const setExternalPatternForm = setPatternForm;
  const setExternalPatternWordForm = setPatternWordForm;

  return {
    patternForm,
    setPatternForm,
    setExternalPatternForm,
    patternWordForm,
    setPatternWordForm,
    setExternalPatternWordForm,
    patterns,
    patternWords,
    pStatus,
    pSaving,
    pwStatus,
    pwSaving,
    patternOptions,
    load,
    handlePatternSubmit,
    handlePatternWordSubmit,
  };
}
