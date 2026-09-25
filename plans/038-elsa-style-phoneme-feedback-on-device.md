# Plan 038: Feedback de pronunciación por sonido (estilo ELSA) sin gastar cuota de IA

> **Executor instructions**: Este plan tiene una **puerta de decisión** (fin de la fase B). Ejecuta las
> fases en orden: A → B → (C solo si B pasa la puerta). Ejecuta cada verificación antes de avanzar.
> Si ocurre algo de "STOP conditions", detente y reporta. No uses Gemini ni ningún servicio de pago
> para puntuar pronunciación. Al terminar cada fase, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- lib/pronunciation components/lesson components/practice/essential-words components/exercises/SpeakScoredExercise.tsx lib/speech docs/architecture/adr-064-acoustic-pronunciation-assessment.md`
> Compara los extractos con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P2
- **Effort**: L (fase A: 1–2 días · fase B: 2–3 días de spike · fase C: 2–3 días, condicional)
- **Risk**: HIGH (afirmar precisión acústica sin validarla engaña a quien aprende)
- **Depends on**: fase A de `plans/039-local-multi-voice-tts-and-hvpt.md` solo para las fases B/C (CSP para
  WebAssembly y descargas de Hugging Face, patrón de Web Worker). La fase A de este plan no depende de nada.
- **Category**: pronunciación / direction
- **Planned at**: commit `866979df`, 2026-09-23 (revisado el mismo día: corpus L2-ARCTIC con hablantes de español,
  modelo ONNX verificado, puerta basada en precisión de errores marcados)

## Por qué importa

La dueña quiere un feedback como ELSA Speak: cada sonido de la palabra marcado como correcto o
incorrecto, con un consejo de articulación. ELSA no usa un LLM para eso: usa un **modelo acústico
propio** que reconoce fonemas directamente del audio. La app ya tiene la UI (`PhonemeFeedbackTable`),
pero la alimenta con una señal que no mide sonidos: el reconocimiento de voz del navegador devuelve
**palabras**, y tiende a "corregir" hacia palabras válidas. Si dices "berry" en vez de "very", el
navegador probablemente escribe "very" y la tabla muestra "¡Excelente!" en /v/. Por eso el feedback se
siente pobre. Gemini tampoco lo resuelve: la transcripción tiene ~25 RPD y no mide fonética.

La vía gratuita que falta probar es un **modelo de reconocimiento de fonemas (CTC) que corra en el
navegador**: 0 requests de IA, funciona sin conexión tras descargarlo y, a diferencia del experimento de
formantes ya rechazado, entrega su propia alineación temporal.

## Estado actual

- `docs/architecture/adr-064-acoustic-pronunciation-assessment.md` — decisión vigente: **NO-SHIP** de
  evaluación acústica de vocales. El benchmark de formantes contra speechocean762 dio 0,309 de acuerdo
  (umbral 0,85). Parte del fallo se atribuye a la segmentación estimada (sin alineador). La ADR prohíbe
  afirmar "evaluación acústica" en la UI hasta que un plan nuevo pase el benchmark. **Este es ese plan.**
- `lib/pronunciation/scoring.ts` — `scorePronunciation(transcript, target)`: diff de palabras + proyección de
  fonemas CMUdict con `analyzePhonemes` (`lib/pronunciation/phonemes.ts`). Señal: `stt_intelligibility`.
- `lib/pronunciation/acoustic-evaluator.ts` — interfaz `AcousticEvaluator` (sin implementación en producción),
  `evaluatorKind: 'forced_alignment' | 'vendor_api' | 'formant_dsp'`, con abstención por dimensión.
- `lib/pronunciation/acoustic/benchmark/` — arnés: `corpus-loader.ts`, `speechocean-extractor.ts`,
  `metrics.ts`, `decision-thresholds.ts` (0,85), `run-benchmark.ts`, `decision.md`. Se construyó para
  **speechocean762**, cuyos 250 hablantes son nativos de **mandarín**: no representa los errores típicos de
  hispanohablantes. El corpus nunca estuvo en el repo (era una descarga local en `D:\proyectos\speechocean762`,
  que ya no existe).
- **Corpus elegido para este plan: L2-ARCTIC** (PSI Lab, Texas A&M). 24 hablantes no nativos, 6 L1 (4 por lengua),
  **incluye 4 hablantes nativos de español**. Subconjunto anotado a mano: 3.599 enunciados con 14.098
  sustituciones, 3.420 omisiones y 1.092 adiciones de fonemas. Licencia **CC BY-NC 4.0** (uso no comercial con
  atribución): válido para esta app mientras no se monetice; si se monetiza, revisar antes de volver a usarlo.
  Documentación: <https://psi.engr.tamu.edu/l2-arctic-corpus-docs/>. Solo se descarga fuera del repo; nunca se
  commitean audios ni etiquetas.
- `components/lesson/PhonemeFeedbackTable.tsx:42-50` — muestra `¡Excelente!` si `p.status === 'correct'` y
  `/gotIpa/` + consejo de `getArticulation(ipa)` si no. Se usa en `components/practice/essential-words/SpeakScoredPanel.tsx:74`.
- `lib/speech/self-listening-recorder.ts` (48 líneas) — graba el audio del intento; se usa en `hooks/useSpeechRecognition.ts`.
- `lib/pronunciation/articulation-guide-data.ts` y `lib/pronunciation/ipa-audio.ts` — consejos y audio por fonema.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/pronunciation components/lesson components/practice/essential-words` | todo pasa |
| Benchmark | `pnpm tsx lib/pronunciation/acoustic/benchmark/run-benchmark.ts` (ver flags en el archivo) | imprime tabla por fonema |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` y `npm run lint:design` | exit 0 |

## Alcance

**Dentro**: `components/lesson/PhonemeFeedbackTable.tsx`, `components/practice/essential-words/SpeakScoredPanel.tsx`,
`components/lesson/` (componentes nuevos pequeños), `lib/pronunciation/**`, `lib/speech/self-listening-recorder.ts`,
`docs/architecture/adr-064-acoustic-pronunciation-assessment.md` (añadir sección), `package.json` (solo en fase B/C
para la librería de inferencia), tests. Además, los documentos listados en el paso de documentación de este plan.

**Fuera**: rutas `/api/gemini/*`, Azure u otros proveedores (ver "Alternativa con proveedor"), puntuación de
entonación/ritmo, checkpoints de nivel (Planes 033/034), promoción de nivel.

## Fase A — Feedback honesto y útil con lo que ya existe (sin IA, sin modelo nuevo)

### A1. Dejar de afirmar "¡Excelente!" por sonido
En `PhonemeFeedbackTable`, cuando la señal es `stt_intelligibility`: si la palabra se reconoció, no muestres
filas de fonemas con "¡Excelente!"; muestra una sola fila "Palabra reconocida". Si no se reconoció, muestra los
fonemas que difieren con la etiqueta **"Posible dificultad"** (no "Incorrecto") y el consejo de articulación.
**Verify**: test del componente: palabra reconocida → no aparece "¡Excelente!"; palabra no reconocida → aparece "Posible dificultad".

### A2. "Tú vs. modelo" (lo más útil de ELSA sin puntuación)
Añade un componente `PronunciationCompareBar` (en `components/lesson/`) con dos botones: reproducir **tu
grabación** (de `self-listening-recorder`) y reproducir **el modelo** (audio existente; si no hay, `playText` de
`lib/speech/tts-provider.ts` cuando el Plan 039 ya lo haya creado —voz Kokoro si está activa—, o TTS del navegador de
`lib/speech/synthesis.ts` si no; **nunca** TTS de Gemini). Muéstralo en `SpeakScoredPanel`. La grabación vive solo en memoria.
**Verify**: test del componente con `Audio` simulado: ambos botones llaman a `play`; sin grabación, el botón de
"tu grabación" está deshabilitado.

### A3. Palabra coloreada por sílaba objetivo
En la cabecera del resultado, resalta en la palabra la grafía del fonema con dificultad reutilizando
`lib/pronunciation/phoneme-in-word.ts` (como el "fa" rojo de "favorite" en ELSA).
**Verify**: test con "favorite" y fonema /eɪ/ → el fragmento resaltado es "a".

## Fase B — Spike: reconocimiento de fonemas en el navegador (puerta de decisión)

### B1. Elegir el modelo candidato
Candidato principal (verificado el 2026-09-23): **`onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX`**, Apache 2.0,
conversión ONNX de `facebook/wav2vec2-lv-60-espeak-cv-ft` (wav2vec2-large afinado en CommonVoice para devolver
etiquetas fonéticas espeak/IPA). Se usa desde `@huggingface/transformers` con
`pipeline('automatic-speech-recognition', 'onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX')`, con audio a 16 kHz.
Riesgo conocido: es un modelo **large** (~315M parámetros); su página no publica el tamaño de cada variante. Mide el
tamaño real de las variantes `q8`/`q4`/`fp16` en la pestaña "Files". Si la más pequeña supera 400 MB, busca también un
modelo de fonemas de tamaño **base** (~95M parámetros) con ONNX y licencia permisiva, y compáralos.
Anota en `docs/architecture/adr-064-acoustic-pronunciation-assessment.md` (sección nueva "Candidate 4 — on-device
phoneme CTC"): ID, licencia, tamaño por variante, inventario de fonemas de salida y su correspondencia con el
inventario ARPAbet de L2-ARCTIC.
No uses Whisper para esto: devuelve palabras y autocorrige igual que el reconocimiento del navegador.
**Verify**: la sección existe con esos 5 datos por candidato. Si ninguno tiene licencia permisiva o ONNX, STOP.

### B2. Evaluador en el arnés
Implementa `lib/pronunciation/acoustic/phoneme-ctc-evaluator.ts` (Node, para el benchmark): audio → fonemas
reconocidos con tiempos → alineación (Levenshtein) contra los fonemas esperados de CMUdict (mapear ARPAbet→IPA con
`ARPABET_TO_IPA` de `lib/pronunciation/phonemes.ts`) → por cada fonema esperado: `match | substitution | deletion`,
con una confianza (probabilidad posterior media del tramo). Añade `'phoneme_ctc'` a `evaluatorKind`.
Añade un cargador `lib/pronunciation/acoustic/benchmark/l2arctic-loader.ts` que lea, para los 4 hablantes de español,
los WAV y las anotaciones manuales (TextGrid del subconjunto anotado: fonema canónico, fonema realizado y tipo de
error). Conecta el evaluador y el cargador a `run-benchmark.ts` con flags nuevas, sin tocar el evaluador de formantes
ni el extractor de speechocean762.
**Verify**: tests con un audio sintético corto y salida del modelo simulada → alineación correcta.

### B3. Correr el benchmark
Descarga L2-ARCTIC desde la página del PSI Lab (fuera del repo, p. ej. `D:\datasets\l2-arctic`; ruta por variable de
entorno `L2ARCTIC_DIR`). Usa **solo el subconjunto anotado de los 4 hablantes de español**. Antes de medir, escribe los
umbrales de la puerta en `decision-thresholds.ts` y haz commit (pre-registro, como en el benchmark anterior).
Mide **por fonema** y en total:
- **Precisión de los errores marcados**: de los fonemas que el modelo marca como mal pronunciados, cuántos marcó
  también la anotación humana. Es la métrica que protege a quien aprende de correcciones falsas.
- **Tasa de falsa alarma**: fonemas bien pronunciados según la anotación que el modelo marca como error.
- **Recall**: errores humanos que el modelo detecta.
- Tasa de abstención y latencia p50/p95 de inferencia en CPU.
Contexto para interpretar: los sistemas publicados de detección de errores de pronunciación sobre L2-ARCTIC suelen
reportar F1 alrededor de 0,6 (verifícalo con 2–3 artículos recientes y anótalo en el informe). Un modelo genérico sin
ajuste probablemente quede por debajo; por eso la puerta es **por fonema** y prioriza la precisión sobre el recall.
Escribe los resultados en `lib/pronunciation/acoustic/benchmark/decision-phoneme-ctc.md`.
Opcional: repite con speechocean762 (hablantes de mandarín) solo como comparación; no cuenta para la puerta.
**Verify**: el archivo existe con tabla por fonema, las métricas anteriores y la conclusión.

### Puerta de decisión

- **Pasa** un fonema si: precisión de errores marcados ≥ 0,80 **y** falsa alarma ≤ 5% **y** hay ≥ 30 errores humanos
  anotados de ese fonema para medir. Prioriza los fonemas típicos de hispanohablantes: /v/, /b/, /ʃ/, /θ/, /ð/, /z/,
  /ɪ/, /iː/, /æ/, /ʌ/, /h/, /dʒ/, /ŋ/ y la epéntesis inicial ("e-school").
- **El plan pasa a la fase C** si ≥ 4 fonemas pasan **y** p95 de inferencia ≤ 3 s para una frase de 5 palabras.
- **No pasa** → actualiza la ADR con el resultado, marca el plan `DONE (fase A + B, no-ship)` y termina. No hay fase C.
  La "Alternativa con proveedor" queda como decisión de la dueña.

## Fase C — Integración (solo si la puerta pasa)

1. Carga del modelo bajo demanda con un botón "Activar análisis de sonidos (descarga ~N MB)", guardado en
   CacheStorage siguiendo el patrón de `lib/offline/`. Nunca se descarga automáticamente.
2. Inferencia en un Web Worker (`lib/pronunciation/acoustic/phoneme-ctc-worker.ts`) sobre la grabación de
   `self-listening-recorder`.
3. `PhonemeFeedbackTable` usa `phoneme_ctc` **solo para los fonemas que pasaron la puerta**; el resto sigue
   como en la fase A. Cuando el evaluador se abstiene, no se muestra nada para ese fonema.
4. Puntuación global de la palabra = % de fonemas validados reconocidos; etiqueta "Sonidos" (no "Pronunciación nativa").
5. Actualiza la ADR: nueva decisión "Ship parcial: fonemas X, Y, Z con phoneme_ctc".
**Verify**: tests del worker con modelo simulado; `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design`.

## Paso final — Documentación (al cerrar cada fase)

| Fase | Archivo | Qué escribir |
|---|---|---|
| A | `docs/architecture/pronunciation-feedback.md` → "Señales y honestidad" | Con `stt_intelligibility` no hay "¡Excelente!" por fonema; etiqueta "Posible dificultad"; comparación tú vs. modelo (la grabación vive solo en memoria) |
| B | `docs/architecture/adr-064-acoustic-pronunciation-assessment.md` | Sección "Candidate 4 — on-device phoneme CTC" y decisión con L2-ARCTIC (ship parcial o no-ship), enlazando `decision-phoneme-ctc.md` |
| B | `docs/README.md` → tabla "Arquitectura" | Actualiza la descripción de la fila "ADR 064" con la decisión nueva |
| C | `docs/architecture/pronunciation-feedback.md` | Señal nueva `phoneme_ctc`: lista de fonemas validados, reglas de abstención, descarga bajo demanda |
| C | `README.md` → "What you can do with it" y "License and attribution" | Feedback por sonido (solo fonemas validados); atribución del modelo (Apache 2.0) y de L2-ARCTIC si se cita en la documentación |

**Verify**: `grep -n "Posible dificultad" docs/architecture/pronunciation-feedback.md` → 1 resultado (fase A);
`grep -n "Candidate 4" docs/architecture/adr-064-acoustic-pronunciation-assessment.md` → 1 resultado (fase B).

## Alternativa con proveedor (decisión de la dueña, no ejecutar sin aprobación)

Azure AI Speech tiene "Pronunciation Assessment" con puntuación por fonema y un tier gratuito con horas de audio
al mes (verificar cifra actual en la documentación de precios de Azure). Implica enviar audio a Microsoft, crear
cuenta y aceptar el tratamiento de datos. La ADR 064 exige aprobación explícita para cualquier proveedor. Si la
fase B no pasa y la dueña lo aprueba, se escribe un plan aparte.

## Criterios de aceptación

- [ ] Fase A: "¡Excelente!" por fonema ya no aparece con señal `stt_intelligibility`; comparación tú/modelo funciona.
- [ ] Fase B: `decision-phoneme-ctc.md` existe con resultados por fonema y veredicto.
- [ ] Fase C (si aplica): el modelo solo se descarga con acción explícita; los fonemas mostrados pasaron la puerta.
- [ ] Ninguna llamada nueva a `/api/gemini/*`.
- [ ] Documentación del "Paso final" actualizada para las fases ejecutadas.
- [ ] `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design` en exit 0.

## STOP conditions

- La licencia del modelo o del corpus no permite este uso.
- El modelo cuantizado pesa más de 400 MB o la inferencia necesita GPU.
- Algún paso te lleva a mostrar una nota de pronunciación sin haber pasado la puerta.
- Se necesita usar grabaciones reales de usuarios para el benchmark (prohibido por la ADR 064).
- La app empieza a monetizarse mientras se usa L2-ARCTIC (licencia no comercial): reporta antes de seguir.
- Las anotaciones de L2-ARCTIC no se pueden mapear al inventario de fonemas del modelo sin perder los contrastes
  de la lista prioritaria.

## Notas de mantenimiento

- Cada fonema añadido a la lista validada exige volver a correr el benchmark.
- Revisar en PR: que ningún texto de UI diga "pronunciación nativa" o "acento".
- Entonación (como el "Intonation 76%" de ELSA) queda fuera: necesita su propio benchmark con `lib/speech/pitch-detector.ts`.
