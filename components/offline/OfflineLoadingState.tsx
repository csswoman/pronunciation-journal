"use client";

// Planned structure:
// <OfflineLoadingState>
//   <LoadingStatus | ImportErrorAndRetry />
// </OfflineLoadingState>

import { PillButton } from "@/components/ui/PillButton";

interface OfflineLoadingStateProps {
  message?: string;
  error?: Error | null;
  retry?: () => void;
}

export function OfflineLoadingState({
  message = "Preparando contenido sin conexión…",
  error,
  retry,
}: OfflineLoadingStateProps) {
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 text-body-sm text-fg">
        <p>No se pudo cargar este contenido.</p>
        {retry ? (
          <PillButton type="button" variant="outline" size="sm" onClick={retry}>
            Reintentar
          </PillButton>
        ) : null}
      </div>
    );
  }

  return <p role="status" className="text-body-sm text-fg-muted">{message}</p>;
}
