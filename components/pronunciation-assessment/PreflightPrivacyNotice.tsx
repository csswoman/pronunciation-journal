/**
 * Up-front privacy explanation shown before any recording UI.
 */
export function PreflightPrivacyNotice() {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="font-label text-fg">Antes de grabar</p>
      <p className="max-w-prose text-pretty font-body-sm text-fg-muted">
        Vamos a escuchar cómo pronuncias algunas palabras para ubicar tu nivel. Solo enviamos tu
        voz al servicio de reconocimiento para obtener el texto y un puntaje; el audio no se
        guarda de forma predeterminada — guardamos la transcripción y el resultado, no la
        grabación.
      </p>
    </div>
  )
}
