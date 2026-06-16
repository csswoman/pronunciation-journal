# Phoneme Feedback Table en flujo Sounds (Fase 2) — Diseño

**Fecha:** 2026-06-16
**Estado:** Aprobado
**Alcance:** Fase 2 — flujo `/practice/sounds` (`SpeakExercise`)
**Depende de:** Fase 1 (`PhonemeFeedbackTable`, `articulation.ts`) — ya implementada.

## Resumen

Mostrar la tabla de feedback fonético estilo ELSA (`PhonemeFeedbackTable`) en el
ejercicio de pronunciación del flujo sounds (`SpeakExercise`), tras grabar. Hoy
ese ejercicio es "shadowing" puro: escuchas el modelo, repites, y siempre pasa
sin nota ni transcripción. Esta fase añade transcripción + scoring SOLO como
feedback informativo, sin alterar la naturaleza shadowing ni el SRS.

## Decisiones de diseño (acordadas en brainstorming)

1. **Pedagogía sin cambios de SRS.** El ejercicio sigue siendo shadowing:
   `onSubmit(true, ...)` se dispara igual al terminar de grabar (siempre "pasa",
   no re-encola por nota). La tabla es feedback extra, no una evaluación. La
   exclusión actual de `speak_word` del SRS se mantiene intacta.
2. **Transcripción vía endpoint existente.** `SpeakExercise` ya graba un blob
   webm/opus con `useVoiceRecorder`. Ese blob se envía a `/api/gemini/transcribe`
   (que ya existe y acepta `targetWord`), y con el transcript se corre
   `scorePronunciation(transcript, targetWord)`. Se conserva la grabación
   reproducible existente ("oír mi voz", comparación de duración).
3. **Degradación elegante ante fallo de red.** Si la transcripción falla (sin
   conexión, timeout, error de Gemini), el ejercicio se comporta como hoy:
   muestra la comparación de duración + "oír mi voz", sin tabla. Nunca bloquea
   el avance.

### Nota sobre offline

CLAUDE.md marca `/practice/sounds` como online-only temporal (excepción a la
regla de offline). El ejercicio vive bajo `sound/[soundId]`, dentro de esa
excepción, así que requerir red para la transcripción está permitido. La
degradación elegante asegura que el shadowing básico siga funcionando sin red.

## Arquitectura

```
SpeakExercise (graba con useVoiceRecorder → blob)
  └─ al terminar de grabar:
       useBlobTranscription.run(blob, targetWord)   ← NUEVO hook
          ├─ blob → dataURL base64
          ├─ POST /api/gemini/transcribe { audioDataUrl, targetWord }  (existente)
          ├─ scorePronunciation(transcript, targetWord)  (existente, local)
          └─ devuelve { wordResults, transcript, accuracy }
       └─ render <PhonemeFeedbackTable wordResults={...} />  (existente, Fase 1)
```

### Pieza nueva: `hooks/useBlobTranscription.ts`

Responsabilidad única: dado un blob de audio + palabra objetivo, transcribir vía
Gemini y puntuar localmente. Sin UI, sin grabación.

```ts
interface TranscriptionScore {
  wordResults: WordResult[]
  transcript: string
  accuracy: number
}

type TranscriptionState = 'idle' | 'transcribing' | 'done' | 'error'

interface UseBlobTranscriptionReturn {
  state: TranscriptionState
  score: TranscriptionScore | null
  error: string | null
  run: (blob: Blob, targetWord: string) => Promise<void>
  reset: () => void
}
```

Flujo de `run(blob, targetWord)`:
1. `state = 'transcribing'`.
2. Convertir blob → data URL base64 (patrón de `GeminiAdapter.blobToBase64`).
3. POST a `/api/gemini/transcribe` con `{ audioDataUrl, targetWord }`.
4. Respuesta no-OK o fetch falla → `state = 'error'`, `error` poblado, `score` null.
5. Con `transcript` → `scorePronunciation(transcript, targetWord)` →
   `state = 'done'`, `score` poblado.
6. Transcript vacío (audio inentendible) → `state = 'done'`; `scorePronunciation`
   ya maneja transcript vacío y produce wordResults con fonemas missing/incorrect.

Por qué un hook y no reusar `GeminiAdapter`: el adapter está acoplado a un
`MediaStream` en vivo (graba él mismo). Aquí ya tenemos el blob de
`useVoiceRecorder`, así que solo necesitamos transcribir-un-blob.

## Integración en `SpeakExercise`

Aditivo — no cambia grabación, duración ni playback existentes.

```tsx
const { state: txState, score, run, reset: resetTx } = useBlobTranscription()

// Disparo al terminar de grabar
useEffect(() => {
  if (recState === 'done' && result && exercise.targetWord) {
    void run(result.blob, exercise.targetWord)
  }
}, [recState, result, exercise.targetWord, run])
```

El `onSubmit(true, ...)` de shadowing se mantiene exactamente como está (se
dispara al terminar de grabar, sin esperar a la transcripción).

Estados visuales, bajo la comparación de duración existente:

| `txState`      | Qué se muestra |
|----------------|----------------|
| `transcribing` | "Analizando tu pronunciación…" (texto sutil) |
| `done` + score | `<PhonemeFeedbackTable wordResults={score.wordResults} />` |
| `error`        | Nada extra — el shadowing (duración + "oír mi voz") queda intacto |

`handleReset` (el "Intentar de nuevo" existente) también llama `resetTx()` para
limpiar la tabla al regrabar.

Caso borde: en `focusUi` (shell de teléfono) la tabla debe caber. Ya tiene
`max-w-md` + `overflow-hidden`; se verifica en implementación.

## Manejo de errores / casos borde

- Fetch falla / red caída / `AbortError` por timeout → `state = 'error'`, sin tabla.
- Servidor responde error (auth, rate-limit, 503) → `state = 'error'`, sin tabla.
- Transcript vacío (audio OK pero inentendible) → `state = 'done'` con wordResults
  que muestran fonemas missing/incorrect (feedback válido).
- `targetWord` ausente → no se dispara la transcripción (guard en el `useEffect`).

## Testing (Vitest)

`hooks/__tests__/useBlobTranscription.test.ts`:
- `fetch` mock OK con transcript → `state` llega a `'done'`, `score.wordResults`
  poblado, scoring corrido contra el target correcto.
- `fetch` que rechaza → `state = 'error'`, `score` null.
- Respuesta `!ok` → `state = 'error'`.
- `reset()` vuelve a `'idle'`.

`SpeakExercise`: sin test nuevo (YAGNI). Es orquestación con dependencias de audio
(MediaRecorder no existe en jsdom); el valor está en el test del hook. La tabla
ya está testeada en Fase 1.

## Archivos

| Archivo | Acción |
|---------|--------|
| `hooks/useBlobTranscription.ts` | Crear — hook de transcripción + scoring |
| `hooks/__tests__/useBlobTranscription.test.ts` | Crear — tests del hook |
| `components/phoneme-practice/SpeakExercise.tsx` | Editar — disparar transcripción + render tabla |

## Fuera de alcance

- Cambiar el SRS de sounds (sigue siendo shadowing).
- Análisis de audio real (feedback por señal, no por texto).
- Descripciones articulatorias por IA.
