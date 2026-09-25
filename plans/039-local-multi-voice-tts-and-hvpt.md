# Plan 039: Voces locales (Kokoro) y entrenamiento de percepción con muchas voces (HVPT)

> **Executor instructions**: Sigue el plan por fases (A → B → C) y paso a paso; ejecuta cada
> verificación antes de avanzar. Si ocurre algo de "STOP conditions", detente y reporta. No llames a
> `/api/gemini/*` en este plan. El modelo de voz **nunca** se descarga sin una acción explícita de la
> persona. Respeta `CLAUDE.md` (componentes ≤250 líneas, ≤8 props, tokens de diseño, offline). Al
> terminar cada fase, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- proxy.ts hooks/useVoiceRotation.ts lib/phoneme-practice lib/speech components/phoneme-practice components/practice/session/useSessionState.ts lib/offline package.json`
> Compara los extractos con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P1
- **Effort**: L (fase A: 1–2 días de spike · fase B: 2 días · fase C: 2–3 días)
- **Risk**: MED (descarga de un modelo de ~decenas de MB, cambios de CSP)
- **Depends on**: — (independiente de 035–037; el Plan 038 reutiliza su infraestructura de worker y CSP)
- **Category**: pronunciación / audio / direction
- **Planned at**: commit `866979df`, 2026-09-23

## Por qué importa

El entrenamiento fonético de alta variabilidad (HVPT) consiste en oír pares mínimos (*ship/sheep*,
*very/berry*) dichos por **muchas voces distintas** y decir cuál escuchaste, con feedback inmediato. Es la
técnica de pronunciación con más evidencia: un meta-análisis de 79 estudios da un efecto grande en
percepción (g = 0,92 pre/post) con retención a largo plazo, y otro da un efecto medio en producción
(g = 0,77), mayor en consonantes. El número de voces es uno de los factores que modula el efecto.

La app ya tiene casi todo: ejercicios de discriminación (AX, ABX, odd-one-out, identify) y un hook que
rota voces. Pero las voces vienen de `speechSynthesis` del navegador, que cambian por dispositivo
(Windows suele traer 2–3 en inglés, Android a veces una sola) y a menudo suenan robóticas. **Kokoro**
(`kokoro-js`) es un modelo TTS de 82M parámetros, Apache 2.0, que corre en el navegador (WASM o WebGPU)
con 54 voces predefinidas. Da la misma variedad en todos los dispositivos, funciona offline tras
descargarlo y no gasta cuota de Gemini TTS (límite de ~3 RPM).

## Estado actual

- `hooks/useVoiceRotation.ts` (40 líneas) — rota por `getEnglishVoices()` del navegador; `nextVoice()`
  avanza el índice. Lo usa `components/practice/session/useSessionState.ts`.
- `lib/phoneme-practice/tts.ts` — `speak(word, { voice?, rate?, onEnd?… })` y `speakSequence(words, { voice? … })`,
  ambos sobre `SpeechSynthesisUtterance`. El tipo de voz es `SpeechSynthesisVoice`.
- `lib/phoneme-practice/types.ts:7-17` — `ExerciseType` incluye `'ax_same_different' | 'abx' | 'odd_one_out' | 'identify' | 'minimal_pair'`.
  `Exercise.stimuli?: AudioStimulus[]` (`{ word, ipa }`) y `contrastId?` (p. ej. `θ|ð`).
- `lib/phoneme-practice/exercises.ts` — generadores `generateAxSameDifferent` (l. 373), `generateOddOneOut` (424),
  `generateAbx` (475) construyen `stimuli`.
- `components/phoneme-practice/{ABXExercise,AxSameDifferentExercise,OddOneOutExercise,IdentifyExercise,MinimalPairExercise,DictationExercise}.tsx`
  reciben `voice?: SpeechSynthesisVoice` y lo pasan a `speak`/`speakSequence` o `PhonemePlayButton`.
- `lib/speech/model-audio.ts` — `resolveModelAudio(line)`: audio grabado si existe; si no, `{ kind: 'synthesized', text }`
  que hoy cae en `speechSynthesis`.
- `lib/offline/` — gestor de descargas bajo demanda (Dexie + CacheStorage). Patrón a seguir para guardar el modelo.
- `proxy.ts:25-33` — CSP: `worker-src 'self'`, `script-src 'self' 'nonce-…' … 'strict-dynamic'` (sin
  `'wasm-unsafe-eval'` en producción), `connect-src 'self' https://*.supabase.co … https://api.dictionaryapi.dev`.
  **Hoy la CSP bloquearía** la descarga del modelo desde Hugging Face y la compilación de WebAssembly.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/phoneme-practice lib/speech hooks components/phoneme-practice` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` y `npm run lint:design` | exit 0 |
| Build | `pnpm build` | exit 0 (valida que el worker y el paquete empaquetan) |

## Alcance

**Dentro**: `package.json` (añadir `kokoro-js`), `proxy.ts` (solo directivas CSP necesarias),
`lib/speech/tts-provider.ts` y `lib/speech/kokoro/` (crear), `hooks/useVoiceRotation.ts`, `lib/phoneme-practice/tts.ts`,
`lib/phoneme-practice/exercises.ts` (asignación de voces por estímulo), `components/phoneme-practice/*` (tipo de voz),
`lib/speech/model-audio.ts`, un componente de ajustes para activar las voces locales, tests. Además, los documentos listados en el paso de documentación de este plan.

**Fuera**: `/api/gemini/reader-audio` y `/api/gemini/mission-audio` (el Plan 035 decide su papel), evaluación de
pronunciación (038), reconocimiento de voz, contenido de pares mínimos en Supabase.

## Fase A — Spike: ¿Kokoro funciona bien en tus dispositivos?

### A1. Verificar paquete, licencia y peso
Revisa `kokoro-js` en npm y el repo del modelo que carga por defecto (`onnx-community/Kokoro-82M-*-ONNX` o el que
indique su README): licencia (Apache 2.0 esperada), variantes (`q8`, `fp16`, `fp32`) y tamaño de cada una. Lista las
voces en inglés (US/UK, género). Escríbelo en `docs/ai/local-voice-models.md`.
**Verify**: el archivo existe con licencia, tamaños por variante y ≥6 voces en inglés anotadas. Si la licencia no es
permisiva, STOP.

### A2. CSP mínima
En `proxy.ts` añade a `connect-src` solo los hosts de descarga del modelo que muestre la pestaña Red del navegador
(esperado: `https://huggingface.co` y el CDN de ficheros que use, p. ej. `https://*.hf.co`), y `'wasm-unsafe-eval'` a
`script-src`. Configura los binarios `.wasm` de ONNX Runtime para servirse desde `public/` (no desde un CDN externo;
ver opción `wasmPaths` en la documentación de transformers.js / onnxruntime-web). Si el worker se sirve desde el propio
origen, `worker-src 'self'` basta.
**Verify**: `pnpm build` → exit 0; en `pnpm dev`, la consola no muestra violaciones de CSP al cargar el modelo.

### A3. Worker y medición
Crea `lib/speech/kokoro/kokoro-worker.ts` (Web Worker) que carga Kokoro con la variante `q8`, recibe `{ text, voiceId }`
y devuelve un `Float32Array` + `sampleRate`. Crea una página temporal de prueba **solo en desarrollo** o un script de
Vitest con navegador simulado si es viable; mide: tiempo de primera carga, latencia por palabra suelta y por frase de 8
palabras, en WASM y WebGPU (si existe). Anota las cifras en `docs/ai/local-voice-models.md`.
**Verify**: el documento tiene la tabla de mediciones.

### Puerta de la fase A
Continúa solo si: la variante elegida pesa ≤ 120 MB, una palabra suelta tarda ≤ 1,5 s en generarse en WASM en un
portátil normal y las voces se entienden. Si no, reporta; el plan se queda con las voces del navegador (fase B se
puede hacer igualmente con `speechSynthesis`).

## Fase B — Proveedor de voz unificado con caché offline

### B1. Abstracción
Crea `lib/speech/tts-provider.ts`:
```ts
export type VoiceRef =
  | { provider: 'browser'; voice: SpeechSynthesisVoice }
  | { provider: 'kokoro'; voiceId: string; label: string }
export async function playText(text: string, voice: VoiceRef | undefined, opts?: { rate?: number; signal?: AbortSignal }): Promise<void>
export async function playSequence(texts: string[], voices: (VoiceRef | undefined)[], opts?): Promise<void>
```
`browser` delega en `speak`/`speakSequence` de `lib/phoneme-practice/tts.ts`. `kokoro` pide el audio al worker y lo
reproduce con Web Audio. Si Kokoro falla o no está descargado, cae a `browser` sin error visible.
**Verify**: tests con worker y `speechSynthesis` simulados: `kokoro` falla → se usa `browser`.

### B2. Caché de clips
Guarda cada clip generado en CacheStorage con clave `kokoro:{modelVersion}:{voiceId}:{texto normalizado}`. Antes de
generar, busca en caché. Límite de 2.000 clips; al pasarlo, borra los más antiguos.
**Verify**: test: segunda petición igual → 0 mensajes al worker.

### B3. Activación explícita
Añade en los ajustes de Sound Lab (o el lugar de ajustes de audio que ya exista; búscalo con
`grep -rn "Ajustes\|Settings" components/phoneme-practice components/settings`) un interruptor "Voces naturales (descarga
~N MB, funciona sin conexión)". Guarda la preferencia en Dexie (no en `localStorage`). La descarga sigue el patrón de
`lib/offline/`.
**Verify**: test del componente: sin activar, `useVoiceRotation` no devuelve voces Kokoro.

## Fase C — HVPT en los ejercicios de discriminación

### C1. Rotación con voces Kokoro
Cambia `useVoiceRotation` para devolver `VoiceRef` en lugar de `SpeechSynthesisVoice`. Con Kokoro activo, usa un
conjunto fijo de **6 voces de entrenamiento** (mezcla US/UK y género) y reserva **2 voces de prueba** que nunca se usan
en entrenamiento. Sin Kokoro, conserva el comportamiento actual.
**Verify**: test del hook: Kokoro activo → 6 voces rotan y las 2 de prueba no aparecen.

### C2. Una voz distinta por estímulo
En `generateAbx`, `generateAxSameDifferent` y `generateOddOneOut`, añade a cada `AudioStimulus` un `talkerIndex`
(0–5) de modo que, dentro de un mismo ensayo, A, B y X usen voces distintas (así se juzga el sonido y no la voz). Los
componentes pasan la voz correspondiente a `playSequence`.
**Verify**: test del generador: en 100 ensayos ABX, ninguno tiene dos estímulos con el mismo `talkerIndex`.

### C3. Prueba de generalización
Al final de cada sesión de contraste, añade 3 ensayos con las **voces de prueba** y muestra en `SessionSummary` el
acierto con voces nuevas ("Con voces que nunca oíste: 2/3"). Guarda ese dato como evidencia del contraste siguiendo el
mismo camino que usa hoy la sesión para el progreso por contraste (`lib/phoneme-practice/contrast-queries.ts`).
**Verify**: test de `SessionSummary` con el dato; test de la persistencia con Dexie simulada.

### C4. Otras voces sintetizadas de la app
En `lib/speech/model-audio.ts`, cuando la línea no tiene audio grabado, usa `playText` con la voz Kokoro por defecto si
está activa. Esto reduce la necesidad de Gemini TTS para líneas cortas.
**Verify**: test de `resolveModelAudio` / reproductor: sin `modelAudio` y Kokoro activo → proveedor `kokoro`.

## Paso final — Documentación (al cerrar cada fase)

| Fase | Archivo | Qué escribir |
|---|---|---|
| A | `docs/ai/local-voice-models.md` | Creado en A1: licencia, tamaños, voces, mediciones y veredicto de la puerta |
| A | `docs/security/threat-model.md` → "Controles Actuales" | En la línea de CSP (que ya apunta a `proxy.ts`): hosts de Hugging Face añadidos a `connect-src`, `'wasm-unsafe-eval'` y por qué; los `.wasm` se sirven desde `public/` |
| B | `docs/architecture/offline-sync.md` | Clips de voz en CacheStorage (clave, límite de 2.000, invalidación por versión) y preferencia en Dexie |
| C | `docs/architecture/exercises.md` → "Ejercicios de fonética (Phoneme Practice)" | HVPT: 6 voces de entrenamiento + 2 de prueba, una voz distinta por estímulo, prueba de generalización |
| B/C | `README.md` → "Tech stack" y "License and attribution" | Fila "On-device speech: Kokoro TTS (opcional, descarga bajo demanda)" y atribución Apache 2.0 del modelo |
| B | `CLAUDE.md` → tabla "Key lib domains" | Fila `Speech / TTS` → `lib/speech/`: "Proveedor de voz (navegador o Kokoro local); nunca Gemini TTS para audio corto" |
| A–C | `docs/README.md` → tablas "Arquitectura" y "Seguridad" | Enlace a `docs/ai/local-voice-models.md` |

**Verify**: `grep -n "proxy.ts" docs/security/threat-model.md` → ≥1 resultado; `grep -n "Kokoro" README.md CLAUDE.md` → ≥2 resultados (tras la fase B).

## Test plan

- Patrón: tests existentes en `components/phoneme-practice/__tests__/` y `lib/phoneme-practice/__tests__/`.
- Nuevos: fallback de proveedor, caché de clips, activación explícita, rotación 6+2, voces distintas por ensayo,
  resumen de generalización, `model-audio` con Kokoro.

## Criterios de aceptación

- [ ] Sin activar las voces naturales, la app se comporta igual que hoy.
- [ ] Con Kokoro activo, los ejercicios AX/ABX/odd-one-out usan voces distintas dentro de cada ensayo.
- [ ] El resumen de sesión muestra el acierto con voces no entrenadas.
- [ ] Los clips generados se reproducen sin conexión.
- [ ] Ninguna llamada nueva a `/api/gemini/*`; CSP sin comodines amplios (`*`).
- [ ] Documentación del "Paso final" actualizada para las fases ejecutadas.
- [ ] `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design`, `pnpm build` en exit 0.

## STOP conditions

- La licencia del modelo o de las voces no es permisiva.
- Hace falta `'unsafe-eval'` (no `'wasm-unsafe-eval'`) en producción.
- La puerta de la fase A no se cumple.
- Cambiar el tipo de voz obliga a tocar más de los componentes listados en "Estado actual".

## Notas de mantenimiento

- Cambiar de versión del modelo invalida la caché (la versión está en la clave).
- El Plan 038 puede reutilizar el worker, la CSP y el patrón de descarga para su modelo de fonemas.
- Ideas relacionadas sin plan todavía (ver `plans/README.md`, "Backlog propuesto"): dictados con Kokoro, shadowing con
  curva de entonación, modo voz del Coach por turnos.
