import type { ReactNode } from 'react'

interface GameReviewListProps {
  title: string
  children: ReactNode
}

/** "Para repasar" block inside a results panel; each game renders its own <li> rows. */
export default function GameReviewList({ title, children }: GameReviewListProps) {
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h3 className="font-sans text-body-sm font-bold text-ink">{title}</h3>
      <ul className="flex max-h-72 flex-col divide-y divide-ink/15 overflow-y-auto">{children}</ul>
    </section>
  )
}
