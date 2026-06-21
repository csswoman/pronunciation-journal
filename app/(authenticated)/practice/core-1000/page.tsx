import PageLayout from '@/components/layout/PageLayout'
import { ArchivedWordsPanel } from '@/components/practice/core-1000/ArchivedWordsPanel'
import { EssentialWordsSession } from '@/components/practice/core-1000/EssentialWordsSession'

export const metadata = { title: 'Essential Words' }

export default function Core1000Page() {
  return (
    <PageLayout cardWrapper={false} className="pb-18">
      <div className="w-full">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Vocabulario · repaso espaciado
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-fg">
            Essential Words
          </h1>
        </header>
        <EssentialWordsSession />
        <ArchivedWordsPanel />
      </div>
    </PageLayout>
  )
}
