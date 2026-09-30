'use client'

// Planned structure:
// <WeakFormRuleCard>
//   <ModalContainer>
//     <VerdictBanner success />
//     <FullPhraseDisplay />
//     <RuleExplanation ruleEs />
//     <ContinueButton />
//   </ModalContainer>
// </WeakFormRuleCard>

import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'

interface WeakFormRuleCardProps {
  phrase: WeakFormPhraseItem
  success: boolean
  onDismiss: () => void
}

export default function WeakFormRuleCard({
  phrase,
  success,
  onDismiss,
}: WeakFormRuleCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 rounded-3xl bg-surface-card border border-border shadow-xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
        <span
          className={`inline-block px-3 py-1 rounded-full font-mono text-tiny font-bold uppercase tracking-wider ${
            success
              ? 'bg-accent-mint/10 text-accent-mint'
              : 'bg-accent-rose/10 text-accent-rose'
          }`}
        >
          {success ? '¡Excelente!' : '¡Aprende la regla!'}
        </span>

        <h3 className="font-heading text-2xl font-extrabold text-fg">
          {phrase.full}
        </h3>

        <div className="p-4 rounded-2xl bg-surface-base border border-border/50 space-y-1 text-left">
          <div className="font-mono text-tiny font-bold text-accent-lilac uppercase">
            Regla de habla conectada
          </div>
          <p className="font-sans text-body-sm text-fg">
            {phrase.ruleEs}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-90 transition-opacity"
        >
          Siguiente frase 🚀
        </button>
      </div>
    </div>
  )
}
