import type { FalseFriend, FalseFriendPrompt } from '@/lib/false-friends/types'

export type SwipeCard = {
  id: string
  friendId: string
  word: string
  displayedMeaning: string
  isTrap: boolean
  explanation: string
  prompt: FalseFriendPrompt
  friend: FalseFriend
}

export function buildSwipeDeck(
  entries: FalseFriend[],
  rng: () => number = Math.random,
  options: { size?: number; trapRatio?: number } = {},
): SwipeCard[] {
  const size = options.size ?? 20
  const trapRatio = options.trapRatio ?? 0.6

  // Exclude partial-overlap from swipe mode
  const eligible = entries.filter((e) => e.kind !== 'partial-overlap')
  if (eligible.length === 0) return []

  const shuffled = [...eligible]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }

  const selected = shuffled.slice(0, size)
  const cards: SwipeCard[] = []

  for (let i = 0; i < selected.length; i++) {
    const friend = selected[i]!
    const isTrap = rng() < trapRatio

    const displayedMeaning = isTrap ? friend.looksLike : friend.actualMeaning
    const explanation = `«${friend.word}» = ${friend.actualMeaning}. «${friend.looksLike}» = ${friend.correctWord}.`
    const prompt = friend.prompts[0] || {
      sentence: `I am ___ going to start tomorrow.`,
      options: [friend.word, friend.correctWord],
      answer: 0,
      explain: explanation,
    }

    cards.push({
      id: `swipe-${friend.id}-${i}`,
      friendId: friend.id,
      word: friend.word,
      displayedMeaning,
      isTrap,
      explanation,
      prompt,
      friend,
    })
  }

  return cards
}
