'use client'

import { ListenButton } from '@/components/ui/ListenButton'
import Button from '@/components/ui/Button'
import { PillButton } from '@/components/ui/PillButton'

interface Props {
  cue?: string
  onListen: () => void
  onSlow: () => void
  onRetry: () => void
  onTransfer?: () => void
  compact?: boolean
}

/** Shared, signal-neutral remediation path. It never claims a score itself. */
export function RemediationSequence({ cue, onListen, onSlow, onRetry, onTransfer, compact = false }: Props) {
  return (
    <section aria-label="Siguiente práctica" className={compact ? 'space-y-3' : 'space-y-3 rounded-md border border-border-subtle bg-surface-raised p-4'}>
      <p className="m-0 font-kicker text-fg-subtle">SIGUIENTE PRÁCTICA</p>
      {cue && <p className="m-0 text-body-sm leading-relaxed text-fg-muted">{cue}</p>}
      <div className="flex flex-wrap gap-2">
        <ListenButton onPlay={onListen} label="Escuchar modelo" />
        <ListenButton onPlay={onSlow} label="Más lento" />
        <Button variant="secondary" size="sm" onClick={onRetry}>Reintentar</Button>
        {onTransfer && <PillButton variant="outline" size="sm" onClick={onTransfer}>Frase variada</PillButton>}
      </div>
    </section>
  )
}
