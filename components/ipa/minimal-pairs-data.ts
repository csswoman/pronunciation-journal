export interface MinimalPairContrast {
  /** Stable id for the contrast (used as React key). */
  id: string;
  phonemeA: string;
  phonemeB: string;
  /** Short hint comparing the two sounds (Spanish). */
  hint: string;
  pairs: { wordA: string; wordB: string }[];
}

/**
 * Curated minimal-pair contrasts. Words ship with the phoneme pair already
 * implicit — `wordA` uses `phonemeA`, `wordB` uses `phonemeB`.
 */
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
    id: "æ-e",
    phonemeA: "/æ/",
    phonemeB: "/e/",
    hint: "/æ/ abre la boca más que /e/.",
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
