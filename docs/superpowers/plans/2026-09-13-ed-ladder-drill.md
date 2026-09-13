# Ed Ladder Drill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-13-ed-ladder-drill-design.md`

**Goal:** Entrenar la terminación `-ed` y los clusters finales en hispanohablantes mediante tres fases (discriminación auditiva → producción con resilabificación → escalera de entornos fonotácticos), con progreso por cluster persistido en Dexie.

**Architecture:** Un dominio puro nuevo bajo `lib/pronunciation/ed-drills/` (tipos, catálogo semilla, selector adaptativo, heurística de epéntesis) sin ninguna dependencia de React. Una tabla Dexie `userEdClusterProgress` (v39) guarda dominio por cluster. Cuatro componentes bajo `components/pronunciation/ed-drills/` renderizan la sesión; la captura de voz se delega **íntegramente** a `useSpeechRecognition`, que ya resuelve Web Speech → Gemini internamente. Ruta dedicada `app/(authenticated)/practice/ed-drills/page.tsx` que sólo compone.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (utility classes + tokens CSS, `cn()` para condicionales, sin `style={{}}`), Dexie, Vitest + `@testing-library/react` (jsdom).

---

## Hechos verificados del código (leer antes de empezar)

Estos puntos se comprobaron contra el código el 2026-09-13. No los re-deduzcas ni los "corrijas" por intuición:

1. **`useSpeechRecognition` ya hace el fallback completo.** `hooks/useSpeechRecognition.ts:219-222` — si no hay Web Speech usable, pasa a `'listening'` y `stop()` (`:285-292`) dispara `runGeminiFallback()`, que graba con MediaRecorder y transcribe server-side. **No construyas ningún fallback propio.**
2. **`isSupported` es `hasWebSpeech || hasMic`** (`:84`), no "el navegador es Chrome". Firefox/Safari/Brave/móviles devuelven `true` mientras haya micrófono.
3. **`status` incluye `'processing'`** (`:22`). La UI **debe** mostrar feedback en ese estado; omitirlo es el bug que ya se arregló en `SpokenProductionExercise`.
4. **El gate canónico es `canScoreSpeech()`** de `lib/speech/adapters/webSpeechAdapter`. Nunca hagas early-return sobre `isSupported` crudo.
5. **Los mensajes de degradación viven en `lib/speech/browser-support-message.ts`.** Importa `SCORING_UNAVAILABLE_SHADOW_ES` / `STT_NETWORK_FAILURE_ES`; no inventes copy nuevo ni menciones marcas de navegador.
6. **El esquema Dexie va por v38** (`lib/db/index.ts:669`). La tabla nueva entra como v39.
7. **`PRODUCTION_KINDS` está tipado `readonly DailyStep['kind'][]`** (`lib/practice/daily-plan/constants.ts:44`). Añadir `ed_cluster_drill` exige ampliar la unión `DailyStep['kind']` — ver Task 9 (diferida).

---

## File Structure

**New — lógica pura (`lib/pronunciation/ed-drills/`):**
- `types.ts` — `EdAllophone`, `EdCluster`, `EdEnvironment`, `EdDrillEnvironmentVariant`, `EdDrillItem`, `UserEdClusterProgress`.
- `catalog.ts` — `ED_DRILL_CATALOG: EdDrillItem[]` (8 verbos semilla) + `TEMPORAL_ADVERB_BLOCKLIST`.
- `selector.ts` — `selectNextItem()`: prioriza clusters con peor accuracy, descarta los ya dominados.
- `epenthesis.ts` — `detectSuspectedEpenthesis()`: heurística de duración pura, sin audio.

**New — persistencia:**
- `lib/pronunciation/ed-drills/progress.ts` — lecturas/escrituras Dexie de `userEdClusterProgress`.

**New — componentes (`components/pronunciation/ed-drills/`):**
- `EdDrillSession.tsx` — orquestador de las 3 fases. ~150 líneas.
- `Phase1PerceptionCard.tsx` — audio ciego + selección A/B, texto velado hasta responder. ~90 líneas.
- `Phase2LinkingCard.tsx` — resilabificación visual + grabación vía `useSpeechRecognition`. ~140 líneas.
- `Phase3LadderCard.tsx` — escalera de entornos 1/2/3 con regla de desbloqueo. ~120 líneas.
- `ClusterProgressPills.tsx` — dominio por cluster. ~60 líneas.

**Modified:**
- `lib/db/index.ts` — `this.version(39).stores({ userEdClusterProgress: ... })` + propiedad tipada en la clase.
- `app/(authenticated)/practice/ed-drills/page.tsx` — ruta nueva, sólo compone (sin lógica).

**New tests:**
- `lib/pronunciation/ed-drills/__tests__/catalog.test.ts` — **invariante sintáctica** (§7.1 de la spec).
- `lib/pronunciation/ed-drills/__tests__/selector.test.ts`
- `lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts`
- `components/pronunciation/ed-drills/__tests__/Phase1PerceptionCard.test.tsx`
- `components/pronunciation/ed-drills/__tests__/Phase2LinkingCard.test.tsx`

---

## Task 1: Tipos del dominio

**Files:**
- Create: `lib/pronunciation/ed-drills/types.ts`

- [ ] **Step 1: Escribir los tipos**

Copiar los tipos de la spec §3.1 y §3.2 **tal como quedaron corregidos**: sin el campo `isAmbiguousContext`, y con `UserEdClusterProgress` incluyendo `id: string` (clave primaria `${userId}:${cluster}`).

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: limpio.

- [ ] **Step 3: Commit**

```bash
git add lib/pronunciation/ed-drills/types.ts
git commit -m "feat(ed-drills): add domain types"
```

---

## Task 2: Catálogo semilla + test de invariante sintáctica

Esta es la tarea que impide que se repita el fallo de la spec original (*"I walk(ed) everyday"*). El test va **primero**.

**Files:**
- Create: `lib/pronunciation/ed-drills/catalog.ts`
- Test: `lib/pronunciation/ed-drills/__tests__/catalog.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/pronunciation/ed-drills/__tests__/catalog.test.ts
import { describe, expect, it } from 'vitest'
import { ED_DRILL_CATALOG, TEMPORAL_ADVERB_BLOCKLIST } from '../catalog'

describe('ED_DRILL_CATALOG — invariante sintáctica', () => {
  const everySentence = ED_DRILL_CATALOG.flatMap((item) =>
    Object.values(item.environments).flatMap((env) => [
      { itemId: item.id, level: env.level, field: 'sentence', text: env.sentence },
      { itemId: item.id, level: env.level, field: 'contrastSentence', text: env.contrastSentence },
    ]),
  )

  it('ningún ítem contiene adverbios temporales que delaten el tiempo verbal', () => {
    const offenders = everySentence.filter(({ text }) =>
      TEMPORAL_ADVERB_BLOCKLIST.some((adv) =>
        new RegExp(`\\b${adv}\\b`, 'i').test(text),
      ),
    )
    expect(offenders).toEqual([])
  })

  it('cada ítem define los tres entornos', () => {
    for (const item of ED_DRILL_CATALOG) {
      expect(Object.keys(item.environments).sort()).toEqual(['1', '2', '3'])
    }
  })

  it('contrastSentence usa el verbo base y sentence el pasado', () => {
    for (const item of ED_DRILL_CATALOG) {
      for (const env of Object.values(item.environments)) {
        expect(env.sentence).toContain(item.pastVerb)
        expect(env.contrastSentence).toContain(item.baseVerb)
        expect(env.contrastSentence).not.toContain(item.pastVerb)
      }
    }
  })

  it('los ids son únicos', () => {
    const ids = ED_DRILL_CATALOG.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/pronunciation/ed-drills/__tests__/catalog.test.ts`
Expected: FAIL — `Failed to resolve import "../catalog"`.

- [ ] **Step 3: Implementar el catálogo**

Crear `catalog.ts` con:

```ts
export const TEMPORAL_ADVERB_BLOCKLIST = [
  'yesterday', 'ago', 'tomorrow', 'now', 'already', 'just',
  'everyday', 'every day', 'last week', 'last year', 'last night',
] as const
```

Y los 8 ítems de la spec §6 (`achieve`, `live`, `use`, `walk`, `stop`, `pass`, `clean`, `call`). **Usa la fila corregida de `walk`** (*"I walk(ed) home"*, no *everyday*).

> Si al escribir una oración dudas de si un adverbio la delata, cámbiala. El test es la autoridad, no el criterio del momento.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/pronunciation/ed-drills/__tests__/catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/ed-drills/catalog.ts lib/pronunciation/ed-drills/__tests__/catalog.test.ts
git commit -m "feat(ed-drills): seed catalog with enforced syntactic invariant"
```

---

## Task 3: Heurística de epéntesis

**Files:**
- Create: `lib/pronunciation/ed-drills/epenthesis.ts`
- Test: `lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts
import { describe, expect, it } from 'vitest'
import { detectSuspectedEpenthesis, EPENTHESIS_DURATION_RATIO } from '../epenthesis'

describe('detectSuspectedEpenthesis', () => {
  it('marca sospecha cuando el usuario tarda >40% más que el modelo', () => {
    expect(detectSuspectedEpenthesis(1500, 1000)).toBe(true)
  })

  it('no marca sospecha en el umbral exacto', () => {
    expect(detectSuspectedEpenthesis(1400, 1000)).toBe(false)
  })

  it('no marca sospecha cuando el usuario va más rápido', () => {
    expect(detectSuspectedEpenthesis(800, 1000)).toBe(false)
  })

  it('devuelve false con duraciones no utilizables en vez de lanzar', () => {
    expect(detectSuspectedEpenthesis(1500, 0)).toBe(false)
    expect(detectSuspectedEpenthesis(0, 1000)).toBe(false)
    expect(detectSuspectedEpenthesis(Number.NaN, 1000)).toBe(false)
  })

  it('expone el ratio como constante documentada', () => {
    expect(EPENTHESIS_DURATION_RATIO).toBe(1.4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts`
Expected: FAIL — import no resuelto.

- [ ] **Step 3: Implementar**

```ts
// lib/pronunciation/ed-drills/epenthesis.ts

/**
 * Un hispanohablante que inserta una vocal de apoyo ("achieve-de") produce una
 * sílaba extra, y eso alarga la emisión. No es una medida acústica fina: es una
 * señal barata para *sugerir* (nunca para suspender) — ver spec §4.1.
 */
export const EPENTHESIS_DURATION_RATIO = 1.4

export function detectSuspectedEpenthesis(
  userDurationMs: number,
  modelDurationMs: number,
): boolean {
  if (!Number.isFinite(userDurationMs) || !Number.isFinite(modelDurationMs)) return false
  if (userDurationMs <= 0 || modelDurationMs <= 0) return false
  return userDurationMs > modelDurationMs * EPENTHESIS_DURATION_RATIO
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/ed-drills/epenthesis.ts lib/pronunciation/ed-drills/__tests__/epenthesis.test.ts
git commit -m "feat(ed-drills): add epenthesis duration heuristic"
```

---

## Task 4: Selector adaptativo

**Files:**
- Create: `lib/pronunciation/ed-drills/selector.ts`
- Test: `lib/pronunciation/ed-drills/__tests__/selector.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Cubrir el comportamiento de la spec §3.2:
- Con accuracy ≥ 0.95 en `t-id`/`d-id`, esos ítems se descartan.
- Se prioriza el cluster con menor accuracy entre los practicados.
- Un cluster sin progreso previo se trata como prioritario (nunca visto > dominado).
- Devuelve `null` cuando el catálogo filtrado queda vacío.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/pronunciation/ed-drills/__tests__/selector.test.ts`

- [ ] **Step 3: Implementar `selectNextItem(catalog, progressByCluster)`**

Función pura: recibe el catálogo y un `Map<EdCluster, UserEdClusterProgress>`, devuelve `EdDrillItem | null`. Umbral de dominio `MASTERY_ACCURACY = 0.95` exportado como constante.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/ed-drills/selector.ts lib/pronunciation/ed-drills/__tests__/selector.test.ts
git commit -m "feat(ed-drills): add adaptive cluster selector"
```

---

## Task 5: Migración Dexie v39

**Files:**
- Modify: `lib/db/index.ts:669` (tras el bloque v38) y la declaración de la clase

- [ ] **Step 1: Añadir la tabla**

Después del bloque `this.version(38)`:

```ts
// v39: progreso por cluster de -ed / clusters finales (Ed Ladder Drill).
this.version(39).stores({
  userEdClusterProgress: 'id, userId, cluster, [userId+cluster], unlockedLevel, lastPracticedAt',
});
```

Y declarar la propiedad tipada en la clase, junto al resto de tablas:

```ts
userEdClusterProgress!: Table<UserEdClusterProgress, string>;
```

- [ ] **Step 2: Verificar que no rompe el esquema existente**

Run: `pnpm type-check && pnpm test lib/db`
Expected: limpio. Abrir la app con una base v38 previa **no** debe lanzar `VersionError` — la v39 sólo añade una tabla, no cambia claves primarias existentes (ver `isFatalIndexedDbSchemaError`, `lib/db/index.ts:680`).

- [ ] **Step 3: Commit**

```bash
git add lib/db/index.ts
git commit -m "feat(ed-drills): add userEdClusterProgress table (Dexie v39)"
```

---

## Task 6: Capa de progreso

**Files:**
- Create: `lib/pronunciation/ed-drills/progress.ts`

- [ ] **Step 1: Implementar lecturas/escrituras**

`readClusterProgress(userId)` → `Map<EdCluster, UserEdClusterProgress>`; `recordAttempt(userId, cluster, { correct, suspectedEpenthesis })` → actualiza `attemptsCount`, `accuracy` (media móvil), `epenthesisWarningsCount`, `lastPracticedAt`, y sube `unlockedLevel` a 3 cuando accuracy ≥ 0.80 en niveles 1 y 2 (spec §2, regla de desbloqueo).

- [ ] **Step 2: Type-check + commit**

```bash
pnpm type-check
git add lib/pronunciation/ed-drills/progress.ts
git commit -m "feat(ed-drills): add cluster progress persistence"
```

---

## Task 7: Fase 1 — discriminación perceptiva

**Files:**
- Create: `components/pronunciation/ed-drills/Phase1PerceptionCard.tsx`
- Test: `components/pronunciation/ed-drills/__tests__/Phase1PerceptionCard.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Cubrir el criterio de aceptación §7.2:
- El texto de las opciones **no** es visible antes de que termine el audio o el usuario interactúe (`aria-hidden` / clase de velado — assert sobre el atributo, no sobre el píxel).
- Tras pulsar una opción, ambos textos quedan visibles.
- Elegir la opción de pasado con el ítem en pasado marca acierto.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implementar**

Empieza el archivo con el bloque de sub-componentes planeados (regla de CLAUDE.md). Audio vía `speak()` de `lib/phoneme-practice/tts`. Sin micrófono: esta fase debe funcionar **siempre** (spec §4.3).

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation/ed-drills/Phase1PerceptionCard.tsx components/pronunciation/ed-drills/__tests__/Phase1PerceptionCard.test.tsx
git commit -m "feat(ed-drills): add Phase1PerceptionCard"
```

---

## Task 8: Fase 2 — producción con resilabificación

La tarea con más riesgo de reintroducir bugs ya corregidos. Relee los "Hechos verificados" 1-5 antes de empezar.

**Files:**
- Create: `components/pronunciation/ed-drills/Phase2LinkingCard.tsx`
- Test: `components/pronunciation/ed-drills/__tests__/Phase2LinkingCard.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Cubrir el criterio §7.4 explícitamente:
- Con `isSupported === false`, el componente **renderiza la rama sin puntuación y permite continuar** (no se desmonta, no bloquea).
- Con `status === 'processing'`, se muestra feedback de progreso al usuario.
- Con transcripción `"achieve it"` sobre objetivo `"achieved it"` → fallo.
- Con transcripción `"achieved it"` → acierto.
- Con `suspectedEpenthesis`, se muestra el tip amarillo de articulación y **no** un error rojo.

Mockea `useSpeechRecognition`; no intentes ejercitar el micro en jsdom.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implementar**

Consume `useSpeechRecognition()` tal cual. Deriva `isShadowing = !isSupported || (status === 'error' && errorCode === 'network')` y renderiza la rama sin puntuación con `SCORING_UNAVAILABLE_SHADOW_ES`. Muestra IPA con `font-ipa` y la resilabificación con `font-mono` (ambas existen en `app/styles/utilities.css:198-204`). Sin colores hardcodeados: tokens.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation/ed-drills/Phase2LinkingCard.tsx components/pronunciation/ed-drills/__tests__/Phase2LinkingCard.test.tsx
git commit -m "feat(ed-drills): add Phase2LinkingCard with honest scoring fallback"
```

---

## Task 9: Fase 3, orquestador, pills y ruta

**Files:**
- Create: `components/pronunciation/ed-drills/Phase3LadderCard.tsx`, `EdDrillSession.tsx`, `ClusterProgressPills.tsx`
- Create: `app/(authenticated)/practice/ed-drills/page.tsx`

- [ ] **Step 1: `Phase3LadderCard`** — tres niveles; el Nivel 3 sólo se habilita con `unlockedLevel === 3`. Tolerancia relajada en Nivel 3 (spec §2, tabla).
- [ ] **Step 2: `ClusterProgressPills`** — dominio por cluster, ≤ 60 líneas.
- [ ] **Step 3: `EdDrillSession`** — orquesta las 3 fases; empieza con el bloque de sub-componentes planeados. Si supera 250 líneas, descomponer (regla dura de CLAUDE.md).
- [ ] **Step 4: Ruta** — `page.tsx` sólo compone y enruta; cero lógica de negocio.
- [ ] **Step 5: Verificación completa**

Run: `pnpm type-check && pnpm lint && pnpm test && pnpm audit:hard-rules`
Expected: todo limpio. Ningún archivo nuevo supera 250 líneas.

- [ ] **Step 6: Commit**

```bash
git add components/pronunciation/ed-drills app/\(authenticated\)/practice/ed-drills
git commit -m "feat(ed-drills): add ladder phase, session orchestrator and route"
```

---

## Task 10: integración en el plan diario — ✅ HECHA (2026-09-13)

Decisión de producto: **solo con evidencia real**, sin arranque en frío. El paso es correctivo, no de descubrimiento — un usuario que nunca practicó en `/practice/ed-drills` no tiene evidencia y no lo verá en la diaria. Es deliberado.

**Lo que se hizo:**

- `lib/practice/types.ts` — `ed_cluster_drill` en la unión `DailyStepKind` + campo opcional `edClusterDrill` (cluster, itemId, accuracy) en `DailyStep`.
- `lib/practice/daily-plan/ed-drill-step.ts` (nuevo) — `findEdClusterEvidence()` (pura, testeable sin Dexie) + `buildEdClusterDrillStep()`. Umbrales: accuracy < 0.80 y ≥ 2 intentos.
- `lib/practice/daily-plan/constants.ts` — `ed_cluster_drill` en `PRODUCTION_KINDS`: compite por el único slot de producción.
- `lib/practice/daily-plan/candidate-helpers.ts` — arms de `targetRefsForStep` (ref `ed-cluster:<cluster>`), `reasonForStep` (`'recent_error'`, prioridad 2 → gana a `variety`) y `PEDAGOGICAL_KIND_ORDER` (6, producción).
- `lib/practice/daily-plan/composer.ts` — construye el paso y lo antepone al resto de candidatos.
- `components/pronunciation/ed-drills/EdDrillSession.tsx` — prop opcional `onComplete`; sin ella conserva el comportamiento de la ruta suelta.
- `components/daily/DailyStepSession.tsx` — early return antes del fallthrough a `PracticeSession` (con `exercises: []` se autocompletaría al instante).
- `lib/home/hero-illustration.ts` — `domainSpeaking`.

**Hallazgo — la mitad del trigger de la spec no existe.** La spec §5.3 asume un pipeline que extrae verbos en pasado regular del Journal. **No está construido**: `lib/journal/` tiene corrección, prompts, scaffold y nudge, pero ninguna extracción de verbos. Con "solo evidencia real", la única fuente de trigger operativa es `readClusterProgress`. Construir NLP sobre el Journal es una feature aparte, no un efecto colateral de esta integración.

**Consecuencia a vigilar:** hasta que exista esa extracción, el paso solo se activa tras usar la ruta suelta. Si se quiere descubrimiento, hay que revisar la decisión de "sin arranque en frío".

**Verificación:** `pnpm type-check` limpio · `pnpm lint` limpio · `pnpm audit:hard-rules` (4/4) · 31 tests de daily-plan · 64 tests de componentes.

---

## Criterios de cierre

- [ ] `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm audit:hard-rules` en verde.
- [ ] Ningún archivo nuevo supera 250 líneas.
- [ ] El test de invariante sintáctica (Task 2) pasa y cubre el catálogo completo.
- [ ] Ningún early-return sobre `isSupported` crudo en los componentes nuevos.
- [ ] Abrir la app con una base Dexie v38 previa no lanza `VersionError`.
- [ ] Sin colores, espaciados ni radios hardcodeados; sin `style={{}}` no computado en runtime.
