import { Info } from '@/components/icons'

interface SetupHeaderProps {
  isAnonymous: boolean
}

/**
 * Aviso contextual para modo invitado en la configuración del sprint.
 */
export function SetupHeader({ isAnonymous }: SetupHeaderProps) {
  if (!isAnonymous) return null

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border-default bg-surface-raised p-3.5 text-body-sm shadow-xs">
      <Info className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-fg">
          Modo invitado: guardado en tu navegador
        </span>
        <p className="text-fg-muted text-tiny leading-relaxed">
          Tu sprint y tu progreso se guardan localmente en este dispositivo.
          Para sincronizar entre dispositivos y respaldar tus datos, inicia sesión cuando quieras.
        </p>
      </div>
    </div>
  )
}

