// Planned structure:
// <ReviewEssentialWordsSection>
//   <ReviewSectionCard title="Palabras esenciales pendientes">
//     <EssentialWordList />
//   </ReviewSectionCard>
// </ReviewEssentialWordsSection>

import Link from 'next/link'
import { ReviewSectionCard } from './ReviewSectionCard'
import type { EssentialWordReviewItem } from '@/lib/review/types'

const SKILL_LABELS = {
  meaning: 'significado',
  listening: 'escucha',
  production: 'producción',
  usage: 'uso',
} as const

interface Props {
  items: EssentialWordReviewItem[]
  count: number
}

/** Real Essential Words skills pending review — links out, since they are practiced on their own surface. */
export function ReviewEssentialWordsSection({ items, count }: Props) {
  return (
    <ReviewSectionCard
      title="Palabras esenciales pendientes"
      count={count}
      emptyMessage="No tienes habilidades de palabras esenciales pendientes."
    >
      <ul className="flex flex-col gap-2">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 font-body-sm text-fg">
            <span>{item.word}</span>
            <span className="font-caption text-fg-muted">{SKILL_LABELS[item.skill]}</span>
          </li>
        ))}
      </ul>
      {count > 0 ? (
        <Link href="/practice/essential-words" className="font-caption text-primary transition-opacity hover:opacity-80">
          Practicar esenciales →
        </Link>
      ) : null}
    </ReviewSectionCard>
  )
}
