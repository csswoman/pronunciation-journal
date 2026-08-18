/**
 * Utilidades para el modo Shadowing (técnica de eco e imitación) y segmentación de oraciones.
 */

export interface SentenceSegment {
  index: number;
  text: string;
  wordCount: number;
  connectedSpeechNotes?: string[];
}

export interface ShadowingSettings {
  playbackRate: number; // 0.75 | 1.0 | 1.25
  pauseMultiplier: number; // 1.0 = igual tiempo que el audio, 1.5 = 1.5x de tiempo para repetir
  autoAdvance: boolean;
}

export const DEFAULT_SHADOWING_SETTINGS: ShadowingSettings = {
  playbackRate: 0.9,
  pauseMultiplier: 1.2,
  autoAdvance: true,
};

/**
 * Divide un texto en oraciones respetando puntos, signos de interrogación y exclamación.
 */
export function splitIntoSentences(text: string): SentenceSegment[] {
  if (!text || !text.trim()) return [];

  // Match sentences ending in ., !, or ? (handling abbreviations gracefully)
  const regex = /[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g;
  const matches = text.match(regex) ?? [text];

  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((sentence, index) => {
      const words = sentence.split(/\s+/).filter(Boolean);
      const connected = detectConnectedSpeech(sentence);
      return {
        index,
        text: sentence,
        wordCount: words.length,
        connectedSpeechNotes: connected,
      };
    });
}

/**
 * Detecta candidatos comunes de enlaces fonéticos (Connected speech) en una oración:
 * - Consonante final + Vocal inicial (ej: "pick it", "turn off")
 * - Doble vocal con glide natural (ej: "go out", "see it")
 * - Flap T potencial entre vocales (ej: "water", "get out")
 */
export function detectConnectedSpeech(sentence: string): string[] {
  const notes: string[] = [];
  const words = sentence.replace(/[^a-zA-Z\s']/g, '').toLowerCase().split(/\s+/);

  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

  for (let i = 0; i < words.length - 1; i++) {
    const curr = words[i];
    const next = words[i + 1];

    if (!curr || !next) continue;

    const lastChar = curr[curr.length - 1];
    const firstChar = next[0];

    // Regla 1: Consonante + Vocal
    if (!VOWELS.has(lastChar) && VOWELS.has(firstChar) && lastChar !== 'r') {
      notes.push(`Enlace: "${curr} ${next}" (la consonante final '${lastChar}' se une a la vocal '${firstChar}')`);
    }

    // Regla 2: Flap T / Flap D
    if ((lastChar === 't' || lastChar === 'd') && VOWELS.has(firstChar)) {
      notes.push(`Flap T suave: "${curr} ${next}" (suena similar a una r suave en español)`);
    }

    // Regla 3: Vocal redondeada + Vocal (Glide /w/)
    if ((curr.endsWith('o') || curr.endsWith('w') || curr.endsWith('u')) && VOWELS.has(firstChar)) {
      notes.push(`Glide /w/: "${curr} ${next}" (transición suave con labios redondeados)`);
    }

    // Regla 4: Vocal frontal + Vocal (Glide /j/)
    if ((curr.endsWith('e') || curr.endsWith('y') || curr.endsWith('i')) && VOWELS.has(firstChar)) {
      notes.push(`Glide /j/: "${curr} ${next}" (transición suave con sonido 'y')`);
    }
  }

  return Array.from(new Set(notes));
}

/**
 * Calcula la duración estimada de habla en milisegundos para una oración según su velocidad.
 */
export function estimateSentenceSpeechDurationMs(wordCount: number, rate: number = 1.0): number {
  // Promedio humano: ~150 palabras por minuto a 1.0x (400ms por palabra)
  const msPerWord = 400 / Math.max(0.5, Math.min(2.0, rate));
  return Math.max(1200, Math.round(wordCount * msPerWord));
}
