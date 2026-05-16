'use client'

import Button from "@/components/ui/Button";
import { H2 } from '@/components/ui/Typography';

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  xp: number
  unlocked?: boolean
}

const achievements: Achievement[] = [
  {
    id: '1',
    icon: '🌙',
    title: 'Night Polyglot',
    description: 'Study 5 days in a row after 10 PM',
    xp: 250,
    unlocked: true,
  },
  {
    id: '2',
    icon: '👑',
    title: 'Grammar Master',
    description: 'Complete a grammar lesson with zero errors',
    xp: 400,
    unlocked: true,
  },
  {
    id: '3',
    icon: '💬',
    title: 'Fluent Speaker',
    description: 'Hold a 5-minute AI conversation',
    xp: 500,
    unlocked: true,
  },
  {
    id: '4',
    icon: '🔥',
    title: '7-Day Streak',
    description: 'Practice every day for a full week',
    xp: 300,
    unlocked: false,
  },
  {
    id: '5',
    icon: '🎯',
    title: 'Sharp Ear',
    description: 'Score 90%+ on 10 pronunciation exercises',
    xp: 350,
    unlocked: false,
  },
  {
    id: '6',
    icon: '📚',
    title: 'Word Collector',
    description: 'Save 100 words to your vocabulary',
    xp: 200,
    unlocked: false,
  },
]

export default function AchievementsSection() {
  const unlocked = achievements.filter(a => a.unlocked)
  const locked   = achievements.filter(a => !a.unlocked)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-tiny font-bold uppercase tracking-[0.24em] text-fg-subtle">
            ACHIEVEMENTS
          </p>
          <H2 className="mt-0.5 text-h4">
            {unlocked.length} earned · {locked.length} remaining
          </H2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs font-semibold shrink-0 text-[var(--primary)]">
          View all
        </Button>
      </div>

      {/* Unlocked grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="flex animate-fadeIn items-start gap-3 rounded-3xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4 shadow-[0_1px_3px_var(--line-divider),0_6px_16px_var(--line-divider)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--primary)_10%,var(--btn-regular-bg))] text-2xl">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight text-fg">
                {a.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                {a.description}
              </p>
              <span className="mt-2 inline-block rounded-lg bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] px-2 py-0.5 text-tiny font-bold text-[var(--primary)]">
                +{a.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Locked row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {locked.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 rounded-3xl border border-[var(--line-divider)] bg-[var(--btn-regular-bg)] p-4 opacity-60"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--line-divider)] text-2xl grayscale">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight text-fg">
                {a.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                {a.description}
              </p>
              <span className="mt-2 inline-block rounded-lg bg-[var(--line-divider)] px-2 py-0.5 text-tiny font-bold text-[var(--text-tertiary)]">
                +{a.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
