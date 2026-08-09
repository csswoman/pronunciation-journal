// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EssentialWordsExerciseCard } from '../EssentialWordsExerciseCard'
import type { EssentialWord } from '@/lib/essential-words/types'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn(), speakSequence: vi.fn() }))
vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))

const government: EssentialWord = {
  rank: 216,
  word: 'government',
  pos: 'noun',
  ipa_strong: 'ˈɡʌvɜrmənt',
  example_sentence: 'The government announced changes.',
  cefr_level: 'A2',
}

const similarWords: EssentialWord[] = [
  { ...government, rank: 217, word: 'govern', ipa_strong: 'ˈɡʌvɜrn' },
  { ...government, rank: 218, word: 'measurement', ipa_strong: 'ˈmɛʒɜrmənt' },
]

describe('EssentialWordsExerciseCard audio recognition', () => {
  it('uses the full audio candidate pool instead of the session words', () => {
    render(
      <EssentialWordsExerciseCard
        current={{ entry: government, kind: 'review' }}
        currentMode="recognize_audio"
        currentStepId="audio:government"
        audioDistractorPool={[government, ...similarWords]}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
        onSpeakAttempt={vi.fn().mockResolvedValue(undefined)}
        onRetry={vi.fn()}
        isContinuing={false}
        onArchive={vi.fn()}
        onKeepSnooze={vi.fn()}
        onMaster={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /\d\. govern$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\d\. measurement$/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /service/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hold/ })).not.toBeInTheDocument()
  })

  it('uses the full candidate pool for meaning recognition too', () => {
    render(
      <EssentialWordsExerciseCard
        current={{ entry: { ...government, word: 'experience', translation: 'experiencia' }, kind: 'review' }}
        currentMode="recognize_translation"
        currentStepId="meaning:experience"
        audioDistractorPool={[
          { ...government, word: 'experience', translation: 'experiencia' },
          { ...government, rank: 14, word: 'activity' },
          { ...government, rank: 15, word: 'lesson' },
        ]}
        onAttempt={vi.fn().mockResolvedValue(undefined)}
        onSpeakAttempt={vi.fn().mockResolvedValue(undefined)}
        onRetry={vi.fn()}
        isContinuing={false}
        onArchive={vi.fn()}
        onKeepSnooze={vi.fn()}
        onMaster={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /activity/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lesson/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\d\. less$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /level/ })).not.toBeInTheDocument()
  })
})
