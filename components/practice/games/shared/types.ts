import type { LucideIcon } from '@/components/icons'
import type { PastelTone } from '@/components/layout/PastelCard'

export interface GameRule {
  icon: LucideIcon
  text: string
}

/** Static copy for a game's start screen. */
export interface GameIntroCopy {
  kicker: string
  title: string
  description: string
  rules: GameRule[]
  startLabel: string
  /** Rough length shown on the start button ("3 min"). */
  duration: string
  tone: PastelTone
  icon: LucideIcon
}

export interface GameStat {
  label: string
  value: string | number
}
