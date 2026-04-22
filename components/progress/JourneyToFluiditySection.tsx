'use client'

import { ChevronRight, Mic, BookOpen, Brain, Pencil, Headphones, MessageSquare } from 'lucide-react'

type Category = 'pronunciation' | 'vocabulary' | 'srs' | 'writing' | 'listening' | 'conversation'

interface Exercise {
  id: string
  icon: React.ReactNode
  title: string
  category: string
  time: string
  accuracy: number
  type: Category
}

const CATEGORY_LABEL: Record<Category, string> = {
  pronunciation: 'Pronunciation',
  vocabulary:    'Vocabulary',
  srs:           'Spaced Repetition',
  writing:       'Writing',
  listening:     'Listening',
  conversation:  'Conversation',
}

function accuracyColor(v: number): string {
  if (v >= 85) return 'oklch(0.62 0.17 145)'
  if (v >= 65) return 'oklch(0.68 0.16 70)'
  return 'oklch(0.62 0.18 30)'
}

const exercises: Exercise[] = [
  {
    id: '1',
    icon: <Mic size={18} />,
    title: 'Pronunciation Practice',
    category: 'Open vocabulary · French',
    time: 'Today, 10:24 AM',
    accuracy: 98,
    type: 'pronunciation',
  },
  {
    id: '2',
    icon: <BookOpen size={18} />,
    title: 'Contextual Translation',
    category: 'Business idioms',
    time: 'Yesterday, 4:15 PM',
    accuracy: 85,
    type: 'vocabulary',
  },
  {
    id: '3',
    icon: <Brain size={18} />,
    title: 'Smart Review (SRS)',
    category: 'Core 50 words deck',
    time: 'Oct 12, 2025',
    accuracy: 72,
    type: 'srs',
  },
]

export default function JourneyToFluiditySection() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--text-tertiary)' }}>
            ACTIVITY LOG
          </p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight" style={{ color: 'var(--deep-text)' }}>
            Journey to fluency
          </h2>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{
            background: 'var(--btn-regular-bg)',
            border: '1px solid var(--line-divider)',
            color: 'var(--text-secondary)',
          }}
        >
          Filter
        </button>
      </div>

      {/* List */}
      <div
        className="overflow-hidden rounded-[22px]"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--line-divider)',
          boxShadow: '0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)',
        }}
      >
        {exercises.map((ex, i) => {
          const color = accuracyColor(ex.accuracy)
          const isLast = i === exercises.length - 1

          return (
            <button
              key={ex.id}
              className="group w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[color:color-mix(in_oklch,var(--primary)_4%,transparent)]"
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--line-divider)',
              }}
            >
              {/* Icon */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: 'color-mix(in oklch, var(--primary) 10%, var(--btn-regular-bg))',
                  color: 'var(--primary)',
                }}
              >
                {ex.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--deep-text)' }}>
                  {ex.title}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {ex.category}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                      color: 'var(--primary)',
                    }}
                  >
                    {CATEGORY_LABEL[ex.type]}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {ex.time}
                  </span>
                </div>
              </div>

              {/* Accuracy */}
              <div className="shrink-0 flex items-center gap-3">
                <div className="text-right">
                  <p className="text-base font-black tabular-nums" style={{ color }}>
                    {ex.accuracy}%
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>accuracy</p>
                </div>

                {/* Mini bar */}
                <div
                  className="hidden sm:block w-14 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--line-divider)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ex.accuracy}%`, background: color }}
                  />
                </div>

                <ChevronRight
                  size={16}
                  className="opacity-30 transition-all group-hover:opacity-80 group-hover:translate-x-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
