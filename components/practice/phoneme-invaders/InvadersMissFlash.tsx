'use client'

// Planned structure:
// <GameRoundFeedback state="wrong" title explanation={contrast}>
//   <ListenPair heard chosen />
// </GameRoundFeedback>

import type { MissRecord } from '@/lib/games/phoneme-invaders/engine'
import { formatContrast } from '@/lib/games/phoneme-invaders/format'
import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import GameRoundFeedback from '@/components/practice/games/shared/GameRoundFeedback'

interface InvadersMissFlashProps {
  miss: MissRecord
  onDismiss: () => void
}

const TIMEOUT_WORD = 'Tiempo agotado'

export default function InvadersMissFlash({ miss, onDismiss }: InvadersMissFlashProps) {
  const timedOut = miss.chosen.word === TIMEOUT_WORD
  const title = timedOut
    ? `Se te escapó: sonaba «${miss.heard.word}»`
    : `Sonaba «${miss.heard.word}», elegiste «${miss.chosen.word}»`
  const contrast = formatContrast(miss.contrast)

  return (
    <GameRoundFeedback
      state="wrong"
      title={title}
      explanation={contrast ? `La diferencia está en ${contrast}. Escúchalas seguidas:` : undefined}
      continueLabel="Continuar"
      onContinue={onDismiss}
    >
      <div className="flex flex-wrap gap-2">
        <ListenButton
          label={`${miss.heard.word} ${miss.heard.ipa}`}
          onPlay={() => speak(miss.heard.word, { rate: 0.8 })}
          className="min-h-11 font-ipa text-ink"
        />
        {miss.distractor.word && (
          <ListenButton
            label={`${miss.distractor.word} ${miss.distractor.ipa}`}
            onPlay={() => speak(miss.distractor.word, { rate: 0.8 })}
            className="min-h-11 font-ipa text-ink"
          />
        )}
      </div>
    </GameRoundFeedback>
  )
}
