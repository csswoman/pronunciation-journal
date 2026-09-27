'use client'

// Planned structure:
// <PhonemeInvadersSession>
//   {status === 'game_over' ? (
//     <InvadersResults state={state} onRestart={startGame} />
//   ) : !isPlaying ? (
//     <StartSetupCard onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <InvadersHud />
//       <InvadersArena />
//       {lastMissFlash && <InvadersMissFlash />}
//     </GameContainer>
//   )}
// </PhonemeInvadersSession>

import { usePhonemeInvadersLoop } from '@/hooks/games/usePhonemeInvadersLoop'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'
import InvadersHud from './InvadersHud'
import InvadersArena from './InvadersArena'
import InvadersMissFlash from './InvadersMissFlash'
import InvadersResults from './InvadersResults'
import PastelCard from '@/components/layout/PastelCard'

interface PhonemeInvadersSessionProps {
  pairs: MinimalPairItem[]
}

export default function PhonemeInvadersSession({
  pairs,
}: PhonemeInvadersSessionProps) {
  const {
    state,
    isPlaying,
    startGame,
    shootShip,
    repeatAudio,
    dismissFlash,
  } = usePhonemeInvadersLoop(pairs)

  if (state.status === 'game_over') {
    return <InvadersResults state={state} onRestart={startGame} />
  }

  if (!isPlaying) {
    return (
      <div className="w-full max-w-lg mx-auto py-8">
        <PastelCard tone="sky" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
          <div className="space-y-2 text-center">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
              DISCRIMINACIÓN AUDITIVA
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-ink leading-tight">
              Phoneme Invaders
            </h1>
            <p className="font-sans text-body-sm text-ink/80 text-pretty">
              Escucha atentamente el sonido por altavoz y dispara a la nave con la palabra correcta antes de que toque el suelo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ink/5 border border-ink/10 space-y-2 text-body-sm font-sans text-ink/90">
            <div className="font-bold flex items-center gap-2">
              <span>🎮 Controles:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-caption text-ink/80">
              <li>Haz clic en la nave o presiona teclas <strong>[1]</strong> al <strong>[4]</strong> por carril.</li>
              <li>Tienes 3 escudos ❤️. Cada fallo o nave que pase resta 1.</li>
              <li>Cada 10 aciertos sube la velocidad y número de carriles.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-95 transition-opacity text-center shadow-md cursor-pointer"
          >
            Iniciar Partida 🚀
          </button>
        </PastelCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 py-4">
      <InvadersHud
        score={state.score}
        wave={state.wave}
        streak={state.streak}
        shields={state.shields}
        onRepeatAudio={repeatAudio}
      />

      <InvadersArena
        ships={state.ships}
        laneCount={state.laneCount}
        onShoot={shootShip}
      />

      {state.lastMissFlash && (
        <InvadersMissFlash
          miss={state.lastMissFlash}
          onDismiss={dismissFlash}
        />
      )}
    </div>
  )
}
