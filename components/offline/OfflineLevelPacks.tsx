"use client";

// Planned structure:
// <OfflineLevelPacks>
//   <AuthProvider>
//     <OfflineLevelPacksRuntime>
//       <PackLevelPicker />        (only when the level is unknown)
//       <PackDownloadAction />
//       <SavedPackRow /> × n
//       <PackStudyPanel />         (under the pack being studied)
//     </OfflineLevelPacksRuntime>
//   </AuthProvider>
// </OfflineLevelPacks>

import { useState } from "react";
import AuthProvider from "@/components/auth/AuthProvider";
import { useOfflineResourcePacks } from "@/hooks/useOfflineResourcePacks";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { DownloadedLessonRecord } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import { formatPackBytes, suggestPackLevel } from "@/lib/offline/pack-level-suggestion";
import { PackDownloadAction } from "./PackDownloadAction";
import { PackLevelPicker } from "./PackLevelPicker";
import { PackStudyPanel } from "./PackStudyPanel";
import { SavedPackRow } from "./SavedPackRow";

interface OfflineLevelPacksProps {
  onStudyLesson: (lesson: DownloadedLessonRecord) => void;
  onStudyWords: (level: CefrLevel) => void;
}

export function OfflineLevelPacks(props: OfflineLevelPacksProps) {
  return (
    <AuthProvider>
      <OfflineLevelPacksRuntime {...props} />
    </AuthProvider>
  );
}

function OfflineLevelPacksRuntime({ onStudyLesson, onStudyWords }: OfflineLevelPacksProps) {
  const { learnerLevel, loading } = useUserPreferences();
  const isOnline = useOnlineStatus();
  const packs = useOfflineResourcePacks();
  const [chosenLevel, setChosenLevel] = useState<CefrLevel | null>(null);
  const [studyLevel, setStudyLevel] = useState<CefrLevel | null>(null);

  const suggestion = suggestPackLevel(learnerLevel, loading);
  const level = suggestion.kind === "suggested" ? suggestion.level : chosenLevel;
  const entry = level ? packs.manifest?.levels.find((candidate) => candidate.level === level) : undefined;
  const receipt = level ? packs.receipts.find((candidate) => candidate.level === level) : undefined;

  return (
    <section
      aria-labelledby="offline-level-packs-title"
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface-raised p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="offline-level-packs-title" className="text-body font-semibold text-fg">
          Paquete de tu nivel
        </h2>
        <p className="text-caption text-fg-muted">
          Essential Words, lecciones de gramática con sus audios y hasta 100 ejercicios del Coach.
          Descargarlo necesita internet; estudiarlo después, no.
        </p>
      </div>

      {suggestion.kind === "loading" && (
        <p className="text-caption text-fg-subtle" role="status">Comprobando tu nivel…</p>
      )}
      {suggestion.kind === "unknown" && <PackLevelPicker value={chosenLevel} onChange={setChosenLevel} />}
      {suggestion.kind === "suggested" && (
        <div className="flex flex-col gap-1">
          <p className="text-body-sm font-medium text-fg">Nivel {suggestion.level}</p>
          {suggestion.note && <p className="text-caption text-fg-muted">{suggestion.note}</p>}
        </div>
      )}
      {entry && (
        <p className="text-caption text-fg-muted">
          Tamaño estimado: {formatPackBytes(entry.estimatedBytes)}
        </p>
      )}

      {suggestion.kind !== "loading" && (
        <PackDownloadAction
          level={level}
          isOnline={isOnline}
          progress={packs.progress}
          receiptStatus={receipt?.status ?? null}
          onDownload={(next) => void packs.download(next)}
          onCancel={packs.cancel}
        />
      )}

      {packs.message && (
        <p className="text-caption text-fg-subtle" role="status" aria-live="polite">{packs.message}</p>
      )}

      {packs.receipts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm font-semibold text-fg">Paquetes guardados en este dispositivo</h3>
          <ul className="flex flex-col gap-2">
            {packs.receipts.map((saved) => (
              <li key={saved.id} className="flex flex-col gap-2">
                <SavedPackRow
                  receipt={saved}
                  busy={packs.busyLevel !== null}
                  isOnline={isOnline}
                  studyOpen={studyLevel === saved.level}
                  onToggleStudy={(next) => setStudyLevel((open) => (open === next ? null : next))}
                  onRedownload={(next) => void packs.download(next)}
                  onRemove={(next) => void packs.remove(next)}
                />
                {studyLevel === saved.level && saved.status === "ready" && (
                  <PackStudyPanel receipt={saved} onStudyLesson={onStudyLesson} onStudyWords={onStudyWords} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
