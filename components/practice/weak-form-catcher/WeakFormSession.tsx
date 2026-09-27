'use client'

// Planned structure:
// <WeakFormSession>
//   {status === 'game_over' ? (
//     <WeakFormResults state={state} onRestart={startGame} />
//   ) : !isPlaying ? (
//     <StartSetupCard onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <WeakFormStage />
//       <WeakFormInput />
//       {lastRule && <WeakFormRuleCard />}
//     </GameContainer>
//   )}
// </WeakFormSession>

import { useWeakFormCatcherLoop } from '@/hooks/games/useWeakFormCatcherLoop'
import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'
import WeakFormStage from './WeakFormStage'
import WeakFormInput from './WeakFormInput'
import WeakFormRuleCard from './WeakFormRuleCard'
import WeakFormResults from './WeakFormResults'
import PastelCard from '@/components/layout/PastelCard'

interface WeakFormSessionProps {
  phrases: WeakFormPhraseItem[]
}

export default function WeakFormSession({
  phrases,
}: WeakFormSessionProps) {
  const {
    state,
    isPlaying,
    startGame,
    submitAnswer,
    useHint,
    dismissRule,
    repeatAudio,
  } = useWeakFormCatcherLoop(phrases)

  if (state.status === 'game_over') {
    return <WeakFormResults state={state} onRestart={startGame} />
  }

  if (!isPlaying || !state.currentPhrase) {
    return (
      <div className="w-full max-w-lg mx-auto py-8">
        <PastelCard tone="mint" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
          <div className="space-y-2 text-center">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
              ENTRENAMIENTO DE COMPRENSIÓN
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-ink leading-tight">
              Weak Form Catcher
            </h1>
            <p className="font-sans text-body-sm text-ink/80 text-pretty">
              Escucha frases a velocidad real. La transcripción reducida caerá lentamente: escribe la <strong>forma completa en inglés</strong> antes de que toque el suelo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ink/5 border border-ink/10 space-y-2 text-body-sm font-sans text-ink/90">
            <div className="font-bold flex items-center gap-2">
              <span>💡 Reglas de juego:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-caption text-ink/80">
              <li>Si cae «whaddya want», escribe <strong>what do you want</strong>.</li>
              <li>Tienes 2 ayudas por partida (Audio lento 🐢 y Revelar 1.ª palabra 💡).</li>
              <li>Tras cada frase verás la explicación gramatical del cambio de sonido.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-95 transition-opacity text-center shadow-md cursor-pointer"
          >
            Empezar entrenamiento 🎧
          </button>
        </PastelCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 py-4">
      <WeakFormStage
        phrase={state.currentPhrase}
        y={state.y}
        hintsUsed={state.hintsUsed}
        hintSlowActive={state.hintSlowActive}
        hintFirstWordActive={state.hintFirstWordActive}
        onUseHint={useHint}
        onRepeatAudio={repeatAudio}
      />

      <WeakFormInput
        rejectedReason={state.rejectedReason}
        onSubmit={submitAnswer}
      />

      {state.status === 'showing_rule' && state.lastRule && (
        <WeakFormRuleCard
          phrase={state.lastRule.phrase}
          success={state.lastRule.success}
          onDismiss={dismissRule}
        />
      )}
    </div>
  )
}
