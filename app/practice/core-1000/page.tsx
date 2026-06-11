import PageLayout from '@/components/layout/PageLayout'
import { Core1000Session } from '@/components/practice/core-1000/Core1000Session'

export const metadata = { title: 'Core 1000' }

export default function Core1000Page() {
  return (
    <PageLayout cardWrapper={false}>
      <div className="mx-auto w-full max-w-[1080px] px-6 pb-18">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Vocabulario · repaso espaciado
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            Core 1000
          </h1>
        </header>
        <Core1000Session />
      </div>
    </PageLayout>
  )
}
