'use client'

// Planned structure:
// <EssentialWordsExerciseCard>
//   one of: RecognizeCard | RecognizeAudioCard | DictationCard | WeakFormCard
//           | ClozeCard | RecallTranslationCard | SpeakReviewCard
// </EssentialWordsExerciseCard>
//
// Picks the exercise card for the current mode and wires the shared
// onContinue/isContinuing gate to every card except SpeakReviewCard, which
// already owns its own advance action.

import { SpeakReviewCard } from './SpeakReviewCard'
import { RecognizeCard } from './RecognizeCard'
import { RecognizeAudioCard } from './RecognizeAudioCard'
import { DictationCard } from './DictationCard'
import { WeakFormCard } from './WeakFormCard'
import { ClozeCard } from './ClozeCard'
import { ListeningClozeCard } from './ListeningClozeCard'
import { RecallTranslationCard } from './RecallTranslationCard'
import type { EssentialWordMode } from '@/lib/essential-words/exercise-modes'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWordQueueItem } from '@/lib/essential-words/queue'

interface Props {
  current: EssentialWordQueueItem
  currentMode: EssentialWordMode
  listeningTier?: 1 | 2 | 3
  isListeningSkill?: boolean
  focusContrastId?: string
  retiredBlankKeys?: string[]
  currentStepId: string | null
  levelLabel?: string
  audioDistractorPool: EssentialWordQueueItem['entry'][]
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onSpeakAttempt: (outcome: AttemptOutcome) => Promise<void>
  onRetry: () => void
  onContinue?: () => void
  isContinuing: boolean
  onArchive: () => void
  onKeepSnooze: () => void
  onMaster: () => void
  isAdvancedListening?: boolean
}

export function EssentialWordsExerciseCard({
  current,
  currentMode,
  listeningTier,
  isListeningSkill = false,
  focusContrastId,
  retiredBlankKeys,
  currentStepId,
  levelLabel,
  audioDistractorPool,
  onAttempt,
  onSpeakAttempt,
  onRetry,
  onContinue,
  isContinuing,
  onArchive,
  onKeepSnooze,
  onMaster,
  isAdvancedListening = false,
}: Props) {
  const key = currentStepId ?? `exercise:${current.entry.word}`

  if (
    currentMode === 'recognize_translation'
    || currentMode === 'recognize_meaning'
    || currentMode === 'recognize_cloze'
  ) {
    return (
      <RecognizeCard
        key={key}
        entry={current.entry}
        mode={currentMode}
        repetitions={current.repetitions ?? 0}
        levelLabel={levelLabel}
        distractors={audioDistractorPool}
        onAttempt={onAttempt}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  if (currentMode === 'recognize_audio') {
    return (
      <RecognizeAudioCard
        key={key}
        entry={current.entry}
        levelLabel={levelLabel}
        distractors={audioDistractorPool}
        onAttempt={onAttempt}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  if ((isListeningSkill || currentMode === 'dictation_sentence') && (listeningTier ?? 1) < 3) {
    return <ListeningClozeCard key={key} entry={current.entry} tier={listeningTier ?? 1} focusContrastId={focusContrastId} retiredBlankKeys={retiredBlankKeys} levelLabel={levelLabel} repetitions={current.repetitions ?? 0} onAttempt={onAttempt} onContinue={onContinue} onArchive={onArchive} isContinuing={isContinuing} />
  }

  if (currentMode === 'dictation_sentence') {
    return (
      <DictationCard
        key={key}
        entry={current.entry}
        levelLabel={levelLabel}
        repetitions={current.repetitions ?? 0}
        onAttempt={onAttempt}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
        isAdvancedListening={isAdvancedListening}
        listeningTier={listeningTier}
      />
    )
  }

  if (currentMode === 'listening_cloze_sentence') {
    return (
      <ListeningClozeCard
        key={key}
        entry={current.entry}
        tier={listeningTier ?? 1}
        focusContrastId={focusContrastId}
        retiredBlankKeys={retiredBlankKeys}
        levelLabel={levelLabel}
        repetitions={current.repetitions ?? 0}
        onAttempt={onAttempt}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  if (currentMode === 'weak_form') {
    return (
      <WeakFormCard
        key={key}
        entry={current.entry}
        levelLabel={levelLabel}
        repetitions={current.repetitions ?? 0}
        onAttempt={onAttempt}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  if (currentMode === 'cloze_sentence') {
    return (
      <ClozeCard
        key={key}
        entry={current.entry}
        levelLabel={levelLabel}
        repetitions={current.repetitions ?? 0}
        onAttempt={onAttempt}
        onRetry={onRetry}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  if (currentMode === 'recall_translation') {
    return (
      <RecallTranslationCard
        key={key}
        entry={current.entry}
        levelLabel={levelLabel}
        repetitions={current.repetitions ?? 0}
        onAttempt={onAttempt}
        onRetry={onRetry}
        onContinue={onContinue}
        onArchive={onArchive}
        isContinuing={isContinuing}
      />
    )
  }

  // currentMode === 'speak_sentence' || currentMode === 'study'
  return (
    <SpeakReviewCard
      key={key}
      entry={current.entry}
      levelLabel={levelLabel}
      repetitions={current.repetitions ?? 0}
      onAttempt={onSpeakAttempt}
      onArchive={onArchive}
      fromSnooze={current.fromSnooze}
      onKeepSnooze={onKeepSnooze}
      onMaster={onMaster}
    />
  )
}
