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
8. [Extensión futura](#extensión-futura)

---

## Arquitectura general

Hay dos sistemas de ejercicios en la app, separados por dominio:

| Sistema | Dominio | Ruta | Fuente de datos |
|---|---|---|---|
| **Phoneme Practice** | Fonética / pronunciación | `/practice/sound/[soundId]` | Tabla `sounds`, `words`, `minimal_pairs` |
| **Generic Exercises** | Vocabulario / comprensión | `/practice/exercises` | `word_bank`, `text_fragments`, `words` |

Ambos sistemas comparten:
- El componente `ExerciseCard` (feedback visual de respuesta correcta/incorrecta)
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
**Componente:** `components/phoneme-practice/SpeakExercise.tsx`

Muestra una palabra. El usuario la pronuncia; la app evalúa la pronunciación con STT.

- Captura: Web Speech API (`hooks/useSpeechRecognition.ts`)
- Validación: Levenshtein ≤ 1 entre transcripción y palabra objetivo
- Feedback: correcto/incorrecto (sin scoring de fonemas individuales en este tipo)

**Datos requeridos:** `words.word`, micrófono disponible

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
| `exercise_types` | Catálogo de tipos: `pick_word`, `pick_sound`, `minimal_pair`, `dictation`, `speak_word`, `fill_blank`, `sentence_dictation`, `match_pairs`, `reorder_words`, `multiple_choice` |
| `answer_history` | Cada respuesta: `user_id`, `exercise_type_id`, `is_correct`, `user_answer`, `target_word`, `time_ms`, `exercise_payload` (JSONB con `sourceRef`), `sound_id` (nullable) |
| `user_sound_progress` | Progreso SM-2 por usuario × sonido |
| `deck_entry_progress` | Progreso SM-2 por usuario × entrada de deck |
| `word_bank` | Vocabulario con campos SM-2 integrados |

### Dexie (IndexedDB local)

| Store | Qué guarda |
|---|---|
| `srsData` | SM-2 de palabras de Dexie (Pronunciation Journal) |
| `localSoundProgress` | Espejo local de `user_sound_progress` |
| `localAnswerHistory` | Respuestas pendientes de sincronizar |
| `generatedExercises` | Cache de ejercicios genéricos generados (TTL 1h) — `id, type, source, generatedAt, exercise` |
| `analyticsEvents` | Eventos de sesión (`exercise_shown`, `exercise_answered`, etc.) |

---

## Spaced Repetition (SM-2)

El algoritmo SM-2 está implementado en varias variantes:

**`lib/srs/`** — SM-2 genérico para Dexie (`updateSRS`, `createSRSEntry`, `accuracyToQuality`)
- Input: `quality` 0–5 (derivado de accuracy %)
- Actualiza: `ease`, `interval`, `repetitions`, `nextReview`

**`lib/phoneme-practice/sr.ts`** — SM-2 simplificado para sonidos
- Input: `isCorrect: boolean`
- Actualiza: `ease_factor`, `interval_days`, `streak`, `next_review` en `user_sound_progress`

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

### Presentación antes de testear (noticing)

El daily-plan antepone un paso `word_intro` (`DailyStepKind`) que **presenta** las palabras nuevas (forma + significado + audio) antes de que el alumno las recupere en `word_review`. Es un paso **no evaluado** (no escribe `answer_history`): lleva `studyCards: StudyCardModel[]` en vez de `exercises`.

- Modelo + adaptadores: `lib/practice/study-card/model.ts` (`StudyCardModel`, `coreWordToStudyCard`, `wordBankEntryToStudyCard`).
- Componente agnóstico de fuente: `components/practice/study-card/StudyCard.tsx`, reutilizado por Core 1000 (`WordStudyCard`) y por el daily-plan (`WordIntroStep`).
- Builder: `buildWordIntroStep` (`step-builders.ts`), tope `WORD_INTRO_MAX_CARDS`; "nueva" = `srs_status === 'new'`.

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
