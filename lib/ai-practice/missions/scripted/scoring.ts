export interface LineScore {
  lineId: string
  correctPhonemes: number
  totalPhonemes: number
}

export interface ScriptSessionScore {
  /** 0-100, o `null` si no hubo nada puntuable. Nunca un 0 falso. */
  score: number | null
  scoredLines: number
  correctPhonemes: number
  totalPhonemes: number
}

/**
 * Puntúa un diálogo como fonemas acertados sobre el total.
 *
 * Deliberadamente NO es la media de los porcentajes por línea: así una
 * intervención larga pesa más que un "Yes, please", que es lo justo.
 */
export function scoreScriptSession(lines: LineScore[]): ScriptSessionScore {
  const scored = lines.filter((line) => line.totalPhonemes > 0)

  const totalPhonemes = scored.reduce((sum, line) => sum + line.totalPhonemes, 0)
  const correctPhonemes = scored.reduce((sum, line) => sum + line.correctPhonemes, 0)

  return {
    score: totalPhonemes === 0 ? null : Math.round((correctPhonemes / totalPhonemes) * 100),
    scoredLines: scored.length,
    correctPhonemes,
    totalPhonemes,
  }
}
