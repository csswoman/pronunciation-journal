'use client'

// Planned structure:
// <PhonemeInvadersSession>
//   {status === 'game_over' ? (
//     <InvadersResults />
//   ) : !isPlaying ? (
//     <GameIntroPanel copy={PHONEME_INVADERS_INTRO} />
//   ) : (
//     <GameLayout>
//       <InvadersHud />
//       <InvadersArena />
//       {lastMissFlash && <InvadersMissFlash />}
//     </GameLayout>
//   )}
// </PhonemeInvadersSession>

import { usePhonemeInvadersLoop } from '@/hooks/games/usePhonemeInvadersLoop'
import { INVADERS_MAX_SHIELDS } from '@/lib/games/phoneme-invaders/engine'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { PHONEME_INVADERS_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import InvadersHud from './InvadersHud'
import InvadersArena from './InvadersArena'
import InvadersMissFlash from './InvadersMissFlash'
import InvadersResults from './InvadersResults'

interface PhonemeInvadersSessionProps {
  pairs: MinimalPairItem[]
}

export default function PhonemeInvadersSession({ pairs }: PhonemeInvadersSessionProps) {
  const { state, isPlaying, startGame, shootShip, repeatAudio, dismissFlash } =
    usePhonemeInvadersLoop(pairs)

  if (state.status === 'game_over') {
    return <InvadersResults state={state} onRestart={startGame} />
  }

  if (!isPlaying) {
    return (
      <GameIntroPanel
        copy={PHONEME_INVADERS_INTRO}
        onStart={startGame}
        unavailableReason={pairs.length === 0 ? 'No pudimos cargar los pares de palabras. Recarga la página.' : undefined}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4">
      <InvadersHud
        score={state.score}
        wave={state.wave}
        streak={state.streak}
        shields={state.shields}
        maxShields={INVADERS_MAX_SHIELDS}
      />

      <InvadersArena
        ships={state.ships}
        laneCount={state.laneCount}
        paused={Boolean(state.lastMissFlash)}
        onShoot={shootShip}
        onRepeatAudio={repeatAudio}
      />

      {state.lastMissFlash && <InvadersMissFlash miss={state.lastMissFlash} onDismiss={dismissFlash} />}
    </div>
  )
}
