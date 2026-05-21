import type { Lesson, LessonWord, Difficulty } from '@/lib/types'
import {
  getAllSoundsWithWords,
  type DbSound,
  type DbWord,
} from '@/lib/db/lessons'

// ── Helpers ──────────────────────────────────────────────────────────────────

function difficultyFromNumber(n: number | null): Difficulty {
  if (n == null) return 'medium'
  if (n <= 1) return 'easy'
  if (n <= 2) return 'medium'
  return 'hard'
}

function soundCategoryLabel(sound: DbSound): string {
  if (sound.category) return sound.category.charAt(0).toUpperCase() + sound.category.slice(1)
  if (sound.type === 'vowel') return 'Vowel'
  if (sound.type === 'diphthong') return 'Diphthong'
  return 'Consonant'
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
    // Every lesson links straight to the phoneme practice session
    href: `/practice/sound/${sound.id}`,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllDbLessons(): Promise<Lesson[]> {
  const soundsWithWords = await getAllSoundsWithWords()
  return soundsWithWords.map(({ sound, words }) => soundToLesson(sound, words))
}

/**
 * Returns a lesson sliced to `size` words starting at `offset`.
 * If totalWords <= size, returns the lesson unchanged.
 */
export function sliceLessonWords(lesson: Lesson, offset: number, size: number): Lesson {
  if (lesson.words.length <= size) return lesson
  const words = lesson.words
  const start = offset % words.length
  const sliced =
    start + size <= words.length
      ? words.slice(start, start + size)
      : [...words.slice(start), ...words.slice(0, size - (words.length - start))]
  return { ...lesson, words: sliced }
}

/** Resolve a dynamic lesson by prefixed ID (e.g. "sound-7") */
export async function getDbLessonById(id: string): Promise<Lesson | null> {
  if (id.startsWith('sound-')) {
    const soundId = parseInt(id.replace('sound-', ''), 10)
    if (isNaN(soundId)) return null
    const soundsWithWords = await getAllSoundsWithWords()
    const entry = soundsWithWords.find(({ sound }) => sound.id === soundId)
    if (!entry) return null
    return soundToLesson(entry.sound, entry.words)
  }

  return null
}
