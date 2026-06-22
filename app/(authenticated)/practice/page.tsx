import PracticeHubClient from '@/components/practice/hub/PracticeHubClient'

interface PageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function PracticePage({ searchParams }: PageProps) {
  const { from } = await searchParams
  return <PracticeHubClient fromDaily={from === 'daily'} />
}
