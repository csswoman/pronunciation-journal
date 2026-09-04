/** Placeholder while path evidence hydrates — avoids canonical→diagnostic flash. */
export function PronunciationPathLoadingCard() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando tu siguiente práctica"
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-border-default bg-surface-raised p-4 shadow-xs sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="h-3 w-32 animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none" />
        <div className="h-7 w-56 max-w-full animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-prose animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none" />
        <div className="h-4 w-3/4 max-w-prose animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-xl bg-surface-sunken motion-reduce:animate-none sm:w-48" />
      <span className="sr-only">Cargando tu siguiente práctica…</span>
    </section>
  )
}
