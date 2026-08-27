/**
 * Reparto estimado de una locucion entre sus palabras.
 *
 * `speechSynthesis` expone un evento `boundary` con la posicion exacta, pero
 * no todos los motores lo emiten de forma fiable, y el audio pregrabado no
 * trae marcas de tiempo. Cuando no hay senal real se estima por longitud:
 * es aproximado, y por eso el consumidor solo lo usa como pista visual.
 *
 * Sin duracion utilizable no se estima nada — resaltar la palabra equivocada
 * es peor que no resaltar ninguna.
 */

/** Separa por espacios conservando la puntuacion junto a su palabra. */
export function splitSpokenWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0)
}

/** Milisegundo de inicio estimado de cada palabra, relativo al arranque. */
export function estimateWordOffsets(words: string[], durationMs: number): number[] {
  if (words.length === 0) return []
  if (!Number.isFinite(durationMs) || durationMs <= 0) return []

  const weights = words.map((word) => Math.max(1, word.length))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  const offsets: number[] = []
  let elapsed = 0
  for (const weight of weights) {
    offsets.push(Math.round(elapsed))
    elapsed += (weight / totalWeight) * durationMs
  }
  return offsets
}
