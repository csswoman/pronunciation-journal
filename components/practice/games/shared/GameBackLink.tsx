import Link from 'next/link'
import { ChevronLeft } from '@/components/icons'

/** Quiet way back to the games catalogue, shown above intro and results. */
export default function GameBackLink() {
  return (
    <Link
      href="/practice/games"
      className="inline-flex min-h-11 w-fit items-center gap-1 rounded-full pr-3 font-sans text-body-sm font-semibold text-fg-muted transition-colors hover:text-fg focus-ring"
    >
      <ChevronLeft size={18} aria-hidden />
      Juegos
    </Link>
  )
}
