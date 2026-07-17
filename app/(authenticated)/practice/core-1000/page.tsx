import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { EssentialWordsSession } from '@/components/practice/core-1000/EssentialWordsSession'
import { SrsVault } from '@/components/practice/srs-vault/SrsVault'

export const metadata = { title: 'Palabras esenciales' }

export default function Core1000Page() {
  return (
    <PageLayout>
      <div className="w-full">
        <PageHeader
          kicker="Práctica"
          title="Palabras esenciales"
          subtitle="Las mil palabras más frecuentes del inglés, con weak forms y repaso espaciado."
        />
        <EssentialWordsSession />
        <SrsVault />
      </div>
    </PageLayout>
  )
}
