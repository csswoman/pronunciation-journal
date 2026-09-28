'use client'

// Planned structure:
// <FalseFriendsSwipeSession>
//   {status === 'completed' ? (
//     <SwipeResults state={state} onRestart={startGame} />
//   ) : status === 'rescue_round' && miss ? (
//     <SwipeRescueRound miss={miss} rescueIndex={state.rescueIndex} totalRescues={state.missHistory.length} onAnswerRescue={answerRescue} />
//   ) : !isPlaying || !currentCard ? (
//     <GameIntroPanel copy={FALSE_FRIENDS_INTRO} onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <SwipeCardStack card={state.currentCard} cardTimeY={state.cardTimeY} currentIndex={state.currentIndex} totalCards={state.deck.length} onAnswer={answer} />
//       {status === 'showing_verdict' && lastVerdict && <SwipeVerdictLine card={lastVerdict.card} isCorrect={lastVerdict.isCorrect} onDismiss={dismissVerdict} />}
//     </GameContainer>
//   )}
// </FalseFriendsSwipeSession>

import { useFalseFriendsSwipeLoop } from '@/hooks/games/useFalseFriendsSwipeLoop'
import type { FalseFriend } from '@/lib/false-friends/types'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { FALSE_FRIENDS_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import SwipeCardStack from './SwipeCardStack'
import SwipeVerdictLine from './SwipeVerdictLine'
import SwipeRescueRound from './SwipeRescueRound'
import SwipeResults from './SwipeResults'

interface FalseFriendsSwipeSessionProps {
  entries: FalseFriend[]
}

export default function FalseFriendsSwipeSession({
  entries,
}: FalseFriendsSwipeSessionProps) {
  const {
    state,
    isPlaying,
    startGame,
    answer,
    dismissVerdict,
    answerRescue,
  } = useFalseFriendsSwipeLoop(entries)

  if (state.status === 'completed') {
    return <SwipeResults state={state} onRestart={startGame} />
  }

  if (state.status === 'rescue_round' && state.missHistory[state.rescueIndex]) {
    return (
      <div className="mx-auto w-full max-w-lg py-8">
        <SwipeRescueRound
          miss={state.missHistory[state.rescueIndex]!}
          rescueIndex={state.rescueIndex}
          totalRescues={state.missHistory.length}
          onAnswerRescue={answerRescue}
        />
      </div>
    )
  }

  if (!isPlaying || !state.currentCard) {
    return (
      <GameIntroPanel
        copy={FALSE_FRIENDS_INTRO}
        onStart={startGame}
        unavailableReason={
          entries.length === 0
            ? 'No pudimos cargar los falsos amigos. Recarga la página.'
            : undefined
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <SwipeCardStack
        card={state.currentCard}
        cardTimeY={state.cardTimeY}
        currentIndex={state.currentIndex}
        totalCards={state.deck.length}
        onAnswer={answer}
      />

      {state.status === 'showing_verdict' && state.lastVerdict && (
        <SwipeVerdictLine
          card={state.lastVerdict.card}
          isCorrect={state.lastVerdict.isCorrect}
          onDismiss={dismissVerdict}
        />
      )}
    </div>
  )
}
