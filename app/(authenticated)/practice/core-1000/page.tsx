import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { ArchivedWordsPanel } from '@/components/practice/core-1000/ArchivedWordsPanel'
import { EssentialWordsSession } from '@/components/practice/core-1000/EssentialWordsSession'

export const metadata = { title: 'Essential Words' }

export default function Core1000Page() {
  return (
    <PageLayout>
      <div className="w-full">
        <PageHeader
          kicker="Practice"
          title="Essential Words"
          subtitle="Las mil palabras más frecuentes del inglés, con weak forms y repaso espaciado."
        />
        <EssentialWordsSession />
        <ArchivedWordsPanel />
      </div>
    </PageLayout>
  )
}
