export interface FallbackWordEntry {
  ipa: string;
  definition: string;
  example_sentence: string;
  example_translation?: string;
  part_of_speech?: string;
}

export const FALLBACK_DEFINITIONS: Record<string, FallbackWordEntry> = {
  quest: {
    ipa: "/kwɛst/",
    part_of_speech: "noun",
    definition: "Búsqueda o expedición en busca de un objetivo importante.",
    example_sentence: "They went on a quest to find the ancient treasure.",
    example_translation: "Fueron en una búsqueda para encontrar el tesoro antiguo.",
  },
  vivid: {
    ipa: "/ˈvɪv.ɪd/",
    part_of_speech: "adjective",
    definition: "Muy claro, brillante o lleno de vida.",
    example_sentence: "She gave a vivid description of her journey.",
    example_translation: "Ella dio una descripción muy vívida de su viaje.",
  },
  keen: {
    ipa: "/kiːn/",
    part_of_speech: "adjective",
    definition: "Entusiasta, muy interesado o de percepción aguda.",
    example_sentence: "He is keen to learn new pronunciation patterns.",
    example_translation: "Él está muy entusiasmado por aprender nuevos patrones de pronunciación.",
  },
  bliss: {
    ipa: "/blɪs/",
    part_of_speech: "noun",
    definition: "Felicidad o satisfacción completa y profunda.",
    example_sentence: "Relaxing with a good book was pure bliss.",
    example_translation: "Relajarse con un buen libro fue pura felicidad.",
  },
  grit: {
    ipa: "/ɡrɪt/",
    part_of_speech: "noun",
    definition: "Perseverancia, valentía y fuerza de carácter.",
    example_sentence: "Success takes dedication and true grit.",
    example_translation: "El éxito requiere dedicación y verdadera perseverancia.",
  },
  bold: {
    ipa: "/boʊld/",
    part_of_speech: "adjective",
    definition: "Valiente, decidido y sin miedo a tomar riesgos.",
    example_sentence: "Taking that first step was a bold decision.",
    example_translation: "Dar ese primer paso fue una decisión valiente.",
  },
  calm: {
    ipa: "/kɑːm/",
    part_of_speech: "adjective",
    definition: "Tranquilo, sereno y libre de agitación.",
    example_sentence: "Stay calm and breathe slowly.",
    example_translation: "Mantén la calma y respira despacio.",
  },
  poise: {
    ipa: "/pɔɪz/",
    part_of_speech: "noun",
    definition: "Elegancia, serenidad y autocontrol bajo presión.",
    example_sentence: "She handled the difficult question with great poise.",
    example_translation: "Manejó la pregunta difícil con gran serenidad.",
  },
  witty: {
    ipa: "/ˈwɪt.i/",
    part_of_speech: "adjective",
    definition: "Ingenioso, divertido y perspicaz al hablar.",
    example_sentence: "He made a witty remark that made everyone smile.",
    example_translation: "Hizo un comentario ingenioso que hizo sonreír a todos.",
  },
  zest: {
    ipa: "/zɛst/",
    part_of_speech: "noun",
    definition: "Gran entusiasmo, energía y gusto por la vida.",
    example_sentence: "She approached every challenge with zest and curiosity.",
    example_translation: "Afrontó cada desafío con entusiasmo y curiosidad.",
  },
  valor: {
    ipa: "/ˈvæl.ər/",
    part_of_speech: "noun",
    definition: "Gran valentía o coraje ante el peligro.",
    example_sentence: "He showed immense valor during the crisis.",
    example_translation: "Demostró un inmenso valor durante la crisis.",
  },
  thrive: {
    ipa: "/θraɪv/",
    part_of_speech: "verb",
    definition: "Prosperar, crecer con éxito y desarrollarse bien.",
    example_sentence: "Students thrive in an encouraging learning environment.",
    example_translation: "Los estudiantes prosperan en un entorno de aprendizaje motivador.",
  },
  muse: {
    ipa: "/mjuːz/",
    part_of_speech: "noun",
    definition: "Fuente de inspiración artística o creativa.",
    example_sentence: "Nature was the painter's greatest muse.",
    example_translation: "La naturaleza fue la mayor musa del pintor.",
  },
  flair: {
    ipa: "/flɛər/",
    part_of_speech: "noun",
    definition: "Talento natural, estilo distintivo o habilidad innata.",
    example_sentence: "She has a natural flair for languages.",
    example_translation: "Tiene un talento natural para los idiomas.",
  },
  lucid: {
    ipa: "/ˈluː.sɪd/",
    part_of_speech: "adjective",
    definition: "Claro, fácil de entender o con mente despierta.",
    example_sentence: "The teacher gave a lucid explanation of the concept.",
    example_translation: "La profesora dio una explicación clara y lúcida del concepto.",
  },
  pragmatic: {
    ipa: "/præɡˈmæt.ɪk/",
    part_of_speech: "adjective",
    definition: "Práctico y orientado a soluciones realistas.",
    example_sentence: "We need a pragmatic approach to solve this issue.",
    example_translation: "Necesitamos un enfoque pragmático para resolver este problema.",
  },
  resilient: {
    ipa: "/rɪˈzɪl.jənt/",
    part_of_speech: "adjective",
    definition: "Capaz de recuperarse rápidamente de las dificultades.",
    example_sentence: "She remained resilient through every setback.",
    example_translation: "Se mantuvo resiliente ante cada contratiempo.",
  },
  eloquent: {
    ipa: "/ˈɛl.ə.kwənt/",
    part_of_speech: "adjective",
    definition: "Fluido, persuasivo y expresivo al comunicarse.",
    example_sentence: "His speech was powerful and remarkably eloquent.",
    example_translation: "Su discurso fue poderoso y notablemente elocuente.",
  },
  serendipity: {
    ipa: "/ˌsɛr.ənˈdɪp.ɪ.ti/",
    part_of_speech: "noun",
    definition: "Descubrimiento afortunado e inesperado por casualidad.",
    example_sentence: "Finding that helpful book was pure serendipity.",
    example_translation: "Encontrar ese libro tan útil fue pura casualidad afortunada.",
  },
  ephemeral: {
    ipa: "/ɪˈfɛm.ər.əl/",
    part_of_speech: "adjective",
    definition: "Que dura poco tiempo; pasajero o fugaz.",
    example_sentence: "Morning mist is lovely but ephemeral.",
    example_translation: "La niebla matutina es hermosa pero efímera.",
  },
};

const FALLBACK_BEGINNER = [
  "vivid", "keen", "bliss", "grit", "bold", "calm", "poise",
  "witty", "zest", "valor", "thrive", "muse", "flair",
] as const;

const FALLBACK_INTERMEDIATE = [
  "lucid", "pragmatic", "resilient", "eloquent", "quest",
] as const;

const FALLBACK_ADVANCED = [
  "serendipity", "ephemeral",
] as const;

/**
 * Client-safe fallback generator for Word of the Day.
 * Picks a deterministic word from FALLBACK_DEFINITIONS based on date seed and level.
 */
export function getClientFallbackWordOfDay(level?: string, extraSeed?: string): import("./types").WordOfDay {
  const dateStr = new Date().toISOString().slice(0, 10);
  const normalizedLevel = level?.toLowerCase();

  let pool: readonly string[];
  if (normalizedLevel === "a1" || normalizedLevel === "a2" || normalizedLevel === "beginner") {
    pool = FALLBACK_BEGINNER;
  } else if (normalizedLevel === "c1" || normalizedLevel === "c2" || normalizedLevel === "advanced") {
    pool = FALLBACK_ADVANCED;
  } else if (normalizedLevel === "b1" || normalizedLevel === "b2" || normalizedLevel === "intermediate") {
    pool = FALLBACK_INTERMEDIATE;
  } else {
    pool = Object.keys(FALLBACK_DEFINITIONS);
  }

  if (!pool || pool.length === 0) {
    pool = Object.keys(FALLBACK_DEFINITIONS);
  }

  const baseSeed = level ? `${dateStr}|${level.toUpperCase()}` : dateStr;
  const seed = extraSeed ? `${baseSeed}-${extraSeed}` : baseSeed;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const wordKey = pool[hash % pool.length] || "vivid";
  const entry = FALLBACK_DEFINITIONS[wordKey] ?? FALLBACK_DEFINITIONS["vivid"];

  const difficulty: import("./types").WordOfDay["difficulty"] = (FALLBACK_BEGINNER as readonly string[]).includes(wordKey)
    ? "beginner"
    : (FALLBACK_ADVANCED as readonly string[]).includes(wordKey)
    ? "advanced"
    : "intermediate";

  return {
    word: wordKey,
    ipa: entry.ipa,
    part_of_speech: entry.part_of_speech,
    definition: entry.definition,
    example_sentence: entry.example_sentence,
    example_translation: entry.example_translation,
    difficulty,
  };
}

