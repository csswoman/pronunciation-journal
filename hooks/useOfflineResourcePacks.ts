"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { listOfflineResourcePacks, type OfflineResourcePackRecord } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { OfflinePackManifest } from "@/lib/offline/pack-types";
import {
  ResourcePackDownloadError,
  downloadResourcePack,
  fetchOfflinePackManifest,
  removeResourcePack,
  repairOrphanedReceipts,
  type ResourcePackDownloadProgress,
} from "@/lib/offline/resource-pack-manager";

function downloadErrorMessage(err: unknown): string {
  if (!(err instanceof ResourcePackDownloadError)) {
    return "No se pudo completar la descarga. Inténtalo de nuevo.";
  }
  if (err.reason === "cancelled") return "Descarga cancelada.";
  const base =
    err.reason === "quota"
      ? `No hay espacio suficiente en este dispositivo para el paquete ${err.level}.`
      : "No se pudo completar la descarga. Comprueba tu conexión e inténtalo de nuevo.";
  return err.previousReceiptPreserved ? `${base} Tu paquete anterior sigue disponible.` : base;
}

/**
 * Orchestrates CEFR resource packs for the offline hub (Plan 057, Step 5):
 * durable receipts come from Dexie (live), the manifest is read once for
 * sizes, and in-flight progress stays ephemeral in this hook.
 */
export function useOfflineResourcePacks() {
  const receipts = useLiveQuery(() => listOfflineResourcePacks(), [], [] as OfflineResourcePackRecord[]);
  const [manifest, setManifest] = useState<OfflinePackManifest | null>(null);
  const [progress, setProgress] = useState<ResourcePackDownloadProgress | null>(null);
  const [message, setMessage] = useState("");
  const [busyLevel, setBusyLevel] = useState<CefrLevel | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    // Repair first so a pack whose cache was evicted never shows as ready.
    void repairOrphanedReceipts().catch(() => undefined);
    fetchOfflinePackManifest()
      .then((next) => {
        if (active) setManifest(next);
      })
      .catch(() => {
        if (active) setManifest(null);
      });
    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  const download = useCallback(async (level: CefrLevel) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBusyLevel(level);
    setMessage("");
    try {
      const result = await downloadResourcePack(level, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      setMessage(
        result.coachCount > 0
          ? `Paquete ${level} listo, con ${result.coachCount} ejercicios del Coach.`
          : `Paquete ${level} listo para estudiar sin conexión.`,
      );
    } catch (err) {
      setMessage(downloadErrorMessage(err));
    } finally {
      abortRef.current = null;
      setBusyLevel(null);
      setProgress(null);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const remove = useCallback(async (level: CefrLevel) => {
    setBusyLevel(level);
    try {
      await removeResourcePack(level);
      setMessage(`Se quitó el paquete ${level}. Tus lecciones descargadas y tu progreso siguen intactos.`);
    } catch {
      setMessage("No se pudo quitar el paquete. Inténtalo de nuevo.");
    } finally {
      setBusyLevel(null);
    }
  }, []);

  return { receipts, manifest, progress, message, busyLevel, download, cancel, remove };
}
