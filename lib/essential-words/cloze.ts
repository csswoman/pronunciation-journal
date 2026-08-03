// Cloze (oración con hueco) para essential-words. Puro — construido sobre la
// elegibilidad compartida de lib/exercises/eligibility, que ya maneja formas
// flexionadas ("works" para lemma "work") e irregulares.

import { blankLemma, hasEnoughContext } from "@/lib/exercises/eligibility";
import type { EssentialWord } from "./types";

export interface ClozeData {
  /** La oración con el token objetivo reemplazado por "___". */
  blanked: string;
  /** El token que se quitó (forma superficial, sin puntuación), p.ej. "works". */
  answer: string;
}

/**
 * Devuelve la oración con hueco y la respuesta esperada, o null cuando el
 * ejercicio no es viable (la palabra no aparece, o el resto de la oración no
 * da contexto suficiente para adivinarla).
 */
export function clozeFor(entry: EssentialWord): ClozeData | null {
  const blanked = blankLemma(entry.example_sentence, entry.word);
  if (!blanked || !hasEnoughContext(blanked)) return null;

  // Recupera el token quitado comparando token a token contra el original.
  const original = entry.example_sentence.split(/\s+/);
  const gapped = blanked.split(/\s+/);
  const idx = gapped.findIndex((token, i) => token !== original[i]);
  const raw = original[idx] ?? entry.word;
  const answer = raw.replace(/[^\w'-]/g, "");
  return { blanked, answer };
}
