import Link from 'next/link'
import { BookOpen, Volume2 } from 'lucide-react'

import type { SkillProfileData } from '@/lib/progress/queries'

import {
  ProgressBigNumber,
  ProgressCard,
  ProgressCardHeader,
  ProgressStatBar,
} from './ProgressCard'

interface Props {
  data: SkillProfileData
}

const STATUS_CONFIG: {
  key: keyof SkillProfileData['wordsByStatus']
  label: string
  color: string
}[] = [
  { key: 'new', label: 'New', color: 'var(--border-subtle)' },
  { key: 'learning', label: 'Learning', color: 'var(--warning-deco)' },
  { key: 'review', label: 'Review', color: 'color-mix(in oklch, var(--primary) 75%, transparent)' },
  { key: 'mastered', label: 'Mastered', color: 'var(--primary)' },
]

function SoundLabPanel({ phonemes }: { phonemes: SkillProfileData['weakestPhonemes'] }) {
  if (phonemes.length === 0) {
    return (
      <ProgressCard>
        <ProgressCardHeader
          icon={<Volume2 size={16} />}
          eyebrow="Sound Lab"
          title="Weakest sounds"
        />
        <p className="text-xs text-fg-muted">
          Practice phoneme exercises to see your weakest sounds.
        </p>
      </ProgressCard>
    )
  }

  const top = phonemes.slice(0, 3)

  return (
    <ProgressCard>
      <ProgressCardHeader
        icon={<Volume2 size={16} />}
        eyebrow="Sound Lab"
        title="Weakest sounds"
      />
      {top.map((p) => (
        <ProgressStatBar
          key={p.ipa}
          label={`/${p.ipa}/`}
          value={p.accuracy}
          barColor={
            p.accuracy >= 80
              ? 'var(--success)'
              : p.accuracy >= 70
                ? 'var(--primary)'
                : 'var(--warning)'
          }
          labelClassName="font-ipa text-primary"
        />
      ))}
      <Link
        href="/practice"
        className="mt-3 text-caption font-medium text-primary transition-opacity hover:opacity-80"
      >
        Practice these sounds →
      </Link>
    </ProgressCard>
  )
}

function LexiconPanel({ wordsByStatus }: { wordsByStatus: SkillProfileData['wordsByStatus'] }) {
  const total = Object.values(wordsByStatus).reduce((a, b) => a + b, 0)
  const mastered = wordsByStatus.mastered
  const retention = total > 0 ? Math.round((mastered / total) * 100) : 0
  const toReview = wordsByStatus.review + wordsByStatus.learning

  if (total === 0) {
    return (
      <ProgressCard>
        <ProgressCardHeader icon={<BookOpen size={16} />} eyebrow="Lexicon" title="Vocabulary" />
        <p className="text-xs text-fg-muted">No words in your bank yet.</p>
      </ProgressCard>
    )
  }

  const topStatuses = STATUS_CONFIG.filter((s) => wordsByStatus[s.key] > 0).slice(0, 3)

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<BookOpen size={16} />} eyebrow="Lexicon" title="Vocabulary" />
      <div className="mt-1 flex gap-6">
        <ProgressBigNumber
          value={`${retention}%`}
          sub={`retention · ${mastered}/${total}`}
        />
        <ProgressBigNumber
          value={toReview}
          sub="to review"
          tone={toReview > 0 ? 'warning' : 'primary'}
        />
      </div>

      <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        {STATUS_CONFIG.map(({ key, color }) => {
          const pct = total > 0 ? (wordsByStatus[key] / total) * 100 : 0
          if (pct === 0) return null
          return <div key={key} style={{ width: `${pct}%`, background: color }} />
        })}
      </div>

      {topStatuses.map(({ key, label, color }) => {
        const count = wordsByStatus[key]
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <ProgressStatBar
            key={key}
            label={label}
            value={pct}
            barColor={color}
          />
        )
      })}

      <Link
        href="/lexicon"
        className="mt-3 text-caption font-medium text-primary transition-opacity hover:opacity-80"
      >
        Open Lexicon →
      </Link>
    </ProgressCard>
  )
}

export function SkillProfileCard({ data }: Props) {
  const hasAnyData =
    Object.values(data.wordsByStatus).some((v) => v > 0) ||
    data.weakestPhonemes.length > 0

  if (!hasAnyData) {
    return (
      <ProgressCard>
        <p className="font-display text-base font-medium text-fg">Skill profile</p>
        <p className="text-sm text-fg-muted">
          Add words and practice phonemes to build your profile.
        </p>
      </ProgressCard>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-base font-medium text-fg">Skill profile</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <SoundLabPanel phonemes={data.weakestPhonemes} />
        <LexiconPanel wordsByStatus={data.wordsByStatus} />
      </div>
    </section>
  )
}
