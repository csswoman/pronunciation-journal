'use client'

// Planned structure:
// <ProductionFeedbackStatus>
//   <StatusBanner />
//   <CriteriaChips>
//     <CriterionChip />
//   </CriteriaChips>
// </ProductionFeedbackStatus>

import { cn } from '@/lib/cn'

interface StatusBannerProps {
  correct: boolean
  score: number
  usedTarget: boolean
  grammaticallyCorrect: boolean
  constraintMet?: boolean
}

export function StatusBanner({
  correct,
  score,
  usedTarget,
  grammaticallyCorrect,
  constraintMet,
}: StatusBannerProps) {
  let title = '¡Excelente oración!'
  let subtitle = 'Has usado la palabra objetivo con una estructura clara y correcta.'

  if (!correct) {
    if (!usedTarget) {
      title = 'Falta la palabra objetivo'
      subtitle = 'No detectamos la palabra requerida. Recuerda incluirla en tu oración.'
    } else if (!grammaticallyCorrect) {
      title = 'Buen intento — revisa la gramática'
      subtitle = 'Usaste la palabra clave, pero hay detalles por ajustar en la oración.'
    } else if (constraintMet === false) {
      title = 'Casi listo — revisa el requisito de la tarea'
      subtitle = 'Falta cumplir la instrucción solicitada para esta práctica.'
    } else {
      title = 'Buen intento — revisa las sugerencias'
      subtitle = 'Compara tu oración con la versión recomendada a continuación.'
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-[var(--radius-md)] border px-4 py-3.5',
        correct
          ? 'border-success-border bg-success-soft text-success'
          : 'border-warning-border bg-warning-soft text-warning',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 flex items-center gap-2 text-body-sm font-semibold">
          <span aria-hidden>{correct ? '✓' : '○'}</span>
          <span>{title}</span>
        </p>
        <span className="font-mono text-tiny font-medium opacity-80">
          {score} / 100
        </span>
      </div>
      <p className="m-0 pl-5 text-caption font-medium opacity-80">
        {subtitle}
      </p>
    </div>
  )
}

interface CriteriaChipsProps {
  usedTarget: boolean
  grammaticallyCorrect: boolean
  constraintMet?: boolean
}

export function CriteriaChips({
  usedTarget,
  grammaticallyCorrect,
  constraintMet,
}: CriteriaChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Criterios de evaluación">
      <CriterionChip
        label={usedTarget ? 'Palabra clave: usada' : 'Palabra clave: no detectada'}
        ok={usedTarget}
      />
      <CriterionChip
        label={grammaticallyCorrect ? 'Gramática: correcta' : 'Gramática: con ajustes'}
        ok={grammaticallyCorrect}
      />
      {constraintMet !== undefined && (
        <CriterionChip
          label={constraintMet ? 'Requisito: cumplido' : 'Requisito: no cumplido'}
          ok={constraintMet}
        />
      )}
    </div>
  )
}

function CriterionChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium',
        ok ? 'bg-success-soft text-success' : 'bg-error-soft text-error',
      )}
    >
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
      <span className="sr-only">{ok ? ': correcto' : ': necesita revisión'}</span>
    </span>
  )
}
