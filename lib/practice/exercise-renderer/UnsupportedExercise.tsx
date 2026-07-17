interface Props {
  slug: string
  onSkip: () => void
}

export function UnsupportedExercise({ slug, onSkip }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-fg-subtle">
        Este tipo de ejercicio ({slug}) aún no está disponible aquí.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="rounded-[var(--radius-md)] bg-surface-raised px-4 py-2 text-sm font-medium text-fg-muted"
      >
        Omitir
      </button>
    </div>
  )
}
