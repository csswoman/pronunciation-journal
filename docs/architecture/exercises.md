# Sistema de ejercicios — English Journal

Documentación del sistema de ejercicios de la app: qué tipos existen, cómo funcionan, dónde vive el código y cómo están conectados a los datos.

---

## Índice

1. [Arquitectura general](#arquitectura-general)
2. [Ejercicios de fonética (Phoneme Practice)](#ejercicios-de-fonética-phoneme-practice)
   - [Pick the Word](#pick-the-word)
   - [Pick the Sound](#pick-the-sound)
   - [Minimal Pair](#minimal-pair)
   - [Dictation (palabra)](#dictation-palabra)
   - [Speak Word](#speak-word)
3. [Ejercicios genéricos (Generic Exercises)](#ejercicios-genéricos-generic-exercises)
   - [Fill in the blank](#fill-in-the-blank)
   - [Sentence Dictation](#sentence-dictation)
   - [Match Pairs](#match-pairs)
   - [Reorder Words](#reorder-words)
4. [Contrato de elegibilidad](#contrato-de-elegibilidad)
5. [Flujo de una sesión](#flujo-de-una-sesión)
6. [Persistencia y tracking](#persistencia-y-tracking)
7. [Spaced Repetition (SM-2)](#spaced-repetition-sm-2)
8. [Evidencia de habla: niveles de señal y matriz surface→store](#evidencia-de-habla-niveles-de-señal-y-matriz-surfacestore)
9. [Extensión futura](#extensión-futura)

---

## Arquitectura general

Hay dos sistemas de ejercicios en la app, separados por dominio:

| Sistema | Dominio | Ruta | Fuente de datos |
|---|---|---|---|
| **Phoneme Practice** | Fonética / pronunciación | `/practice/sound/[soundId]` | Tabla `sounds`, `words`, `minimal_pairs` |
| **Generic Exercises** | Vocabulario / comprensión | `/practice/exercises` | `word_bank`, `text_fragments`, `words` |

Ambos sistemas comparten:
- El contrato `PedagogicalFeedback` para feedback de ejercicios: mensaje inmediato,
  explicación, corrección/respuesta esperada, pista, ejemplo y acción sugerida.
- La tabla `answer_history` en Supabase (registro de todas las respuestas)
- El catálogo `exercise_types` (slug + label por tipo)
- La lógica Levenshtein para validación tolerante de texto

---

## Ejercicios de fonética (Phoneme Practice)

**Ruta:** `/practice/sound/[soundId]`
**Hub:** `/practice` → `SoundLabPage`

Los ejercicios están organizados en **etapas (stages)** por sonido. Cada sonido avanza de reconocimiento pasivo a producción activa:

| Stage | Ejercicios | Desbloqueo |
|---|---|---|
| `recognition` — Identify the Sound | `pick_word`, `pick_sound` | Siempre disponible |
| `pairs` — Minimal Pairs | `minimal_pair` | 4+ intentos en recognition + pares disponibles |
| `dictation` — Dictation | `dictation` | 4+ intentos en pairs (o 8 en recognition si no hay pares) |
| `speaking` — Speak It | `speak_word` | 4+ intentos en dictation |

**Generadores:** `lib/phoneme-practice/exercises.ts`
**Tipos:** `lib/phoneme-practice/types.ts`
**Queries Supabase:** `lib/phoneme-practice/queries.ts`
**SRS de sonidos:** `lib/phoneme-practice/sr.ts`

---

### Pick the Word

**Slug:** `pick_word`
**Componente:** `components/phoneme-practice/PickWordExercise.tsx`

Muestra el símbolo IPA de un sonido. El usuario debe seleccionar todas las palabras del listado que contienen ese sonido.

- Respuesta: multi-select (puede haber 2+ correctas)
- Distractores: palabras de sonidos fonéticamente similares (confusables por IPA)
- Opciones por defecto: 2 correctas + 2 distractores
- Validación: `correctIds` exactamente iguales al set seleccionado

**Datos requeridos:** `sounds.ipa`, `words` (con `sound_id`), palabras de sonidos confusables

---

### Pick the Sound

**Slug:** `pick_sound`
**Componente:** `components/phoneme-practice/PickSoundExercise.tsx`

Reproduce el audio o muestra la palabra. El usuario elige el símbolo IPA correcto de entre varias opciones.

- Respuesta: single-select
- Distractores: IPAs fonéticamente similares (vía `lib/phoneme-practice/phoneme-similarity.ts`)
- Opciones por defecto: 1 correcta + 3 distractores

**Datos requeridos:** `words.audio_url` (o TTS fallback), `sounds.ipa`

---

### Minimal Pair

**Slug:** `minimal_pair`
**Componente:** `components/phoneme-practice/MinimalPairExercise.tsx`

Reproduce el audio de una de las dos palabras del par mínimo. El usuario elige cuál oyó.

- Respuesta: single-select (2 opciones)
- Los pares se obtienen de la tabla `minimal_pairs`
- Si no hay pares en BD, se genera un par sintético (`synthetic: true`) con palabras de sonidos cercanos

**Datos requeridos:** `minimal_pairs` (o fallback sintético), `audio_url` de ambas palabras

---

### Dictation (palabra)

**Slug:** `dictation`
**Componente:** `components/phoneme-practice/DictationExercise.tsx`

Reproduce el audio de una palabra. El usuario escribe lo que oye.

- Respuesta: texto libre
- Validación: distancia Levenshtein ≤ 1 (tolerancia a 1 error tipográfico)
- Audio: reproduce automáticamente al cargar; botón para repetir
- TTS fallback vía Web Speech API (`lib/phoneme-practice/tts.ts`)

**Datos requeridos:** `words.word`, `words.audio_url` (o TTS)

---

### Speak Word

**Slug:** `speak_word`
**Componente:** `components/exercises/SpeakScoredExercise.tsx` (usado tanto por Sound Lab como por el paso de producción del Daily plan)

Muestra una palabra. El usuario la pronuncia; la app evalúa la pronunciación con STT vía `defaultEvaluationEngine` (motor de evaluación cliente — diff de palabras, NO Gemini).

- Captura: Web Speech API (`hooks/useSpeechRecognition.ts`)
- Evaluación: `defaultEvaluationEngine.evaluate(...)` (`lib/exercises/evaluation/`) — produce score + `wordResults`
- Si la evaluación falla o STT no está disponible (navegador no soportado, o bloqueo de red como en Brave), el componente cae a un **fallback de shadowing honesto**: escuchar + repetir + continuar, sin scoring. Llama `onSubmit(false, '')` — nunca fabrica una respuesta correcta. Este intento queda como `SpokenAttempt` con `outcome: 'unscored'`, excluido de accuracy/SRS.
- Solo se programa en la sesión adaptativa cuando el contraste de fonemas enfocado ya tiene evidencia previa en `user_contrast_progress` y no está dominado (`buildAdaptiveSession`, `lib/phoneme-practice/mixed-session.ts`) — nunca es el primer ejercicio de un contraste nuevo.

**Datos requeridos:** `words.word`, micrófono disponible

Ver [Evidencia de habla](#evidencia-de-habla-niveles-de-señal-y-matriz-surfacestore) para el contrato `SpokenAttempt` y los niveles de señal.

---

## Ejercicios genéricos (Generic Exercises)

**Ruta:** `/practice/exercises`
**Motor:** `lib/exercises/`

Sistema nuevo, desacoplado de fonemas. Trabaja con tres fuentes de contenido:

- **`word_bank`** — Vocabulario capturado y enriquecido por IA (incluye `text`, `meaning`, `translation`, `example`, `audio_url`)
- **`text_fragments`** — Fragmentos de texto del usuario (`content`, `audio_url`)
- **`words`** — Vocabulario del sistema fonético (`word`, `ipa`, `audio_url`)

Los ejercicios se generan **on-the-fly en cliente** y se cachean en Dexie (TTL 1 hora) para funcionar offline.

**Tipos:** `lib/exercises/types.ts`
**Queries:** `lib/exercises/queries.ts`
**Generadores:** `lib/exercises/generators/`
**Elegibilidad:** `lib/exercises/eligibility.ts` (`assessWordBankEntry`, `blankLemma`, `hasEnoughContext`)
**Utilidades:** `lib/exercises/utils.ts` (`shuffle`, `pick`, `exerciseId`; re-exporta `hasEnoughContext`)

Cada ejercicio tiene un **id determinista** (hash djb2 de `type + sourceRef.id`) que garantiza deduplicación en Dexie y en `answer_history`.

### Contrato de feedback pedagogico

Los ejercicios genéricos reportan el resultado mediante `PracticeSubmitHandler`
y pueden adjuntar `feedback?: PedagogicalFeedback`:

```ts
type PedagogicalFeedback = {
  immediate: string
  explanation?: string
  correction?: string
  tip?: string
  example?: string
  expectedAnswer?: string
  category?: string
  errorCode?: ExerciseErrorCode
  canRetry?: boolean
  nextAction?: 'continue' | 'retry' | 'review_hint'
}
```

### Taxonomía estable de errores

`errorCode` es un contrato corto y tipado para feedback y analítica. El texto
visible puede evolucionar, pero estos códigos deben conservar su significado:

| Código | Uso |
|---|---|
| `correct` | Respuesta correcta |
| `empty_answer` | No se proporcionó respuesta |
| `form_error` | Flexión o forma gramatical incorrecta |
| `word_order` | Tokens correctos en orden incorrecto |
| `listening_omission` | Faltan palabras en una transcripción |
| `meaning_choice` | Opción o palabra incompatible con el significado |
| `target_not_used` | Producción sin el elemento objetivo |
| `pair_mapping` | Asociación incorrecta entre pares |
| `unknown` | Error determinista no clasificado |

Mapeo principal: `fill_blank` produce `correct`, `empty_answer`,
`form_error` o `meaning_choice`; `sentence_dictation`,
`listening_omission`; `reorder_words`, `word_order`; `multiple_choice`,
`meaning_choice`; y `match_pairs`, `pair_mapping`.

Ejemplos de copy para principiantes:

- `form_error`: “Almost! Check the ending — the answer is ‘drinks’.”
- `listening_omission`: “Close. Replay the slow audio and listen for short words.”

`ExerciseShell` muestra al alumno `immediate`, `explanation`,
`correction`/`expectedAnswer`, `tip` y `example` cuando existen. Las respuestas
correctas sin feedback detallado pueden avanzar solas tras una pausa breve. Las
respuestas incorrectas con explicación, pista, ejemplo o corrección no avanzan
solas: el alumno puede leer, continuar o usar **Try again** cuando `canRetry`
es `true`.

El soporte para principiantes es determinista primero. `fill_blank`,
`sentence_dictation`, `reorder_words`, `multiple_choice` y `match_pairs`
generan feedback desde el payload local del ejercicio. Gemini se reserva para
grading de producción (`written_production` / `spoken_production`) salvo que un
plan futuro añada explicaciones AI para ejercicios deterministas.

---

### Fill in the blank

**Slug:** `fill_blank`
**Componente:** `components/exercises/FillBlankExercise.tsx`
**Generador:** `lib/exercises/generators/fill-blank.ts`

Muestra una oración con una palabra reemplazada por `___`. El usuario elige la palabra correcta de entre 4 opciones.

- Fuente: `word_bank.example` (la oración) + `word_bank.text` (la palabra objetivo)
- Distractores: otras palabras del `word_bank` con dificultad ±1
- Hint opcional: `word_bank.meaning` o `word_bank.translation`
- La oración debe contener el lemma o una flexión reconocible (`sentenceContainsLemma`); el blank usa `blankLemma` (primera ocurrencia)

**Requisitos de datos:** `assessWordBankEntry(entry, 'fill_blank', { pool })` — ver [Contrato de elegibilidad](#contrato-de-elegibilidad)

---

### Sentence Dictation

**Slug:** `sentence_dictation`
**Componente:** `components/exercises/SentenceDictationExercise.tsx`
**Generador:** `lib/exercises/generators/sentence-dictation.ts`

Reproduce el audio de una oración o palabra. El usuario la transcribe en un textarea.

- Fuentes:
  - `text_fragments`: reproduce `audio_url` si existe, TTS si no
  - `word_bank`: usa `word_bank.audio_url`; si es nulo, TTS con el `example`
- Validación: distancia Levenshtein ≤ 10% de la longitud de la oración (mínimo 2 caracteres)
- Normalización antes de comparar: minúsculas + eliminar puntuación
- Enter sin Shift envía la respuesta

**Requisitos de datos:** `text_fragments.content` o `word_bank.example`; el audio es opcional (fallback TTS)

---

### Match Pairs

**Slug:** `match_pairs`
**Componente:** `components/exercises/MatchPairsExercise.tsx`
**Generador:** `lib/exercises/generators/match-pairs.ts`

Conectar elementos de la columna izquierda con los de la derecha. Los de la derecha están mezclados.

- Fuentes y pares:
  - `word_bank`: palabra ↔ significado/traducción
  - `words` (fonemas): palabra ↔ símbolo IPA
- Grupos de 4 pares por ejercicio
- Interacción: tap izquierda → tap derecha para crear la conexión; tap en un elemento ya colocado lo devuelve al banco
- Sin drag & drop (tap-to-select, funciona en móvil)
- Validación: al pulsar "Check", cada par se evalúa individualmente; correcto solo si todos aciertan

**Requisitos de datos:** `word_bank` con `meaning` o `translation`, mínimo 2 entradas (`assessWordBankEntry(..., 'match_pairs')`)

---

### Reorder Words

**Slug:** `reorder_words`
**Componente:** `components/exercises/ReorderWordsExercise.tsx`
**Generador:** `lib/exercises/generators/reorder-words.ts`

Reordenar tokens (palabras) mezclados para reconstruir la oración original.

- Fuentes:
  - `text_fragments.content`: se parte en oraciones individuales (`split` por `.!?`)
  - `word_bank.example`: la oración de ejemplo
- Longitud válida: 3–12 tokens (oraciones muy cortas o largas se descartan)
- Interacción: tap token del banco → pasa a la zona de respuesta; tap en token colocado → vuelve al banco
- Validación: comparación exacta de strings (`placed.join(' ') === sentence`)

**Requisitos de datos:** `text_fragments` con oraciones de 3–12 palabras, o `word_bank.example` con ≥4 tokens (`assessWordBankEntry(..., 'reorder_words')`)

---

## Contrato de elegibilidad

Una fila de `word_bank` (o un `CoreWord` adaptado vía `coreWordToWordBankEntry`) no es “válida para ejercicios” en abstracto: cada generador consulta el mismo contrato en `lib/exercises/eligibility.ts`.

### API principal

```ts
assessWordBankEntry(entry, mode, options?)
// → { eligible: boolean, reasons: EligibilityReason[] }

blankLemma(sentence, lemma)   // primera forma encontrada → "___"
sentenceContainsLemma(...)  // lemma o flexión en la frase
hasEnoughContext(blanked)   // ≥2 content words tras el blank
```

`generateFillBlankFromWordBank` devuelve `GenerationResult<T>` (`lib/exercises/generation.ts`): `{ exercises, skipped[] }` con la razón de cada entrada descartada.

### Reglas por modo

| Modo | Reglas | Archivos |
|------|--------|----------|
| `fill_blank` | `example` + lemma en frase + contexto tras blank + pool global con ≥3 distractores elegibles | `generators/fill-blank.ts`, `daily-plan/step-builders.ts` |
| `reorder_words` | `example` con ≥4 tokens | `generators/reorder-words.ts` |
| `sentence_dictation` | `example` presente | `generators/sentence-dictation.ts` |
| `match_pairs` | `text` + `meaning` | `generators/match-pairs.ts` |
| `sentence_context` | mismas reglas que fill_blank (sin chequeo de pool global) | `lib/lexicon/exercises.ts` |

Validación de contenido Core 1000: `pnpm validate:core1000` (schema + IPA).  
Gate de generabilidad: `pnpm validate:core1000-generators` (umbrales documentados en `plans/017-exercise-eligibility-contract.md`).

---

## Flujo de una sesión

### Phoneme Practice

```
SoundLabPage
  └── SoundLabLessonCard (un sonido)
        └── /practice/sound/[soundId]
              ├── StageLobby (selección de stage)
              └── buildStageSession() → Exercise[]
                    └── usePracticeSession(exercises)
                          ├── ExerciseCard (feedback wrapper)
                          │     └── [tipo de ejercicio]
                          └── SessionSummary (resumen final)
                                └── saveAnswers() + updateProgress() + updateSR()
```

### Generic Exercises

```
/practice/exercises (ExercisesPage)
  ├── loadExercises() — al montar y al completar sesión
  │     ├── Dexie cache (< 1h) → usar caché
  │     └── Fetch word_bank + text_fragments → generateX() → bulkPut en Dexie
  └── GenericExerciseSession(exercises)  ← sesión mixta directa, sin selector
        ├── Barra de progreso
        ├── ExerciseCard (feedback wrapper — reutilizado de phoneme-practice)
        │     └── [FillBlank | SentenceDictation | MatchPairs | ReorderWords]
        └── SessionSummary inline (% correcto)
              └── saveGenericAnswer() → answer_history (fire-and-forget)
```

---

## Persistencia y tracking

### Supabase

| Tabla | Qué guarda |
|---|---|
| `exercise_types` | Catálogo de tipos: `pick_word`, `pick_sound`, `minimal_pair`, `dictation`, `speak_word`, `fill_blank`, `sentence_dictation`, `match_pairs`, `reorder_words`, `multiple_choice`, `cs_shadow_phrase` (id 23, migración `20260720190000_add_cs_shadow_phrase_exercise_type.sql`) |
| `answer_history` | Cada respuesta: `user_id`, `exercise_type_id`, `is_correct`, `user_answer`, `target_word`, `time_ms`, `exercise_payload` (JSONB con `sourceRef`), `sound_id` (nullable) |
| `user_contrast_progress` | Progreso SM-2 por usuario × **contraste de fonemas** (`contrast_id`, ej. `"iː\|ɪ"` — no por sonido aislado). Ver [`lib/phoneme-practice/types.ts`](../../lib/phoneme-practice/types.ts) (`UserContrastProgress`) y [`lib/phoneme-practice/mastery.ts`](../../lib/phoneme-practice/mastery.ts) (`isContrastMastered`). |
| `deck_entry_progress` | Progreso SM-2 por usuario × entrada de deck |
| `word_bank` | Vocabulario con campos SM-2 integrados |

> **Nota histórica:** una versión anterior usaba `user_sound_progress` (progreso por sonido completo, sin distinguir contraste). Esa tabla fue reemplazada por `user_contrast_progress`, que trackea el par de fonemas específico que el alumno confunde (más preciso para SRS de producción). No queda código activo que lea/escriba `user_sound_progress`.

### Dexie (IndexedDB local)

| Store | Qué guarda |
|---|---|
| `srsData` | SM-2 de palabras de Dexie (Pronunciation Journal) |
| `generatedExercises` | Cache de ejercicios genéricos generados (TTL 1h) — `id, type, source, generatedAt, exercise` |
| `analyticsEvents` | Eventos de sesión (`exercise_shown`, `exercise_answered`, etc.) |
| `pronunciationMastery` / `pronunciationCoachState` | Estado local de UX del Pronunciation Coach (frases dominadas / cola / vistas) — ver [Evidencia de habla](#evidencia-de-habla-niveles-de-señal-y-matriz-surfacestore). No es fuente de verdad de accuracy/SRS. |

> **Nota histórica:** `localSoundProgress` (espejo local de `user_sound_progress`) y `localAnswerHistory` (cola de respuestas pendientes de sincronizar) no existen en el código actual. Si aparecen en migraciones antiguas de Dexie, trátense como legacy — el mecanismo vigente de "respuestas pendientes de sync" es el outbox (`syncOutbox`), documentado en [`offline-sync.md`](./offline-sync.md).

---

## Spaced Repetition (SM-2)

El algoritmo SM-2 está implementado en varias variantes:

**`lib/srs/`** — SM-2 genérico para Dexie (`updateSRS`, `createSRSEntry`, `accuracyToQuality`)
- Input: `quality` 0–5 (derivado de accuracy %)
- Actualiza: `ease`, `interval`, `repetitions`, `nextReview`

**`lib/phoneme-practice/sr.ts`** — SM-2 simplificado para contrastes de fonemas
- Input: `isCorrect: boolean`
- Actualiza: `ease_factor`, `interval_days`, `streak`, `next_review` en `user_contrast_progress` (histórico: antes `user_sound_progress`, por sonido en vez de por contraste — ver nota en [Persistencia y tracking](#persistencia-y-tracking))

**`lib/decks/study-source.ts`** — SM-2 para decks y word_bank
- Misma lógica, persiste en columnas SM-2 de `word_bank` o `deck_entry_progress`

**Loop genérico (cerrado).** `savePracticeAnswer` (`lib/practice/queries.ts`) enruta cada respuesta a su SRS según `sourceRef.source` / `topic`:

| Fuente | Destino SRS | Helper |
|---|---|---|
| `word_bank` | Columnas SM-2 de `word_bank` (vía outbox) | `enqueueWordBankSRSUpdate` |
| `topic` (concepto) | Tabla `topic_srs` (vía outbox) | `enqueueTopicSRSUpdate` |
| `text_fragments` | Dexie `srsData`, clave `fragment:<id>` (local) | `upsertFragmentSrs` |

Los `text_fragments` son system sentences (`user_id = null`), así que su estado de repaso es per-usuario y local (Dexie), no una tabla Supabase. Los fragmentos vencidos se priorizan en la sesión vía `orderFragmentsByDue` (`lib/practice/fragment-priority.ts`).

### Features conectadas vía `savePracticeAnswer`

Además de Phoneme Practice, Generic Exercises, Lexicon, Courses, Reader, Daily y Core 1000, estas UIs escriben al flujo unificado de progreso:

| Feature | Call site | `context` | Qué persiste |
|---|---|---|---|
| **AI Coach** (fill-blank, multiple choice, speaking) | `answerToolCall` → `persistCoachExerciseResult` (`lib/ai-practice/coach-progress.ts`) | `ai_coach` | `answer_history` + `topic_srs` cuando hay `topic` |
| **Interview** (turnos de pronunciación) | `InterviewResults` al montar resultados | `ai_coach` | `answer_history` por turno (sin `topic` → sin topic-SRS) |
| **Mini-lessons** | `MiniLessonQuiz` al terminar quiz; `MiniLessonComplete` con "Mark as read" | `courses` (vía `recordLessonComplete`) | Dexie `completedLessons` + una fila `answer_history` por lección |

Todas las escrituras son **best-effort** (try/catch): un fallo de red nunca bloquea la UX. Mini-lessons comprueba `isLessonComplete` en Dexie antes de insertar para evitar duplicados en re-finish.

Las respuestas genéricas pueden persistir metadatos mínimos de feedback en
`exercise_payload`: `feedbackCategory`, `errorCode`, `expectedAnswer`, `hintUsed` y
`nextAction`. No se guarda por defecto el texto largo de explicaciones,
correcciones AI o tips, para mantener `answer_history` orientado a analítica de
errores y no a logging de contenido libre.

### Presentación antes de testear (noticing)

El daily-plan antepone un paso `word_intro` (`DailyStepKind`) que **presenta** las palabras nuevas (forma + significado + audio) antes de que el alumno las recupere en `word_review`. Es un paso **no evaluado** (no escribe `answer_history`): lleva `studyCards: StudyCardModel[]` en vez de `exercises`.

- Modelo + adaptadores: `lib/practice/study-card/model.ts` (`StudyCardModel`, `coreWordToStudyCard`, `wordBankEntryToStudyCard`).
- Componente agnóstico de fuente: `components/practice/study-card/StudyCard.tsx`, reutilizado por Core 1000 (`WordStudyCard`) y por el daily-plan (`WordIntroStep`).
- Builder: `buildWordIntroStep` (`step-builders.ts`), tope `WORD_INTRO_MAX_CARDS`; "nueva" = `srs_status === 'new'`.

---

## Evidencia de habla: niveles de señal y matriz surface→store

Toda superficie donde el usuario habla y la app intenta evaluarlo produce un
`SpokenAttempt` (`lib/pronunciation/spoken-attempt.ts`): `outcome: 'scored' |
'unscored' | 'skipped' | 'failed'`. **Solo `outcome === 'scored'` puede afectar
accuracy, SRS o promoción de mastery** — el guard `isScorableAttempt()` es
obligatorio antes de agregar cualquier intento a una métrica. Un intento
`'unscored'` (STT no disponible, fallback de shadowing) o `'failed'`
(evaluador lanzó excepción) no es ni acierto ni fallo: se excluye, nunca se
trata como 0% ni como 100%.

### Tres niveles de señal

No todo lo que mide "pronunciación" mide lo mismo. La app distingue tres
niveles explícitos:

| Nivel | Qué mide | Estado | Dónde vive |
|---|---|---|---|
| **1 — STT intelligibility** (`scoreKind: 'stt_intelligibility'`) | ¿La transcripción STT coincide con el texto objetivo? Mide inteligibilidad (¿un oyente/STT entendería lo dicho?), **no** precisión acústica real. | Implementado | `SpeakScoredExercise`, `PronunciationView` (`scorePronunciation()`), `CsShadowPhraseExercise` — todas vía diff cliente, nunca Gemini |
| **2 — Transcript-derived phoneme match** | Una vez transcrita una palabra, compara su secuencia ARPABET (diccionario CMU) contra la esperada, dando feedback más fino que correcto/incorrecto binario. Sigue basado en la transcripción, no en la señal acústica cruda. | Implementado | `lib/pronunciation/phonemes.ts` (`analyzePhonemes`), enriquecimiento en `lib/pronunciation/scoring.ts` |
| **3 — Future acoustic analysis** | Análisis acústico/formantes/prosodia real de la señal de audio, independiente de la transcripción STT. | **No implementado** — explícitamente fuera de alcance del plan 063; diferido al plan `plans/064-validate-acoustic-pronunciation-assessment.md` | N/A |

`scoreKind` es un literal discriminado (no `string` plano) precisamente para
que un futuro nivel 3 se agregue como nuevo miembro del union sin romper a los
consumidores existentes que hacen switch sobre este campo.

### Matriz surface → evidencia → store/SRS → consumidor de progreso

| Surface | Evidencia (`SpokenAttempt.outcome`) | Store | ¿Alimenta SRS? | Consumidor de progreso |
|---|---|---|---|---|
| **Sound Lab — Speak Word** (`speak_word`, `components/exercises/SpeakScoredExercise.tsx`) | `scored` (nivel 1, vía `defaultEvaluationEngine`) o `unscored` (fallback shadowing) | `answer_history` (Supabase, `sound_id` set) + `user_contrast_progress` vía `lib/phoneme-practice/sr.ts` | Sí — **contraste de fonemas** (`contrastId` propagado desde `buildAdaptiveSession`) | Mastery display de Sound Lab (`isContrastMastered`), skill matrix de fonemas |
| **Pronunciation Coach** (`components/ai-coach/PronunciationView.tsx`) | `scored` (nivel 1+2, vía `scorePronunciation()`) — no hay outcome `unscored` explícito en esta superficie (siempre se llama con transcripción no vacía) | `answer_history` (`context: 'ai_coach'`) + `activity_sessions` vía `savePracticeAnswer` + `recordActivitySession` (`lib/progress/activity-hub.ts`) | No liga a `user_contrast_progress` (no hay `sound_id`/`contrastId`); accuracy vive solo en `answer_history` | Daily reconciliation / historial de `answer_history` por `context: 'ai_coach'`. Local Dexie (`pronunciationMastery`, `pronunciationCoachState`) sigue existiendo para la UX de cola/vistas/dominadas de este surface — **no** es fuente de verdad de accuracy/SRS, ver [offline-sync.md](./offline-sync.md) |
| **Connected-speech shadow phrase** (`cs_shadow_phrase`, `components/exercises/CsShadowPhraseExercise.tsx`, generador `lib/exercises/generators/connected-speech.ts`) | `scored` (nivel 1, vía `scorePronunciation()`) o `unscored` (fallback shadowing) | `answer_history` vía el pipeline genérico (`sourceRef: { source: 'text_fragments' }`) | Alimenta SRS de `text_fragments` (Dexie `srsData`, ver [srs.md](./srs.md)) cuando aplica, no `user_contrast_progress` | Daily plan step `connected_speech` (`buildConnectedSpeechStep`, `lib/practice/daily-plan/async-step-builders.ts`) |
| **Oral chat** | No existe todavía en este branch. Planeado en `plans/070-build-goal-based-oral-missions.md`. | — | — | — |

Nota: `spoken_production` / `written_production` (`lib/exercises/generators/production.ts`)
son un flujo **distinto y deliberado**: producción libre calificada por Gemini
(online-only), no por STT-intelligibility. No se incluyen en la matriz de
arriba porque no usan el contrato `SpokenAttempt`/`scorePronunciation()`.

---

## Extensión futura

El sistema de ejercicios genéricos está diseñado para crecer sin cambiar la interfaz de los generadores ni los componentes:

**Dificultad adaptativa**
Leer accuracy reciente de `answer_history` por `source_ref` y ajustar el `level` de los ejercicios generados. El campo `level?: CEFRLevel` ya existe en todos los tipos.

**Tracking de errores**
Agregar `answer_history` por `exercise_payload.sourceRef.source + id` para identificar qué palabras/fragmentos fallan más.

**Generador con IA**
Añadir `lib/exercises/generators/ai.ts` que llame a una ruta `/api/gemini/*` nueva con prompt en `lib/ai-prompts.ts`. La interfaz `generateX() → GenericExercise[]` no cambia; el componente de sesión lo recibe igual.

**Nuevos tipos de ejercicio**
1. Crear la variante en `lib/exercises/types.ts` (tipo discriminado)
2. Escribir el generador en `lib/exercises/generators/`
3. Añadir el componente en `components/exercises/`
4. Insertar la fila en `exercise_types` vía migración SQL
5. Registrar el tipo en `GenericExerciseSession` y en la página
