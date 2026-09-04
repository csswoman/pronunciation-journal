# Plan 090 — Ecosistema SLA Completo: Explicabilidad en Home, Shadowing Oral en Reader, Weak Forms & Letras Mudas, y Duración Vocálica

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Cerrar el ecosistema SLA con cuatro frentes: (1) contenidos y entrenamiento auditivo sobre content/function words, schwa y formas débiles; (2) explicabilidad del plan diario en Home ("por qué este plan"); (3) shadowing oral con grabación y reproducción dual en el Reader; (4) datos de letras mudas y duración vocálica para el entrenador de habla conectada y la remediación silábica.

**Architecture:** Sistema integrado compuesto por lección/mini-lección estáticas en JSON (`lib/content`), enriquecimiento de lecciones existentes, componente cliente `ContentFunctionEarTrainer` en `/mini-lessons/[slug]`, expansión de `CONNECTED_SPEECH_DATA` (categorías `weak-forms` y `silent-letters`), helper puro `lib/home/plan-rationale.ts` + `HomePlanRationale` montado vía `customPrefix` de `HomeDailyCard`, refactor de `ShadowingController` con `ReaderSentenceRecorder` / `ShadowingPlaybackBar`, y módulos `lib/pronunciation/{silent-letters-data,vowel-duration}.ts`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zod, Web Speech API (`lib/speech/synthesis.ts`), Vitest.

**Estado:** Completado — verificado con `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules` y `pnpm test`.

---

### Task 1: Crear la nueva mini-lección y lección completa en JSON
**Files:**
- Create: `public/mini-lessons/better-listening-weak-forms.json`
- Create: `public/lessons/better-listening-weak-forms.json`
- Test: `lib/content/__tests__/listening-content.test.ts`

**Step 1: Escribir el test para validar el schema Zod de la nueva lección**
Validar que `public/mini-lessons/better-listening-weak-forms.json` y `public/lessons/better-listening-weak-forms.json` cumplen con `MiniLessonSchema` y `LessonContentSchema`.

**Step 2: Ejecutar el test para comprobar que falla (archivos aún no existen)**
Run: `pnpm test --run lib/content/__tests__/listening-content.test.ts`
Expected: FAIL (file not found).

**Step 3: Crear los archivos JSON con todo el contenido detallado**
Crear `public/mini-lessons/better-listening-weak-forms.json` (id: 66, slug: "better-listening-weak-forms", category: "listening", duration: 6) y `public/lessons/better-listening-weak-forms.json` con las 5 secciones, ejemplos IPA, ejercicios y quiz.

**Step 4: Ejecutar el test para comprobar que pasa**
Run: `pnpm test --run lib/content/__tests__/listening-content.test.ts`
Expected: PASS.

---

### Task 2: Enriquecer lecciones existentes
**Files:**
- Modify: `public/lessons/basic-listening-reductions.json`
- Modify: `public/lessons/sentence-stress.json`

**Step 1: Actualizar `basic-listening-reductions.json`**
Incorporar la explicación del schwa como regla fonética general y distinguir entre palabras de contenido y palabras de función.

**Step 2: Actualizar `sentence-stress.json`**
Profundizar sobre cómo el ritmo acentual debilita las palabras funcionales intermedias.

**Step 3: Validar que todos los JSONs de lecciones siguen siendo válidos**
Run: `pnpm test --run lib/content/__tests__/listening-content.test.ts`
Expected: PASS.

---

### Task 3: Expandir `CONNECTED_SPEECH_DATA` con frases de `weak-forms`
**Files:**
- Modify: `lib/pronunciation/connected-speech-data.ts`
- Test: `lib/pronunciation/__tests__/connected-speech-data.test.ts`

**Step 1: Escribir o correr test de validación de datos de habla conectada**
Comprobar unicidad de IDs y consistencia de categorías.

**Step 2: Añadir 6 frases a la categoría `weak-forms`**
1. `"we-can-meet-at-two"`: *"We can meet at two"* (`can` -> `/kən/`, `at` -> `/ət/`).
2. `"its-for-the-team"`: *"It's for the team"* (`for` -> `/fər/`, `the` -> `/ðə/`).
3. `"he-was-ready-to-go"`: *"He was ready to go"* (`was` -> `/wəz/`, `to` -> `/tə/`).
4. `"talk-to-them"`: *"I have to talk to them"* (`to` -> `/tə/`, `them` -> `/ðəm/`).
5. `"from-time-to-time"`: *"From time to time"* (`from` -> `/frəm/`, `to` -> `/tə/`).
6. `"more-than-enough"`: *"It was more than enough"* (`than` -> `/ðən/`, `was` -> `/wəz/`).

---

### Task 4: Crear componente `ContentFunctionEarTrainer` y montar en la lección
**Files:**
- Create: `components/mini-lessons/ContentFunctionEarTrainer.tsx`
- Test: `components/mini-lessons/__tests__/ContentFunctionEarTrainer.test.tsx`
- Modify: `app/(authenticated)/mini-lessons/[slug]/page.tsx`

**Step 1: Escribir test unitario para `ContentFunctionEarTrainer`**
Probar selección de palabras, reproducción de audio (mock `speakText`/`cancelSpeech`), y revelación del mapa acústico.

**Step 2: Implementar `ContentFunctionEarTrainer.tsx`**
Respetar todas las hard rules: < 250 líneas, bloque de comentarios de estructura planeada, tokens de diseño de Tailwind v4, accesibilidad con `aria-pressed`.

**Step 3: Montar condicionalmente en `app/(authenticated)/mini-lessons/[slug]/page.tsx`**
Cuando `slug === "better-listening-weak-forms"`, renderizar `<ContentFunctionEarTrainer />` antes de los ejercicios.

**Step 4: Ejecutar tests**
Run: `pnpm test --run components/mini-lessons/__tests__/ContentFunctionEarTrainer.test.tsx`
Expected: PASS.

---

### Task 5: Explicabilidad en Home ("Por qué este plan")
**Files:**
- Create: `lib/home/plan-rationale.ts`
- Create: `components/home/HomePlanRationale.tsx`
- Create: `lib/home/__tests__/plan-rationale.test.ts`
- Modify: `components/home/HomeCommandGrid.tsx`

**Step 1: Escribir `derivePlanRationale` (módulo puro, sin React ni I/O)**
Recibe las señales que Home ya tiene (`reviewDue`, `isNewLearner`, `conceptLesson`, `weakestPhoneme`) y devuelve `{ headline, detail }` con la prioridad del compositor de la diaria: nuevo aprendiz -> repasos vencidos -> sonido más débil -> lección de concepto -> `null`.

**Step 2: Test del helper**
Run: `pnpm test --run lib/home/__tests__/plan-rationale.test.ts`
Expected: PASS (5 casos, incluyendo `null` cuando no hay nada que explicar).

**Step 3: Componente `HomePlanRationale` colapsable**
Nota point-of-use con `aria-expanded`, tokens Tailwind v4, `< 250` líneas. Sólo renderiza cuando el plan ha asentado (`ready`) y `derivePlanRationale` devuelve contenido.

**Step 4: Montar vía `customPrefix` de `HomeDailyCard`**
En `HomeCommandGrid`, anteponer `<HomePlanRationale />` al `HomeReviewBanner` dentro de `customPrefix`.

---

### Task 6: Shadowing Oral en Reader
**Files:**
- Modify: `components/practice/reader/ShadowingController.tsx`
- Modify: `components/practice/reader/ReaderExercise.tsx`
- Modify: `components/practice/reader/passage-tokens.ts`
- Create: `components/practice/reader/ReaderSentenceRecorder.tsx`
- Create: `components/practice/reader/ShadowingPlaybackBar.tsx`
- Test: `components/practice/reader/__tests__/ReaderExercise.bimodal.test.tsx`
- Test: `components/practice/reader/__tests__/ReaderSentenceRecorder.test.tsx`

**Step 1: Extraer grabación por oración a `ReaderSentenceRecorder`**
Grabación con Web Audio (OGG/Opus), estados accesibles, `< 250` líneas.

**Step 2: Extraer la barra de reproducción dual a `ShadowingPlaybackBar`**
Reproducción modelo vs. usuario; `ShadowingController` queda como orquestador (`~180` líneas, sin la excepción de allowlist).

**Step 3: Ampliar `passage-tokens.ts` para sincronización a nivel token**
Añadir el manejo de tokens que necesita el shadowing.

**Step 4: Tests**
Run: `pnpm test --run components/practice/reader/__tests__/ReaderExercise.bimodal.test.tsx components/practice/reader/__tests__/ReaderSentenceRecorder.test.tsx`
Expected: PASS.

---

### Task 7: Letras Mudas y Duración Vocálica
**Files:**
- Create: `lib/pronunciation/silent-letters-data.ts`
- Create: `lib/pronunciation/vowel-duration.ts`
- Create: `lib/pronunciation/__tests__/silent-letters.test.ts`
- Create: `lib/pronunciation/__tests__/vowel-duration.test.ts`
- Modify: `lib/pronunciation/connected-speech-data.ts`
- Modify: `lib/pronunciation/syllable-remediation.ts`

**Step 1: `silent-letters-data.ts` + `silentLettersToConnectedPhrases`**
Dataset de palabras con letras mudas y adaptador a frases de habla conectada; nueva categoría `silent-letters` en `CONNECTED_SPEECH_DATA`.

**Step 2: `vowel-duration.ts`**
Helper puro de duración vocálica (vocales tensas vs. laxas, *clipping* pre-fortis); consumido por `syllable-remediation.ts`.

**Step 3: Tests**
Run: `pnpm test --run lib/pronunciation/__tests__/silent-letters.test.ts lib/pronunciation/__tests__/vowel-duration.test.ts`
Expected: PASS.

---

### Task 8: Verificación global de calidad
**Step 1: Comprobación de tipos**
Run: `pnpm type-check`

**Step 2: Comprobación de linter y guardrails**
Run: `pnpm lint`

**Step 3: Auditorías de reglas duras**
Run: `pnpm audit:hard-rules`

**Step 4: Suite completa de tests**
Run: `pnpm test`
