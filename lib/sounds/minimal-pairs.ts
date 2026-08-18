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
  // ─── VOCALES ──────────────────────────────────────────────────────────
  {
    id: "iː-ɪ",
    phonemeA: "/iː/",
    phonemeB: "/ɪ/",
    hint: "/iː/ es largo y tenso (sonrisa), /ɪ/ es corto y relajado (neutro).",
    pairs: [
      { wordA: "sheep", wordB: "ship" },
      { wordA: "seat", wordB: "sit" },
      { wordA: "feet", wordB: "fit" },
      { wordA: "leave", wordB: "live" },
      { wordA: "beat", wordB: "bit" },
      { wordA: "peel", wordB: "pill" },
      { wordA: "reach", wordB: "rich" },
      { wordA: "heat", wordB: "hit" },
    ],
  },
  {
    id: "uː-ʊ",
    phonemeA: "/uː/",
    phonemeB: "/ʊ/",
    hint: "/uː/ redondea los labios con fuerza; /ʊ/ es corta y relajada.",
    pairs: [
      { wordA: "fool", wordB: "full" },
      { wordA: "pool", wordB: "pull" },
      { wordA: "luke", wordB: "look" },
      { wordA: "suit", wordB: "soot" },
      { wordA: "stewed", wordB: "stood" },
      { wordA: "shoot", wordB: "should" },
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
      { wordA: "match", wordB: "much" },
      { wordA: "track", wordB: "truck" },
    ],
  },
  {
    id: "æ-ɛ",
    phonemeA: "/æ/",
    phonemeB: "/ɛ/",
    hint: "/æ/ abre la mandíbula mucho más que /ɛ/.",
    pairs: [
      { wordA: "bad", wordB: "bed" },
      { wordA: "man", wordB: "men" },
      { wordA: "sat", wordB: "set" },
      { wordA: "pan", wordB: "pen" },
      { wordA: "flash", wordB: "flesh" },
      { wordA: "land", wordB: "lend" },
    ],
  },
  {
    id: "ɛ-ɪ",
    phonemeA: "/ɛ/",
    phonemeB: "/ɪ/",
    hint: "/ɛ/ abre la boca como en 'mesa'; /ɪ/ es más cerrada hacia arriba.",
    pairs: [
      { wordA: "pen", wordB: "pin" },
      { wordA: "ten", wordB: "tin" },
      { wordA: "mess", wordB: "miss" },
      { wordA: "bet", wordB: "bit" },
      { wordA: "fell", wordB: "fill" },
      { wordA: "dead", wordB: "did" },
    ],
  },
  {
    id: "ɑ-ʌ",
    phonemeA: "/ɑ/",
    phonemeB: "/ʌ/",
    hint: "/ɑ/ baja la mandíbula al máximo (médico); /ʌ/ es relajada al centro.",
    pairs: [
      { wordA: "cop", wordB: "cup" },
      { wordA: "lock", wordB: "luck" },
      { wordA: "hot", wordB: "hut" },
      { wordA: "body", wordB: "buddy" },
      { wordA: "fond", wordB: "fund" },
    ],
  },
  {
    id: "ɔ-oʊ",
    phonemeA: "/ɔ/",
    phonemeB: "/oʊ/",
    hint: "/ɔ/ es vocal pura abierta; /oʊ/ es un diptongo que se cierra en /ʊ/.",
    pairs: [
      { wordA: "bought", wordB: "boat" },
      { wordA: "caught", wordB: "coat" },
      { wordA: "cost", wordB: "coast" },
      { wordA: "law", wordB: "low" },
      { wordA: "saw", wordB: "sew" },
      { wordA: "call", wordB: "coal" },
    ],
  },

  // ─── CONSONANTES ──────────────────────────────────────────────────────
  {
    id: "b-v",
    phonemeA: "/b/",
    phonemeB: "/v/",
    hint: "/b/ junta los dos labios; /v/ apoya los dientes superiores en el labio inferior.",
    pairs: [
      { wordA: "ban", wordB: "van" },
      { wordA: "bat", wordB: "vat" },
      { wordA: "berry", wordB: "very" },
      { wordA: "boat", wordB: "vote" },
      { wordA: "best", wordB: "vest" },
      { wordA: "curb", wordB: "curve" },
    ],
  },
  {
    id: "v-w",
    phonemeA: "/v/",
    phonemeB: "/w/",
    hint: "/v/ tiene fricción con los dientes; /w/ es un redondeo suave sin dientes.",
    pairs: [
      { wordA: "vet", wordB: "wet" },
      { wordA: "vine", wordB: "wine" },
      { wordA: "vest", wordB: "west" },
      { wordA: "viper", wordB: "wiper" },
      { wordA: "vow", wordB: "wow" },
    ],
  },
  {
    id: "θ-s",
    phonemeA: "/θ/",
    phonemeB: "/s/",
    hint: "/θ/ saca la lengua entre los dientes; /s/ la mantiene detrás.",
    pairs: [
      { wordA: "think", wordB: "sink" },
      { wordA: "thin", wordB: "sin" },
      { wordA: "thank", wordB: "sank" },
      { wordA: "path", wordB: "pass" },
      { wordA: "thumb", wordB: "sum" },
      { wordA: "mouth", wordB: "mouse" },
    ],
  },
  {
    id: "θ-t",
    phonemeA: "/θ/",
    phonemeB: "/t/",
    hint: "/θ/ es aire continuo entre dientes; /t/ es un golpe seco alveolar.",
    pairs: [
      { wordA: "three", wordB: "tree" },
      { wordA: "thick", wordB: "tick" },
      { wordA: "thought", wordB: "taught" },
      { wordA: "bath", wordB: "bat" },
      { wordA: "cloth", wordB: "clot" },
      { wordA: "thin", wordB: "tin" },
    ],
  },
  {
    id: "ð-d",
    phonemeA: "/ð/",
    phonemeB: "/d/",
    hint: "/ð/ es suave con la lengua entre los dientes; /d/ es un golpe seco.",
    pairs: [
      { wordA: "they", wordB: "day" },
      { wordA: "those", wordB: "doze" },
      { wordA: "though", wordB: "dough" },
      { wordA: "breathe", wordB: "breed" },
      { wordA: "then", wordB: "den" },
      { wordA: "there", wordB: "dare" },
    ],
  },
  {
    id: "s-z",
    phonemeA: "/s/",
    phonemeB: "/z/",
    hint: "/s/ es sorda (sin voz); /z/ hace vibrar las cuerdas vocales como una abeja.",
    pairs: [
      { wordA: "sue", wordB: "zoo" },
      { wordA: "peace", wordB: "peas" },
      { wordA: "ice", wordB: "eyes" },
      { wordA: "bus", wordB: "buzz" },
      { wordA: "loose", wordB: "lose" },
      { wordA: "price", wordB: "prize" },
      { wordA: "race", wordB: "raise" },
    ],
  },
  {
    id: "ʃ-tʃ",
    phonemeA: "/ʃ/",
    phonemeB: "/tʃ/",
    hint: "/ʃ/ es continua (shhh); /tʃ/ empieza con un bloqueo seco explosivo (ch).",
    pairs: [
      { wordA: "shop", wordB: "chop" },
      { wordA: "share", wordB: "chair" },
      { wordA: "sheep", wordB: "cheap" },
      { wordA: "wash", wordB: "watch" },
      { wordA: "wish", wordB: "witch" },
      { wordA: "cash", wordB: "catch" },
    ],
  },
  {
    id: "tʃ-dʒ",
    phonemeA: "/tʃ/",
    phonemeB: "/dʒ/",
    hint: "/tʃ/ es sorda (ch); /dʒ/ es sonora y vibra con fuerza en la garganta.",
    pairs: [
      { wordA: "rich", wordB: "ridge" },
      { wordA: "chump", wordB: "jump" },
      { wordA: "chain", wordB: "Jane" },
      { wordA: "cheap", wordB: "jeep" },
      { wordA: "choke", wordB: "joke" },
    ],
  },
  {
    id: "dʒ-j",
    phonemeA: "/dʒ/",
    phonemeB: "/j/",
    hint: "/dʒ/ tiene un golpe seco inicial (j); /j/ es un desliz suave como la 'y' en 'yes'.",
    pairs: [
      { wordA: "joke", wordB: "yoke" },
      { wordA: "juice", wordB: "use" },
      { wordA: "jam", wordB: "yam" },
      { wordA: "jet", wordB: "yet" },
      { wordA: "jealous", wordB: "zealous" },
    ],
  },
  {
    id: "ŋ-n",
    phonemeA: "/ŋ/",
    phonemeB: "/n/",
    hint: "/ŋ/ se produce al fondo de la boca (velar); /n/ toca la punta detrás de los dientes.",
    pairs: [
      { wordA: "sing", wordB: "sin" },
      { wordA: "ring", wordB: "rin" },
      { wordA: "thing", wordB: "thin" },
      { wordA: "bang", wordB: "ban" },
      { wordA: "wing", wordB: "win" },
      { wordA: "ping", wordB: "pin" },
    ],
  },
  {
    id: "h-silent",
    phonemeA: "/h/",
    phonemeB: "vocal",
    hint: "/h/ expulsa un soplo de aire cálido; la vocal inicial no tiene soplo.",
    pairs: [
      { wordA: "heat", wordB: "eat" },
      { wordA: "harm", wordB: "arm" },
      { wordA: "hair", wordB: "air" },
      { wordA: "hold", wordB: "old" },
      { wordA: "heart", wordB: "art" },
      { wordA: "hate", wordB: "eight" },
    ],
  },
  {
    id: "t-d-final",
    phonemeA: "/t/",
    phonemeB: "/d/",
    hint: "Al final de palabra: antes de /t/ la vocal es corta; antes de /d/ se alarga.",
    pairs: [
      { wordA: "beat", wordB: "bead" },
      { wordA: "write", wordB: "ride" },
      { wordA: "hat", wordB: "had" },
      { wordA: "light", wordB: "lied" },
      { wordA: "set", wordB: "said" },
      { wordA: "bit", wordB: "bid" },
    ],
  },
  {
    id: "p-b-final",
    phonemeA: "/p/",
    phonemeB: "/b/",
    hint: "/p/ corta la vocal anterior bruscamente; /b/ permite que la vocal resuene.",
    pairs: [
      { wordA: "cap", wordB: "cab" },
      { wordA: "rope", wordB: "robe" },
      { wordA: "mop", wordB: "mob" },
      { wordA: "lap", wordB: "lab" },
      { wordA: "rip", wordB: "rib" },
    ],
  },
  {
    id: "k-g-final",
    phonemeA: "/k/",
    phonemeB: "/g/",
    hint: "/k/ final es un corte sordo; /g/ final tiene resonancia con voz.",
    pairs: [
      { wordA: "pick", wordB: "pig" },
      { wordA: "back", wordB: "bag" },
      { wordA: "dock", wordB: "dog" },
      { wordA: "lock", wordB: "log" },
      { wordA: "duck", wordB: "dug" },
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
