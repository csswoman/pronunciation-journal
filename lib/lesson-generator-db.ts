import type { Lesson, LessonWord, Difficulty } from '@/lib/types'
import {
  getAllPatterns,
  getAllPatternWordsGrouped,
  getAllSoundsWithWords,
  getSoundIdsByIpa,
  type DbPattern,
  type DbPatternWord,
  type DbSound,
  type DbWord,
} from '@/lib/db-lessons'

// ── Helpers ──────────────────────────────────────────────────────────────────

function difficultyFromNumber(n: number | null): Difficulty {
  if (n == null) return 'medium'
  if (n <= 1) return 'easy'
  if (n <= 2) return 'medium'
  return 'hard'
}

function patternTypeLabel(type: string | null): string {
  if (!type) return 'Pattern'
  const map: Record<string, string> = {
    vowel: 'Vowel Pattern',
    consonant: 'Consonant Pattern',
    digraph: 'Digraph',
    silent: 'Silent Letter',
    blend: 'Consonant Blend',
    diphthong: 'Diphthong',
  }
  return map[type.toLowerCase()] ?? type.charAt(0).toUpperCase() + type.slice(1) + ' Pattern'
}

function soundCategoryLabel(sound: DbSound): string {
  if (sound.category) return sound.category.charAt(0).toUpperCase() + sound.category.slice(1)
  if (sound.type === 'vowel') return 'Vowel'
  if (sound.type === 'diphthong') return 'Diphthong'
  return 'Consonant'
}

// ── Pattern lessons ───────────────────────────────────────────────────────────

function patternToLesson(pattern: DbPattern, words: DbPatternWord[], soundId?: number): Lesson {
  const lessonWords: LessonWord[] = words.map((w) => ({
    word: w.word,
    ipa: w.ipa ?? '',
    hint: pattern.sound_focus ? `Focus on the "${pattern.pattern}" pattern → /${pattern.sound_focus}/` : undefined,
  }))

  const difficulty: Difficulty = words.length <= 4 ? 'easy' : words.length <= 8 ? 'medium' : 'hard'

  return {
    id: `pattern-${pattern.id}`,
    title: `"${pattern.pattern}" — ${patternTypeLabel(pattern.type)}`,
    description: pattern.sound_focus
      ? `Practice words where "${pattern.pattern}" sounds like /${pattern.sound_focus}/`
      : `Practice the spelling pattern "${pattern.pattern}"`,
    category: 'patterns',
    difficulty,
    words: lessonWords,
    // If we can resolve the sound, redirect to the full phoneme practice page
    href: soundId != null ? `/practice/${soundId}` : undefined,
  }
}

// ── Sound lessons ─────────────────────────────────────────────────────────────

function soundToLesson(sound: DbSound, words: DbWord[]): Lesson {
  const lessonWords: LessonWord[] = words.map((w) => ({
    word: w.word,
    ipa: w.ipa ?? `/${sound.ipa}/`,
    audioUrl: w.audio_url ?? undefined,
    hint: w.sound_focus ? `Listen for the /${w.sound_focus}/ sound` : undefined,
  }))

  return {
    id: `sound-${sound.id}`,
    title: `/${sound.ipa}/ — ${soundCategoryLabel(sound)} Sound`,
    description: sound.example
      ? `Practice the /${sound.ipa}/ sound as in "${sound.example}"`
      : `Practice words featuring the /${sound.ipa}/ sound`,
    category: 'sounds',
    difficulty: difficultyFromNumber(sound.difficulty),
    words: lessonWords,
    // Redirect to the existing phoneme practice page which already has 3 stages
    href: `/practice/${sound.id}`,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPatternLessons(): Promise<Lesson[]> {
  const [patterns, grouped, soundIdsByIpa] = await Promise.all([
    getAllPatterns(),
    getAllPatternWordsGrouped(),
    getSoundIdsByIpa(),
  ])
  return patterns
    .filter((p) => (grouped[p.id]?.length ?? 0) >= 2)
    .map((p) => {
      const soundId = p.sound_focus ? soundIdsByIpa[p.sound_focus] : undefined
      return patternToLesson(p, grouped[p.id], soundId)
    })
}

export async function getSoundLessons(): Promise<Lesson[]> {
  const soundsWithWords = await getAllSoundsWithWords()
  return soundsWithWords.map(({ sound, words }) => soundToLesson(sound, words))
}

export async function getAllDbLessons(): Promise<Lesson[]> {
  const [patternLessons, soundLessons] = await Promise.all([
    getPatternLessons(),
    getSoundLessons(),
  ])
  return [...patternLessons, ...soundLessons]
}

/**
 * Returns a lesson sliced to `size` words starting at `offset`.
 * If totalWords <= size, returns the lesson unchanged.
 */
export function sliceLessonWords(lesson: Lesson, offset: number, size: number): Lesson {
  if (lesson.words.length <= size) return lesson
  const words = lesson.words
  const start = offset % words.length
  // Wrap around if the chunk goes past the end
  const sliced =
    start + size <= words.length
      ? words.slice(start, start + size)
      : [...words.slice(start), ...words.slice(0, size - (words.length - start))]
  return { ...lesson, words: sliced }
}

/** Resolve a dynamic lesson by prefixed ID (e.g. "pattern-3", "sound-7") */
export async function getDbLessonById(id: string): Promise<Lesson | null> {
  if (id.startsWith('pattern-')) {
    const patternId = parseInt(id.replace('pattern-', ''), 10)
    if (isNaN(patternId)) return null
    const { getPatternWords, getAllPatterns, getSoundIdsByIpa } = await import('@/lib/db-lessons')
    const [patterns, words, soundIdsByIpa] = await Promise.all([
      getAllPatterns(),
      getPatternWords(patternId),
      getSoundIdsByIpa(),
    ])
    const pattern = patterns.find((p) => p.id === patternId)
    if (!pattern || words.length === 0) return null
    const soundId = pattern.sound_focus ? soundIdsByIpa[pattern.sound_focus] : undefined
    return patternToLesson(pattern, words, soundId)
  }

  if (id.startsWith('sound-')) {
    const soundId = parseInt(id.replace('sound-', ''), 10)
    if (isNaN(soundId)) return null
    const { getAllSoundsWithWords } = await import('@/lib/db-lessons')
    const soundsWithWords = await getAllSoundsWithWords()
    const entry = soundsWithWords.find(({ sound }) => sound.id === soundId)
    if (!entry) return null
    return soundToLesson(entry.sound, entry.words)
  }

  return null
}
