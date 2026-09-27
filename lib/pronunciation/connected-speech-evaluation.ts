import type { SpeechErrorCode } from "@/hooks/useSpeechRecognition";

/**
 * Evaluación honesta de un intento de habla conectada a partir del texto
 * reconocido. El transcript sólo dice qué palabras entendió el reconocedor:
 * no mide si el usuario enlazó los sonidos, así que no se inventa ese veredicto.
 */
export interface ConnectedWordResult {
  word: string;
  heard: boolean;
}

export interface ConnectedSpeechEvaluation {
  words: ConnectedWordResult[];
  heardCount: number;
  total: number;
  /** Todas las palabras de la frase aparecen en el transcript. */
  isCorrect: boolean;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function evaluateConnectedSpeechTranscript(
  phrase: string,
  transcript: string,
): ConnectedSpeechEvaluation {
  const expected = phrase.split(/\s+/).filter(Boolean);
  const pool = tokens(transcript);

  const words = expected.map((word) => {
    const [normalized] = tokens(word);
    const idx = normalized ? pool.indexOf(normalized) : -1;
    // Consumir la coincidencia para que una palabra repetida cuente una sola vez.
    if (idx !== -1) pool.splice(idx, 1);
    return { word, heard: idx !== -1 };
  });

  const heardCount = words.filter((w) => w.heard).length;
  return {
    words,
    heardCount,
    total: words.length,
    isCorrect: words.length > 0 && heardCount === words.length,
  };
}

export function connectedSpeechErrorMessage(code: SpeechErrorCode | null): string {
  switch (code) {
    case "not-allowed":
      return "Se denegó el acceso al micrófono. Permítelo en la configuración del navegador.";
    case "no-speech":
      return "No detectamos tu voz. Acércate al micrófono e inténtalo otra vez.";
    case "network":
      return "No pudimos transcribir tu voz. Revisa tu conexión e inténtalo otra vez.";
    default:
      return "No se pudo reconocer tu voz. Inténtalo otra vez.";
  }
}
