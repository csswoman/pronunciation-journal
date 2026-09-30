# Plan 054: Honestidad de datos y progreso real en /practice/games (y Word Rain)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** eliminar 4 huecos de honestidad/progreso detectados tras revisar plan 052: Word Rain deja de prometer un guardado que no ocurre, los juegos dejan de reportar `results: []` (0 XP, "Sin ejercicios · actividad registrada"), Phoneme Invaders alimenta de verdad el repaso de contrastes fonéticos cuando fallas un par, el export de pares mínimos lee Supabase en vez de re-validar un JSON estático, y ningún juego queda vacío en silencio si falta su archivo de contenido en el deploy.

**Architecture:** cuatro cambios independientes. (A) un fix de UI + manejo de errores en Word Rain. (B) un log visible en vez de un `catch` silencioso en las páginas que leen JSON con `fs`. (C) reescribir el script de export para que sí consulte `minimal_pairs` vía `@supabase/supabase-js` con la service role key, igual que `scripts/audit-sound-content.ts`. (D) generalizar `recordGameActivity` para construir un `SessionResult` con resultados reales (a partir de los `hits`/`misses` que cada juego ya trackea vía `lib/games/shared/scoring.ts`), sin escribir nada nuevo en `answer_history` — `recordActivitySession` ya no persiste resultados individuales, solo la fila resumen en `activity_sessions`. (E) Phoneme Invaders reutiliza el mismo pipeline de SRS de contrastes que ya usa Sound Lab (`finishAttributedContrastSessions`), así que un fallo en el juego mueve la fecha de repaso igual que un fallo en Sound Lab.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, `@supabase/supabase-js` (script Node, service role key), el pipeline de SRS de contrastes ya existente (`lib/phoneme-practice/finish-session.ts`, `sr.ts`, `mastery-pct.ts`).

---

## Estado y base

- Estado: DONE funcional. Implementación, checks locales, aceptación manual autenticada de A–E y commits enfocados completados. Las pruebas rojas de pre-implementación de D/E no quedaron registradas y sus dos checkboxes históricos permanecen abiertos.
- Prioridad: P1 (honestidad de producto) para A, B, D; P2 para C, E. Esfuerzo total: L (~1–2 días).
- Base: rama `dev`, 2026-09-27, revisión adicional tras el plan 053 (mismo día).
- Depende de: nada bloqueante. Fase D es independiente de plan 053; si 053 ya corrió, Fase B ya no aplica a `memory-match/page.tsx` (ver nota en esa fase).

## Problema y evidencia

1. **Word Rain miente sobre el guardado.** [components/practice/word-rain/WordRainSession.tsx:153](components/practice/word-rain/WordRainSession.tsx#L153): "Conforme las aciertas, se van guardando en tu lista de vocabulario aprendido" — falso, solo se guardan si tocas el botón en la pantalla de resultados. Y en [WordRainResults.tsx:57-63](components/practice/word-rain/WordRainResults.tsx#L57), el `catch` de `handleSaveToBank`/`handleSaveAllToBank` marca la palabra como guardada (`setAddedWords(...true)`) sin distinguir un 409 de duplicado (correcto marcarla) de un fallo de red (incorrecto marcarla).
2. **Los 4 `page.tsx` que leen `fs` fallan en silencio.** `phoneme-invaders`, `weak-form-catcher`, `false-friends-swipe` (y `memory-match` si el plan 053 aún no corrió) devuelven `[]` en el `catch` sin ningún `console.error`. Si el asset no llega al build/deploy, el juego se ve vacío y nadie se entera hasta que un usuario lo reporta.
3. **`scripts/export-minimal-pairs.ts` no exporta nada real.** Solo relee `public/games/phoneme-invaders/pairs.json` y lo re-valida con Zod — nunca toca la tabla `minimal_pairs` de Supabase. El comentario del plan 052 ("exporta minimal_pairs a public/games/...") nunca se cumplió; los 20 pares/6 contrastes actuales son contenido sembrado a mano, no un export real.
4. **`recordGameActivity` siempre envía `results: []`.** Confirmado en [lib/progress/game-activity.ts:13](lib/progress/game-activity.ts#L13). Esto hace que `activity_sessions.exercises_total` sea 0, `accuracy_pct` sea 0, `xp_earned` sea 0 (`sessionXp` sólo suma sobre `result.results`), y el historial muestre "Sin ejercicios · actividad registrada" (`ActivityHistoryCard.tsx:171`) para los 5 juegos nuevos, Word Rain y Word Search.
5. **Un fallo en Phoneme Invaders no alimenta el repaso de contrastes.** El juego nunca llama `updateContrastProgress`/`finishContrastSession`; fallar `ship`/`sheep` 10 veces seguidas no cambia el `mastery_pct` de `/iː/-/ɪ/` ni acerca su próxima revisión en Sound Lab.

## Preflight obligatorio

1. Leer CLAUDE.md y este plan completo. Si plan 053 ya se ejecutó, confirmar con `git log --oneline -5 -- lib/games/memory-match` si `app/(authenticated)/practice/memory-match/page.tsx` ya dejó de leer `fs` (afecta el alcance de Fase B).
2. `git status --short`. Trabajar en `dev`. No commit/push sin instrucción.
3. Baseline: `pnpm vitest run lib/progress/__tests__/game-activity.test.ts components/practice/word-rain lib/games` en verde antes de empezar.
4. Variables de entorno para Fase C: confirmar que `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están disponibles en el entorno local (mismo patrón que `scripts/audit-sound-content.ts`). Si faltan, Fase C se detiene ahí — no se inventa una key.

## Alcance

Permitido:
- `components/practice/word-rain/WordRainSession.tsx`, `components/practice/word-rain/WordRainResults.tsx`
- `app/(authenticated)/practice/phoneme-invaders/page.tsx`, `.../weak-form-catcher/page.tsx`, `.../false-friends-swipe/page.tsx`, `.../memory-match/page.tsx` (solo si aún lee `fs`)
- `scripts/export-minimal-pairs.ts`, `public/games/phoneme-invaders/pairs.json` (regenerado, no editado a mano)
- `lib/progress/game-activity.ts`, `lib/progress/__tests__/game-activity.test.ts`
- Los 5 `hooks/games/use<Juego>Loop.ts` + `components/practice/word-rain/WordRainSession.tsx` + `components/practice/word-search/WordSearchCompletion.tsx` (solo la llamada a `recordGameActivity`)
- `lib/games/phoneme-invaders/engine.ts` (excepción explícita: esta fase SÍ necesita tocar el motor para trackear el contraste de cada acierto, no solo de cada fallo)
- `hooks/games/usePhonemeInvadersLoop.ts` (de nuevo, tras plan 053 si ya corrió)

Fuera de alcance: cualquier otro motor de juego, migraciones Supabase nuevas, nuevas filas en `exercise_types`, cambiar `answer_history`.

---

## Fase A — Word Rain: no prometer un guardado que no ocurre

### Task A1: Corregir el texto y el manejo de errores de guardado

**Files:**
- Modify: `components/practice/word-rain/WordRainSession.tsx`
- Modify: `components/practice/word-rain/WordRainResults.tsx`

- [x] **Step 1: Corregir el texto de la pantalla de inicio**

En `WordRainSession.tsx:153`, cambiar:

```tsx
              Escribe las palabras en inglés antes de que toquen el suelo. Conforme las aciertas, se van guardando en tu lista de vocabulario aprendido.
```

por:

```tsx
              Escribe las palabras en inglés antes de que toquen el suelo. Al terminar, podrás guardar las que acertaste en tu lista de vocabulario.
```

- [x] **Step 2: Distinguir duplicado (409) de fallo real en `handleSaveToBank`**

En `WordRainResults.tsx`, importar `DuplicateWordError` y solo marcar "guardado" en éxito o en duplicado; en cualquier otro error, dejar la palabra sin marcar y guardar el error para poder reintentar:

```tsx
import { quickAddWord, DuplicateWordError } from '@/lib/word-bank/queries'
```

Reemplazar `handleSaveToBank` y `handleSaveAllToBank`:

```tsx
  const [failedWords, setFailedWords] = useState<Record<string, boolean>>({})

  const handleSaveToBank = async (word: string) => {
    if (!user || addedWords[word]) return
    try {
      await quickAddWord({ text: word, source: 'manual' })
      setAddedWords((prev) => ({ ...prev, [word]: true }))
      setFailedWords((prev) => ({ ...prev, [word]: false }))
    } catch (err) {
      if (err instanceof DuplicateWordError) {
        // Already in the word bank — that's a successful outcome, not a failure.
        setAddedWords((prev) => ({ ...prev, [word]: true }))
        return
      }
      console.warn('[WordRainResults] Error adding word to bank:', err)
      setFailedWords((prev) => ({ ...prev, [word]: true }))
    }
  }

  const handleSaveAllToBank = async () => {
    if (!user || isAddingAll) return
    setIsAddingAll(true)
    for (const item of savedWords) {
      if (!addedWords[item.word]) {
        await handleSaveToBank(item.word)
      }
    }
    setIsAddingAll(false)
  }
```

- [x] **Step 3: Mostrar el estado de fallo en la lista de palabras (buscar el `.map` que renderiza `savedWords` en este archivo)**

Añadir, junto al botón "Guardar" existente por palabra, un estado visible cuando `failedWords[item.word]` es `true` — reutilizar el patrón de badges ya presente en el archivo (buscar el bloque `{addedWords[item.word] ? ... : (<button onClick={() => handleSaveToBank(item.word)}>...)}` y añadir una rama `failedWords[item.word] && <span className="text-caption text-danger">No se pudo guardar, toca para reintentar</span>` antes del botón, o como su label cuando ha fallado).

- [x] **Step 4: Ejecutar tests y type-check**

Run: `pnpm vitest run components/practice/word-rain`
Expected: PASS (los tests existentes no dependen del texto exacto ni de `DuplicateWordError`; si alguno sí, ajustar su fixture al nuevo texto/comportamiento, nunca al revés)

Run: `pnpm type-check`
Expected: exit 0

- [x] **Step 5: Commit**

```bash
git add components/practice/word-rain/WordRainSession.tsx components/practice/word-rain/WordRainResults.tsx
git commit -m "fix(word-rain): stop promising autosave, only mark saved on success or duplicate"
```

---

## Fase B — Aviso visible si falta el contenido de un juego en el deploy

### Task B1: Loggear en vez de tragar el error

**Files:**
- Modify: `app/(authenticated)/practice/phoneme-invaders/page.tsx`
- Modify: `app/(authenticated)/practice/weak-form-catcher/page.tsx`
- Modify: `app/(authenticated)/practice/false-friends-swipe/page.tsx`
- Modify (solo si plan 053 fase D aún no corrió): `app/(authenticated)/practice/memory-match/page.tsx`

- [x] **Step 1: Mismo patrón en los 3–4 archivos — ejemplo completo para Phoneme Invaders**

```tsx
// app/(authenticated)/practice/phoneme-invaders/page.tsx
import { readFileSync } from 'fs'
import { resolve } from 'path'
import PageLayout from '@/components/layout/PageLayout'
import PhonemeInvadersSession from '@/components/practice/phoneme-invaders/PhonemeInvadersSession'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'

export const metadata = {
  title: 'Phoneme Invaders | English Journal',
  description: 'Juego arcade de discriminación auditiva y fonemas en inglés',
}

function loadPairsData(): MinimalPairItem[] {
  const filePath = resolve(process.cwd(), 'public/games/phoneme-invaders/pairs.json')
  try {
    const fileData = readFileSync(filePath, 'utf-8')
    return JSON.parse(fileData)
  } catch (err) {
    // A missing/corrupt content file at deploy time must be loud, not a
    // silently empty game — this is the only signal an operator gets.
    console.error(`[PhonemeInvadersPage] Failed to load ${filePath}:`, err)
    return []
  }
}

export default function PhonemeInvadersPage() {
  const pairs = loadPairsData()

  return (
    <PageLayout archetype="catalog">
      <PhonemeInvadersSession pairs={pairs} />
    </PageLayout>
  )
}
```

Aplicar el mismo cambio (envolver el `JSON.parse`/`readFileSync` en `try/catch` con `console.error` describiendo el archivo y el juego) en `weak-form-catcher/page.tsx` y `false-friends-swipe/page.tsx` (este último ya itera varios archivos — loggear cuál falló, no silenciar todo el directorio). Aplicar en `memory-match/page.tsx` solo si ese archivo sigue existiendo con esta forma (si plan 053 fase D ya corrió, esta página ya no lee `fs` y esta tarea no aplica a Memory Match).

- [x] **Step 2: Verificar manualmente que el log aparece**

Run: renombrar temporalmente `public/games/phoneme-invaders/pairs.json` a `pairs.json.bak`, ejecutar `pnpm dev`, abrir `/practice/phoneme-invaders`, confirmar el `console.error` en la terminal del servidor, y restaurar el nombre del archivo.

- [x] **Step 3: Type-check y lint**

Run: `pnpm type-check && pnpm lint`
Expected: exit 0

- [x] **Step 4: Commit**

```bash
git add "app/(authenticated)/practice/phoneme-invaders/page.tsx" "app/(authenticated)/practice/weak-form-catcher/page.tsx" "app/(authenticated)/practice/false-friends-swipe/page.tsx"
git commit -m "fix(games): log instead of silently returning [] when game content is missing"
```

---

## Fase C — Export real de `minimal_pairs` desde Supabase

### Task C1: Reescribir el script para leer la tabla de verdad

**Files:**
- Modify: `scripts/export-minimal-pairs.ts`

- [x] **Step 1: Reescribir el script**

```ts
// scripts/export-minimal-pairs.ts
/**
 * Exports the `minimal_pairs` Supabase table to
 * public/games/phoneme-invaders/pairs.json for Phoneme Invaders (offline,
 * no Supabase call during play). Re-run whenever minimal_pairs changes —
 * this is a snapshot, not a live query.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/export-minimal-pairs.ts
 *
 * Every row is validated by minimalPairsDataSchema BEFORE anything is
 * written — a malformed row aborts the export instead of shipping bad IPA.
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { canonicalizeSoundIpa } from '../lib/sounds/inventory'
import { contrastKey } from '../lib/phoneme-practice/phoneme-similarity'
import { minimalPairsDataSchema, type MinimalPairItem } from '../lib/games/phoneme-invaders/schema'

interface MinimalPairRow {
  id: number
  word_a: string
  word_b: string
  ipa_a: string | null
  ipa_b: string | null
  contrast_ipa_a: string | null
  contrast_ipa_b: string | null
}

async function fetchAllMinimalPairs(): Promise<MinimalPairRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key)
  const rows: MinimalPairRow[] = []
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('minimal_pairs')
      .select('id, word_a, word_b, ipa_a, ipa_b, contrast_ipa_a, contrast_ipa_b')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed to read minimal_pairs: ${error.message}`)
    const page = (data ?? []) as MinimalPairRow[]
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

/** Rows without both contrast IPAs can't drive the game's "which contrast is
 * this" grouping — skip them rather than emit a pair with an empty contrast. */
function toGameItem(row: MinimalPairRow): MinimalPairItem | null {
  if (!row.ipa_a || !row.ipa_b || !row.contrast_ipa_a || !row.contrast_ipa_b) return null
  const contrast = contrastKey(
    canonicalizeSoundIpa(row.contrast_ipa_a),
    canonicalizeSoundIpa(row.contrast_ipa_b),
  )
  return {
    id: `pair-${row.id}`,
    wordA: row.word_a,
    wordB: row.word_b,
    ipaA: row.ipa_a,
    ipaB: row.ipa_b,
    contrast,
  }
}

async function exportMinimalPairs() {
  const targetPath = resolve(process.cwd(), 'public/games/phoneme-invaders/pairs.json')
  const rows = await fetchAllMinimalPairs()
  const candidates = rows.map(toGameItem).filter((item): item is MinimalPairItem => item !== null)

  const validated = minimalPairsDataSchema.parse(candidates)
  if (validated.length === 0) {
    throw new Error('No valid minimal pairs found — aborting without touching pairs.json')
  }

  writeFileSync(targetPath, JSON.stringify(validated, null, 2), 'utf-8')
  const contrastCount = new Set(validated.map((p) => p.contrast)).size
  console.log(`Exported ${validated.length} minimal pairs across ${contrastCount} contrasts to ${targetPath}`)
}

exportMinimalPairs().catch((err) => {
  console.error('Failed to export minimal pairs:', err)
  process.exit(1)
})
```

- [x] **Step 2: Ejecutar el export contra el proyecto local/remoto (requiere las env vars del preflight)**

Run: `NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY npx tsx scripts/export-minimal-pairs.ts`
Expected: `Exported N minimal pairs across M contrasts to .../pairs.json` con N y M mayores que los 20/6 actuales — si la tabla remota tiene menos pares que el JSON sembrado a mano, **no sobrescribir**: detenerse y decidir con el usuario si el JSON a mano se conserva como contenido curado en vez de reemplazarlo por un export más pobre.

- [x] **Step 3: Ejecutar la suite de Phoneme Invaders contra el JSON regenerado**

Run: `pnpm vitest run lib/games/phoneme-invaders`
Expected: PASS — el schema no cambió, solo el contenido.

- [x] **Step 4: Commit (JSON y script juntos, para que el diff se pueda auditar)**

```bash
git add scripts/export-minimal-pairs.ts public/games/phoneme-invaders/pairs.json
git commit -m "fix(phoneme-invaders): export-minimal-pairs.ts now reads Supabase for real"
```

---

## Fase D — Los juegos reportan resultados reales (no `results: []`)

### Task D1: Generalizar `recordGameActivity` con un `outcome` real, opcional para no romper compatibilidad

**Files:**
- Modify: `lib/progress/game-activity.ts`
- Modify: `lib/progress/__tests__/game-activity.test.ts`

- [x] **Step 1: Escribir el test que falla**

```ts
// lib/progress/__tests__/game-activity.test.ts
import { describe, expect, it, vi } from 'vitest'
import { recordGameActivity } from '../game-activity'
import { recordActivitySession } from '../activity-hub'

vi.mock('../activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue({ reconciledStepIds: [] }),
}))

describe('recordGameActivity', () => {
  it('still sends an empty session when no outcome is given (backward compatible)', async () => {
    await recordGameActivity('user-1', 'games', 1250, 'games')

    expect(recordActivitySession).toHaveBeenLastCalledWith('user-1', expect.objectContaining({
      sessionResult: expect.objectContaining({ results: [], totalTimeMs: 1250 }),
    }))
  })

  it('builds real ExerciseResult rows from hits/misses when an outcome is given', async () => {
    await recordGameActivity('user-1', 'phoneme_invaders', 4000, 'phoneme-invaders', ['listening'], {
      hits: 7,
      misses: 3,
      slug: 'minimal_pair',
    })

    const call = vi.mocked(recordActivitySession).mock.calls.at(-1)!
    const input = call[1] as { sessionResult: { results: unknown[]; accuracy: number; totalTimeMs: number } }
    expect(input.sessionResult.results).toHaveLength(10)
    expect(input.sessionResult.results.filter((r: any) => r.isCorrect)).toHaveLength(7)
    expect(input.sessionResult.accuracy).toBeCloseTo(70)
    expect(input.sessionResult.totalTimeMs).toBe(4000)
  })

  it('reports 0% accuracy (not NaN) when hits and misses are both 0', async () => {
    await recordGameActivity('user-1', 'memory_match', 1000, 'memory-match', ['vocabulary'], {
      hits: 0,
      misses: 0,
      slug: 'match_pairs',
    })

    const call = vi.mocked(recordActivitySession).mock.calls.at(-1)!
    const input = call[1] as { sessionResult: { accuracy: number } }
    expect(input.sessionResult.accuracy).toBe(0)
  })
})
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `pnpm vitest run lib/progress/__tests__/game-activity.test.ts`
Expected: FAIL — el segundo y tercer test esperan `results` con longitud >0, hoy siempre es `[]`.

- [x] **Step 3: Implementar**

```ts
// lib/progress/game-activity.ts
import { recordActivitySession } from '@/lib/progress/activity-hub'
import type { GameActivitySource, SkillTag } from '@/lib/progress/activity-types'
import type { ExerciseResult, ExerciseSlug, SessionResult } from '@/lib/practice/types'

export interface GameOutcome {
  hits: number
  misses: number
  /** Semantic label only — games never write to answer_history/exercise_types,
   * so this doesn't need a real exercise_type_id. */
  slug: ExerciseSlug
}

function buildGameSessionResult(
  totalTimeMs: number,
  gameId: string,
  outcome?: GameOutcome,
): SessionResult {
  if (!outcome) {
    return {
      results: [],
      accuracy: 0,
      totalTimeMs: Math.max(0, Math.round(totalTimeMs)),
      bySlug: {} as SessionResult['bySlug'],
    }
  }

  const total = outcome.hits + outcome.misses
  const perResultMs = total > 0 ? Math.round(totalTimeMs / total) : 0
  const results: ExerciseResult[] = []

  for (let i = 0; i < outcome.hits; i++) {
    results.push({
      exerciseId: `${gameId}-${i}`,
      slug: outcome.slug,
      // Games never persist to answer_history — there is no exercise_types
      // FK to point at, unlike a real drill using this same slug.
      exerciseTypeId: null,
      isCorrect: true,
      timeMs: perResultMs,
      contentId: `${gameId}-${i}`,
      completedAt: new Date(),
    })
  }
  for (let i = 0; i < outcome.misses; i++) {
    results.push({
      exerciseId: `${gameId}-miss-${i}`,
      slug: outcome.slug,
      exerciseTypeId: null,
      isCorrect: false,
      timeMs: perResultMs,
      contentId: `${gameId}-miss-${i}`,
      completedAt: new Date(),
    })
  }

  return {
    results,
    accuracy: total > 0 ? (outcome.hits / total) * 100 : 0,
    totalTimeMs: Math.max(0, Math.round(totalTimeMs)),
    bySlug: {} as SessionResult['bySlug'],
  }
}

export async function recordGameActivity(
  userId: string,
  source: GameActivitySource,
  totalTimeMs: number,
  gameId: string,
  skillTags: SkillTag[] = ['vocabulary'],
  outcome?: GameOutcome,
): Promise<void> {
  await recordActivitySession(userId, {
    practiceContext: 'practice',
    source,
    allowEmptySession: true,
    explicitSkillTags: skillTags,
    sessionResult: buildGameSessionResult(totalTimeMs, gameId, outcome),
    metadata: { gameId },
  })
}
```

- [x] **Step 4: Ejecutar y confirmar que pasa**

Run: `pnpm vitest run lib/progress/__tests__/game-activity.test.ts`
Expected: PASS (3 tests)

- [x] **Step 5: Commit**

```bash
git add lib/progress/game-activity.ts lib/progress/__tests__/game-activity.test.ts
git commit -m "feat(progress): recordGameActivity can report real hits/misses instead of results: []"
```

### Task D2: Conectar los 7 llamadores con sus hits/misses reales

**Files:**
- Modify: `hooks/games/usePhonemeInvadersLoop.ts`, `hooks/games/useWeakFormCatcherLoop.ts`, `hooks/games/useChunkDuelLoop.ts`, `hooks/games/useFalseFriendsSwipeLoop.ts`, `hooks/games/useMemoryMatchLoop.ts`
- Modify: `components/practice/word-rain/WordRainSession.tsx`, `components/practice/word-search/WordSearchCompletion.tsx`

- [x] **Step 1: Phoneme Invaders** — en `usePhonemeInvadersLoop.ts`, dentro del `useEffect` que llama `recordGameActivity`:

```ts
      void recordGameActivity(userId, 'phoneme_invaders', elapsed, 'phoneme-invaders', [
        'listening',
        'pronunciation',
      ], { hits: state.hits, misses: state.misses, slug: 'minimal_pair' })
```

- [x] **Step 2: Weak Form Catcher** — en `useWeakFormCatcherLoop.ts`:

```ts
      void recordGameActivity(userId, 'weak_form_catcher', elapsed, 'weak-form-catcher', [
        'listening',
      ], { hits: state.hits, misses: state.misses, slug: 'dictation' })
```

- [x] **Step 3: Chunk Duel** — en `useChunkDuelLoop.ts`:

```ts
      void recordGameActivity(userId, 'chunk_duel', elapsed, 'chunk-duel', [
        'grammar',
        'vocabulary',
      ], { hits: state.hits, misses: state.misses, slug: 'reorder_words' })
```

- [x] **Step 4: Falsos Amigos** — en `useFalseFriendsSwipeLoop.ts`:

```ts
      void recordGameActivity(
        userId,
        'false_friends_swipe',
        elapsed,
        'false-friends-swipe',
        ['vocabulary'],
        { hits: state.hits, misses: state.misses, slug: 'multiple_choice' },
      )
```

- [x] **Step 5: Memory Match** — en `useMemoryMatchLoop.ts`:

```ts
      void recordGameActivity(userId, 'memory_match', elapsed, 'memory-match', [
        'vocabulary',
      ], { hits: state.hits, misses: state.misses, slug: 'match_pairs' })
```

- [x] **Step 6: Word Rain** — en `WordRainSession.tsx`, dentro de `recordFinishedGame` (usar los contadores ya presentes en el componente: `savedWords.length` como aciertos, `missedCount` como fallos):

```tsx
  const recordFinishedGame = useCallback((gameId: string) => {
    if (!user?.id || hasRecordedActivityRef.current) return
    hasRecordedActivityRef.current = true
    const startedAt = gameStartedAtRef.current ?? Date.now()
    void recordGameActivity(
      user.id,
      'word_rain',
      Date.now() - startedAt,
      gameId,
      undefined,
      { hits: savedWords.length, misses: missedCount, slug: 'dictation' },
    ).catch((err) => console.warn('[WordRainSession] activity record failed', err))
  }, [user?.id, savedWords.length, missedCount])
```

- [x] **Step 7: Word Search** — en `WordSearchCompletion.tsx`. Esta pantalla solo se muestra al completar el tablero (todas las palabras encontradas), así que el resultado siempre es 100%:

```tsx
    void recordGameActivity(
      user.id,
      'word_search',
      elapsedSeconds * 1000,
      puzzle.id,
      undefined,
      { hits: puzzle.items.length, misses: 0, slug: 'match_pairs' },
    ).catch((err) => console.warn('[WordSearchCompletion] activity record failed', err))
```

- [x] **Step 8: Ejecutar toda la suite de juegos + type-check**

Run: `pnpm vitest run hooks/games lib/games components/practice/word-rain components/practice/word-search lib/progress/__tests__/game-activity.test.ts`
Expected: PASS — no hay tests de hooks directos (no existe carpeta `hooks/games/__tests__`); esto confirma que nada de motor/schema se rompió y que los tests de componentes existentes (que sí mockean `recordGameActivity`) siguen pasando.

Run: `pnpm type-check`
Expected: exit 0

- [x] **Step 9: Commit**

```bash
git add hooks/games components/practice/word-rain/WordRainSession.tsx components/practice/word-search/WordSearchCompletion.tsx
git commit -m "feat(games): report real hits/misses to activity_sessions instead of results: []"
```

---

## Fase E — Phoneme Invaders alimenta el repaso real de contrastes

**Depende de:** Fase D (usa el mismo `state.hits`/`misses`, y esta fase añade una segunda llamada además de `recordGameActivity`).

**Excepción de alcance:** esta fase sí modifica `lib/games/phoneme-invaders/engine.ts` — necesario para trackear el contraste de cada acierto, no solo de cada fallo (`missHistory` ya existe; falta el equivalente para aciertos).

### Task E1: Trackear también los aciertos por contraste en el motor

**Files:**
- Modify: `lib/games/phoneme-invaders/engine.ts`
- Test: `lib/games/phoneme-invaders/__tests__/engine.test.ts` (extender el archivo existente)

- [x] **Step 1: Añadir el test al `describe` existente**

```ts
  it('tracks a hit history entry with the shot pair\'s contrast', () => {
    let state = createInitialInvadersState()
    const pair: MinimalPairItem = { id: 'p1', wordA: 'ship', wordB: 'sheep', ipaA: '/ʃɪp/', ipaB: '/ʃiːp/', contrast: 'iː|ɪ' }
    state = invadersReducer(state, { type: 'spawn', pair, targetSide: 'a', lanes: 2 })
    const targetShipId = state.target!.shipId
    state = invadersReducer(state, { type: 'shoot', shipId: targetShipId })
    expect(state.hitHistory).toEqual([{ contrast: 'iː|ɪ' }])
  })
```

(Ajustar el import de `MinimalPairItem` al ya usado por el archivo de test existente.)

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `pnpm vitest run lib/games/phoneme-invaders/__tests__/engine.test.ts`
Expected: FAIL — `state.hitHistory` es `undefined`.

- [x] **Step 3: Añadir `hitHistory` al estado y al caso `'shoot'` de acierto**

En `InvadersState`, junto a `missHistory: MissRecord[]`:

```ts
  hitHistory: Array<{ contrast: string }>
```

En `createInitialInvadersState()`:

```ts
    hitHistory: [],
```

En el `case 'shoot'`, rama de acierto (`if (shotShip.isTarget)`), añadir `hitHistory` al objeto devuelto:

```ts
      if (shotShip.isTarget) {
        const hitState = applyHit(state, 100)
        const newHits = hitState.hits
        const nextWave = Math.floor(newHits / 10) + 1
        const nextLanes = Math.min(4, 2 + Math.floor((nextWave - 1) / 2))

        return {
          ...hitState,
          ships: [],
          target: null,
          targetPair: null,
          wave: nextWave,
          laneCount: nextLanes,
          hitHistory: [...state.hitHistory, { contrast: state.targetPair?.contrast ?? '' }],
        }
      }
```

- [x] **Step 4: Ejecutar y confirmar que pasa**

Run: `pnpm vitest run lib/games/phoneme-invaders/__tests__/engine.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add lib/games/phoneme-invaders/engine.ts lib/games/phoneme-invaders/__tests__/engine.test.ts
git commit -m "feat(phoneme-invaders): track hit history by contrast, mirroring missHistory"
```

### Task E2: Alimentar `finishAttributedContrastSessions` al terminar la partida

**Files:**
- Modify: `hooks/games/usePhonemeInvadersLoop.ts`

- [x] **Step 1: Construir un `SessionResult` real a partir de `hitHistory`/`missHistory` y llamarlo junto a `recordGameActivity`**

Reemplazar el `useEffect` de registro de actividad (el que llama `recordGameActivity` al terminar la partida) por:

```ts
  useEffect(() => {
    if (state.status === 'game_over' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current

      void recordGameActivity(userId, 'phoneme_invaders', elapsed, 'phoneme-invaders', [
        'listening',
        'pronunciation',
      ], { hits: state.hits, misses: state.misses, slug: 'minimal_pair' })

      // Feed the same contrast SRS pipeline Sound Lab uses, so a miss here
      // moves the contrast's next review date exactly like a Sound Lab miss.
      const perResultMs = state.hits + state.misses > 0
        ? Math.round(elapsed / (state.hits + state.misses))
        : 0
      const sessionResult: SessionResult = {
        results: [
          ...state.hitHistory.map((h, i): ExerciseResult => ({
            exerciseId: `phoneme-invaders-hit-${i}`,
            slug: 'minimal_pair',
            exerciseTypeId: null,
            isCorrect: true,
            timeMs: perResultMs,
            contentId: `phoneme-invaders-hit-${i}`,
            exercisePayload: { contrastId: h.contrast },
            completedAt: new Date(),
          })),
          ...state.missHistory.map((m, i): ExerciseResult => ({
            exerciseId: `phoneme-invaders-miss-${i}`,
            slug: 'minimal_pair',
            exerciseTypeId: null,
            isCorrect: false,
            timeMs: perResultMs,
            contentId: `phoneme-invaders-miss-${i}`,
            exercisePayload: { contrastId: m.contrast },
            completedAt: new Date(),
          })),
        ],
        accuracy: state.hits + state.misses > 0 ? (state.hits / (state.hits + state.misses)) * 100 : 0,
        totalTimeMs: elapsed,
        bySlug: {} as SessionResult['bySlug'],
      }
      void finishAttributedContrastSessions(userId, sessionResult).catch((err) => {
        console.warn('[PhonemeInvaders] contrast SRS update failed', err)
      })
    }
  }, [state.status, state.hits, state.misses, state.hitHistory, state.missHistory, userId, isGuest])
```

Añadir los imports necesarios al principio del archivo:

```ts
import { finishAttributedContrastSessions } from '@/lib/phoneme-practice/finish-session'
import type { ExerciseResult, SessionResult } from '@/lib/practice/types'
```

- [x] **Step 2: Ejecutar tests y type-check**

Run: `pnpm vitest run lib/games/phoneme-invaders`
Expected: PASS — sin tests de hook directos, pero confirma que el motor/schema siguen intactos.

Run: `pnpm type-check`
Expected: exit 0 — si `exercisePayload` no acepta `{ contrastId: string }` en el tipo `PracticeAnswer`, revisar `lib/practice/types.ts` para el nombre de campo real (`contrastIdFromResult` en `finish-session.ts:65` ya lo lee de `result.exercisePayload as { contrastId?: string }`, así que el campo existe pero puede no estar tipado en `PracticeAnswer` — en ese caso usar el mismo patrón de cast que el resto del archivo, con el comentario que exige CLAUDE.md).

- [x] **Step 3: Verificación manual (offline no aplica aquí — esto sí requiere red al terminar la partida, igual que Sound Lab)** — dos partidas autenticadas, seis fallos atribuidos a `/iː/|/ɪ/`; dos RPC 204 y SRS actualizado.

Jugar una partida completa de Phoneme Invaders fallando deliberadamente el mismo contraste 5 veces, luego abrir Sound Lab / la vista de progreso de sonidos y confirmar que ese contraste bajó de `mastery_pct` o adelantó su próxima revisión.

- [x] **Step 4: Commit**

```bash
git add hooks/games/usePhonemeInvadersLoop.ts
git commit -m "feat(phoneme-invaders): feed hits/misses into the real contrast SRS pipeline"
```

---

## Verificación final (todas las fases)

- [x] `pnpm vitest run lib/progress lib/games hooks/games components/practice/word-rain components/practice/word-search components/practice/phoneme-invaders` → exit 0 (32 archivos, 188 tests)
- [x] `pnpm type-check && pnpm lint` → exit 0
- [x] Navegador autenticado: copy de Word Rain correcto; Fase B registra el asset ausente; los siete juegos muestran sesiones con resultados en `/progress`; Phoneme Invaders actualiza el repaso del contraste fallado.
- [x] `git grep -n "results: \[\]" lib/progress/game-activity.ts` → solo aparece dentro de la rama `if (!outcome)`.

### Evidencia de ejecución (2026-09-27)

- Fase A: copy y manejo de errores de guardado implementados; los errores reales quedan visibles y reintentables. En Chromium autenticado, una partida terminó con una palabra recolectada; aborté el POST local a `/api/words`, apareció «No se pudo guardar; toca para reintentar» y el guardado no llegó al servidor.
- Fase B: las cuatro páginas ahora registran el archivo y el error al fallar la carga. Prueba manual: moví temporalmente `public/games/weak-forms/phrases-001.json`, abrí Weak Form Catcher y Next registró `[WeakFormCatcherPage] Failed to load ... ENOENT`; restauré el archivo y verifiqué su existencia.
- Fase C: export remoto ejecutado con `.env.local` sin imprimir secretos; `pairs.json` quedó con 121 pares y 41 contrastes. La suite de Phoneme Invaders pasa.
- Fase D: `recordGameActivity` conserva el modo compatible sin `outcome` y construye resultados con aciertos/fallos cuando se proporciona; los siete llamadores quedaron conectados. La consulta autenticada de `activity_sessions` devolvió Word Search 6/100 %, False Friends 20/35 %, Memory Match 19/32 %, Word Rain 4/25 %, Chunk Duel 10/0 %, Weak Form Catcher 3/0 % y Phoneme Invaders dos sesiones de 3/0 %. `/progress` mostró también Weak Form Catcher al recargar. Las filas antiguas vacías de Memory Match, Phoneme Invaders y Word Search siguen intactas; no se hizo backfill.
- Fase E: fallé seis veces el mismo contraste `/iː/|/ɪ/` en dos partidas (el juego limita cada partida a tres escudos). El progreso pasó de 9 a 15 intentos, de 25 % a 0 % de dominio y próxima revisión del 20 de julio de 2026 al 29 de septiembre de 2026; ambas llamadas `apply_contrast_session_result` respondieron HTTP 204.
- `pnpm type-check && pnpm lint`: exit 0. `git diff --check`: exit 0 (Git mostró advertencias de conversión LF/CRLF y de lectura del ignore global).
- La conexión interactiva se completó con Chromium 153 en perfil temporal y `agent-browser --cdp`; Next/Turbopack no reportó incidencias de compilación y la consola quedó sin errores de React tras el arreglo.
- La partida de Word Rain reveló que el bucle de física actualizaba estado del padre dentro de un actualizador de estado del hijo. El bucle ahora calcula fuera del actualizador y procesa cada palabra perdida una vez; repetí una partida en Chromium sin la advertencia de React.
- La aceptación autenticada se hizo en perfil Chromium temporal; no se guardaron las credenciales en archivos. El POST de Word Rain se bloqueó localmente antes de persistir la palabra.
- No quedaron registradas las ejecuciones rojas previas a implementación de D/E; esos dos pasos históricos permanecen abiertos. Las verificaciones finales están arriba.
- Commits de código en dev: d7775137 (Word Rain A + runtime y registro D de Word Rain), 8bba6671 (B, logs de assets), d2b4e34e (C, export Supabase y JSON), 8dee088a (D, helper, tests y llamadores compartidos; Steps 5 y 9 agrupados), eb7815c6 (E, hitHistory y SRS de contrastes).

## Riesgos y matices

- Fase C puede descubrir que la tabla remota `minimal_pairs` tiene MENOS pares que el JSON sembrado a mano — en ese caso no hacer downgrade de contenido; conservar el JSON actual y reportarlo como hallazgo, no como fallo del script.
- Fase E asume que `exercisePayload.contrastId` sigue siendo el contrato leído por `contrastIdFromResult` (`lib/phoneme-practice/finish-session.ts:65`). Si ese contrato cambia, esta fase debe releerse contra el código real antes de escribir el hook.
- `recordActivitySession` no escribe filas individuales en `answer_history` — se confirmó leyendo `lib/progress/activity-hub.ts` completo antes de diseñar Fase D. Si esa función cambia para empezar a persistir `telemetry.answers`, Fase D debe revisarse (los `exerciseTypeId: null` dejarían de ser inertes).
- No añadir compensación retroactiva (XP faltante de partidas ya jugadas con `results: []`) — fuera de alcance, requeriría decidir una política de backfill.

## Cierre

Estados por fase: TODO / IN PROGRESS / DONE / BLOCKED con evidencia (salida de tests + verificación manual). Actualizar `plans/README.md` con una fila para el plan 054 al terminar.
