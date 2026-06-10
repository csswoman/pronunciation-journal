import type { Lesson, LessonWord, Difficulty } from '@/lib/types'
import {
  getAllSoundsWithWords,
  type DbSound,
  type DbWord,
} from '@/lib/db/lessons'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'

// ── Helpers ──────────────────────────────────────────────────────────────────

function difficultyFromNumber(n: number | null): Difficulty {
  if (n == null) return 'medium'
  if (n <= 1) return 'easy'
  if (n <= 2) return 'medium'
  return 'hard'
}

// ── Sound lessons ─────────────────────────────────────────────────────────────

function soundToLesson(sound: DbSound, words: DbWord[]): Lesson {
  const ipaDisplay = formatIpaDisplay(sound.ipa)
  const example = sound.example?.trim() || null

  const lessonWords: LessonWord[] = words.map((w) => ({
    word: w.word,
    ipa: w.ipa ?? ipaDisplay,
    audioUrl: w.audio_url ?? undefined,
    hint: w.sound_focus ? `Listen for the ${formatIpaDisplay(w.sound_focus)} sound` : undefined,
  }))

  return {
    id: `sound-${sound.id}`,
    title: example ? `${ipaDisplay} — ${example}` : ipaDisplay,
    description: sound.category ?? sound.type,
    category: 'sounds',
    difficulty: difficultyFromNumber(sound.difficulty),
    words: lessonWords,
    href: `/practice/sounds/sound/${sound.id}`,
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
