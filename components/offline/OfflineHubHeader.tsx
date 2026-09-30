"use client";

// Planned structure:
// <OfflineHubHeader>
//   <h1 /> + <p />                          (copy depends on connection)
//   <button>Comprobar conexión</button>      (offline only)
// </OfflineHubHeader>

import { RefreshCw } from "@/components/icons";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Online it's the downloads page; offline it's the fallback study hub. */
export function OfflineHubHeader() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-h1" aria-hidden="true">{isOnline ? "📥" : "📡"}</div>
      <h1 className="text-h3 font-semibold text-fg">
        {isOnline ? "Descargas sin conexión" : "Modo sin conexión"}
      </h1>
      <p className="max-w-md text-body text-fg-muted">
        {isOnline
          ? "Guarda el paquete de tu nivel o lecciones sueltas en este dispositivo para estudiar después sin internet."
          : "Estás navegando sin internet. Puedes seguir estudiando lo que descargaste en este dispositivo."}
      </p>
      {!isOnline && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1.5 font-mono text-caption text-fg-muted transition-colors hover:text-fg"
        >
          <RefreshCw size={12} />
          Comprobar conexión
        </button>
      )}
    </div>
  );
}
