/**
 * Guardia de homófonos.
 *
 * La evaluación segmental compara texto normalizado, así que un reconocedor
 * que escribe "there" cuando el objetivo era "their" produce un acierto por
 * ortografía, no por pronunciación. Como ambas suenan igual, el alumno pudo
 * haberlas dicho bien — pero el reconocedor tampoco puede demostrarlo.
 *
 * Misma disciplina que `scoring-guards.ts`: no convertimos la ambigüedad en
 * un fallo (sería injusto) ni en un acierto silencioso (sería deshonesto).
 * Se puntúa y se anota la salvedad, para que la nota sea auditable.
 *
 * Los pares mínimos quedan fuera por construcción: "bit" y "beat" no son
 * homófonos, así que este guardia nunca los iguala.
 */

import { phonemesForWord } from './phonemes'

function stripStress(phoneme: string): string {
  return phoneme.replace(/\d$/, '')
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, '')
}

/**
 * True cuando dos palabras DISTINTAS comparten la misma secuencia de fonemas.
 * Una palabra nunca es homófona de sí misma: eso es simplemente un acierto.
 */
export async function areHomophones(expected: string, got: string): Promise<boolean> {
  const a = normalizeWord(expected)
  const b = normalizeWord(got)
  if (!a || !b || a === b) return false

  const [expectedPhonemes, gotPhonemes] = await Promise.all([
    phonemesForWord(a),
    phonemesForWord(b),
  ])

  // Fuera del diccionario no hay evidencia fonética que comparar.
  if (expectedPhonemes.length === 0 || gotPhonemes.length === 0) return false
  if (expectedPhonemes.length !== gotPhonemes.length) return false

  return expectedPhonemes.every(
    (phoneme, i) => stripStress(phoneme) === stripStress(gotPhonemes[i]!)
  )
}

/**
 * Mensaje de salvedad cuando el reconocedor escribió un homófono del objetivo,
 * o null si no aplica.
 */
export async function homophoneCaveat(expected: string, got: string): Promise<string | null> {
  if (!(await areHomophones(expected, got))) return null

  return `Escuchamos "${got.trim()}", que suena igual que "${expected.trim()}". No podemos distinguirlas por sonido, así que damos el intento por válido.`
}
