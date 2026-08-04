import PageLayout from '@/components/layout/PageLayout'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'

export const metadata = { title: 'Palabras esenciales' }

export default function EssentialWordsPage() {
  return (
    <PageLayout
      archetype="session"
      className="pt-space-8! pb-[calc(var(--layout-page-block-end)+var(--space-12))]! sm:pt-space-10! sm:pb-layout-page-block-end!"
    >
      <EssentialWordsSession />
    </PageLayout>
  )
}
