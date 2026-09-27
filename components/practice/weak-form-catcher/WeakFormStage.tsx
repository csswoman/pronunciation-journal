'use client'

// Planned structure:
// <WeakFormStage>
//   <StageContainer>
//     <FallingCard y={y}>
//       <IPA />
//       <ReducedText />
//       <FirstWordHint />
//     </FallingCard>
//     <HintsBar />
//   </StageContainer>
// </WeakFormStage>

import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'
import { Volume2, Sparkles } from '@/components/icons'

interface WeakFormStageProps {
  phrase: WeakFormPhraseItem
  y: number
  hintsUsed: number
  hintSlowActive: boolean
  hintFirstWordActive: boolean
  onUseHint: (kind: 'slow' | 'first_word') => void
  onRepeatAudio: () => void
}

export default function WeakFormStage({
  phrase,
  y,
  hintsUsed,
  hintSlowActive,
  hintFirstWordActive,
  onUseHint,
  onRepeatAudio,
}: WeakFormStageProps) {
  const firstWord = phrase.full.split(' ')[0]

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-3xl bg-surface-base border border-border/60 overflow-hidden shadow-inner flex flex-col justify-between p-4">
      {/* Top hints bar */}
      <div className="flex items-center justify-between gap-2 z-10">
        <button
          type="button"
          onClick={onRepeatAudio}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-border text-fg font-sans text-caption font-bold hover:bg-surface-elevated transition-colors"
        >
          <Volume2 size={16} className="text-primary" />
          <span>Escuchar</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={hintsUsed >= 2 || hintSlowActive}
            onClick={() => onUseHint('slow')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-card border border-border text-fg font-sans text-caption font-bold disabled:opacity-40 hover:bg-surface-elevated transition-colors"
          >
            🐢 Lento
          </button>
          <button
            type="button"
            disabled={hintsUsed >= 2 || hintFirstWordActive}
            onClick={() => onUseHint('first_word')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-card border border-border text-fg font-sans text-caption font-bold disabled:opacity-40 hover:bg-surface-elevated transition-colors"
          >
            💡 1.ª Palabra
          </button>
        </div>
      </div>

      {/* Falling card */}
      <div className="relative w-full h-full">
        <div
          style={{ top: `${Math.min(75, y)}%` }}
          className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-surface-card border-2 border-accent-lilac/40 shadow-lg text-center space-y-1 transition-all"
        >
          <span className="font-mono text-tiny font-bold text-accent-lilac tracking-wider uppercase">
            {phrase.ipa}
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-fg">
            «{phrase.reduced}»
          </h2>

          {hintFirstWordActive && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-amber/10 font-mono text-caption font-bold text-accent-amber">
              <Sparkles size={12} /> Empieza con: «{firstWord}»
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
