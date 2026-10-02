'use client'

// Planned structure:
// <PronunciationPathNextAction>
//   <PastelCard tone="coral">
//     <BadgesHeader />
//     <UnitTitleAndIpa />
//     <DiagnosticReason />
//     <ExamplePairsInset />
//     <ActionButtons />
//   </PastelCard>
// </PronunciationPathNextAction>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PathRecommendation, PathUnit } from '@/lib/pronunciation/path/types'

interface PronunciationPathNextActionProps {
  activeUnit?: PathUnit | null
  activeStageId?: string
  recommendation: PathRecommendation
  copyEnabled: boolean
  href: string
  ctaLabel?: string
  needsEvidence?: boolean
}

const STAGE_LABELS: Record<string, { num: number; name: string }> = {
  sounds: { num: 1, name: 'sonidos' },
  'word-stress': { num: 2, name: 'acento' },
  'sentence-prosody': { num: 3, name: 'ritmo' },
  connected: { num: 4, name: 'habla conectada' },
  'intonation-transfer': { num: 5, name: 'entonación' },
}

const EXAMPLE_PAIRS_BY_TARGET: Record<string, { chips: string[]; extraCount: number }> = {
  'contrast.iː.ɪ': { chips: ['ship', 'sheep', 'fit', 'feet'], extraCount: 4 },
  'contrast.θ.ð': { chips: ['think', 'this', 'thin', 'them'], extraCount: 3 },
  'phoneme.ə': { chips: ['banana', 'about', 'paper', 'camera'], extraCount: 2 },
  'contrast.b.v': { chips: ['berry', 'very', 'ban', 'van'], extraCount: 4 },
  'contrast.æ.ʌ': { chips: ['cat', 'cut', 'bat', 'but'], extraCount: 4 },
  'contrast.s.z': { chips: ['price', 'prize', 'bus', 'buzz'], extraCount: 5 },
  'contrast.ʃ.tʃ': { chips: ['share', 'chair', 'shop', 'chop'], extraCount: 4 },
  'phoneme.ɹ': { chips: ['red', 'bird', 'run', 'car'], extraCount: 3 },
}

export function PronunciationPathNextAction({
  activeUnit,
  activeStageId = 'sounds',
  recommendation,
  copyEnabled,
  href,
  needsEvidence = false,
}: PronunciationPathNextActionProps) {
  const targetId = activeUnit?.targetId ?? recommendation.targetId
  const targetCopy = targetId ? getLearnerTargetCopy(targetId) : null

  const title = targetCopy?.title ?? 'ship vs sheep'
  const ipaHint = targetCopy?.ipaHint ? `/${targetCopy.ipaHint}/` : null
  const plainHint = targetCopy?.plainHint
  const reason =
    copyEnabled || recommendation.reasonKind === 'all_retained'
      ? recommendation.reasonEs
      : 'Tu diagnóstico dice que este par es el que más te cuesta ahora.'

  const stageInfo = STAGE_LABELS[activeUnit?.stageId ?? activeStageId] ?? { num: 1, name: 'sonidos' }

  const exampleInfo = targetId ? EXAMPLE_PAIRS_BY_TARGET[targetId] : null
  const chips = exampleInfo?.chips ?? (targetCopy?.speakCue ? [targetCopy.speakCue] : ['ship', 'sheep', 'fit', 'feet'])
  const extraCount = exampleInfo?.extraCount ?? 0

  const handleListenPair = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const textToSpeak = targetCopy?.speakCue ?? title
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleSpeakWord = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <PastelCard tone="coral" className="flex min-w-0 flex-col gap-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-ink text-paper rounded-full px-3 py-1 font-sans text-xs font-extrabold tracking-wider uppercase">
          QUÉ TOCA AHORA
        </span>
        <span className="bg-paper/40 text-ink rounded-full px-3 py-1 font-sans text-xs font-semibold">
          paso {stageInfo.num} · {stageInfo.name}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="ts-headline text-ink font-display font-black text-3xl sm:text-4xl tracking-tight">
          {title}
        </h2>
        {ipaHint ? (
          <p className="font-ipa !text-ink-secondary text-lg font-medium">
            {ipaHint}
          </p>
        ) : null}
      </div>

      <p className="ts-body-sm text-ink-secondary max-w-prose">
        {plainHint ?? reason}
      </p>

      {needsEvidence ? (
        <p className="ts-body-sm text-ink-secondary max-w-prose">
          Aún no hay suficiente práctica grabada de este sonido. Practica un poco para medirlo.
        </p>
      ) : null}

      {chips.length > 0 ? (
        <div className="pastel-card-inset rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center gap-2 border border-ink/10">
          {chips.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => handleSpeakWord(word)}
              className="bg-paper border border-ink/10 hover:bg-paper/90 rounded-full px-3.5 py-1 text-xs font-bold text-ink transition-transform active:scale-95 cursor-pointer"
              title={`Escuchar "${word}"`}
            >
              {word}
            </button>
          ))}
          {extraCount > 0 ? (
            <span className="ts-caption text-ink-muted text-xs font-medium ml-1">
              +{extraCount} pares
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <Link
          href={href}
          className="bg-ink text-paper hover:bg-ink-secondary active:scale-[0.98] rounded-full px-6 py-3 font-bold text-sm cursor-pointer transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Practicar · 5 min</span>
        </Link>
        <button
          type="button"
          onClick={handleListenPair}
          className="border-2 border-ink/80 text-ink hover:bg-ink/10 active:scale-[0.98] rounded-full px-6 py-3 font-bold text-sm cursor-pointer transition-all inline-flex items-center justify-center gap-2"
        >
          <span>Escuchar el par</span>
        </button>
      </div>
    </PastelCard>
  )
}
