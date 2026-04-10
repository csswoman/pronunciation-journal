# State Management — Patrones de uso

## Separación de responsabilidades

| Capa | Qué guarda | Tecnología |
|------|-----------|-----------|
| **UI State** | `isRecording`, `currentPhoneme`, dialogs, `recordingPhase` | Zustand (`useJournalStore`) |
| **Data State** | `attempts`, `aiConversations`, `srsData`, `dailyProgress` | Dexie (IndexedDB) |
| **Remote State** | `answer_history`, `user_sound_progress` | Supabase (via Server Actions) |

---

## Patrón completo: finishAttempt

```tsx
// app/lesson/[id]/page.tsx  (Client Component)
"use client";

import { useJournalStore, useLiveAttemptsForLesson } from "@/store";
import { syncAttemptToSupabase } from "@/app/actions/attempts";

export default function LessonPage({ params }: { params: { id: string } }) {
  const { finishAttempt, startLessonSession, recordingPhase } = useJournalStore();

  // Reactivo: se actualiza automáticamente cuando finishAttempt escribe en Dexie
  const attempts = useLiveAttemptsForLesson(params.id);

  useEffect(() => {
    startLessonSession(params.id);
  }, [params.id]);

  async function handleResult(word: string, result: ScoringResult) {
    await finishAttempt(word, result, xp, {
      // Opcional: sincroniza a Supabase en paralelo (fire-and-forget)
      serverAction: syncAttemptToSupabase,
    });
    // En este punto Dexie ya tiene el attempt → attempts[] ya se actualizó
  }

  return (
    <div>
      <p>Estado: {recordingPhase}</p>
      <p>Intentos esta sesión: {attempts.length}</p>
    </div>
  );
}
```

## AI dialog

```tsx
import { useAIDialog, useJournalStore } from "@/store";

function WordHighlight({ word, context }: { word: string; context: string }) {
  const openAIDialog = useJournalStore((s) => s.openAIDialog);
  return <span onClick={() => openAIDialog(word, context)}>{word}</span>;
}

function SaveWordModal() {
  const dialog = useAIDialog(); // { open, word, context } | { open: false }
  const closeAIDialog = useJournalStore((s) => s.closeAIDialog);

  if (!dialog.open) return null;
  return <Modal word={dialog.word} onClose={closeAIDialog} />;
}
```

## Selector hooks (evitar re-renders innecesarios)

```tsx
// Importa el selector ya memoizado, no el store entero
import { useRecordingPhase, useCurrentPhoneme } from "@/store";

function RecordButton() {
  const phase = useRecordingPhase(); // solo re-renderiza si cambia recordingPhase
  return <button disabled={phase === "recording"}>Grabar</button>;
}
```

## Sin Server Action (offline puro)

```tsx
await finishAttempt(word, result, xp);
// Sin options → solo Dexie, sin red
```
