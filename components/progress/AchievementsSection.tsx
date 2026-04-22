'use client'

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
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--text-tertiary)' }}>
            ACHIEVEMENTS
          </p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight" style={{ color: 'var(--deep-text)' }}>
            {unlocked.length} earned · {locked.length} remaining
          </h2>
        </div>
        <button className="text-xs font-semibold shrink-0" style={{ color: 'var(--primary)' }}>
          View all
        </button>
      </div>

      {/* Unlocked grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="rounded-[22px] p-4 flex items-start gap-3 animate-fadeIn"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--line-divider)',
              boxShadow: '0 1px 3px var(--line-divider), 0 6px 16px var(--line-divider)',
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'color-mix(in oklch, var(--primary) 10%, var(--btn-regular-bg))' }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--deep-text)' }}>
                {a.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {a.description}
              </p>
              <span
                className="mt-2 inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold"
                style={{
                  background: 'color-mix(in oklch, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                }}
              >
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
            className="rounded-[22px] p-4 flex items-start gap-3"
            style={{
              background: 'var(--btn-regular-bg)',
              border: '1px solid var(--line-divider)',
              opacity: 0.6,
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl grayscale"
              style={{ background: 'var(--line-divider)' }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--deep-text)' }}>
                {a.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {a.description}
              </p>
              <span
                className="mt-2 inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold"
                style={{
                  background: 'var(--line-divider)',
                  color: 'var(--text-tertiary)',
                }}
              >
                +{a.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
