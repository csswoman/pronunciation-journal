export const dynamic = 'force-dynamic'

import DailyChecklist, { type ConceptLesson } from '@/components/daily/DailyChecklist'
import { getTodaysMiniLesson } from '@/lib/content/lessons'

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams

  let conceptLesson: ConceptLesson | null = null

  try {
    const lesson = await getTodaysMiniLesson()
    if (lesson) {
      conceptLesson = { slug: lesson.slug, title: lesson.title, subtitle: lesson.subtitle }
    }
  } catch {
    conceptLesson = null
  }

  return <DailyChecklist conceptLesson={conceptLesson} initialStepId={step} />
}
