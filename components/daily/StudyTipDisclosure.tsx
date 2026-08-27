// Planned structure:
// <StudyTipDisclosure>  — a native <details>, closed by default. No state,
//   no selection, no persistence. Pure static guidance.

export default function StudyTipDisclosure() {
  return (
    <details className="group rounded-card-interactive border border-border-default bg-daily-card px-[var(--layout-card-pad)] py-3">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-2 font-body-sm font-medium text-fg marker:content-none">
        ¿Cómo estudiar hoy?
        <span className="text-fg-muted transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-2 text-body-sm text-fg-muted">
        <p>Una rutina de referencia — no es obligatoria:</p>
        <ul className="flex flex-col gap-1 pl-4">
          <li className="list-disc">~15 min de repaso espaciado (tu plan del día)</li>
          <li className="list-disc">
            ~15 min de lectura y <em>shadowing</em>
          </li>
          <li className="list-disc">
            ~30 min de inmersión (video, podcast, serie) — regístrala abajo
          </li>
        </ul>
        <p>
          El enfoque es <strong className="text-fg">adquisición natural</strong>: comprensión
          primero, sin forzar el habla temprana.
        </p>
      </div>
    </details>
  )
}
