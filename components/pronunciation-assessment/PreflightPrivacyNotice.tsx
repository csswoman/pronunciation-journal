/**
 * Up-front privacy explanation shown before any recording UI. States what is
 * sent, what is retained, and that raw audio is not saved by default (plan
 * 067 out-of-scope: persist transcript/derived evidence only).
 */
export function PreflightPrivacyNotice() {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-[var(--text-primary)]">
      <p className="font-semibold">Antes de grabar</p>
      <p className="text-[var(--text-secondary)]">
        Vamos a escuchar cómo pronuncias algunas palabras para ubicar tu nivel. Solo enviamos tu
        voz al servicio de reconocimiento para obtener el texto y un puntaje; el audio no se
        guarda de forma predeterminada — guardamos la transcripción y el resultado, no la
        grabación.
      </p>
    </div>
  )
}
