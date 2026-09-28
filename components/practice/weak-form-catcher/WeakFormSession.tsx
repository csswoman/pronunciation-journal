'use client'

// Planned structure:
// <WeakFormSession>
//   {status === 'game_over' ? (
//     <WeakFormResults state={state} onRestart={startGame} />
//   ) : !isPlaying || !currentPhrase ? (
//     <GameIntroPanel copy={WEAK_FORM_INTRO} onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <GameSessionBar title progressLabel>
//         <StreakBadge />
//         <ShieldsMeter />
//         <GameSessionStat label="Puntos" />
//       </GameSessionBar>
//       <WeakFormStage />
//       <WeakFormInput />
//       {lastRule && <WeakFormRuleCard />}
//     </GameContainer>
//   )}
// </WeakFormSession>

import { Flame, Heart } from '@/components/icons'
import { cn } from '@/lib/cn'
import { useWeakFormCatcherLoop } from '@/hooks/games/useWeakFormCatcherLoop'
import { WEAK_FORM_MAX_MISSES } from '@/lib/games/weak-form-catcher/engine'
import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { WEAK_FORM_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import GameSessionBar, { GameSessionStat } from '@/components/practice/games/shared/GameSessionBar'
import WeakFormStage from './WeakFormStage'
import WeakFormInput from './WeakFormInput'
import WeakFormRuleCard from './WeakFormRuleCard'
import WeakFormResults from './WeakFormResults'

interface WeakFormSessionProps {
  phrases: WeakFormPhraseItem[]
}

export default function WeakFormSession({ phrases }: WeakFormSessionProps) {
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
      <GameIntroPanel
        copy={WEAK_FORM_INTRO}
        onStart={startGame}
        unavailableReason={
          phrases.length === 0
            ? 'No pudimos cargar las frases. Recarga la página.'
            : undefined
        }
      />
    )
  }

  const shieldsLeft = Math.max(0, WEAK_FORM_MAX_MISSES - state.misses)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <GameSessionBar
        title="Weak Form Catcher"
        progressLabel={`Frase ${state.phraseIndex + 1} de ${state.totalPhrases}`}
      >
        {state.streak >= 3 && (
          <span className="hidden items-center gap-1 rounded-full bg-butter-soft px-2.5 py-1 font-sans text-caption font-bold tabular-nums text-ink sm:inline-flex">
            <Flame size={14} aria-hidden />
            Racha {state.streak}
          </span>
        )}

        <div
          className="flex items-center gap-0.5"
          role="img"
          aria-label={`${shieldsLeft} de ${WEAK_FORM_MAX_MISSES} escudos`}
        >
          {Array.from({ length: WEAK_FORM_MAX_MISSES }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              aria-hidden
              className={cn(
                'transition-opacity duration-200',
                i < shieldsLeft ? 'fill-error text-error' : 'text-fg-faint opacity-60',
              )}
            />
          ))}
        </div>

        <GameSessionStat label="Puntos" value={state.score} />
      </GameSessionBar>

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
