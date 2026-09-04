'use client'

// Planned structure:
// <SentenceErrorDetailPanel>
//   <ErrorDetailHeader />
//   <ErrorDetailBody />
//   <ErrorDetailActions />
// </SentenceErrorDetailPanel>

import Link from 'next/link'
import type { WordResult, PhonemeAlignment } from '@/lib/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import {
  buildDetailedTip,
  getPhonemeErrorDescription,
} from './PronunciationFeedbackChips'

interface Props {
  selectedWord: WordResult
  selectedPhoneme: PhonemeAlignment | null
  onClose: () => void
}

export function SentenceErrorDetailPanel({
  selectedWord,
  selectedPhoneme,
  onClose,
}: Props) {
  const remediation = selectedPhoneme
    ? buildRemediation(selectedPhoneme)
    : null

  return (
    <div className="animate-fadeIn rounded-lg border border-border-default bg-surface-raised p-3.5 space-y-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
        <div className="flex items-center gap-2">
          <span className="text-body leading-none" aria-hidden="true">💡</span>
          <span className="font-semibold text-body-sm text-fg">
            {selectedPhoneme
              ? `Sonido /${selectedPhoneme.ipa ?? selectedPhoneme.phoneme}/ en "${selectedWord.expected}"`
              : `Palabra "${selectedWord.expected || selectedWord.got}"`}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-fg-muted hover:text-fg text-caption px-1.5 py-0.5 rounded cursor-pointer focus-ring"
          aria-label="Cerrar detalle de error"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-caption text-fg">
        {selectedPhoneme ? (
          <p className="m-0 text-body-sm font-medium text-fg leading-relaxed">
            {getPhonemeErrorDescription(selectedPhoneme)}
          </p>
        ) : (
          <p className="m-0 text-body-sm text-fg leading-relaxed">
            {buildDetailedTip(selectedWord) ?? 'Revisa la pronunciación de esta palabra.'}
          </p>
        )}

        {selectedWord.status === 'incorrect' && selectedWord.got && (
          <p className="m-0 text-fg-subtle text-caption">
            Reconocido: &ldquo;{selectedWord.got}&rdquo; (esperado: &ldquo;{selectedWord.expected}&rdquo;)
          </p>
        )}

        {remediation?.visualCueEs && (
          <p className="m-0 text-fg-muted text-caption">
            👉 {remediation.visualCueEs}
          </p>
        )}
        {remediation?.spanishTip && (
          <p className="m-0 text-fg-muted text-caption">
            💡 {remediation.spanishTip}
          </p>
        )}

        {remediation?.vowelDuration && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-surface-sunken px-2.5 py-1.5 border border-border-subtle text-caption">
            <span className="font-semibold text-primary">{remediation.vowelDuration.badge}</span>
            <span className="text-fg-muted">{remediation.vowelDuration.tipEs}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {selectedPhoneme?.ipa && (
            <button
              type="button"
              onClick={() => playIpaSound(selectedPhoneme.ipa!)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface px-2.5 py-1 text-caption font-medium text-fg hover:border-primary focus-ring cursor-pointer"
            >
              <span>Escuchar /{selectedPhoneme.ipa}/</span>
              <span aria-hidden="true">🔊</span>
            </button>
          )}

          {selectedPhoneme?.ipa && (
            <Link
              href={`/practice/sounds?tab=minimal-pairs&phoneme=${encodeURIComponent(selectedPhoneme.ipa)}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary-soft px-2.5 py-1 text-caption font-semibold text-primary hover:bg-primary-soft/80 focus-ring cursor-pointer"
            >
              <span>Entrenar oído (pares mínimos)</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          {selectedWord.expected && (
            <button
              type="button"
              onClick={() => speak(selectedWord.expected)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface px-2.5 py-1 text-caption font-medium text-fg hover:border-primary focus-ring cursor-pointer"
            >
              <span>Escuchar &ldquo;{selectedWord.expected}&rdquo;</span>
              <span aria-hidden="true">🔊</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
