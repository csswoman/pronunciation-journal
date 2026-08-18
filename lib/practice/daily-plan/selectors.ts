import type { WordEntry } from '@/lib/lexicon/types'
import type { PracticeExercise } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'

/** Día del año (1-366) usado para rotar la selección de contenido por día. */
export function dayOfYear(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

export function getSemanticContentKey(ex: PracticeExercise): string {
  // Ejercicios de fonema: deduplicar por slug + palabra objetivo
  if (ex.payload.kind === 'phoneme') {
    return `phoneme:${ex.slug}:${ex.payload.targetWord ?? ''}`
  }

  // Ejercicios genéricos: deduplicar por contenido textual normalizado
  if (ex.payload.kind === 'generic' && ex.payload.data) {
    const data = ex.payload.data
    let rawText = ''
    if ('sentence' in data && typeof data.sentence === 'string') {
      rawText = data.sentence
    } else if ('phrase' in data && typeof data.phrase === 'string') {
      rawText = data.phrase
    } else if ('sourceSentence' in data && typeof data.sourceSentence === 'string') {
      rawText = data.sourceSentence
    } else if ('sourceEs' in data && typeof data.sourceEs === 'string') {
      rawText = data.sourceEs
    } else if ('question' in data && typeof data.question === 'string') {
      rawText = data.question
    } else if ('taskPrompt' in data && typeof data.taskPrompt === 'string') {
      rawText = `${data.taskPrompt}|${(data as { targetItem?: string }).targetItem ?? ''}`
    }

    if (rawText) {
      let answer = ''
      if ('answer' in data && typeof data.answer === 'string') {
        answer = data.answer
      } else if ('correctSentence' in data && typeof data.correctSentence === 'string') {
        answer = data.correctSentence
      }

      // Reemplazar la barra de espacio en blanco '___' con la respuesta para que fill_blank
      // y sentence_dictation de la misma oración coincidan semánticamente.
      if (rawText.includes('___') && answer) {
        rawText = rawText.replace('___', answer)
      }

      // Devolver la oración normalizada: todo minúsculas, quitando puntuación y espacios extras.
      return `generic:${rawText.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    }

    // Para emparejamiento (match_pairs), deduplicar en base a las parejas a emparejar ordenadas
    if ('pairs' in data && Array.isArray(data.pairs)) {
      const pairKeys = data.pairs
        .map((p: { left: string; right: string }) => `${p.left}:${p.right}`)
        .sort()
        .join(',')
      return `match_pairs:${pairKeys.toLowerCase().replace(/[^a-z0-9:,]/g, '')}`
    }
  }

  // Fallback si no hay estructura genérica reconocida
  return ex.contentId
}

export function dedupeByContentId(exercises: PracticeExercise[]): PracticeExercise[] {
  const seen = new Set<string>()
  return exercises.filter((ex) => {
    const key = getSemanticContentKey(ex)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Elige un sonido del seed de forma determinista por día, evitando el sonido
 * ya usado por el paso de fonema débil.
 */
export function pickSeedSound(allSounds: Sound[], offset: number, excludeId?: number): Sound | null {
  const pool = allSounds.filter((s) => s.id !== excludeId)
  if (pool.length === 0) return null
  const ranked = [...pool].sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9))
  return ranked[(dayOfYear() + offset) % ranked.length]
}

/** Adapts WordBankEntry to the WordEntry shape expected by generateSentenceContextExercises. */
export function toWordEntry(entry: WordBankEntry): WordEntry & { bankId: string } {
  return {
    // Catalog / content id when present; fall back to bank UUID for legacy rows.
    id: entry.source_ref || entry.id,
    word: entry.text,
    pos: 'n',
    definition: entry.meaning ?? '',
    ipa: entry.ipa ?? undefined,
    translation: entry.translation ?? undefined,
    difficulty: (entry.difficulty ?? 2) as 1 | 2 | 3,
    tags: [],
    exampleSentence: entry.example ?? undefined,
    bankId: entry.id,
  }
}
