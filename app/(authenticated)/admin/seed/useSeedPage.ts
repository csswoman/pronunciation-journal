"use client";

import { useState, useEffect } from "react";
import type {
  ApplyPayload,
  MinimalPairForm,
  PatternForm,
  PatternWordForm,
  Sound,
  SoundForm,
  Tab,
  WordForm,
} from "@/lib/admin/seed/types";
import { fetchSounds } from "@/lib/admin/seed/services";

const DEFAULT_SOUND_FORM: SoundForm = { ipa: "", type: "vowel", category: "", example: "", difficulty: "1" };
const DEFAULT_WORD_FORM: WordForm = { word: "", ipa: "", soundId: "", soundFocus: "", difficulty: "1" };
const DEFAULT_PATTERN_FORM: PatternForm = { pattern: "", type: "vowel", focus: "" };
const DEFAULT_PATTERN_WORD_FORM: PatternWordForm = { patternId: "", word: "", ipa: "" };
const DEFAULT_MP_FORM: MinimalPairForm = { wordA: "", wordB: "", ipaA: "", ipaB: "", soundGroup: "", soundAId: "", soundBId: "", contrastAId: "", contrastBId: "", contrastIpaA: "", contrastIpaB: "" };

export function useSeedPage() {
  const [tab, setTab] = useState<Tab>("sounds");
  const [allSounds, setAllSounds] = useState<Sound[]>([]);

  const [soundForm, setSoundForm] = useState<SoundForm>(DEFAULT_SOUND_FORM);
  const [wordForm, setWordForm] = useState<WordForm>(DEFAULT_WORD_FORM);
  const [patternForm, setPatternForm] = useState<PatternForm>(DEFAULT_PATTERN_FORM);
  const [patternWordForm, setPatternWordForm] = useState<PatternWordForm>(DEFAULT_PATTERN_WORD_FORM);
  const [mpForm, setMpForm] = useState<MinimalPairForm>(DEFAULT_MP_FORM);

  useEffect(() => {
    fetchSounds().then(setAllSounds);
  }, []);

  function handleApply(payload: ApplyPayload) {
    if (payload.tab === "pattern_words") {
      setTab("patterns");
      setPatternWordForm((prev) => ({ ...prev, ...payload.data }));
      return;
    }
    setTab(payload.tab);
    if (payload.tab === "sounds")        setSoundForm((prev) => ({ ...prev, ...payload.data }));
    if (payload.tab === "words")         setWordForm((prev) => ({ ...prev, ...payload.data }));
    if (payload.tab === "patterns")      setPatternForm((prev) => ({ ...prev, ...payload.data }));
    if (payload.tab === "minimal_pairs") setMpForm((prev) => ({ ...prev, ...payload.data }));
  }

  return {
    tab, setTab,
    allSounds,
    soundForm, setSoundForm,
    wordForm, setWordForm,
    patternForm, setPatternForm,
    patternWordForm, setPatternWordForm,
    mpForm, setMpForm,
    handleApply,
  };
}
