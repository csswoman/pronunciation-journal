/**
 * Up-front privacy explanation shown before any recording UI.
 * Short by default; detail stays behind progressive disclosure.
 */
export function PreflightPrivacyNotice() {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="font-label text-fg">Antes de grabar</p>
      <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
        Usamos tu voz solo para reconocer lo que dijiste y orientar la práctica. El audio no se
        guarda de forma predeterminada.
      </p>
      <details className="min-w-0">
        <summary className="cursor-pointer font-body-sm font-medium text-fg">Más detalle</summary>
        <p className="mt-2 max-w-prose text-pretty font-body-sm text-fg-muted">
          Enviamos la voz al servicio de reconocimiento para obtener el texto y un puntaje. Guardamos
          la transcripción y el resultado del diagnóstico, no la grabación.
        </p>
      </details>
    </div>
  )
}