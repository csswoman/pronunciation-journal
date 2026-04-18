'use client'

import Button from "@/components/ui/Button";
interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  xp: number
  date?: string
}

const achievements: Achievement[] = [
  {
    id: '1',
    icon: '🌙',
    title: 'Poliglota Nocturno',
    description: 'Estudia 5 días seguidos después de las 10 PM',
    xp: 250,
  },
  {
    id: '2',
    icon: '👑',
    title: 'Maestro de Tiempos',
    description: 'Completa una lección de gramática en errores',
    xp: 400,
  },
  {
    id: '3',
    icon: '💬',
    title: 'Conversador Fluido',
    description: 'Mantén una charla de 5 min con la IA',
    xp: 500,
  },
]

export default function AchievementsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--deep-text)' }}
        >
          Recent Achievements
        </h2>
        <Button
          className="text-sm font-medium"
          style={{ color: 'var(--primary)' }}
        >
          Ver todos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)',
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: 'var(--line-divider)' }}
            >
              {achievement.icon}
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold text-sm leading-tight"
                style={{ color: 'var(--deep-text)' }}
              >
                {achievement.title}
              </h3>
              <p
                className="text-xs mt-1 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {achievement.description}
              </p>
              <span
                className="inline-block text-xs font-semibold mt-2 px-2 py-1 rounded-md"
                style={{
                  background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                +{achievement.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

