"use client";

// Planned structure:
// <SavedPackRow>
//   <Badge />  (status)
//   <PillButton>Estudiar</PillButton>          (ready only)
//   <PillButton>Reintentar</PillButton>        (not ready)
//   <PillButton>Quitar</PillButton>
// </SavedPackRow>

import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import type { OfflineResourcePackRecord, OfflineResourcePackStatus } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import { formatPackBytes } from "@/lib/offline/pack-level-suggestion";

interface SavedPackRowProps {
  receipt: OfflineResourcePackRecord;
  busy: boolean;
  isOnline: boolean;
  studyOpen: boolean;
  onToggleStudy: (level: CefrLevel) => void;
  onRedownload: (level: CefrLevel) => void;
  onRemove: (level: CefrLevel) => void;
}

const STATUS_BADGE: Record<OfflineResourcePackStatus, { label: string; variant: BadgeVariant }> = {
  ready: { label: "Disponible sin conexión", variant: "success" },
  stale: { label: "Incompleto: vuelve a descargarlo", variant: "warning" },
  failed: { label: "Descarga fallida", variant: "error" },
  downloading: { label: "Descargando", variant: "info" },
};

export function SavedPackRow({
  receipt,
  busy,
  isOnline,
  studyOpen,
  onToggleStudy,
  onRedownload,
  onRemove,
}: SavedPackRowProps) {
  const level = receipt.level as CefrLevel;
  const badge = STATUS_BADGE[receipt.status];
  const date = new Date(receipt.downloadedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-semibold text-fg">Paquete {level}</p>
        <p className="text-caption text-fg-muted">
          {formatPackBytes(receipt.estimatedBytes)} · {date}
        </p>
        <Badge label={badge.label} variant={badge.variant} />
      </div>
      <div className="flex flex-wrap gap-2">
        {receipt.status === "ready" && (
          <PillButton
            variant="outline"
            size="sm"
            aria-expanded={studyOpen}
            onClick={() => onToggleStudy(level)}
          >
            {studyOpen ? "Cerrar" : "Estudiar"}
          </PillButton>
        )}
        {receipt.status !== "ready" && (
          <PillButton
            variant="outline"
            size="sm"
            disabled={busy || !isOnline}
            onClick={() => onRedownload(level)}
          >
            Reintentar
          </PillButton>
        )}
        <PillButton
          variant="quiet"
          size="sm"
          disabled={busy}
          aria-label={`Quitar paquete ${level}`}
          onClick={() => onRemove(level)}
        >
          Quitar
        </PillButton>
      </div>
    </div>
  );
}
