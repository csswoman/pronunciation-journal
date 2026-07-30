import { canonicalizeSoundIpa } from "./inventory";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";

export interface PhonemeMinimalPair {
  wordA: string;
  wordB: string;
  phonemeA: string;
  phonemeB: string;
}

export interface MinimalPairContrast {
  /** Stable id for the contrast. */
  id: string;
  phonemeA: string;
  phonemeB: string;
  /** Short hint comparing the two sounds. */
  hint: string;
  pairs: { wordA: string; wordB: string }[];
}

/** Curated contrasts used by the listening discrimination runner. */
export const MINIMAL_PAIR_CONTRASTS: MinimalPairContrast[] = [
  {
    id: "iː-ɪ",
    phonemeA: "/iː/",
    phonemeB: "/ɪ/",
    hint: "/iː/ es largo y tenso, /ɪ/ es corto y relajado.",
    pairs: [
      { wordA: "sheep", wordB: "ship" },
      { wordA: "seat", wordB: "sit" },
      { wordA: "feet", wordB: "fit" },
      { wordA: "leave", wordB: "live" },
      { wordA: "beat", wordB: "bit" },
    ],
  },
  {
    id: "æ-ʌ",
    phonemeA: "/æ/",
    phonemeB: "/ʌ/",
    hint: "/æ/ es muy abierta hacia adelante; /ʌ/ es central y relajada.",
    pairs: [
      { wordA: "cat", wordB: "cut" },
      { wordA: "bat", wordB: "but" },
      { wordA: "hat", wordB: "hut" },
      { wordA: "ran", wordB: "run" },
      { wordA: "ankle", wordB: "uncle" },
    ],
  },
  {
    id: "æ-ɛ",
    phonemeA: "/æ/",
    phonemeB: "/ɛ/",
    hint: "/æ/ abre la boca más que /ɛ/.",
    pairs: [
      { wordA: "bad", wordB: "bed" },
      { wordA: "man", wordB: "men" },
      { wordA: "sat", wordB: "set" },
      { wordA: "pan", wordB: "pen" },
    ],
  },
  {
    id: "b-v",
    phonemeA: "/b/",
    phonemeB: "/v/",
    hint: "/b/ junta los labios; /v/ usa labio inferior con dientes superiores.",
    pairs: [
      { wordA: "ban", wordB: "van" },
      { wordA: "bat", wordB: "vat" },
      { wordA: "berry", wordB: "very" },
      { wordA: "boat", wordB: "vote" },
    ],
  },
  {
    id: "θ-s",
    phonemeA: "/θ/",
    phonemeB: "/s/",
    hint: "/θ/ saca la lengua entre los dientes; /s/ queda detrás.",
    pairs: [
      { wordA: "think", wordB: "sink" },
      { wordA: "thin", wordB: "sin" },
      { wordA: "thank", wordB: "sank" },
      { wordA: "path", wordB: "pass" },
    ],
  },
  {
    id: "ð-d",
    phonemeA: "/ð/",
    phonemeB: "/d/",
    hint: "/ð/ es suave con la lengua entre los dientes; /d/ es un golpe.",
    pairs: [
      { wordA: "they", wordB: "day" },
      { wordA: "those", wordB: "doze" },
      { wordA: "though", wordB: "dough" },
      { wordA: "breathe", wordB: "breed" },
    ],
  },
  {
    id: "ʃ-tʃ",
    phonemeA: "/ʃ/",
    phonemeB: "/tʃ/",
    hint: "/ʃ/ es continua; /tʃ/ empieza con un golpe seco.",
    pairs: [
      { wordA: "shop", wordB: "chop" },
      { wordA: "share", wordB: "chair" },
      { wordA: "sheep", wordB: "cheap" },
      { wordA: "wash", wordB: "watch" },
    ],
  },
  {
    id: "ŋ-n",
    phonemeA: "/ŋ/",
    phonemeB: "/n/",
    hint: "/ŋ/ es nasal velar (atrás); /n/ es alveolar (delante).",
    pairs: [
      { wordA: "sing", wordB: "sin" },
      { wordA: "ring", wordB: "rin" },
      { wordA: "thing", wordB: "thin" },
      { wordA: "bang", wordB: "ban" },
    ],
  },
];

export function findMinimalPairContrastIndex(
  initialPhoneme?: string,
  initialContrastId?: string,
): number | null {
  if (initialContrastId) {
    const byId = MINIMAL_PAIR_CONTRASTS.findIndex(
      (contrast) => contrast.id === initialContrastId,
    );
    if (byId >= 0) return byId;
  }

  if (!initialPhoneme) return 0;
  const target = canonicalizeSoundIpa(initialPhoneme);
  const byPhoneme = MINIMAL_PAIR_CONTRASTS.findIndex((contrast) =>
    [contrast.phonemeA, contrast.phonemeB].some(
      (phoneme) => canonicalizeSoundIpa(phoneme) === target,
    ),
  );

  return byPhoneme >= 0 ? byPhoneme : null;
}

export function minimalPairsRunnerHref(phoneme: string): string {
  return `/practice/sounds/minimal-pairs?phoneme=${encodeURIComponent(
    canonicalizeSoundIpa(phoneme),
  )}`;
}

/** The only pairs a SoundDetail session may practice: its own preview data. */
export function getMinimalPairsForPhoneme(phoneme: string): PhonemeMinimalPair[] {
  return IPA_EXTRA[canonicalizeSoundIpa(phoneme)]?.minimalPairs ?? [];
}
