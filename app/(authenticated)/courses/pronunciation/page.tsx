import { redirect } from 'next/navigation'

export default async function PronunciationLearningRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; stage?: string }>
}) {
  const params = await searchParams
  const query = new URLSearchParams({ tab: 'path' })
  if (params.target) query.set('target', params.target)
  if (params.stage) query.set('stage', params.stage)
  redirect(`/practice/sounds?${query.toString()}`)
}
