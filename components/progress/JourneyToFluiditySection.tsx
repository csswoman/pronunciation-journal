'use client'

import Button from "@/components/ui/Button";
import { ChevronRight, Filter } from 'lucide-react'

interface Exercise {
  id: string
  title: string
  category: string
  time: string
  accuracy: number
  icon: string
}

const exercises: Exercise[] = [
  {
    id: '1',
    icon: '🎤',
    title: 'Práctica de Pronunciación',
    category: 'vocabulo abiertos en francés',
    time: 'Hay, 10:24 AM',
    accuracy: 98,
  },
  {
    id: '2',
    icon: '📖',
    title: 'Traducción Contextual',
    category: 'Modismos de negocios',
    time: 'Ayer, 4:15 PM',
    accuracy: 85,
  },
  {
    id: '3',
    icon: '🧠',
    title: 'Repaso Inteligente (SRS)',
    category: 'Docis 50 palabras core',
    time: '12 Oct, 2025',
    accuracy: 72,
  },
]

export default function JourneyToFluiditySection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--deep-text)' }}
        >
          Viaje a la fluidez
        </h2>
        <Button
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--line-divider)',
          }}
        >
          <Filter size={16} />
          Filtrar
        </Button>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise) => (
          <Button
            key={exercise.id}
            className="w-full rounded-2xl p-5 flex items-center justify-between group hover:shadow-md transition-shadow"
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)',
            }}
          >
            <div className="flex items-center gap-4 flex-1 text-left">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: 'var(--line-divider)' }}
              >
                {exercise.icon}
              </div>
              <div>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: 'var(--deep-text)' }}
                >
                  {exercise.title}
                </h3>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {exercise.category}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {exercise.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div
                  className="text-lg font-bold"
                  style={{ color: 'var(--deep-text)' }}
                >
                  {exercise.accuracy}%
                </div>
                <div
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Precisión
                </div>
              </div>

              <div
                className="w-12 h-1 rounded-full"
                style={{
                  background: 'var(--line-divider)',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${exercise.accuracy}%`,
                    background: `oklch(.65 .15 ${120 + (exercise.accuracy * 2)}deg)`,
                  }}
                />
              </div>

              <ChevronRight
                size={20}
                className="flex-shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                style={{ color: 'var(--text-secondary)' }}
              />
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

