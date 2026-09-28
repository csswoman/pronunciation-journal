'use client'

// Planned structure:
// <GameIntroPanel copy={MEMORY_MATCH_INTRO} onStart={...}>
//   <ModeSelector />
//   <PairCountSelector />
// </GameIntroPanel>

import { useState } from 'react'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { MEMORY_MATCH_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import type { MemoryMatchMode } from '@/lib/games/memory-match/engine'

interface MemorySetupProps {
  onStart: (mode: MemoryMatchMode, pairCount: number) => void
}

export default function MemorySetup({ onStart }: MemorySetupProps) {
  const [mode, setMode] = useState<MemoryMatchMode>('word_meaning')
  const [pairCount, setPairCount] = useState<number>(6)

  return (
    <GameIntroPanel
      copy={MEMORY_MATCH_INTRO}
      onStart={() => onStart(mode, pairCount)}
    >
      {/* Mode Selector */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
          MODO DE PAREJAS
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('word_meaning')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'word_meaning'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            📖 Palabra ↔ Significado
          </button>

          <button
            type="button"
            onClick={() => setMode('audio_word')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'audio_word'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            🔊 Audio ↔ Palabra
          </button>

          <button
            type="button"
            onClick={() => setMode('word_ipa')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'word_ipa'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            🗣️ Palabra ↔ IPA
          </button>
        </div>
      </div>

      {/* Pair Count Selector */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
          CANTIDAD DE PAREJAS
        </label>
        <div className="flex gap-2">
          {[6, 8, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPairCount(num)}
              className={`flex-1 py-2.5 rounded-2xl border-2 font-sans text-body-sm font-bold transition-all cursor-pointer ${
                pairCount === num
                  ? 'bg-ink text-surface-base border-ink shadow-xs'
                  : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
              }`}
            >
              {num} parejas ({num * 2} cartas)
            </button>
          ))}
        </div>
      </div>
    </GameIntroPanel>
  )
}
