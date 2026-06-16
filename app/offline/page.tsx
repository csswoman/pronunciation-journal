export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="text-2xl font-semibold text-fg">No hay conexión</h1>
      <p className="text-fg-muted max-w-sm">
        Parece que estás sin internet. Algunas funciones requieren conexión.
      </p>
      <div className="bg-surface-raised rounded-xl p-5 text-left max-w-sm w-full">
        <p className="text-sm font-medium text-fg mb-3">Disponible sin conexión:</p>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>✓ Práctica de vocabulario</li>
          <li>✓ Repaso de flashcards</li>
          <li>✓ Tu progreso guardado</li>
        </ul>
      </div>
      <div className="bg-surface-raised rounded-xl p-5 text-left max-w-sm w-full">
        <p className="text-sm font-medium text-fg mb-3">Requiere conexión:</p>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>✗ Práctica de sonidos</li>
          <li>✗ Generación de ejercicios con IA</li>
          <li>✗ Sincronización</li>
        </ul>
      </div>
    </div>
  );
}
