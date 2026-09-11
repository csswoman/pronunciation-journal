interface SetupHeaderProps {
  isAnonymous: boolean
}

/**
 * Encabezado + aviso de modo invitado. Separado del resto porque no depende
 * de ningún estado de selección.
 */
export function SetupHeader({ isAnonymous }: SetupHeaderProps) {
  return (
    <div className="mb-8">
      <span className="text-tiny uppercase tracking-wider font-semibold text-[var(--primary)] block mb-1">
        Modo Foco
      </span>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Cierra tus gaps de inglés
      </h1>
      <p className="text-body text-[var(--text-secondary)]">
        Elige hasta 2 puntos que se te dificulten. Generamos una historia, ejercicios,
        un diálogo y más, centrados exclusivamente en dominarlos durante tu sprint.
      </p>

      {isAnonymous && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-start gap-3">
          <span className="text-lg">💾</span>
          <div className="text-body-sm">
            <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
              Modo invitado: guardado en tu navegador
            </span>
            <span className="text-[var(--text-secondary)] leading-relaxed">
              No has iniciado sesión, así que tu sprint y tu progreso se guardan localmente
              (IndexedDB). Si limpias tus datos o cambias de dispositivo, se perderán hasta
              que inicies sesión.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
