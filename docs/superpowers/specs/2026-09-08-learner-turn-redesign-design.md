# Rediseño del turno del learner en misiones guiadas

**Fecha:** 2026-09-08
**Estado:** Aprobado (pendiente de plan de implementación)
**Rama:** dev

## Problema

En las misiones guiadas del AI Coach (`ScriptedMissionRunner`), el turno del
estudiante (`LearnerLine` → `LearnerSpeechControls`) tiene tres carencias:

1. **Bug de captura.** El botón "Hablar" arranca y se desactiva solo sin capturar
   la voz. En Chrome Android (pestaña normal y PWA instalada) el indicador de
   micrófono del sistema se enciende pero la transcripción nunca llega. Causa
   raíz: `LearnerLine` usa `useSpeechRecognition`, que está clavado a la Web
   Speech API (`webkitSpeechRecognition`). En Chrome Android esa API adquiere el
   micrófono pero `onresult` no dispara de forma fiable — o dispara `onerror`
   con `network` — incluso con buena conexión. `isWebSpeechReliable()` deja
   pasar Chrome Android como fiable, así que nunca cae al fallback de Gemini.

2. **Sin feedback real de grabación.** La "onda" de `LearnerSpeechControls` es un
   array `WAVE_BARS` con animación CSS fija — no reacciona a la voz. El usuario
   no tiene señal de que el micrófono está capturando.

3. **Sin escucha previa ni shadowing.** Cuando le toca hablar, el estudiante no
   puede escuchar primero la frase objetivo. `CoachLine` tiene botón "Repetir" +
   resaltado palabra a palabra, pero eso es el turno del coach, no el del
   learner. No hay forma de reproducir la frase completa para imitar el ritmo,
   ni palabra por palabra para aislar sonidos difíciles.

## Objetivo

Rediseñar el turno del learner como un orquestador con piezas aisladas que:

- Capture audio de forma fiable en Chrome Android ruteando a Gemini cuando la
  Web Speech API no sirve (reutilizando la infraestructura de adapters que ya
  existe).
- Muestre una forma de onda real (osciloscopio en vivo) mientras se graba.
- Permita escuchar la frase objetivo **antes y después** de hablar: frase
  completa con resaltado sincronizado, y cada palabra tocable individualmente.
- Degrade a "modo práctica sin puntuación" cuando no hay STT posible ni con
  Gemini (sin red): se graba igual, se compara la voz propia con el modelo, se
  continúa sin score.

## No objetivos

- Migrar `useSpeechRecognition` fuera de otras pantallas (`ReaderSentenceRecorder`,
  `SpokenProductionExercise`, `SpeakScoredExercise`, phoneme `SpeakExercise`,
  etc.). Ese hook se queda; solo `LearnerLine` deja de usarlo.
- Refactor de `WaveformVisualizer` o `RecordingControls` — los usan otras
  pantallas y quedan igual.
- Cambiar el motor de evaluación (`defaultEvaluationEngine`), el scoring de la
  sesión, o la persistencia.
- Cambios en el turno del coach más allá de extraer el prefetch de audio a un
  hook compartido.

## Arquitectura

### Estructura de componentes

```
<LearnerLine>                     orquestador (~120 líneas): estado del intento + scoring
  <ShadowingPanel>                escuchar el modelo antes/después de hablar
    <FullPhraseRow>               botón ▶ "Escuchar frase" + frase con resaltado sincronizado
    <WordChips>                   cada palabra un <button> tocable → speak(word)
  <LearnerSpeechControls>         capturar la voz (solo cuando !attempt)
    <ScrollingWaveform>           <canvas> osciloscopio en vivo (useVoiceLevel)
    botón Mic (Hablar / Detener)
    banner error / "Analizando…" / hint modo práctica
  <SpokenLineFeedback>            (ya existe) frase coloreada palabra a palabra
  <SelfPlaybackAudioBar>          (ya existe) Nativo vs Mi voz
  <RetryAndContinue>              (extraído) los dos botones Repetir / Continuar
```

### Flujo de datos

1. `LearnerLine` monta → `ShadowingPanel` prefetchea el audio HD de la frase vía
   `useMissionLineAudio` (misma cola `fetchMissionLineAudio` que `CoachLine`).
2. El usuario pulsa "Escuchar frase" o toca palabras sueltas — playback puro, sin
   tocar el micrófono, sin pedir permisos. Funciona con la app instalada aunque
   la captura esté rota.
3. El usuario pulsa **Hablar** → `useLearnerSpeechCapture.start()`:
   - Pide **un** `MediaStream` vía `useSharedMicStream`.
   - Ese stream alimenta a la vez: (a) el adapter de STT vía `useSpeechInput`,
     (b) un `MediaRecorder` para el auto-playback, (c) un `AnalyserNode` para el
     waveform (vía `useVoiceLevel`, que recibe `capture.micStream`).
   - `useSpeechInput` con `prefer: 'auto'` elige Web Speech (Chrome real) o
     Gemini (Chrome Android, Brave, Edge…). Si Web Speech falla con `network` /
     `service-not-allowed`, cae a Gemini solo. **Esto arregla el bug.**
4. El usuario pulsa **Detener** → `stop()` → `useSpeechInput` resuelve el
   transcript → `LearnerLine` corre `defaultEvaluationEngine.evaluate()` (igual
   que hoy) → `<SpokenLineFeedback>` + `<SelfPlaybackAudioBar>`.
5. Si no hay STT ni con Gemini (sin red): `capture.canScore === false` → modo
   práctica. Se graba para el playback, se muestra `SelfPlaybackAudioBar`, se
   continúa con `onLineComplete(null)` (sin inventar un 0).

### Manejo de errores

- `useSpeechInput` ya mapea a mensajes públicos (`network`, `not-allowed`,
  `no-speech`, o mensaje de degradación de Gemini). `useLearnerSpeechCapture`
  normaliza a `errorCode: 'network' | 'not-allowed' | 'no-speech' | 'unknown'`.
- `LearnerSpeechControls` muestra el banner con los mismos textos de hoy +
  botón "Reintentar" → `capture.reset()`.
- `useVoiceLevel` cierra siempre el `AudioContext` y desconecta el `AnalyserNode`
  en el cleanup — nunca toca los tracks del stream (eso es de
  `useSharedMicStream.release`).
- `useLearnerSpeechCapture` en `reset()` y al desmontar: detiene el
  `MediaRecorder`, revoca el `userAudioUrl` anterior.
- `LearnerLine` llama `release()` de `useSharedMicStream` en el cleanup del
  componente (patrón idéntico a `MissionWorkspace`).

## Unidades

### `useSharedMicStream` (existente, sin cambios)

`hooks/useSharedMicStream.ts`. Expone `{ getStream, release }`. `getStream`
devuelve un `MediaStream` cacheado con `echoCancellation / noiseSuppression /
autoGainControl`, compartible entre STT + `MediaRecorder` + `AnalyserNode`.
`release` detiene los tracks. Sin cambios.

### `useVoiceLevel(stream: MediaStream | null)` (nuevo, ~60 líneas)

`hooks/useVoiceLevel.ts`.

**Qué hace:** convierte un `MediaStream` en muestras de amplitud en tiempo real
para dibujar el osciloscopio.

- Crea `AudioContext` + `AnalyserNode` (`fftSize: 2048`,
  `smoothingTimeConstant: 0.6`), conecta `createMediaStreamSource(stream)`.
- Bucle `requestAnimationFrame`: lee `getByteTimeDomainData` en un `Uint8Array`,
  lo empuja a un ring buffer (últimas ~200 columnas).
- Devuelve `{ getSamples: () => Uint8Array, peak: number }`. `getSamples` se lee
  desde el `rAF` del canvas — **no** provoca re-render de React.
- `prefers-reduced-motion`: no arranca el `rAF`; `peak` se actualiza a ~10 Hz
  con `setInterval` para una barra de nivel simple.
- **Cleanup:** `cancelAnimationFrame` + `analyser.disconnect()` +
  `audioContext.close()`. Nunca toca los tracks del stream.
- **Dependencias:** solo `stream`. Sin `stream` → no-op, `getSamples` devuelve
  buffer de ceros, `peak` es 0.

**Tests** (`hooks/__tests__/useVoiceLevel.test.ts`): mock `AudioContext`; crea
analyser al recibir stream; llama `close()` al recibir `null`; no arranca `rAF`
con `prefers-reduced-motion` mockeado.

### `useLearnerSpeechCapture({ targetText, getStream })` (nuevo, ~90 líneas)

`hooks/useLearnerSpeechCapture.ts`.

**Qué hace:** orquesta la captura completa de un intento hablado. Envuelve
`useSpeechInput` y le suma el audio propio + el stream para el waveform.

```ts
interface UseLearnerSpeechCaptureOptions {
  targetText: string
  getStream: () => Promise<MediaStream>
}

interface LearnerCapture {
  status: 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
  transcript: string | null
  userAudioUrl: string | null      // para SelfPlaybackAudioBar
  micStream: MediaStream | null    // para useVoiceLevel
  errorCode: 'network' | 'not-allowed' | 'no-speech' | 'unknown' | null
  canScore: boolean                // false → modo práctica sin score
  start: () => Promise<void>
  stop: () => void
  reset: () => void
}
```

- **STT:** delega en `useSpeechInput({ prefer: 'auto', getStream, onResult })`.
  El fallback Web Speech → Gemini ya vive ahí.
- **Audio propio:** en `start()`, además del STT, arranca un
  `MediaRecorder(stream)` con el mismo stream que devuelve `getStream()`. En
  `stop()`, al terminar, crea el `blob` → `URL.createObjectURL` → `userAudioUrl`;
  revoca el anterior. Lógica aislada aquí (hoy vive suelta en
  `useSpeechRecognition` líneas 96-113).
  - **Un solo `MediaRecorder` siempre**, independientemente del adapter. El
    `GeminiAdapter` graba internamente pero no expone su blob, y la ruta Web
    Speech no graba nada. Para que `SelfPlaybackAudioBar` funcione igual en
    ambas rutas, `useLearnerSpeechCapture` mantiene su propio `MediaRecorder`
    sobre el stream compartido. Se acepta la pequeña redundancia en la ruta
    Gemini (dos recorders sobre el mismo stream) a cambio de una sola ruta de
    audio propio, más simple de razonar y testear.
- **`micStream`:** expone el stream que devolvió `getStream()` mientras
  `status === 'listening'`, si no `null`. Eso enciende/apaga `useVoiceLevel`.
- **`canScore`:** `false` si `useSpeechInput.isSupported` es `false`, o si el
  `status` acabó en `error` con `errorCode === 'network'` sin transcript.
- **`errorCode`:** normaliza el `error: string` de `useSpeechInput` al enum.
- **Cleanup:** en `reset()` y al desmontar — `stop()` del recorder, revoca
  `userAudioUrl`. El stream lo suelta el dueño (`LearnerLine`).

**Tests** (`hooks/__tests__/useLearnerSpeechCapture.test.ts`): mock
`useSpeechInput` + `MediaRecorder`; `start` arranca recorder; `stop` con result
→ `userAudioUrl` + `status: 'done'`; `error` con `network` → `canScore: false`;
`errorCode` mapeado; `reset` revoca el blob URL.

### `useMissionLineAudio(line, missionId)` (nuevo, ~35 líneas)

`hooks/useMissionLineAudio.ts`.

**Qué hace:** extrae el `useEffect` de prefetch de audio HD de la frase que hoy
está duplicado en `CoachLine` (líneas 56-76) y en `ScriptedMissionRunner`.

- Si `line.modelAudio?.path` existe → lo devuelve directo, sin fetch.
- Si no, y hay `missionId` y `navigator.onLine` → `fetchMissionLineAudio(line,
  missionId)`; al resolver, si `missionId` empieza por `generated.` llama
  `updateGeneratedScriptLineAudio`.
- Devuelve `{ hdAudioUrl: string | undefined }`.
- Cleanup con flag `active` para no setear tras desmontar.

`CoachLine` se refactoriza para usarlo (cambio pequeño, misma conducta).

**Tests** (`hooks/__tests__/useMissionLineAudio.test.ts`): mock
`fetchMissionLineAudio`; devuelve `hdAudioUrl` al resolver; no hace fetch si
`line.modelAudio.path` ya existe; no hace fetch offline.

### `ScrollingWaveform` (nuevo, ~70 líneas)

`components/ai-coach/missions/scripted/ScrollingWaveform.tsx`.

```tsx
interface Props {
  getSamples: () => Uint8Array   // de useVoiceLevel
  isActive: boolean              // status === 'listening'
  className?: string
}
```

- Un `<canvas>`. `useEffect` arranca un `requestAnimationFrame` propio cuando
  `isActive`; cada frame: limpia, lee `getSamples()`, dibuja la forma de onda
  como polyline que se desplaza a la izquierda (el buffer más nuevo entra por la
  derecha).
- Colores vía tokens: trazo `var(--error)` (rojo = grabando, coherente con el
  resto de indicadores de grabación), fondo transparente, línea 2px.
- `style={{}}` **solo** para `width` / `height` del canvas en píxeles reales
  (`devicePixelRatio`) — cómputo en runtime, permitido.
- `!isActive` → cancela el `rAF`, limpia el canvas. No desmonta.
- `prefers-reduced-motion` → en vez de la polyline animada, una barra horizontal
  cuya anchura sigue `peak` (10 Hz). Sin `rAF`.
- `aria-hidden` — decorativo; el estado real lo anuncia el `role="status"` de
  `LearnerSpeechControls`.
- **Sustituye** la onda falsa de `LearnerSpeechControls` (bloque `WAVE_BARS`,
  líneas 24 y 40-61).

**Tests** (`.../scripted/__tests__/ScrollingWaveform.test.tsx`): `isActive` → hay
`<canvas>`; reduced-motion mockeado → hay la barra, no se llama
`requestAnimationFrame`.

### `ShadowingPanel` (nuevo, ~110 líneas)

`components/ai-coach/missions/scripted/ShadowingPanel.tsx`.

```tsx
interface Props {
  line: ScriptLine
  missionId?: string
}
```

**Estructura interna:**

```
<ShadowingPanel>
  <FullPhraseRow>    botón ▶ "Escuchar frase" + la frase con resaltado sincronizado
  <WordChips>        cada palabra un <button> tocable
```

- **Frase completa:** `useMissionLineAudio(line, missionId)` → `hdAudioUrl`.
  Botón ▶ reproduce el `<audio>` HD y arranca `useSpokenWordHighlight` con
  `line.modelAudio?.durationMs ?? estimatedDuration(line.text)`. Fallback a
  `speak()` (TTS del navegador) si el audio falla o estás offline — con
  `onBoundary` → `highlight.markWord` como en `CoachLine`.
- **Palabras (`WordChips`):** `splitSpokenWords(line.text)` → cada una un chip
  `<button>`. Tap → `speak(word)` (TTS del navegador; rápido, sin trocear el
  audio HD). El chip que suena se ilumina; también se ilumina el que va sonando
  durante el playback de la frase completa (comparte `activeIndex` de
  `useSpokenWordHighlight`).
- Colores / espaciado por tokens. Chips: `bg-surface-sunken` en reposo,
  `bg-primary-soft text-primary` activo. `cn()` para el condicional.
- **Sin micrófono** — solo escucha. No pide permisos.
- Se muestra **siempre** en el turno del learner: antes de hablar y después del
  intento. No desaparece al grabar.

`estimatedDuration` y `wordIndexAtChar` se comparten con `CoachLine` — se mueven
a `lib/speech/word-timings.ts` (donde ya viven `splitSpokenWords` y
`estimateWordOffsets`) o a un util local del directorio `scripted/`.

**Tests** (`.../scripted/__tests__/ShadowingPanel.test.tsx`): mock
`fetchMissionLineAudio`; N palabras → N chips; tap chip → `speak(word)`; botón
frase → play del audio HD; sin `hdAudioUrl` → `speak(line.text)`.

### `LearnerSpeechControls` (reescrito, ~90 líneas; hoy 120)

`components/ai-coach/missions/scripted/LearnerSpeechControls.tsx`.

```tsx
interface Props {
  status: LearnerCapture['status']
  isScoring: boolean
  errorCode: LearnerCapture['errorCode']
  getSamples: () => Uint8Array      // NUEVO
  canScore: boolean                 // NUEVO
  onStart: () => void | Promise<void>
  onStop: () => void
  onRetry: () => void
}
```

- Bloque `WAVE_BARS` (líneas 24, 40-61) **eliminado** → `<ScrollingWaveform
  getSamples={getSamples} isActive={status === 'listening'} />` dentro del pill
  "Grabando tu voz…".
- `status === 'processing'` reutiliza el estado visual de `isScoring`
  ("Analizando…").
- Si `!canScore` y `status === 'idle'`: texto tenue bajo el botón — "Sin
  conexión para evaluar: practica y compara tu voz." El botón sigue diciendo
  **Hablar** (graba igual para el playback).
- Banner de error: mismos textos que hoy (`not-allowed`, `no-speech`, `network`,
  genérico) + "Reintentar".
- Botón Mic: `Hablar` / `Detener` según `status === 'listening'`, sin cambios de
  estilo.

**Tests:** actualizar `.../scripted/__tests__/LearnerSpeechControls.test.tsx` —
`status: 'listening'` → `<canvas>` presente (no las barras CSS); `!canScore` →
hint de modo práctica; errores → textos + Reintentar.

### `RetryAndContinue` (nuevo, ~25 líneas)

`components/ai-coach/missions/scripted/RetryAndContinue.tsx`. Los dos botones
"Repetir" / "Continuar" que hoy son JSX suelto en `LearnerLine` (líneas
155-173). Props: `{ onRetry: () => void; onContinue: () => void }`.

### `LearnerLine` (reescrito como orquestador, ~120 líneas; hoy 178)

`components/ai-coach/missions/scripted/LearnerLine.tsx`.

```tsx
interface Props {
  line: ScriptLine
  missionId?: string               // NUEVO — desde ScriptedMissionRunner
  onLineComplete: (result: LineAttemptResult | null) => void
}
```

- `useSharedMicStream()` → `{ getStream, release }`; `useEffect(() => release,
  [release])`.
- `useLearnerSpeechCapture({ targetText: line.text, getStream })` → `capture`.
- `useVoiceLevel(capture.micStream)` → `voice`.
- Scoring: cuando `capture.status === 'done' && capture.transcript && !attempt`
  → `defaultEvaluationEngine.evaluate(...)` (misma lógica que hoy líneas 53-71,
  leyendo de `capture`).
- Remediation: idéntico a hoy (líneas 80-96).
- `handleRetry`: `setAttempt(null); capture.reset()`.
- `<ShadowingPanel line={line} missionId={missionId} />` **siempre** visible.
- `!attempt` → `<LearnerSpeechControls>` con `status`, `isScoring: isScoring ||
  capture.status === 'processing'`, `errorCode`, `getSamples: voice.getSamples`,
  `canScore`, handlers.
- `attempt` → `<SpokenLineFeedback>` + score + `<SyllableRemediation>` +
  `<SelfPlaybackAudioBar targetWord={line.text} userAudioUrl={capture.userAudioUrl} />`
  + `<RetryAndContinue>`.
- El early-return `!isSupported` de hoy (líneas 104-114) se subsume en
  `canScore === false`: mismo layout, `LearnerSpeechControls` en modo práctica +
  `ShadowingPanel` visible + Continuar con `onLineComplete(null)`.

**Tests:** actualizar `.../scripted/__tests__/LearnerLine.test.tsx` —
`ShadowingPanel` siempre presente; `capture.status: 'done'` + transcript → corre
`evaluate` → `SpokenLineFeedback`; sin STT (`canScore: false`) → modo práctica
con Continuar.

## Cambios en archivos existentes

| Archivo | Cambio |
|---|---|
| `components/ai-coach/missions/scripted/ScriptedMissionRunner.tsx` | pasar `missionId={mission.id}` a `<LearnerLine>`; opcionalmente usar `useMissionLineAudio` en el prefetch de líneas del coach |
| `components/ai-coach/missions/scripted/CoachLine.tsx` | usar `useMissionLineAudio` en vez del `useEffect` de prefetch inline (misma conducta); importar `estimatedDuration` / `wordIndexAtChar` desde su nueva ubicación |
| `lib/speech/word-timings.ts` | recibir `estimatedDuration` y `wordIndexAtChar` (movidas desde `CoachLine`) |
| `hooks/useSharedMicStream.ts` | sin cambios |

## Estrategia de tests

Vitest + Testing Library. Archivos nuevos junto a la fuente o en `__tests__/`.

**Hooks (unit):**
- `useVoiceLevel.test.ts` — mock `AudioContext`; crea analyser con stream, limpia
  (`close()`) con `null`, no arranca `rAF` con reduced-motion.
- `useLearnerSpeechCapture.test.ts` — mock `useSpeechInput` + `MediaRecorder`;
  `start` arranca recorder; `stop` → `userAudioUrl` + `status: 'done'`; `error`
  `network` → `canScore: false`; `errorCode` mapeado; `reset` revoca blob URL.
- `useMissionLineAudio.test.ts` — mock `fetchMissionLineAudio`; devuelve
  `hdAudioUrl` al resolver; no fetch si `modelAudio.path` existe; no fetch
  offline.

**Componentes:**
- `ScrollingWaveform.test.tsx` — `isActive` → `<canvas>`; reduced-motion → barra,
  sin `requestAnimationFrame`.
- `ShadowingPanel.test.tsx` — N palabras → N chips; tap chip → `speak(word)`;
  botón frase → play HD; sin `hdAudioUrl` → `speak(line.text)`.
- `LearnerSpeechControls.test.tsx` (actualizar) — `listening` → `<canvas>` (no
  barras CSS); `!canScore` → hint modo práctica; errores → textos + Reintentar.
- `LearnerLine.test.tsx` (actualizar) — `ShadowingPanel` siempre presente;
  `done` + transcript → `evaluate` → `SpokenLineFeedback`; sin STT → modo
  práctica con Continuar.

**Regresión:** `CoachLine.test.tsx` y `ScriptedMissionRunner.test.tsx` verdes sin
cambios de aserción (conducta idéntica).

## Reglas del proyecto verificadas

- Ningún archivo nuevo supera 250 líneas (el mayor, `ShadowingPanel`, ~110).
- Cada componente / hook = una responsabilidad, nombre de dominio explícito.
- Sin `style={{}}` salvo `width` / `height` del canvas (runtime, permitido).
- Sin colores / spacing / radii hardcodeados — tokens vía Tailwind + `cn()`.
- Sin prompts fuera de `lib/ai-prompts.ts` (no aplica; no hay prompts nuevos).
- Sin llamadas a Supabase fuera de `lib/*/queries.ts` (no aplica).
- Offline: modo práctica sin score cubre el caso sin red; `ShadowingPanel` cae a
  TTS del navegador; `useMissionLineAudio` no fetchea offline.
- Sin hooks multipropósito: `useSpeechRecognition` no se toca; los hooks nuevos
  tienen alcance único.

## Riesgos

- **`useSpeechInput` no expone el `MediaStream`.** `useLearnerSpeechCapture` debe
  obtener el stream por su cuenta vía `getStream` (el mismo que pasa a
  `useSpeechInput`), y confiar en que `useSharedMicStream` lo cachea para que sea
  literalmente el mismo objeto. Verificar en implementación que
  `getStream()` devuelve la instancia cacheada en la segunda llamada.
- **`AudioContext` en móvil requiere gesto de usuario.** `useVoiceLevel` crea el
  contexto al recibir el stream, que solo llega tras pulsar "Hablar" (gesto) —
  debería estar bien, pero validar en Chrome Android real.
- **Gemini como ruta principal en Android añade latencia** (grabar → subir →
  transcribir, presupuesto 30 s). El estado `processing` ("Analizando…") cubre la
  espera visualmente. Aceptado: es la única ruta que funciona ahí.
- **Doble consumo del stream** (STT + `MediaRecorder` + `AnalyserNode`). Los tres
  son lectores; ningún navegador moderno lo impide, pero validar que el
  `MediaRecorder` de Gemini y el nuestro no colisionan — puede que solo haga
  falta uno. Revisar en implementación si `GeminiAdapter` ya graba y podemos
  reusar su blob en vez de un segundo `MediaRecorder`.
