// Planned structure:
// <DailyExploreLinks>
//   link → /courses
//   link → /practice
//
// Pie de /daily: salidas opcionales hacia teoría y práctica libre.

import Link from 'next/link'
import { GraduationCap, Sparkles } from '@/components/icons'

export default function DailyExploreLinks() {
  return (
    <div className="flex flex-col items-center gap-2 pt-2 text-center sm:flex-row sm:justify-center">
      <Link
        href="/courses"
        className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 font-label text-fg-muted transition-colors hover:text-primary"
      >
        <GraduationCap size={16} className="text-primary" aria-hidden />
        Ver cursos y teoría
      </Link>
      <Link
        href="/practice"
        className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 font-label text-fg-muted transition-colors hover:text-primary"
      >
        <Sparkles size={16} className="text-primary" aria-hidden />
        ¿Práctica libre? Elige qué trabajar
      </Link>
    </div>
  )
}
