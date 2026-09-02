# Contenido de Escucha y Formas Débiles: Plan de Implementación

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implementar contenidos pedagógicos y herramientas interactivas de entrenamiento auditivo sobre palabras de contenido vs. palabras funcionales, reducciones con schwa y formas débiles.

**Architecture:** Sistema integrado compuesto por una nueva lección y mini-lección estática en JSON (`lib/content`), enriquecimiento de lecciones existentes, componente cliente especializado `ContentFunctionEarTrainer` montado en `/mini-lessons/[slug]` y expansión de datos en `CONNECTED_SPEECH_DATA` para `/practice/connected-speech`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Zod, Web Speech API (`lib/speech/synthesis.ts`), Vitest.

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

### Task 5: Verificación global de calidad
**Step 1: Comprobación de tipos**
Run: `pnpm type-check`

**Step 2: Comprobación de linter y guardrails**
Run: `pnpm lint`

**Step 3: Auditorías de reglas duras**
Run: `pnpm audit:hard-rules`

**Step 4: Suite completa de tests**
Run: `pnpm test`
