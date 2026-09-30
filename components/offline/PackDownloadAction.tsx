"use client";

// Planned structure:
// <PackDownloadAction>
//   <ProgressBar /> + <PillButton>Cancelar</PillButton>   (while downloading)
//   <PillButton>Descargar mi nivel X</PillButton>          (idle)
//   <p role="status" />                                     (why disabled)
// </PackDownloadAction>

import { Download } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import ProgressBar from "@/components/ui/ProgressBar";
import type { OfflineResourcePackStatus } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { ResourcePackDownloadProgress } from "@/lib/offline/resource-pack-manager";

interface PackDownloadActionProps {
  level: CefrLevel | null;
  isOnline: boolean;
  progress: ResourcePackDownloadProgress | null;
  receiptStatus: OfflineResourcePackStatus | null;
  onDownload: (level: CefrLevel) => void;
  onCancel: () => void;
}

const PHASE_LABEL: Record<ResourcePackDownloadProgress["phase"], string> = {
  manifest: "Leyendo el paquete…",
  quota: "Comprobando espacio…",
  downloading: "Descargando recursos",
  verifying: "Verificando recursos…",
  coach: "Guardando ejercicios del Coach…",
  done: "Listo",
};

function actionLabel(level: CefrLevel, status: OfflineResourcePackStatus | null): string {
  if (status === "ready") return `Actualizar paquete ${level}`;
  if (status === "failed" || status === "stale") return `Reintentar paquete ${level}`;
  return `Descargar mi nivel ${level}`;
}

export function PackDownloadAction({
  level,
  isOnline,
  progress,
  receiptStatus,
  onDownload,
  onCancel,
}: PackDownloadActionProps) {
  if (progress) {
    const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const counter = progress.phase === "downloading" ? ` ${progress.completed}/${progress.total}` : "";
    return (
      <div className="flex flex-col gap-2">
        <p className="text-caption text-fg-muted" role="status" aria-live="polite">
          {PHASE_LABEL[progress.phase]}
          {counter}
        </p>
        <ProgressBar value={pct} tone="neutral" height="sm" />
        <PillButton variant="outline" size="sm" className="self-start" onClick={onCancel}>
          Cancelar descarga
        </PillButton>
      </div>
    );
  }

  const hint = !isOnline
    ? "Conéctate para descargar; los paquetes guardados siguen disponibles."
    : !level
      ? "Elige un nivel para ver su tamaño y descargarlo."
      : null;

  return (
    <div className="flex flex-col gap-2">
      <PillButton
        variant="primary"
        size="sm"
        className="self-start"
        icon={<Download size={14} />}
        disabled={!isOnline || !level}
        onClick={() => level && onDownload(level)}
      >
        {level ? actionLabel(level, receiptStatus) : "Descargar paquete"}
      </PillButton>
      {hint && <p className="text-caption text-fg-subtle">{hint}</p>}
    </div>
  );
}
