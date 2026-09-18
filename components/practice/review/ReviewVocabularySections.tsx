// Planned structure:
// <ReviewVocabularySections>
//   <EssentialWordsSection />
//   <WeakWordsSection />
//   <DueWordsSection />
// </ReviewVocabularySections>

import Link from 'next/link'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { getWordStrength } from '@/lib/word-bank/strength'
import type { ReviewHubSummary } from '@/lib/review/types'
import { ReviewSectionCard } from './ReviewSectionCard'

const SKILL_LABELS = {
  meaning: 'significado',
  listening: 'escucha',
  production: 'producción',
  usage: 'uso',
} as const

function formatIpa(ipa: string): string {
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

export function ReviewVocabularySections({ summary }: { summary: ReviewHubSummary }) {
  const { counts } = summary
  return (
    <>
      <ReviewSectionCard
        title="Palabras esenciales pendientes"
        count={counts.essentialWordsDue}
        emptyMessage="No tienes habilidades de palabras esenciales pendientes."
      >
        <ul className="flex flex-col gap-2">
          {summary.essentialWordsDue.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 font-body-sm text-fg">
              <span>{item.word}</span>
              <span className="font-caption text-fg-muted">{SKILL_LABELS[item.skill]}</span>
            </li>
          ))}
        </ul>
        {counts.essentialWordsDue > 0 ? (
          <Link href="/practice/essential-words" className="font-caption text-primary transition-opacity hover:opacity-80">
            Practicar esenciales →
          </Link>
        ) : null}
      </ReviewSectionCard>

      <ReviewSectionCard title="Palabras débiles" count={counts.weakWords} emptyMessage="Ninguna palabra en aprendizaje — muy bien.">
        <ul className="flex flex-col gap-3">
          {summary.weakWords.slice(0, 4).map((word) => (
            <li key={word.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-fg">{word.text}</p>
                {word.translation ? <p className="font-body-sm text-fg-muted">{word.translation}</p> : null}
              </div>
              <WordStrengthBars strength={getWordStrength(word)} size={14} />
            </li>
          ))}
        </ul>
      </ReviewSectionCard>

      <ReviewSectionCard title="Vocabulario pendiente" count={counts.dueWords} emptyMessage="Nada de vocabulario para hoy.">
        <ul className="flex flex-col gap-2">
          {summary.dueWords.slice(0, 4).map((word) => (
            <li key={word.id} className="font-body-sm text-fg">
              {word.text}
              {word.ipa ? <span className="font-ipa ml-2 text-primary">{formatIpa(word.ipa)}</span> : null}
            </li>
          ))}
        </ul>
        {counts.dueWords > 0 ? (
          <Link href="/words" className="font-caption text-primary transition-opacity hover:opacity-80" data-cuelume-hover="tick">
            Ver léxico →
          </Link>
        ) : null}
      </ReviewSectionCard>
    </>
  )
}
