'use client'

// Planned structure:
// <GameResultsPanel tone="sky" headline summary stats>
//   <GameReviewList title="Contrastes para repasar">
//     <ContrastRow contrast count heard />
//   </GameReviewList>
// </GameResultsPanel>

import type { InvadersState, MissRecord } from '@/lib/games/phoneme-invaders/engine'
import { formatContrast } from '@/lib/games/phoneme-invaders/format'
import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import GameResultsPanel from '@/components/practice/games/shared/GameResultsPanel'
import GameReviewList from '@/components/practice/games/shared/GameReviewList'

interface InvadersResultsProps {
  state: InvadersState
  onRestart: () => void
}

interface ContrastSummary {
  contrast: string
  count: number
  example: MissRecord
}

function summarizeContrasts(misses: MissRecord[]): ContrastSummary[] {
  const byContrast = new Map<string, ContrastSummary>()
  for (const miss of misses) {
    if (!miss.contrast) continue
    const current = byContrast.get(miss.contrast)
    byContrast.set(miss.contrast, {
      contrast: miss.contrast,
      count: (current?.count ?? 0) + 1,
      example: miss,
    })
  }
  return [...byContrast.values()].sort((a, b) => b.count - a.count)
}

function summaryFor(hits: number, wave: number): string {
  if (hits === 0) return 'Esta vez no cayó ninguna nave. Escucha los contrastes de abajo y vuelve a intentarlo.'
  return `Derribaste ${hits} ${hits === 1 ? 'nave' : 'naves'} y llegaste a la oleada ${wave}.`
}

function headlineFor(hits: number): string {
  if (hits >= 20) return 'Oído afinado'
  if (hits >= 8) return 'Buen entrenamiento'
  return 'Cada partida afina el oído'
}

export default function InvadersResults({ state, onRestart }: InvadersResultsProps) {
  const contrasts = summarizeContrasts(state.missHistory)

  return (
    <GameResultsPanel
      tone="sky"
      headline={headlineFor(state.hits)}
      summary={summaryFor(state.hits, state.wave)}
      stats={[
        { label: 'Puntos', value: state.score },
        { label: 'Aciertos', value: state.hits },
        { label: 'Racha máx.', value: state.maxStreak },
      ]}
      onRestart={onRestart}
    >
      {contrasts.length > 0 && (
        <GameReviewList title="Contrastes para repasar">
          {contrasts.map(({ contrast, count, example }) => (
            <li key={contrast} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="font-ipa text-body-md font-bold text-ink">{formatContrast(contrast)}</span>
                <span className="font-sans text-caption text-ink-secondary">
                  {count} {count === 1 ? 'fallo' : 'fallos'} · p. ej. «{example.heard.word}»
                </span>
              </div>
              <ListenButton
                iconOnly
                aria-label={`Escuchar ${example.heard.word}`}
                onPlay={() => speak(example.heard.word, { rate: 0.8 })}
                className="size-11"
              />
            </li>
          ))}
        </GameReviewList>
      )}
    </GameResultsPanel>
  )
}
