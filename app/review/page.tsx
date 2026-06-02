'use client'

import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import {
  getAllSounds,
  getAllWords,
  getMinimalPairs,
  getContrastsForToday,
  saveAnswers,
  updateContrastProgress,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { contrastKey, PHONEME_CONFUSION } from '@/lib/phoneme-practice/phoneme-similarity'
import { isContrastMastered } from '@/lib/phoneme-practice/mastery'
import type { Exercise, UserContrastProgress } from '@/lib/phoneme-practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'

const MAX_EXERCISES = 10

/** Derives the primary contrast id for a sound IPA (first confusable). */
function primaryContrastId(ipa: string): string | null {
  const confusables = PHONEME_CONFUSION[ipa]
  if (!confusables || confusables.length === 0) return null
  return contrastKey(ipa, confusables[0])
}

export default function ReviewPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  // Map from contrastId → progress row (for SR updates)
  const [contrastProgressMap, setContrastProgressMap] = useState<Map<string, UserContrastProgress>>(new Map())
  // Map from soundId → sound (for exercise building)
  const [soundsBySoundId, setSoundsBySoundId] = useState<Map<number, Sound>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean } | null>(null)
  const [exerciseStartedAt, setExerciseStartedAt] = useState(Date.now())
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    if (!user) return
    loadReview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionKey])

  async function loadReview() {
    try {
      const [dueContrasts, allSounds, allWords] = await Promise.all([
        getContrastsForToday(user!.id),
        getAllSounds(),
        getAllWords(),
      ])

      if (dueContrasts.length === 0) {
        router.replace('/dashboard')
        return
      }

      const soundMap = new Map(allSounds.map((s) => [s.id, s]))
      setSoundsBySoundId(soundMap)

      const wordsBySoundId = new Map(
        allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
      )

      // Derive sounds from due contrasts (each contrastId encodes two IPAs)
      const dueIpas = new Set<string>()
      for (const cp of dueContrasts) {
        const [ipaA, ipaB] = cp.contrast_id.split('|')
        dueIpas.add(ipaA)
        dueIpas.add(ipaB)
      }
      const dueSounds = allSounds.filter((s) => dueIpas.has(s.ipa))

      const allExercises: Exercise[] = []
      for (const sound of dueSounds) {
        if (allExercises.length >= MAX_EXERCISES) break
        const pairs = await getMinimalPairs(sound.id)
        const targetWords = allWords.filter((w) => w.sound_id === sound.id)
        const mixed = buildMixedSession(sound, targetWords, allSounds, wordsBySoundId, pairs)
        const session = mixed.filter((e) => e.kind === 'phoneme').map((e) => e.data)
        const remaining = MAX_EXERCISES - allExercises.length
        allExercises.push(...session.slice(0, remaining))
      }

      setExercises(allExercises)
      setExerciseStartedAt(Date.now())
      setCurrentFeedback(null)

      const cMap = new Map<string, UserContrastProgress>()
      for (const cp of dueContrasts) cMap.set(cp.contrast_id, cp)
      setContrastProgressMap(cMap)
    } catch (e) {
      setError('No se pudo cargar la sesión de repaso.')
      console.error(e)
    }
  }

  const session = usePracticeSession(exercises ?? [])

  useEffect(() => {
    if (session.isComplete && user) {
      finishSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isComplete])

  async function handleAnswer(isCorrect: boolean, userAnswer: string) {
    setCurrentFeedback({ isCorrect })
    session.submitAnswer({ isCorrect, userAnswer, startedAt: exerciseStartedAt })
  }

  function handleNext() {
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
    session.advance()
  }

  async function finishSession() {
    if (!user) return
    const answers = session.answers

    await saveAnswers(user.id, answers)

    // Group answers by contrast id (via exercise sound ipa)
    const byContrastId = new Map<string, typeof answers>()
    for (const a of answers) {
      const sound = soundsBySoundId.get(a.soundId)
      if (!sound) continue
      const cid = primaryContrastId(sound.ipa)
      if (!cid) continue
      const list = byContrastId.get(cid) ?? []
      list.push(a)
      byContrastId.set(cid, list)
    }

    for (const [cid, contrastAnswers] of byContrastId) {
      const correct = contrastAnswers.filter((a) => a.isCorrect).length
      const total = contrastAnswers.length
      const base = contrastProgressMap.get(cid) ?? {
        id: '',
        user_id: user.id,
        contrast_id: cid,
        ease_factor: 2.5,
        interval_days: 1,
        next_review: null,
        last_seen: null,
        total_attempts: 0,
        correct_answers: 0,
        streak: 0,
      }
      const sessionPassed = correct >= Math.ceil(total / 2)
      const sr = updateSR(base, sessionPassed)
      await updateContrastProgress(user.id, cid, correct, total, sr)

      const updated = {
        ...base,
        total_attempts: base.total_attempts + total,
        correct_answers: base.correct_answers + correct,
        streak: sr.streak,
      }
      // Mastery is informational only here — sound unlock logic moves to Fase 5b display
      void isContrastMastered(updated)
    }
  }

  if (error) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center p-4">
        <div className="space-y-3 text-center">
          <p className="text-error">{error}</p>
          <Button
            onClick={() => {
              setError(null)
              setSessionKey((k) => k + 1)
            }}
            variant="primary"
            size="sm"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!exercises) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Cargando repaso…</div>
      </div>
    )
  }

  const progressPct = Math.min(
    100,
    Math.round((session.currentQueuePos / Math.max(session.queueLength, 1)) * 100),
  )

  if (session.isComplete) {
    return (
      <PhonemeFocusShell badge="Repaso" progressPct={100} onExit={() => router.push('/dashboard')}>
        <div className="phoneme-focus__summary">
          <SessionSummary
            soundIpa="Repaso"
            scoreableCorrect={session.scoreableCorrect}
            originalTotal={session.originalTotal}
            nextReview={null}
            onPracticeAgain={() => {
              setExercises(null)
              setSessionKey((k) => k + 1)
            }}
          />
        </div>
      </PhonemeFocusShell>
    )
  }

  const ex = session.currentExercise
  if (!ex) return null

  const badge = ex.ipa?.trim() || 'Repaso'

  function renderExercise() {
    const submitHandler = (isCorrect: boolean, userAnswer: string) =>
      handleAnswer(isCorrect, userAnswer)
    switch (ex.type) {
      case 'pick_word':
        return <PickWordExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'pick_sound':
        return <PickSoundExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'minimal_pair':
        return <MinimalPairExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'dictation':
        return <DictationExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'speak_word':
        return <SpeakExercise exercise={ex} onSubmit={submitHandler} focusUi />
      default:
        return null
    }
  }

  return (
    <PhonemeFocusShell
      badge={badge}
      progressPct={progressPct}
      onExit={() => router.back()}
      feedback={
        currentFeedback
          ? {
              isCorrect: currentFeedback.isCorrect,
              subtitle: currentFeedback.isCorrect
                ? 'Buen trabajo — sigue con el siguiente'
                : 'Repasa el sonido e inténtalo otra vez',
              onContinue: handleNext,
            }
          : null
      }
    >
      <div key={session.currentQueuePos}>{renderExercise()}</div>
    </PhonemeFocusShell>
  )
}
