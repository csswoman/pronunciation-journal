import PageLayout from '@/components/layout/PageLayout'
import { EssentialWordsSession } from '@/components/practice/core-1000/EssentialWordsSession'

export const metadata = { title: 'Essential Words' }

export default function Core1000Page() {
  return (
    <PageLayout cardWrapper={false}>
      <div className="w-full px-6 pb-18">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Vocabulario · repaso espaciado
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            Essential Words
          </h1>
        </header>
        <EssentialWordsSession />
      </div>
    </PageLayout>
  )
}
