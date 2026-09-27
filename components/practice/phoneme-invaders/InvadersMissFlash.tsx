'use client'

// Planned structure:
// <InvadersMissFlash>
//   <ToastCard>
//     <ComparisonLine heard chosen contrast />
//     <AudioCompareButtons />
//     <ContinueButton />
//   </ToastCard>
// </InvadersMissFlash>

import type { MissRecord } from '@/lib/games/phoneme-invaders/engine'
import { speak } from '@/lib/phoneme-practice/tts'
import { Volume2 } from '@/components/icons'

interface InvadersMissFlashProps {
  miss: MissRecord
  onDismiss: () => void
}

export default function InvadersMissFlash({
  miss,
  onDismiss,
}: InvadersMissFlashProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 rounded-3xl bg-surface-card border border-border shadow-xl text-center space-y-4 animate-in fade-in zoom-in duration-200">
        <span className="inline-block px-3 py-1 rounded-full bg-accent-rose/10 font-mono text-tiny font-bold uppercase tracking-wider text-accent-rose">
          ¡Casi! Revisa el contraste {miss.contrast}
        </span>

        <h3 className="font-heading text-xl font-extrabold text-fg">
          Sonó <span className="text-primary">{miss.heard.word}</span> ({miss.heard.ipa})
        </h3>

        <p className="font-sans text-body-sm text-fg-muted">
          Elegiste: <span className="font-bold text-fg">{miss.chosen.word}</span> ({miss.chosen.ipa})
        </p>

        <div className="flex items-center justify-center gap-3 py-2">
          <button
            type="button"
            onClick={() => speak(miss.heard.word, { rate: 0.8 })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-sans text-body-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <Volume2 size={16} />
            Escuchar {miss.heard.word}
          </button>

          {miss.chosen.word !== 'Tiempo agotado' && (
            <button
              type="button"
              onClick={() => speak(miss.chosen.word, { rate: 0.8 })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-base border border-border text-fg font-sans text-body-sm font-bold hover:bg-surface-elevated transition-colors"
            >
              <Volume2 size={16} />
              Escuchar {miss.chosen.word}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-90 transition-opacity"
        >
          Continuar 🚀
        </button>
      </div>
    </div>
  )
}
