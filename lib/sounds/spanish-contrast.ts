import { canonicalizeSoundIpa } from "./inventory";

export type SpanishContrastLevel = "missing" | "confusable" | "similar";

export interface SpanishContrastInfo {
  level: SpanishContrastLevel;
  label: string;
  badgeLabel: string;
  shortDescription: string;
}

export const SPANISH_CONTRAST_META: Record<
  SpanishContrastLevel,
  { label: string; badgeLabel: string; chipClass: string; cardClass: string; ipaClass: string }
> = {
  missing: {
    label: "No existe en español",
    badgeLabel: "No existe en ES",
    chipClass: "sound-lab__chip--contrast-missing",
    cardClass: "sound-lab__card--contrast-missing",
    ipaClass: "sound-lab__ipa--contrast-missing",
  },
  confusable: {
    label: "Se confunde fácil",
    badgeLabel: "Se confunde",
    chipClass: "sound-lab__chip--contrast-confusable",
    cardClass: "sound-lab__card--contrast-confusable",
    ipaClass: "sound-lab__ipa--contrast-confusable",
  },
  similar: {
    label: "Similar al español",
    badgeLabel: "Similar",
    chipClass: "sound-lab__chip--contrast-similar",
    cardClass: "sound-lab__card--contrast-similar",
    ipaClass: "sound-lab__ipa--contrast-similar",
  },
};

/**
 * Clasificación contrastiva para hispanohablantes (General American vs Español).
 * - missing: No existe en español; requiere crear un nuevo patrón articulatorio y auditivo.
 * - confusable: Colapsa en pares mínimos o se confunde con fonemas cercanos en español.
 * - similar: Fonema con transferencia positiva o cercanía articulatoria notable.
 */
const PHONEME_CONTRAST_MAP: Record<string, SpanishContrastLevel> = {
  // ─── NO EXISTE EN ESPAÑOL (Máxima urgencia pedagógica / Rojo) ───────────
  "/æ/": "missing",   // Trap (cat, bad) — apertura anterior inexistente en español
  "/ɜr/": "missing",  // Nurse (bird, work) — vocal rótica fusionada
  "/ə/": "missing",   // Schwa (about, sofa) — reducción vocálica átona inexistente
  "/ʌ/": "missing",   // Strut (cup, bus) — vocal central media-baja corta
  "/ʊ/": "missing",   // Foot (book, put) — vocal posterior laxa
  "/θ/": "missing",   // Theta (think, bath) — interdental sorda ajena al español de América
  "/ð/": "missing",   // Eth (this, mother) — fricativa interdental sonora
  "/z/": "missing",   // Z (zoo, buzz) — fricativa alveolar sonora inexistente en español
  "/ʒ/": "missing",   // Zh (measure, vision) — fricativa postalveolar sonora
  "/v/": "missing",   // V (van, live) — fricativa labiodental; el español no distingue B/V
  "/ŋ/": "missing",   // Velar nasal en coda (sing, ring)
  "/h/": "missing",   // H glotal suave (hat, home) — distinta de la jota española

  // ─── SE CONFUNDE FÁCIL (Pares mínimos críticos / Ámbar) ─────────────────
  "/iː/": "confusable", // Fleece (sheep) vs Kit (/ɪ/)
  "/ɪ/": "confusable",  // Kit (ship) vs Fleece (/iː/)
  "/uː/": "confusable", // Goose (pool) vs Foot (/ʊ/)
  "/ɛ/": "confusable",  // Dress (bed) vs Trap (/æ/)
  "/ɔ/": "confusable",  // Thought (law, ball) vs Lot (/ɑ/)
  "/b/": "confusable",  // Plosiva bilabial que se confunde con /v/
  "/d/": "confusable",  // Alveolar plosive que se confunde con /ð/ o dental española
  "/ʃ/": "confusable",  // Sh (she) vs Ch (/tʃ/)
  "/dʒ/": "confusable", // J (job) vs Y (/j/) o Ch (/tʃ/)
  "/r/": "confusable",  // R postalveolar inglesa vs vibrante española
  "/oʊ/": "confusable", // Goat (go) — diptongo que se aplana a vocal pura

  // ─── SIMILAR AL ESPAÑOL (Bajo riesgo / Transferencia positiva / Verde) ─
  "/ɑ/": "similar",   // Lot (hot, stop) — similar a vocal abierta
  "/p/": "similar",   // Pen, stop
  "/t/": "similar",   // Ten, cat
  "/k/": "similar",   // Cat, key
  "/g/": "similar",   // Go, big
  "/f/": "similar",   // Fan, fish
  "/s/": "similar",   // See, city
  "/tʃ/": "similar",  // Church, chair — similar a la "ch"
  "/m/": "similar",   // Man, swim
  "/n/": "similar",   // No, run
  "/l/": "similar",   // Leg, fall
  "/j/": "similar",   // Yes, you — semivocal
  "/w/": "similar",   // Wet, water — semivocal
  "/eɪ/": "similar",  // Face (day, play) — diptongo similar a "ei"
  "/aɪ/": "similar",  // Price (my, time) — diptongo similar a "ai"
  "/ɔɪ/": "similar",  // Choice (boy, coin) — diptongo similar a "oi"
  "/aʊ/": "similar",  // Mouth (now, cow) — diptongo similar a "au"
};

export function getSpanishContrast(ipa: string): SpanishContrastInfo {
  const canonical = canonicalizeSoundIpa(ipa);
  const level = PHONEME_CONTRAST_MAP[canonical] ?? "similar";
  const meta = SPANISH_CONTRAST_META[level];

  return {
    level,
    label: meta.label,
    badgeLabel: meta.badgeLabel,
    shortDescription: meta.label,
  };
}

export interface SoundCardTag {
  label: string;
  type: "confusable" | "new";
}

const CONFUSABLE_TARGET_MAP: Record<string, string> = {
  "/ɛ/": "/i:/",
  "/ɔ/": "/ɑ/",
  "/uː/": "/ʊ/",
  "/b/": "/v/",
  "/d/": "/ð/",
  "/ʃ/": "/tʃ/",
  "/dʒ/": "/tʃ/",
};

export function getSoundCardTag(ipa: string): SoundCardTag | null {
  const canonical = canonicalizeSoundIpa(ipa);
  const target = CONFUSABLE_TARGET_MAP[canonical];
  if (target) {
    return {
      label: `Se confunde con ${target}`,
      type: "confusable",
    };
  }

  const level = PHONEME_CONTRAST_MAP[canonical];
  if (level === "missing") {
    return {
      label: "Nuevo",
      type: "new",
    };
  }

  return null;
}
