import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'
import { SrsVault } from '@/components/practice/srs-vault/SrsVault'

export const metadata = { title: 'Palabras esenciales' }

export default function EssentialWordsPage() {
  return (
    <PageLayout
      archetype="session"
      className="pt-[var(--layout-page-block)]! pb-[calc(var(--layout-page-block-end)+var(--space-12))]! sm:pt-[var(--layout-page-block)]! sm:pb-[var(--layout-page-block-end)]!"
    >
      <div className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            kicker="Práctica"
            title="Palabras esenciales"
            subtitle="Las palabras más frecuentes del inglés, con formas relajadas al hablar y repaso espaciado."
            className="max-sm:gap-[var(--layout-stack)]! max-sm:pb-[var(--layout-section-gap)]!"
          />
          <div className="shrink-0 sm:pt-8">
            <SrsVault />
          </div>
        </div>
        <EssentialWordsSession />
      </div>
    </PageLayout>
  )
}
