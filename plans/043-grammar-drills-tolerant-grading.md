# Plan 043: Drills de gramática A1–C1 (4 técnicas) con corrección tolerante y local

> **Executor instructions**: Sigue el plan por fases y paso a paso; ejecuta cada verificación antes
> de avanzar. Si ocurre algo de "STOP conditions", detente y reporta. Respeta `CLAUDE.md`: prompts solo
> en `lib/ai-prompts.ts`; Dexie para datos persistentes; componentes ≤250 líneas; nuevos tipos de
> ejercicio → entrada de registry, nunca condicionales en `ExerciseRenderer`; "many variants → registry +
> type guard". Al terminar cada fase, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 510f87eb -- lib/exercises components/exercises lib/courses lib/practice/exercise-renderer lib/practice/adapters.ts lib/db/index.ts scripts/generate-deck-quizzes.ts`
> Compara los extractos de "Estado actual" con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P1
- **Effort**: L — código ~3 días (A: 4 h · B: 3 h · C: 3 h · D: 5 h · E: 4 h · F: 4 h · H: 30 min)
  más contenido (G): pilotos ~1 día; generación y revisión de hasta 212 decks ~5–7 días al ritmo de la cuota gratuita
- **Risk**: MED (toca la calificación de ejercicios existentes; el contenido generado necesita revisión)
- **Depends on**: — (comparte pieza con 037 C1; ver "Relación con otros planes")
- **Category**: pedagogía / ejercicios / contenido / offline
- **Planned at**: commit `510f87eb`, 2026-09-23
- **Approved**: 2026-09-23 — la dueña confirmó la Matriz por nivel (incluidas B2 y C1)

## Por qué importa

Un método de gramática muy usado combina 4 técnicas sobre un mismo punto gramatical:
**transformar** oraciones, **construir** oraciones, **corregir errores** y **personalizar** (hablar de
uno mismo con la estructura, la más importante). La app tiene 3 de esos 4 tipos de ejercicio, pero:

1. Los califica con **una sola respuesta exacta**: `She's a teacher` se marca mal si la clave dice
   `She is a teacher`; un tipeo en una palabra que no se evalúa cuenta como error de gramática; sin
   conexión la transformación no se corrige. Eso castiga a la persona y mete errores falsos en el SRS.
2. No hay progresión por nivel: la misma mecánica no sirve igual en A1 (contraer `I am`) que en C1
   (inversión, transformación con palabra clave). En niveles altos hay **muchas** respuestas válidas y
   una clave cerrada deja de funcionar.

Este plan añade: un calificador local tolerante; detectores de estructura gramatical para aceptar
respuestas abiertas sin IA; el tipo que falta (personalización); perfiles por nivel A1–C1 que definen
qué técnica, qué longitud y cuánta tolerancia; y contenido de drill para los decks de gramática A1–C1
(hasta 212, sin los de pronunciación y audio), generado por script con validación automática y revisión humana.

## Estado actual

**Calificación**
- `components/exercises/ErrorCorrectionExercise.tsx:27-29` — normaliza en línea y compara contra
  **una** `correctSentence`. Sin variantes, contracciones ni tipeo. Toda oración mostrada tiene error.
- `components/exercises/SentenceTransformationExercise.tsx:37` — `isExactTransformation`
  (`lib/exercises/transformations.ts:16`) compara contra `referenceAnswer` + `acceptedAnswers`; si no
  coincide llama a `gradeProduction`; sin conexión solo muestra la referencia (líneas 51-60), sin veredicto.
  **Viola la regla de prompts**: líneas 66-68 arman `taskPrompt` en el componente.
- `lib/exercises/grade-reorder.ts` — `gradeReorder(userAnswer, sentence)`: una sola oración válida.
- `lib/exercises/translation.ts` — `isExactTranslation`, mismo patrón (normalizador duplicado).
- `lib/exercises/evaluator.ts` — concepto `acceptableAlternatives` / `commonWrongAnswers` para `ExerciseDesign`.
- `lib/exercises/diff-words.ts` — `diffWords(original, modified)` (LCS por palabra).
- `lib/exercises/speech-constraints.ts` — `SPEECH_CONSTRAINTS` con `minLevel` y `checkEn` (texto que la
  IA usa para verificar `constraintMet`: past simple, present perfect, second conditional…). **No hay
  verificación local** de estructuras.
- No existe lista de verbos irregulares en `lib/` (solo menciones en prompts).
- `app/api/gemini/grade-production/route.ts:13` acepta `level` (A1–C2) y `constraintCheck`.

**Tipos** (`lib/exercises/types.ts`)
- `ReorderWordsExercise { sentence, tokens }` (l.104), `ErrorCorrectionExercise { sentence, correctSentence, explanation? }` (l.156),
  `SentenceTransformationExercise { sourceSentence, instruction, referenceAnswer?, acceptedAnswers? }` (l.172).
- `GenericExerciseType` (l.19-31); `lib/practice/adapters.ts:12` `Record<GenericExerciseType, ExerciseSlug>`
  (puede haber más mapas exhaustivos: `pnpm type-check` los lista).
- Registry de render: `lib/practice/exercise-renderer/generic-registry.tsx`. `GenericRenderExtras`
  admite `score`, `feedback`, `resultStatus`.
- `PracticeResultStatus` (`lib/practice/types.ts:137`); `lib/practice/grade.ts:17`: lo que no es
  `answered` **no recibe nota SRS**.
- `CEFRLevel` y `cefrToNumber` en `lib/exercises/cefr.ts`.

**Contenido y sesión de deck**
- `public/grammar-decks/*.json`: a1 38 · a2 36 · b1 42 · b2 40 · c1 56 (+ c2 11, biz/chunk/tech/cs/ff
  sin nivel). Validados por `GrammarStudyDeckSchema` (`lib/courses/grammar-deck/schema.ts:101`).
- `scripts/generate-deck-quizzes.ts` — **precedente a copiar**: lee decks, llama a Gemini con
  `callWithFallback` (`lib/gemini/client.ts`) y prompts de `lib/ai-prompts.ts`
  (`GRAMMAR_DECK_QUIZ_SYSTEM_PROMPT`, `buildGrammarDeckQuizPrompt`), flags `--dry-run` y `--deck`.
- `scripts/grammar-pattern-deck-specs-*.ts` — specs de decks con `mistake { bad, good, note }` y `quiz`.
- `components/courses/grammar-deck/GrammarStudyDeck.tsx` (221 líneas) llama a
  `buildCoursePracticeSession({ deckSlug, cefrLevel })` en l.106 y l.142. **Ojo**: l.105
  `const level = cefrLevel ?? "A1"` y `app/(authenticated)/practice/decks/[slug]/page.tsx` no pasa
  `cefrLevel` → el nivel del drill **no** puede salir de ahí; sale del propio drill (F1).
- `lib/courses/practice/build-session.ts` — `TARGET_SIZE = 10`, mezcla fragmentos + Core 1000.
- Dexie: última versión `this.version(42)` en `lib/db/index.ts:726`.

## Relación con otros planes

- **037 C1** pide `matchesAcceptedAnswer` con contracciones y una tabla Dexie `gradedAnswers`. La fase A
  de este plan ES esa función, más completa. Si 037 C1 ya se ejecutó: reutiliza y amplía su función y
  su tabla. Si no: crea las de este plan y deja en 037 C1 la nota "paso 3 = `matchAnswer` de
  `lib/exercises/answer-match.ts` (Plan 043)"; la tabla `gradedAnswers` usa **exactamente** el esquema de 037 C1.
- **037 C2** (máx. 2 llamadas a IA por ejercicio): cualquier llamada a IA de este plan pasa por ese
  límite si ya existe.
- **041** (banco pregenerado): el script de la fase G puede ejecutarse desde el job de 041 cuando exista;
  este plan no depende de él.
- **042** (reportar corrección mal): la fase C engancha ahí si ya existe.

## Matriz por nivel (fuente de verdad pedagógica)

Esta tabla se implementa como datos en F1 (`DRILL_PROFILES`). El script de G la usa para generar y
validar; la UI la usa para la tolerancia y la ayuda.

| | A1 | A2 | B1 | B2 | C1 |
|---|---|---|---|---|---|
| **Transformar** | contraer / descontraer; afirmativa→negativa; afirmativa→pregunta sí/no | cambio de tiempo (presente→pasado); singular→plural; pregunta con wh- | activa→pasiva; directo→indirecto; unir con relativo; palabra clave (ligera) | palabra clave estilo FCE (2–5 palabras, no cambiar la palabra); condicionales; `wish`; modales en pasado | palabra clave estilo CAE (3–6 palabras); inversión; cleft; nominalización; informal→formal |
| **Construir** | ordenar 4–6 palabras, 1 cláusula | ordenar 6–9 palabras; posición de adverbios y expresiones de tiempo (órdenes alternativos) | unir 2 oraciones con conector dado (texto libre) | unir con participio / conector; ordenar bloques de palabras | unir 3 ideas en 1 oración; ordenar bloques de cláusulas |
| **Corregir** | 1 error, siempre del tema | 1 error; 20 % ya están bien | 1 error; 30 % bien; errores de temas previos | 1 error; 40 % bien; errores de colocación/preposición | 1 error sutil; 50 % bien; registro y colocaciones |
| **Personalizar** | marco con 1 hueco (`I'm ___ years old.`) | marco con hueco de frase (`Last weekend I ___.`) + estructura obligatoria | respuesta abierta 1–2 oraciones + 1 estructura obligatoria | 2–3 oraciones + 1–2 estructuras | 2–4 oraciones + 2 estructuras (p. ej. inversión + cleft) |
| **Tipeos tolerados por oración** | 2 | 2 | 2 | 1 | 1 |
| **Mostrar la respuesta tras** | 1 intento fallido | 1 | 2 | 2 | 2 |
| **Ayuda visible** | banco de palabras / pista en español | pista en español | pista con el patrón (`if + past, would + verbo`) | pista bajo demanda | pista bajo demanda |
| **Explicaciones** | español | español | español con términos en inglés | español con términos en inglés | español con términos en inglés |

Reglas que aplican a todos los niveles:
- La **personalización nunca evalúa el contenido** (no hay respuesta incorrecta sobre la vida de alguien):
  solo forma (hueco válido) y, desde A2, que aparezca la estructura pedida.
- "Corregir" con oraciones ya correctas (A2+) evita el hábito de "cambiar algo siempre".
- Desde B1 hay **muchas** respuestas válidas: la clave es un conjunto de plantillas **más** detectores de
  estructura (fase D), y lo que no se resuelve en local va a IA (online) o a autoevaluación (offline).

## Fase A — Calificador tolerante `lib/exercises/answer-match.ts` (puro, sin IA, sin Dexie)

### A1. Tipos
```ts
export interface AnswerSpec {
  /** Plantillas de respuestas válidas. `{a|b}` = alternativas; `{a|}` = opcional. La 1.ª expansión es la canónica. */
  accept: string[]
  /** Palabras que el ejercicio evalúa; nunca se les perdona tipeo. Si falta, se derivan (A4). */
  targetTokens?: string[]
  /** 'equivalent' (default): I'm = I am. 'require': debe contraer. 'forbid': debe ir sin contraer. */
  contractions?: 'equivalent' | 'require' | 'forbid'
  /** Palabras que deben aparecer tal cual (palabra clave de B1–C1). */
  mustInclude?: string[]
  commonWrong?: { answer: string; feedback: string }[]
}

export interface MatchOptions {
  /** Del perfil de nivel (F1). Default 2. */
  maxTypos?: number
  /** Respuestas que la persona ya aceptó en su banco local (fase C). */
  extraAccepted?: string[]
}

export type AnswerVerdict =
  | { kind: 'exact' | 'variant'; score: 100; matched: string }
  | { kind: 'typo'; score: 90; matched: string; typos: { got: string; expected: string }[] }
  | { kind: 'contraction_mismatch'; matched: string; expectedForm: 'contracted' | 'full' }
  | { kind: 'missing_required'; missing: string[] }
  | { kind: 'known_wrong'; feedback: string }
  | { kind: 'no_match'; canonical: string }
```

### A2. Normalización y expansión
- `normalize`: `toLocaleLowerCase('en-US')`, `’`→`'`, quita puntuación excepto `'`, colapsa espacios.
  Sustituye los normalizadores duplicados de `translation.ts`, `transformations.ts` y
  `ErrorCorrectionExercise.tsx` (mantén las funciones exportadas existentes como envoltorios).
- `expandTemplate(t)`: producto cartesiano de los grupos `{…|…}`; sin anidamiento; **tope 64
  expansiones** por plantilla (si se supera, lanza error de contenido; lo atrapa el schema en F2).
- `expandContractions(tokens)`: tabla fija (`i'm, you're, he's, she's, it's, we're, they're, isn't,
  aren't, wasn't, weren't, don't, doesn't, didn't, haven't, hasn't, hadn't, can't→cannot, couldn't,
  won't→will not, wouldn't, shouldn't, i've, you've, we've, they've, i'll, you'll, i'd, you'd, let's`).
  `'s` se expande a `is` **solo** tras pronombres (`he/she/it/that/there/what/who/here`) y `'d` a
  `would`; el genitivo (`John's car`) nunca se toca (limitación conocida: `she's got` ≠ `she has got`,
  `I'd gone` ≠ `I had gone`; caen en `no_match` y los resuelve D/C; no añadas heurísticas aquí).

### A3. Orden de `matchAnswer(answer, spec, options)`
1. Vacío → `no_match`.
2. `commonWrong` (normalizado) → `known_wrong`.
3. `mustInclude` ausente en la respuesta → `missing_required`.
4. Igual a una expansión (de `accept` o `extraAccepted`) → `exact` (1.ª expansión) o `variant`.
5. Igual tras `expandContractions` en ambos lados: `'equivalent'` → `variant`; `'require'`/`'forbid'`
   y la forma no es la pedida → `contraction_mismatch`.
6. Tipeo: se compara sobre las formas **ya expandidas** del paso 5 (así `She's a techer` también cuenta
   como tipeo); misma cantidad de tokens que alguna expansión; cada diferencia es Damerau-Levenshtein ≤1 en un
   token de ≥4 letras que **no** está en `targetTokens` ni en `mustInclude`; total ≤ `maxTypos` → `typo`.
7. Nada → `no_match`.

### A4. Derivar `targetTokens` cuando no vienen
- `error_correction`: tokens `insert` de `diffWords(sentence, canonical)` (`She am` → `is`).
- `sentence_transformation`: tokens `insert` de `diffWords(sourceSentence, canonical)`.
- `reorder_words`: todos (no hay tipeo en fichas).

### A5. Compatibilidad
`specFromErrorCorrection(ex)`, `specFromTransformation(ex)`, `specFromReorder(ex)`: si el ejercicio no
trae `answerSpec`, lo construyen desde `correctSentence` / `referenceAnswer + acceptedAnswers` /
`sentence`. Así **todos los ejercicios existentes** ganan contracciones y tipeo sin tocar contenido.

**Verify**: `lib/exercises/__tests__/answer-match.test.ts`, mínimo:
`She am a teacher.` + accept `{She is|She's} a teacher.` → `She's a teacher` = variant,
`she is a teacher!` = exact, `She is a techer` = typo, `She are a teacher` = no_match (target `is`);
contracción requerida con `She is a doctor` = contraction_mismatch; `mustInclude: ['wish']` sin `wish`
= missing_required; `maxTypos: 1` con 2 tipeos = no_match; plantilla con 65 expansiones lanza error.
`pnpm test answer-match`.

## Fase B — Conectar los ejercicios existentes

Helper puro `lib/exercises/answer-feedback.ts`: `feedbackFromVerdict(verdict, ctx) → PedagogicalFeedback`
(mensajes en español; `variant` muestra "También vale: <canónica>"; `typo` → "Ojo con la ortografía:
<got> → <expected>", correcto con score 90; `contraction_mismatch` → "Correcto, pero la instrucción pide
contraer: <canónica>", `canRetry`; `missing_required` → "Usa la palabra <X> sin cambiarla", `canRetry`;
`known_wrong` → su feedback, `canRetry`). Los componentes solo lo llaman; así quedan ≤250 líneas.

**Reintentos y "mostrar respuesta"**: hoy ambos componentes cierran tras un envío (`setDone(true)`).
Hook `hooks/useDrillAttempts.ts`: cuenta intentos fallidos (`canRetry`) y solo revela la canónica y llama
a `onResult(false, …)` al llegar a `revealAfterAttempts` del perfil (default 1 sin `level`). Un acierto
tras fallar → `onResult(true, …, { firstTryFailed: true })` (campo que ya existe en `GenericRenderExtras`).

### B1. `ErrorCorrectionExercise`
- Añade al tipo `answerSpec?: AnswerSpec` y `alreadyCorrect?: boolean`.
- Usa `matchAnswer(answer, ex.answerSpec ?? specFromErrorCorrection(ex), { maxTypos })`.
- Si `alreadyCorrect`: muestra un botón secundario **"Está correcta"**. Pulsarlo (o reescribir la misma
  oración) = correcto; pulsarlo cuando sí había error = incorrecto con la corrección.
  Sin `alreadyCorrect` el botón **también** se muestra en ejercicios de drill cuyo perfil tiene
  `alreadyCorrectRatio > 0` (A2+), para que su presencia no delate la respuesta; en A1 y fuera de
  drills no se muestra.
- `no_match` → fase C.

### B2. `SentenceTransformationExercise`
- Añade al tipo `answerSpec?` y `requires?: StructureCheckId[]` (el tipo llega en D; en esta fase deja
  el campo y la rama de detectores detrás de un `TODO(043-D)` y complétalos al cerrar D).
  Sustituye `isExactTransformation` por `matchAnswer`.
- Solo si `no_match`: primero detectores locales (D) si hay `requires` — **con o sin red**; si falta una
  estructura → pista específica y reintento. Si pasan (o no hay `requires`): online →
  `gradeProduction` (o `gradeWithLocalFirst` si 037 C1 existe) con `level`; offline / sin cuota → fase C.
- **Mueve el `taskPrompt` (líneas 66-68) a `lib/ai-prompts.ts`** como `buildTransformationGradeTaskPrompt(...)`.

### B3. `reorder_words`
- Añade `answerSpec?` al tipo; `gradeReorder` acepta un spec opcional y usa `matchAnswer` con
  `contractions: 'forbid'` implícito. Uso: órdenes alternativos (`{I am tired today.|Today I am tired.}`).
- Fichas de varias palabras (B2–C1, "ordenar bloques"): `tokens` ya es `string[]`; verifica que el
  renderer y `gradeReorder` funcionan con tokens como `"which I bought"` (test). Si el renderer asume una
  palabra por ficha, STOP y reporta.

**Verify**: tests existentes verdes; nuevos: `She's a teacher` aceptado en ErrorCorrection; botón "Está
correcta" en ambos casos; transformación con variante válida no llama a `gradeProduction` (mock); reorder
con orden alternativo y con fichas de bloque. `pnpm type-check && pnpm test exercises`.

## Fase C — "Mi respuesta también es correcta" (sin IA o sin conexión)

Cuando el veredicto final es `no_match` y no hay IA disponible (offline, cuota agotada, error, o ya se
gastaron las llamadas de 037 C2):
1. Muestra la canónica y dos botones: **"Me equivoqué"** y **"Mi respuesta también es correcta"**.
   Componente `components/exercises/SelfAssessPrompt.tsx` (una responsabilidad).
2. "Me equivoqué" → `onResult(false, …)` con `resultStatus: 'answered'`.
3. "También es correcta" → `onResult(true, answer, t, { score: 70, resultStatus: 'unscored' })` (sin nota
   SRS, `lib/practice/grade.ts:17`) y guarda la respuesta normalizada en `gradedAnswers` (Dexie
   `version(43)` si la tabla no existe; datos solo locales, **no** se sincronizan).
4. Hook `hooks/useAcceptedAnswers.ts` (`useLiveQuery`) entrega `extraAccepted` a `matchAnswer`: la
   misma respuesta ya no vuelve a preguntarse.
5. Si el Plan 042 existe, "También es correcta" registra además un reporte de clave incompleta.

**Verify**: test del componente: offline + no_match → 2 botones; "También es correcta" → `onResult` con
`resultStatus: 'unscored'` y escritura en Dexie (fake-indexeddb); segundo intento igual → `variant`.

## Fase D — Detectores de estructura `lib/exercises/structure-checks/` (puros, sin IA)

Permiten aceptar respuestas **abiertas** (personalización A2+, uniones B1+, transformaciones libres) sin
clave cerrada. Son **condición necesaria**, no suficiente: comprueban que la estructura está, no que la
oración sea perfecta.

### D1. Datos
`lib/exercises/structure-checks/irregular-verbs.ts`: ~180 verbos irregulares comunes `{ base, past, participle }`
(escritos a mano o desde una lista con licencia libre; cita la fuente en un comentario). Añade formas
regulares por regla (`-ed`, `-ied`, consonante doble) en un helper `pastForms(base)`.

### D2. Registry
```ts
export type StructureCheckId =
  | 'contraction' | 'negative' | 'yes_no_question' | 'wh_question'
  | 'past_simple' | 'past_continuous' | 'present_perfect' | 'past_perfect'
  | 'going_to_future' | 'will_future' | 'comparative' | 'superlative'
  | 'passive' | 'relative_clause' | 'first_conditional' | 'second_conditional'
  | 'third_conditional' | 'mixed_conditional' | 'wish_past' | 'wish_past_perfect'
  | 'modal_perfect' | 'reported_speech' | 'participle_clause'
  | 'negative_inversion' | 'cleft_what' | 'cleft_it'

export interface StructureCheck {
  id: StructureCheckId
  minLevel: CEFRLevel
  labelEs: string              // "present perfect (have/has + participio)"
  hintEs: string               // pista cuando falta
  /** Texto para la IA (mismo rol que SpeechConstraint.checkEn); reutilízalo si ya existe. */
  checkEn: string
  test: (tokens: string[]) => boolean
}
export const STRUCTURE_CHECKS: Record<StructureCheckId, StructureCheck>
export function checkStructures(text: string, ids: StructureCheckId[]): { ok: boolean; missing: StructureCheckId[] }
```
Ejemplos de `test`: `present_perfect` = `have|has|'ve|'s` seguido (≤2 tokens, admite `never/already/just/ever`)
de un participio (irregular o `-ed`); `third_conditional` = `if` … `had` + participio **y** `would|could|might` + `have` + participio;
`negative_inversion` = empieza con `never|rarely|seldom|hardly|not only|no sooner|little|at no time|under no circumstances|only then`
seguido de auxiliar. Un archivo por familia si el registry pasa de 250 líneas (`tenses.ts`, `conditionals.ts`, `advanced.ts`).
Donde exista un `SpeechConstraintId` equivalente, reutiliza su `checkEn`.

**Verify**: `lib/exercises/structure-checks/__tests__/*.test.ts` con ≥3 positivos y ≥3 negativos por id
(incluye contracciones y adverbios intercalados: `I've never been`, `She hasn't finished`); test de que
`STRUCTURE_CHECKS[id].minLevel` es coherente con la matriz (p. ej. `negative_inversion` ≥ B2).

## Fase E — Tipo nuevo `personalization`

```ts
export type PersonalizationExercise = BaseGenericExercise & { type: 'personalization'; hintEs?: string; example?: string } & (
  | { mode: 'frame'; frame: string; slot: 'number' | 'word' | 'phrase'; requires?: StructureCheckId[] }   // A1–A2
  | { mode: 'open'; promptEs: string; starter?: string; requires: StructureCheckId[]; minWords: number; maxWords: number } // B1–C1
)
```
1. Añade `'personalization'` a `GenericExerciseType` y completa cada mapa exhaustivo que marque
   `pnpm type-check` (p. ej. `GENERIC_TYPE_TO_SLUG` en `lib/practice/adapters.ts:12`; si hace falta un
   `ExerciseSlug` nuevo, añádelo donde se definen los slugs).
2. `lib/exercises/personalization.ts` (puro): `gradePersonalization(ex, text) → { ok, issues[], hints[] }`.
   - `frame`: `frame` con exactamente un `___`; `validateSlot` (`number` = dígitos o 0–99 en palabras;
     `word` = 1 token; `phrase` = 1–8 tokens); si hay `requires`, `checkStructures` sobre la oración armada.
   - `open`: número de palabras en rango + `checkStructures(text, requires)`.
   - Avisos suaves que **no** bloquean: `a` + vocal → "¿an …?"; mayúscula inicial.
   - **Nunca** evalúa contenido.
3. Componentes (uno por modo; un wrapper elige por `mode` vía mapa, no `if` en cadena):
   `PersonalizationFrameExercise.tsx` (prefijo y sufijo fijos, input en el hueco) y
   `PersonalizationOpenExercise.tsx` (textarea con contador de palabras y chips de "estructuras pedidas"
   que se marcan en verde en vivo con `checkStructures`).
4. Resultado: forma válida y estructuras presentes → `onResult(true, text, t, { score: 100 })` con
   `resultStatus: 'answered'` **solo si hay `requires`** (es evidencia real de que usa la estructura);
   sin `requires` (marcos A1) → `resultStatus: 'unscored'`, para que "siempre correcto" no infle el
   dominio del tema en el SRS. Falta
   una estructura → pista (`hintEs`) y reintento sin llamar a `onResult`. Tras 2 intentos sin la
   estructura → `SelfAssessPrompt` (C) con el texto "¿Usaste <estructura>?".
5. Botón opcional **"Pulir con IA"** (solo online, iniciado por la persona, nunca automático): llama a
   `gradeProduction` con `level`, `targetItem` = `labelEs` de la 1.ª estructura (máx. 100 caracteres,
   límite del schema de la ruta), `taskPrompt` desde un builder nuevo en `lib/ai-prompts.ts` y
   `constraintCheck` = `checkEn` de las estructuras (máx. 400 caracteres); muestra sugerencias,
   **no cambia** el resultado ya registrado. Respeta 037 C2 si existe.
6. Entrada en `generic-registry.tsx` (`title: 'Habla de ti'`).

**Verify**: tests de `gradePersonalization` (número en dígitos y palabras; hueco vacío; `open` sin la
estructura; con contracción `I've been`); test de cada componente vía registry; "Pulir con IA" no se
muestra offline. `pnpm type-check`.

## Fase F — Perfiles por nivel, schema de drill y sesión

### F1. Perfiles `lib/exercises/grammar-drill/profiles.ts`
`DRILL_PROFILES: Record<'A1'|'A2'|'B1'|'B2'|'C1', DrillProfile>` con los valores de la **Matriz por nivel**:
`maxTypos`, `revealAfterAttempts`, `alreadyCorrectRatio`, `buildMode` (`'reorder'` A1–A2, `'combine'` B1+,
`'reorder_chunks'` B2+), `sentenceWords: [min, max]`, `personalizationMode`, `hintVisibility`.
Los componentes leen el perfil desde el nivel del ejercicio (`exercise.level`), nunca del usuario.
Ejercicios sin `level` (los que ya existen fuera de drills) usan los defaults de `MatchOptions`
(`maxTypos: 2`) y no muestran "Está correcta".

### F2. Schema: campo opcional `drill` en `GrammarStudyDeckSchema`
```ts
drill?: {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'       // obligatorio: no depender de cefrLevel (ver Estado actual)
  reviewed: boolean                              // false = generado sin revisión humana
  transform?:   { source: string; instruction: string; accept: string[]; contractions?; mustInclude?; requires?: StructureCheckId[]; commonWrong?; explanation? }[]
  build?:       ({ kind: 'reorder'; accept: string[]; chunks?: string[] } | { kind: 'combine'; sources: string[]; connector?: string; accept: string[]; requires?: StructureCheckId[] })[]
  correct?:     { sentence: string; alreadyCorrect?: boolean; accept: string[]; explanation?: string; commonWrong? }[]
  personalize?: PersonalizationItem[]            // mismo shape que PersonalizationExercise sin campos base
}
```
`superRefine` (en `lib/courses/grammar-deck/drill-schema.ts` para no inflar `schema.ts`):
- 3–5 ítems por técnica;
- cada plantilla expande ≤64;
- `reorder`: todas las expansiones usan el mismo multiconjunto de tokens (o `chunks`);
- `correct` sin `alreadyCorrect`: `matchAnswer(sentence, spec)` debe dar `no_match` (la oración errónea
  no puede aceptarse); con `alreadyCorrect`: `sentence` debe estar en `accept`;
- `transform`: `matchAnswer(source, spec)` no puede dar `exact`/`variant`/`typo` (copiar la oración
  original no puede aprobar; con `contractions: 'require'` debe dar `contraction_mismatch`);
- cada palabra de `mustInclude` aparece en **todas** las expansiones de `accept`;
- ningún `commonWrong` coincide con una expansión de `accept` (se evalúa antes y la bloquearía);
- toda plantilla de `accept` con `requires` debe pasar `checkStructures`;
- cada id de `requires` cumple `STRUCTURE_CHECKS[id].minLevel ≤ level` (p. ej. `negative_inversion`
  no puede usarse en A2); `build.kind` permitido por `buildMode` del perfil;
- `correct`: cantidad con `alreadyCorrect` = `round(n × alreadyCorrectRatio)` ± 1.

### F3. Builder `lib/exercises/generators/grammar-drill.ts`
`buildGrammarDrill(deckSlug, drill) → GenericExercise[]`, orden del método: transform → build → correct →
personalize. Mapeo: `transform` y `build.combine` → `sentence_transformation` (en `combine`,
`sourceSentence = sources.join(' ')` e `instruction` = "Une las oraciones usando <connector>" o
"Une las oraciones en una sola"); `correct` → `correctSentence` = 1.ª expansión de `accept`; `build.reorder` →
`reorder_words` (baraja tokens o `chunks` de la 1.ª expansión); `correct` → `error_correction`;
`personalize` → `personalization`. Todos con `level: drill.level`, `lessonSlug: deckSlug`,
`sourceRef: { source: 'grammar_deck', id: 'grammar-deck:<slug>' }`, ids con `exerciseId(...)`.
Cada técnica es una entrada de un registry `DRILL_ITEM_BUILDERS` (no `switch`).

### F4. Sesión
`buildCoursePracticeSession` acepta `drill?: GrammarDrill`. Si viene, los ejercicios del drill van
**primero** y `TARGET_SIZE` solo limita a las demás fuentes. `GrammarStudyDeck.tsx` pasa `deck.drill` en
las 2 llamadas (l.106 y l.142). Sin `drill`, nada cambia. Si `drill.reviewed === false`, muestra una
etiqueta discreta "Ejercicios nuevos"; si 042 existe, añade "· avísanos si algo está mal" con su botón
(sin 042 no prometas un canal de reporte que no existe).

**Verify**: test del schema cargando **todos** los decks; tests de `superRefine` (cada regla con un caso
que falla); test del builder (orden, tipos, `level`); test de `build-session` con y sin `drill`;
`pnpm build`.

## Fase G — Contenido A1–C1

### G1. Pilotos escritos a mano (1 por nivel, `reviewed: true`)

| Nivel | Deck | Qué debe mostrar |
|---|---|---|
| A1 | `a1-verbo-to-be` | contracciones `require`; reorder 4–6; `I are from Mexico` → `{I am\|I'm\|We are\|We're\|They are\|They're} from Mexico.`; marcos `I'm ___ years old.` (number), `I'm from ___.`, `I'm a ___.`, `My best friend is ___.`, `Right now, I'm ___.` |
| A2 | `a2-pasado-to-be` | presente→pasado; adverbio con 2 órdenes; 1 de 5 "Está correcta"; marco `Last weekend I ___.` (phrase) con `requires: ['past_simple']` (el verbo lo escribe la persona; un marco con `was` ya incluido haría la comprobación inútil) |
| B1 | `b1-segundo-condicional` | palabra clave ligera; `combine` con `if`; 30 % correctas; `open`: "¿Qué harías si ganaras la lotería?" `requires: ['second_conditional']`, 10–30 palabras |
| B2 | `b2-tercer-condicional` | palabra clave FCE con `mustInclude`; `reorder_chunks`; 40 % correctas; `open` 2–3 oraciones `requires: ['third_conditional']` |
| C1 | `c1-enfasis-inversion-avanzada` | palabra clave CAE; inversión y cleft; 50 % correctas; `open` 2–4 oraciones `requires: ['negative_inversion', 'cleft_what']` |

Estos 5 archivos calibran el prompt de G2 (se pasan como ejemplos few-shot del mismo nivel).

### G2. Script `scripts/generate-grammar-drills.ts` (copiar la estructura de `generate-deck-quizzes.ts`)
- Prompts nuevos en `lib/ai-prompts.ts`: `GRAMMAR_DRILL_SYSTEM_PROMPT`, `buildGrammarDrillPrompt({ deck, profile, pilot })`.
  Deben pedir: todas las variantes válidas como plantillas `{a|b}`; `requires` con ids del registry; y
  basarse en las `cards` del deck (reglas, ejemplos, `pairs`) para no inventar otro tema.
- Salida JSON con `responseMimeType: 'application/json'`; se valida con el schema de F2 **y** su
  `superRefine`. Ítems que fallan se descartan; si una técnica queda con <3 ítems, reintenta 1 vez; si
  sigue fallando, anota el deck en `scripts/content/grammar-drills-report.json` y sigue.
- Flags: `--dry-run`, `--deck <slug>`, `--level a1|a2|b1|b2|c1`, `--limit N` (default 25), `--overwrite`
  (por defecto no toca decks que ya tienen `drill`). Pausa entre llamadas como el script de quizzes.
- **Solo decks elegibles**: slug con prefijo `a1-`…`c1-` y con al menos una card con bloque `rules`,
  `conjugation`, `contrast` o `pairs`. Excluye pronunciación y audio (slugs con `sonido`, `vocales`,
  `pronunciacion`, `audio`, `alfabeto`) y cualquier deck que el script marque sin tema gramatical;
  guarda la lista de excluidos en el reporte. C2, biz, chunk, tech, cs y ff quedan fuera.
- Escribe siempre `reviewed: false`.
- Cuota: 1 llamada por deck (≤212 decks; menos tras excluir pronunciación y audio). Ejecútalo por nivel en lotes de ≤25–50
  al día según la cuota de 035; el script es reanudable porque salta los decks que ya tienen `drill`.

### G3. Revisión
- Test de contenido `lib/courses/grammar-deck/__tests__/drills-content.test.ts`: carga todos los decks
  con `drill` y ejecuta el `superRefine` (ya cubierto por F4, aquí es explícito por nivel) + que cada
  nivel respeta `sentenceWords` del perfil.
- Revisión humana: al menos 10 % de los decks de cada nivel (y todos los que el reporte marque). Al
  revisarlo, pasa `reviewed: true`. Lista de control por deck: ¿el tema coincide con el deck?, ¿faltan
  variantes obvias en `accept`?, ¿las oraciones "ya correctas" lo están de verdad?, ¿la personalización
  pregunta algo que una persona de ese nivel puede contestar?

**Verify**: `pnpm tsx --env-file=.env.local scripts/generate-grammar-drills.ts --level a1 --limit 3 --dry-run`
imprime 3 drills válidos; `pnpm test drills-content`; los 5 pilotos siguen intactos (no se sobrescriben sin `--overwrite`).

## Fase H — Documentación

| Archivo | Qué escribir |
|---|---|
| `docs/architecture/exercises.md` → sección "Corrección tolerante" | Capas de `matchAnswer`, sintaxis `{a\|b}`, `targetTokens`, `mustInclude`, contracciones, detectores de estructura (necesarios, no suficientes), "Mi respuesta también es correcta" y por qué va `unscored` |
| `docs/content/grammar-drills.md` (crear) | La **Matriz por nivel**; cómo escribir o revisar un `drill`; ejemplos buenos y malos por nivel; cómo correr el script por lotes; qué significa `reviewed` |
| `plans/README.md` | Fila 043 y su lugar en el orden recomendado |
| `CLAUDE.md` → "Hard rules" | "Ejercicios con respuesta escrita → `matchAnswer` (`lib/exercises/answer-match.ts`) antes de cualquier IA" y "Estructuras gramaticales → `lib/exercises/structure-checks/` (no regex sueltas en componentes)" |

## STOP conditions

- El drift check muestra cambios en `ErrorCorrectionExercise.tsx`, `SentenceTransformationExercise.tsx`
  o ya existe `answer-match.ts` con otra forma → reporta antes de seguir.
- `lib/practice/grade.ts` ya no excluye `unscored` del SRS → no uses `unscored` en C; reporta.
- El renderer de `reorder_words` asume una palabra por ficha (B3) → reporta antes de `reorder_chunks`.
- Un detector de D no llega a ≥3 positivos y ≥3 negativos correctos → quítalo del registry y de los
  perfiles; no lo dejes a medias.
- Algún componente pasa de 250 líneas y no se puede extraer a helper/hook sin cambiar su UI → reporta.
- Algún deck existente falla el schema nuevo sin tener `drill` → reporta la lista; no edites contenido ajeno.
- En G2, más del 30 % de los decks de un nivel acaba en el reporte de fallos → para ese nivel, ajusta el
  prompt con otro piloto antes de seguir generando.

## Fuera de alcance

- C2 y decks sin nivel (biz, chunk, tech, cs, ff). Los chunk decks tipo `chunk-sentence-frames` o
  `chunk-hablar-de-mi` encajan con `personalization` en un plan posterior.
- Meter drills en el daily plan (`lib/practice/daily-plan/`); aquí solo se usan desde la práctica del deck.
- Llevar lo escrito en `personalization` al journal como semilla (la respuesta ya queda en
  `answer_history` vía `savePracticeAnswer`).
- Subir al servidor las respuestas autoaceptadas para mejorar las claves de todos (requiere tabla con RLS
  y moderación; plan futuro junto con 042).
- Formas flexionadas vía Kaikki (ver tabla de fuentes en `plans/README.md`).
