"use client";

// Planned structure:
// <OfflineCoachPack>
//   <AuthProvider>
//     <OfflineCoachPackRuntime />
//   </AuthProvider>
// </OfflineCoachPack>

import { useEffect, useState } from "react";
import AuthProvider, { useAuth } from "@/components/auth/AuthProvider";
import { PillButton } from "@/components/ui/PillButton";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  downloadCoachExercises,
  getCoachExercisesOfflineCount,
  removeCoachExercisesOffline,
  useCoachExercisesOfflineCount,
} from "@/lib/offline/download-manager";

export function OfflineCoachPack() {
  return (
    <AuthProvider>
      <OfflineCoachPackRuntime />
    </AuthProvider>
  );
}

function OfflineCoachPackRuntime() {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  // Canonical resolution, same source as the level pack, so both suggest the
  // same level. `unknown` (read failed / offline) never becomes a guessed level.
  const { learnerLevel, loading: levelLoading } = useUserPreferences();
  const coachLevel = learnerLevel && learnerLevel.source !== "unknown" ? learnerLevel.level : null;
  const [isOnline, setIsOnline] = useState(false);
  const [packBusy, setPackBusy] = useState(false);
  const [packMessage, setPackMessage] = useState("");
  const coachExerciseCount = useCoachExercisesOfflineCount(coachLevel ?? "");

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const handleDownloadCoachPack = async () => {
    if (!coachLevel || !userId || !isOnline) return;
    setPackBusy(true);
    setPackMessage("");
    try {
      const result = await downloadCoachExercises(coachLevel, 100);
      const total = await getCoachExercisesOfflineCount(coachLevel);
      setPackMessage(result.count > 0
        ? `La descarga encontró ${result.count} ejercicios; ahora tienes ${total} guardados para ${coachLevel}.`
        : total > 0
          ? `Ya tienes ${total} ejercicios descargados para ${coachLevel}.`
          : "No hay ejercicios disponibles para descargar en este nivel.");
    } catch {
      setPackMessage("No se pudo descargar el set. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setPackBusy(false);
    }
  };

  const handleRemoveCoachPack = async () => {
    if (!coachLevel) return;
    setPackBusy(true);
    try {
      await removeCoachExercisesOffline(coachLevel);
      setPackMessage(`Se quitaron los ejercicios descargados de ${coachLevel}.`);
    } catch {
      setPackMessage("No se pudo quitar la descarga. Inténtalo de nuevo.");
    } finally {
      setPackBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body-sm font-medium text-fg">
            {coachLevel ? `Nivel ${coachLevel}` : "Nivel de tu cuenta"}
          </p>
          <p className="text-caption text-fg-muted">
            {coachExerciseCount} ejercicios guardados para practicar sin conexión.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillButton
            variant="outline"
            size="sm"
            isLoading={packBusy}
            disabled={!coachLevel || !userId || !isOnline}
            onClick={() => void handleDownloadCoachPack()}
          >
            {coachExerciseCount > 0 ? "Actualizar descarga" : "Descargar hasta 100"}
          </PillButton>
          {coachExerciseCount > 0 && (
            <PillButton
              variant="quiet"
              size="sm"
              disabled={packBusy}
              onClick={() => void handleRemoveCoachPack()}
            >
              Quitar descarga
            </PillButton>
          )}
        </div>
      </div>
      <p className="text-caption text-fg-subtle" role="status">
        {packMessage || (auth.loading || levelLoading
          ? "Comprobando tu cuenta…"
          : !coachLevel
            ? "No pudimos resolver el nivel de tu cuenta."
            : !userId
              ? "Inicia sesión para descargar ejercicios del Coach."
              : !isOnline
                ? "Conéctate para descargar nuevos ejercicios; los ya guardados siguen disponibles."
                : "El set se guarda en este dispositivo y funciona sin conexión.")}
      </p>
    </div>
  );
}
