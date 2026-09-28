// <HomeHeroNewContent>
//   <NewMaterialPreview />

import type { DailyStep } from '@/lib/practice/types'

export default function HomeHeroNewContent({ steps }: { steps: DailyStep[] }) {
  const newStep = steps.find((step) =>
    step.selection?.reason === 'chunk_new' || step.selection?.reason === 'word_new')
  const newContent = newStep?.chunks?.[0]?.contentGraph?.text
    ?? newStep?.chunks?.[0]?.chunk
    ?? newStep?.featuredWords?.[0]

  return (
    <p className="text-body-sm text-ink-secondary">
      {newContent
        ? <>También aprenderás: <strong lang="en" className="text-ink">{newContent}</strong>.</>
        : 'Hoy no encontramos contenido nuevo disponible en este plan.'}
    </p>
  )
}
