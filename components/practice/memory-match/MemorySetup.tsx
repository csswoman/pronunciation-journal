'use client'

// Planned structure:
// <MemorySetup>
//   <PastelCard tone="coral">
//     <HeaderTitle font-heading />
//     <ModeSelector />
//     <PairCountSelector />
//     <StartButton />
//   </PastelCard>
// </MemorySetup>

import { useState } from 'react'
import PastelCard from '@/components/layout/PastelCard'
import type { MemoryMatchMode } from '@/lib/games/memory-match/engine'

interface MemorySetupProps {
  onStart: (mode: MemoryMatchMode, pairCount: number) => void
}

export default function MemorySetup({ onStart }: MemorySetupProps) {
  const [mode, setMode] = useState<MemoryMatchMode>('word_meaning')
  const [pairCount, setPairCount] = useState<number>(6)

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <PastelCard tone="coral" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
        <div className="space-y-2 text-center">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            MEMORIA & ASOCIACIÓN
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-ink leading-tight">
            Memory Match
          </h1>
          <p className="font-sans text-body-sm text-ink/80 text-pretty">
            Encuentra las parejas de cartas girando de dos en dos. Practica el significado, el audio nativo o la pronunciación IPA.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
            MODO DE PAREJAS
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('word_meaning')}
              className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
                mode === 'word_meaning'
                  ? 'bg-ink text-surface-base border-ink shadow-sm'
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
                  ? 'bg-ink text-surface-base border-ink shadow-sm'
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
                  ? 'bg-ink text-surface-base border-ink shadow-sm'
                  : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
              }`}
            >
              🗣️ Palabra ↔ IPA
            </button>
          </div>
        </div>

        {/* Pair Count Selector */}
        <div className="space-y-2">
          <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
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
                    ? 'bg-ink text-surface-base border-ink shadow-sm'
                    : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
                }`}
              >
                {num} parejas ({num * 2} cartas)
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStart(mode, pairCount)}
          className="w-full py-4 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-95 transition-opacity text-center shadow-md cursor-pointer"
        >
          Iniciar Memory Match 🧠
        </button>
      </PastelCard>
    </div>
  )
}
