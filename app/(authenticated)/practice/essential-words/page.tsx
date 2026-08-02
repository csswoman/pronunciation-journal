import PageLayout from '@/components/layout/PageLayout'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'

export const metadata = { title: 'Palabras esenciales' }

export default function EssentialWordsPage() {
  return (
    <PageLayout
      archetype="session"
      className="pt-[var(--layout-page-block)]! pb-[calc(var(--layout-page-block-end)+var(--space-12))]! sm:pt-[var(--layout-page-block)]! sm:pb-[var(--layout-page-block-end)]!"
    >
      <div className="w-full">
        <EssentialWordsSession />
      </div>
    </PageLayout>
  )
}
