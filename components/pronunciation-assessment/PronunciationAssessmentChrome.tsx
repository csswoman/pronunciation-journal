import PageHeader from '@/components/layout/PageHeader'

export type AssessmentChromeStage = 'preflight' | 'prompts' | 'results' | 'finish_error'

interface PronunciationAssessmentChromeProps {
  stage: AssessmentChromeStage
}

function QuietChrome({ kicker }: { kicker: string }) {
  return (
    <header className="flex flex-col gap-1 pb-2">
      <span className="font-kicker text-fg-muted">{kicker}</span>
    </header>
  )
}

/**
 * Stage-aware page chrome so preflight / prompts / results don't share one
 * static exam-style header. Prompts and results stay quiet so the task owns
 * the primary heading (single h1).
 */
export function PronunciationAssessmentChrome({ stage }: PronunciationAssessmentChromeProps) {
  if (stage === 'preflight') {
    return (
      <PageHeader
        variant="compact"
        kicker="Antes de empezar"
        title="Pronunciación"
        subtitle="Unas preguntas cortas para ubicar qué practicar primero."
      />
    )
  }

  if (stage === 'prompts') {
    return <QuietChrome kicker="Pronunciación" />
  }

  if (stage === 'finish_error') {
    return (
      <PageHeader
        variant="compact"
        kicker="Pronunciación"
        title="Algo no cuadró"
      />
    )
  }

  return <QuietChrome kicker="Pronunciación" />
}
