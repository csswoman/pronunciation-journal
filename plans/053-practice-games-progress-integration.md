# Plan 053: Phoneme Invaders adaptativo, más contenido de Weak Forms, niveles en Falsos Amigos, y Memory Match por nivel + pronunciación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cerrar 4 huecos de contenido/adaptatividad detectados en la revisión de plan 052: Phoneme Invaders debe priorizar los contrastes fonéticos débiles del usuario, Weak Form Catcher necesita un validador de contenido y más frases, Falsos Amigos debe filtrar por nivel CEFR, y Memory Match debe cargar vocabulario aleatorio según nivel y pronunciar la palabra al completar cada pareja.

**Architecture:** cada juego recibe una función pura y testeable nueva (selección ponderada, validador de contenido, o loader de palabras) que se integra en su hook `use<Juego>Loop.ts` existente sin tocar el motor (`engine.ts`) de ningún juego. Ningún cambio agrega llamadas a Gemini; Memory Match y Falsos Amigos empiezan a leer `essential-words`/`false-friends` con el mismo patrón cliente-cacheable que ya usa Word Rain (`lib/exercises/word-rain/word-loader.ts`), así que siguen funcionando offline tras la primera carga.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Supabase (lectura de `user_contrast_progress` vía `getAllContrastProgress`, ya existente), Dexie (caché offline ya existente), Web Speech API (`speak()`).

---

## Estado y base

- Estado: TODO. Cuatro fases independientes (A–D), cada una es una entrega propia.
- Prioridad: P2. Esfuerzo total: M (~2–3 días de una persona). Riesgo: bajo.
- Base inspeccionada: rama `dev`, 2026-09-27, revisión post-plan-052 (memoria `practice-games-expansion-plan`).
- Dependencias: plan 052 (DONE, sin commit). No bloquea ni es bloqueado por otros planes activos.
- Fuente: sesión 2026-09-27 — el usuario pidió específicamente estos 4 puntos tras la revisión de plan 052.

## Problema y evidencia

1. **Phoneme Invaders no usa el progreso de contrastes.** `hooks/games/usePhonemeInvadersLoop.ts:35` elige el siguiente par con `pairs[Math.floor(Math.random() * pairs.length)]` — mezcla uniforme, ignorando `getAllContrastProgress` (`lib/phoneme-practice/contrast-queries.ts:51`), que ya existe y ya se usa en Sound Lab. El plan 052 (fase 1) pedía explícitamente priorizar los 3 contrastes más débiles del usuario.
2. **Weak Form Catcher no tiene el validador de contenido** que el plan 052 pedía ("cada palabra reducida debe estar en `WEAK_FORM_WHITELIST` o en una lista cerrada de reducciones coloquiales") y solo tiene 20 frases (`public/games/weak-forms/phrases-001.json`) de las ~60 planeadas.
3. **Falsos Amigos no filtra por nivel.** El banco (`lib/false-friends/types.ts:60`) ya tiene `cefr_level` y `lib/false-friends/data.ts:48` ya expone `filterByLevel`, pero `app/(authenticated)/practice/false-friends-swipe/page.tsx` carga las 100 entradas sin filtrar y `useFalseFriendsSwipeLoop.ts:24` las pasa todas a `buildSwipeDeck`.
4. **Memory Match usa las mismas 50 palabras fijas para todos.** `app/(authenticated)/practice/memory-match/page.tsx:12-38` lee siempre las primeras 50 entradas de `public/essential-words/words-001.json`, sin nivel ni aleatoriedad real entre partidas. Además, `speak()` solo se dispara al voltear una carta (`hooks/games/useMemoryMatchLoop.ts:58`), no específicamente al completar una pareja — la confirmación de pronunciación en el momento de "descubrir" la palabra no está garantizada en todos los modos.

Resultado esperado: los 4 juegos siguen offline y sin Gemini; cada uno usa datos reales de progreso/nivel del usuario en vez de contenido estático o aleatorio uniforme.

## Preflight obligatorio

1. Leer CLAUDE.md, este plan completo, y `plans/052-practice-games-expansion.md` (contexto de los 5 juegos).
2. `git status --short` — confirmar que los archivos de plan 052 (juegos, hooks, componentes) siguen sin commit y no hay drift inesperado.
3. Baseline: `pnpm vitest run lib/games components/practice/games components/practice/hub lib/progress/__tests__/game-activity.test.ts` en verde antes de empezar.
4. Trabajar en `dev`. No commit, push ni despliegue sin instrucción.
5. Cada fase (A–D) es independiente; se pueden ejecutar en cualquier orden o en paralelo por distintos ejecutores, ya que tocan archivos disjuntos.

## Alcance

Permitido:
- `hooks/games/usePhonemeInvadersLoop.ts`, `hooks/games/useFalseFriendsSwipeLoop.ts`, `hooks/games/useMemoryMatchLoop.ts`
- Nuevos: `lib/games/phoneme-invaders/priority.ts`, `lib/games/weak-form-catcher/reduction-words.ts`, `lib/games/memory-match/word-loader.ts`
- `public/games/weak-forms/phrases-001.json` (solo añadir frases, no borrar las 20 existentes)
- `components/practice/memory-match/MemorySetup.tsx`, `components/practice/memory-match/MemoryMatchSession.tsx`
- `components/practice/false-friends-swipe/FalseFriendsSwipeSession.tsx`, nuevo `components/practice/false-friends-swipe/SwipeLevelSelector.tsx`
- `app/(authenticated)/practice/memory-match/page.tsx`
- `components/practice/games/shared/GameIntroPanel.tsx` (solo para añadir un prop opcional `isLoading`, no cambia comportamiento existente)
- Tests junto al código en `__tests__/`.

Fuera de alcance: cambiar el motor (`engine.ts`) de cualquier juego, tocar `lib/games/chunk-duel/*`, migraciones Supabase nuevas, llamadas a Gemini, el registro en el hub (`practice-games.ts`), el botón "Estudiar en Chunks" de Chunk Duel (huella separada, no pedida en esta sesión).

## Reglas comunes (heredadas de plan 052)

Motor puro sin React; hooks orquestan; sin `fetch` a Supabase durante la partida salvo la lectura de progreso al inicio (Phoneme Invaders, que ya es el patrón existente en Sound Lab); tokens de diseño; ningún archivo nuevo >250 líneas; cada juego sigue registrando actividad con `recordGameActivity` sin cambios.

---

## Fase A — Phoneme Invaders: priorizar contrastes débiles

**Qué resuelve:** punto 1. El jugador entrena más los sonidos que peor domina en vez de una mezcla uniforme.

### Task A1: Selector puro de contrastes débiles y pares ponderados

**Files:**
- Create: `lib/games/phoneme-invaders/priority.ts`
- Test: `lib/games/phoneme-invaders/__tests__/priority.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/games/phoneme-invaders/__tests__/priority.test.ts
import { describe, expect, it } from 'vitest'
import { selectWeakestContrasts, pickWeightedPair } from '../priority'
import type { MinimalPairItem } from '../schema'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

function progress(contrastId: string, masteryPct: number): UserContrastProgress {
  return {
    id: contrastId,
    user_id: 'u1',
    contrast_id: contrastId,
    ease_factor: 2.5,
    interval_days: 1,
    next_review: null,
    last_seen: null,
    total_attempts: 5,
    correct_answers: 3,
    streak: 0,
    mastery_pct: masteryPct,
  }
}

const pairs: MinimalPairItem[] = [
  { id: 'p1', wordA: 'ship', wordB: 'sheep', ipaA: '/ʃɪp/', ipaB: '/ʃiːp/', contrast: 'iː|ɪ' },
  { id: 'p2', wordA: 'cat', wordB: 'cut', ipaA: '/kæt/', ipaB: '/kʌt/', contrast: 'æ|ʌ' },
  { id: 'p3', wordA: 'berry', wordB: 'very', ipaA: '/beri/', ipaB: '/veri/', contrast: 'b|v' },
]

describe('selectWeakestContrasts', () => {
  it('ranks contrasts ascending by mastery_pct', () => {
    const rows = [progress('iː|ɪ', 80), progress('æ|ʌ', 20), progress('b|v', 50)]
    const weakest = selectWeakestContrasts(pairs, rows, 2)
    expect(weakest).toEqual(['æ|ʌ', 'b|v'])
  })

  it('treats a contrast with no progress row as weakest (mastery 0)', () => {
    const rows = [progress('iː|ɪ', 80), progress('b|v', 50)]
    const weakest = selectWeakestContrasts(pairs, rows, 1)
    expect(weakest).toEqual(['æ|ʌ'])
  })

  it('returns at most `count` distinct contrasts, never more than exist', () => {
    const weakest = selectWeakestContrasts(pairs, [], 10)
    expect(weakest.length).toBe(3)
  })

  it('returns [] when there is no progress and pairs is empty', () => {
    expect(selectWeakestContrasts([], [], 3)).toEqual([])
  })
})

describe('pickWeightedPair', () => {
  it('picks from the weak subset when rng is below the weak-bias threshold', () => {
    const rng = () => 0 // always "below threshold"
    const picked = pickWeightedPair(pairs, ['æ|ʌ'], rng)
    expect(picked.contrast).toBe('æ|ʌ')
  })

  it('picks uniformly across all pairs when rng is above the weak-bias threshold', () => {
    const rng = () => 0.99
    const picked = pickWeightedPair(pairs, ['æ|ʌ'], rng)
    expect(pairs).toContainEqual(picked)
  })

  it('falls back to uniform pick over all pairs when weakContrasts is empty', () => {
    const rng = () => 0
    const picked = pickWeightedPair(pairs, [], rng)
    expect(pairs).toContainEqual(picked)
  })

  it('falls back to uniform pick when no pair matches any weak contrast', () => {
    const rng = () => 0
    const picked = pickWeightedPair(pairs, ['ʃ|tʃ'], rng)
    expect(pairs).toContainEqual(picked)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `pnpm vitest run lib/games/phoneme-invaders/__tests__/priority.test.ts`
Expected: FAIL — `Cannot find module '../priority'`

- [ ] **Step 3: Implementar `priority.ts`**

```ts
// lib/games/phoneme-invaders/priority.ts
import { canonicalizeContrastId } from '@/lib/phoneme-practice/phoneme-similarity'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'
import type { MinimalPairItem } from './schema'

/** Fraction of spawns that should prefer the learner's weakest contrasts. */
const WEAK_BIAS_THRESHOLD = 0.7

/**
 * Ranks the contrasts present in `pairs` by ascending mastery (weakest first).
 * A contrast with no matching progress row counts as mastery 0 (never seen =
 * weakest), matching plan 052's "sin red → mezcla" fallback when `progress`
 * is empty (every contrast ties at 0, so the returned order is stable but not
 * meaningfully prioritized — `pickWeightedPair` still works uniformly then).
 */
export function selectWeakestContrasts(
  pairs: MinimalPairItem[],
  progress: UserContrastProgress[],
  count: number,
): string[] {
  const distinctContrasts = Array.from(
    new Set(pairs.map((p) => canonicalizeContrastId(p.contrast))),
  )

  const masteryByContrast = new Map<string, number>()
  for (const row of progress) {
    masteryByContrast.set(canonicalizeContrastId(row.contrast_id), row.mastery_pct)
  }

  return distinctContrasts
    .map((contrast) => ({ contrast, mastery: masteryByContrast.get(contrast) ?? 0 }))
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, count)
    .map((entry) => entry.contrast)
}

/**
 * Picks the next pair to spawn. With probability `WEAK_BIAS_THRESHOLD` it
 * prefers a pair whose contrast is in `weakContrasts`; otherwise (or when no
 * pair matches any weak contrast) it falls back to a uniform pick over all
 * pairs, so the game never stalls even with an empty or unmatched weak list.
 */
export function pickWeightedPair(
  pairs: MinimalPairItem[],
  weakContrasts: string[],
  rng: () => number = Math.random,
): MinimalPairItem {
  if (weakContrasts.length > 0 && rng() < WEAK_BIAS_THRESHOLD) {
    const weakSet = new Set(weakContrasts)
    const weakPairs = pairs.filter((p) => weakSet.has(canonicalizeContrastId(p.contrast)))
    if (weakPairs.length > 0) {
      return weakPairs[Math.floor(rng() * weakPairs.length)]!
    }
  }
  return pairs[Math.floor(rng() * pairs.length)]!
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `pnpm vitest run lib/games/phoneme-invaders/__tests__/priority.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/games/phoneme-invaders/priority.ts lib/games/phoneme-invaders/__tests__/priority.test.ts
git commit -m "feat(phoneme-invaders): add weak-contrast prioritization engine"
```

### Task A2: Conectar el hook al progreso real del usuario

**Files:**
- Modify: `hooks/games/usePhonemeInvadersLoop.ts`

- [ ] **Step 1: Leer el progreso al montar y calcular los contrastes débiles**

Reemplazar el cuerpo de `usePhonemeInvadersLoop` (mantener todo lo existente, añadir lo siguiente):

```ts
'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  createInitialInvadersState,
  invadersReducer,
} from '@/lib/games/phoneme-invaders/engine'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'
import { selectWeakestContrasts, pickWeightedPair } from '@/lib/games/phoneme-invaders/priority'
import { getAllContrastProgress } from '@/lib/phoneme-practice/contrast-queries'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

const WEAK_CONTRAST_COUNT = 3

export function usePhonemeInvadersLoop(pairs: MinimalPairItem[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(
    invadersReducer,
    createInitialInvadersState(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const weakContrastsRef = useRef<string[]>([])

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  // Prior contrast progress is read once, before the match starts, and is
  // optional: a guest, an offline session, or a fetch failure all leave
  // weakContrastsRef empty, which pickWeightedPair treats as "mix by
  // difficulty" (uniform random) — matching plan 052's "sin red → mezcla".
  useEffect(() => {
    if (!userId || isGuest) return
    let cancelled = false
    getAllContrastProgress(userId)
      .then((progress) => {
        if (cancelled) return
        weakContrastsRef.current = selectWeakestContrasts(pairs, progress, WEAK_CONTRAST_COUNT)
      })
      .catch(() => {
        // Offline or no rows yet: keep the empty list, game falls back to uniform mix.
      })
    return () => {
      cancelled = true
    }
  }, [userId, isGuest, pairs])

  const playTargetAudio = useCallback((word: string) => {
    if (!word) return
    speak(word, { rate: 0.9 })
  }, [])

  const spawnNextPair = useCallback((lanes: number = state.laneCount) => {
    if (pairs.length === 0) return
    const pair = pickWeightedPair(pairs, weakContrastsRef.current)
    const targetSide = Math.random() < 0.5 ? 'a' : 'b'
    dispatch({ type: 'spawn', pair, targetSide, lanes })
  }, [pairs, state.laneCount])
```

El resto del hook (`recordedRef`, `startGame`, los `useEffect` de audio/tick/actividad, `shootShip`, `repeatAudio`, `dismissFlash`, y el `return`) no cambia.

- [ ] **Step 2: Ejecutar la suite de juegos y confirmar que sigue en verde**

Run: `pnpm vitest run lib/games/phoneme-invaders components/practice/phoneme-invaders`
Expected: PASS — no hay tests unitarios directos del hook (no hay carpeta `__tests__` en `hooks/games/`), pero esto confirma que nada del motor ni del schema se rompió.

- [ ] **Step 3: Verificar tipos**

Run: `pnpm type-check`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add hooks/games/usePhonemeInvadersLoop.ts
git commit -m "feat(phoneme-invaders): spawn pairs weighted by the user's weakest contrasts"
```

---

## Fase B — Weak Form Catcher: validador de contenido + más frases

**Qué resuelve:** punto 2.

### Task B1: Lista cerrada de reducciones + tokenizador puro

**Files:**
- Create: `lib/games/weak-form-catcher/reduction-words.ts`
- Test: `lib/games/weak-form-catcher/__tests__/reduction-words.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/games/weak-form-catcher/__tests__/reduction-words.test.ts
import { describe, expect, it } from 'vitest'
import { tokenize, isAllowedReductionToken } from '../reduction-words'

describe('tokenize', () => {
  it('lowercases and strips punctuation', () => {
    expect(tokenize("What d'you want?")).toEqual(['what', "d'you", 'want'])
  })

  it('keeps internal apostrophes but drops trailing punctuation', () => {
    expect(tokenize('c\'mon already!')).toEqual(["c'mon", 'already'])
  })
})

describe('isAllowedReductionToken', () => {
  it('allows whitelisted function words', () => {
    expect(isAllowedReductionToken('the')).toBe(true)
    expect(isAllowedReductionToken('and')).toBe(true)
  })

  it('allows the closed list of colloquial reductions', () => {
    for (const word of ['gonna', 'wanna', 'gotta', 'lemme', 'dunno', 'kinda', 'sorta', 'whaddya', 'didja', 'gimme']) {
      expect(isAllowedReductionToken(word)).toBe(true)
    }
  })

  it('rejects an invented reduction not in either list', () => {
    expect(isAllowedReductionToken('wancha')).toBe(false)
    expect(isAllowedReductionToken('getcha')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `pnpm vitest run lib/games/weak-form-catcher/__tests__/reduction-words.test.ts`
Expected: FAIL — `Cannot find module '../reduction-words'`

- [ ] **Step 3: Implementar `reduction-words.ts`**

```ts
// lib/games/weak-form-catcher/reduction-words.ts
import { WEAK_FORM_WHITELIST } from '@/lib/essential-words/weak-forms'

/**
 * Closed list of colloquial reductions used across public/games/weak-forms/
 * phrases. Extending this list is a deliberate, reviewed change (same policy
 * as WEAK_FORM_WHITELIST) — it exists specifically so content authors cannot
 * invent a new reduction without a human reviewing its pronunciation.
 */
export const CLOSED_COLLOQUIAL_REDUCTIONS: ReadonlySet<string> = new Set([
  'gonna', 'wanna', 'gotta', 'lemme', 'dunno', 'kinda', 'sorta',
  'whaddya', 'didja', 'gimme', 'outta', "shoulda", "woulda", "coulda",
  'musta', 'lotta', "c'mon", "hows",
])

/** Splits a phrase into lowercase word tokens, keeping internal apostrophes. */
export function tokenize(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z']+|[^a-z']+$/g, ''))
    .filter((token) => token.length > 0)
}

export function isAllowedReductionToken(token: string): boolean {
  return WEAK_FORM_WHITELIST.has(token) || CLOSED_COLLOQUIAL_REDUCTIONS.has(token)
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `pnpm vitest run lib/games/weak-form-catcher/__tests__/reduction-words.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/games/weak-form-catcher/reduction-words.ts lib/games/weak-form-catcher/__tests__/reduction-words.test.ts
git commit -m "feat(weak-form-catcher): closed list of allowed colloquial reductions"
```

### Task B2: Validador de contenido sobre el banco de frases

**Files:**
- Test: `lib/games/weak-form-catcher/__tests__/content-validator.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Este test lee el JSON real (no un fixture) para que falle en cuanto alguien añada una frase inválida.

```ts
// lib/games/weak-form-catcher/__tests__/content-validator.test.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { tokenize, isAllowedReductionToken } from '../reduction-words'
import { weakFormPhraseSchema } from '../schema'

function loadPhrases() {
  const filePath = resolve(process.cwd(), 'public/games/weak-forms/phrases-001.json')
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  return raw.map((entry: unknown) => weakFormPhraseSchema.parse(entry))
}

/** Reduction tokens are the reduced-phrase words that don't appear as-is in
 * the full phrase — e.g. "gonna" in "gonna go" vs "going to go". Ordinary
 * unchanged words (like "cup", "tea") are never flagged. */
function reductionTokens(reduced: string, full: string): string[] {
  const fullTokens = new Set(tokenize(full))
  return tokenize(reduced).filter((token) => !fullTokens.has(token))
}

describe('weak-form-catcher content bank', () => {
  const phrases = loadPhrases()

  it('has at least 40 phrases (plan 052 target: 60)', () => {
    expect(phrases.length).toBeGreaterThanOrEqual(40)
  })

  it('every reduction token is in the whitelist or the closed colloquial list', () => {
    const violations: string[] = []
    for (const phrase of phrases) {
      for (const token of reductionTokens(phrase.reduced, phrase.full)) {
        if (!isAllowedReductionToken(token)) {
          violations.push(`${phrase.id}: "${token}"`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('every phrase has a valid CEFR level', () => {
    for (const phrase of phrases) {
      expect(['A1', 'A2', 'B1', 'B2', 'C1']).toContain(phrase.cefr)
    }
  })

  it('every id is unique', () => {
    const ids = phrases.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `pnpm vitest run lib/games/weak-form-catcher/__tests__/content-validator.test.ts`
Expected: FAIL — "has at least 40 phrases" fails (hay 20); revisa si `weakFormPhraseSchema` existe (ver Task B3 si no).

- [ ] **Step 3: Confirmar el schema existente**

`lib/games/weak-form-catcher/schema.ts` ya exporta `weakFormPhraseSchema` (usado por `WeakFormPhraseItem`). Si el nombre exportado difiere, ajustar el import del test al nombre real — no crear un segundo schema.

- [ ] **Step 4: Commit del test (aún en rojo, a propósito — Task B3 lo pone en verde)**

```bash
git add lib/games/weak-form-catcher/__tests__/content-validator.test.ts
git commit -m "test(weak-form-catcher): add content validator for the phrase bank"
```

### Task B3: Añadir 20 frases nuevas (20 → 40)

**Files:**
- Modify: `public/games/weak-forms/phrases-001.json`

- [ ] **Step 1: Añadir las 20 entradas nuevas al final del array existente**

Contenido curado a mano, IPA en General American, y reduciendo únicamente con palabras ya permitidas por `reduction-words.ts` (o dejando la ortografía completa cuando la reducción solo afecta al IPA, igual que las entradas `wf-11`/`wf-12` ya existentes):

```json
  { "id": "wf-21", "reduced": "gonna miss you", "full": "going to miss you", "ipa": "/ɡənə mɪs juː/", "ruleEs": "'going to' antes de un verbo se reduce a 'gonna'", "cefr": "A1" },
  { "id": "wf-22", "reduced": "wanna dance", "full": "want to dance", "ipa": "/wɑːnə dæns/", "ruleEs": "'want to' se une como 'wanna' /wɑːnə/", "cefr": "A1" },
  { "id": "wf-23", "reduced": "gotta tell you", "full": "got to tell you", "ipa": "/ɡɑːtə tel juː/", "ruleEs": "'got to' se convierte en 'gotta' /ɡɑːtə/", "cefr": "A1" },
  { "id": "wf-24", "reduced": "lemme try", "full": "let me try", "ipa": "/lemɪ traɪ/", "ruleEs": "'let me' pierde la /t/ y suena 'lemme'", "cefr": "A1" },
  { "id": "wf-25", "reduced": "dunno yet", "full": "do not know yet", "accept": ["dont know yet", "don't know yet"], "ipa": "/dənoʊ jet/", "ruleEs": "'don't know' se reduce rápidamente a 'dunno'", "cefr": "A2" },
  { "id": "wf-26", "reduced": "kinda tired", "full": "kind of tired", "ipa": "/kaɪndə taɪərd/", "ruleEs": "'kind of' se pronuncia /kaɪndə/ antes de adjetivos", "cefr": "A2" },
  { "id": "wf-27", "reduced": "sorta weird", "full": "sort of weird", "ipa": "/sɔːrtə wɪrd/", "ruleEs": "'sort of' se abrevía a /sɔːrtə/", "cefr": "A2" },
  { "id": "wf-28", "reduced": "whaddya think", "full": "what do you think", "ipa": "/wʌdʒə θɪŋk/", "ruleEs": "'what do you' se contrae a /wʌdʒə/", "cefr": "A2" },
  { "id": "wf-29", "reduced": "didja hear that", "full": "did you hear that", "ipa": "/dɪdʒə hɪr ðæt/", "ruleEs": "'did you' se fusiona en /dɪdʒə/", "cefr": "A2" },
  { "id": "wf-30", "reduced": "gimme five", "full": "give me five", "ipa": "/ɡɪmɪ faɪv/", "ruleEs": "'give me' se contrae a 'gimme'", "cefr": "A1" },
  { "id": "wf-31", "reduced": "outta gas", "full": "out of gas", "ipa": "/aʊtə ɡæs/", "ruleEs": "'out of' se convierte en 'outta' /aʊtə/", "cefr": "A2" },
  { "id": "wf-32", "reduced": "shoulda called", "full": "should have called", "accept": ["should've called"], "ipa": "/ʃʊdə kɔːld/", "ruleEs": "'should have' se reduce a 'shoulda' /ʃʊdə/", "cefr": "B1" },
  { "id": "wf-33", "reduced": "woulda helped", "full": "would have helped", "accept": ["would've helped"], "ipa": "/wʊdə helpt/", "ruleEs": "'would have' suena como 'woulda' /wʊdə/", "cefr": "B1" },
  { "id": "wf-34", "reduced": "coulda won", "full": "could have won", "accept": ["could've won"], "ipa": "/kʊdə wʌn/", "ruleEs": "'could have' se reduce a 'coulda' /kʊdə/", "cefr": "B1" },
  { "id": "wf-35", "reduced": "musta forgot", "full": "must have forgotten", "accept": ["must've forgotten"], "ipa": "/mʌstə fərˈɡɑːtən/", "ruleEs": "'must have' se apaga en /mʌstə/", "cefr": "B1" },
  { "id": "wf-36", "reduced": "lotta work", "full": "lot of work", "ipa": "/lɑːtə wɜːrk/", "ruleEs": "'lot of' se fusiona en 'lotta' /lɑːtə/", "cefr": "A2" },
  { "id": "wf-37", "reduced": "c'mon already", "full": "come on already", "ipa": "/kəmɑːn ɔːlˈredi/", "ruleEs": "'come on' pierde la vocal inicial y suena /kəmɑːn/", "cefr": "A2" },
  { "id": "wf-38", "reduced": "cup of coffee", "full": "cup of coffee", "ipa": "/kʌpə ˈkɔːfi/", "ruleEs": "'of' pierde la /v/ débil y suena solo /ə/", "cefr": "A1" },
  { "id": "wf-39", "reduced": "bread and butter", "full": "bread and butter", "ipa": "/bred ən ˈbʌtər/", "ruleEs": "'and' reduce su vocal y pierde la /d/ final /ən/", "cefr": "A1" },
  { "id": "wf-40", "reduced": "waiting for you", "full": "waiting for you", "ipa": "/ˈweɪtɪŋ fər juː/", "ruleEs": "'for' antes de un pronombre se debilita a /fər/", "cefr": "A2" }
```

Insertar estas 20 líneas antes del `]` de cierre del array existente (después de `wf-20`), con la coma correspondiente tras `wf-20`.

- [ ] **Step 2: Ejecutar el validador de contenido y confirmar que pasa**

Run: `pnpm vitest run lib/games/weak-form-catcher/__tests__/content-validator.test.ts`
Expected: PASS (4 tests) — 40 frases, ninguna reducción inventada, todos los niveles válidos, ids únicos.

- [ ] **Step 3: Ejecutar toda la suite de weak-form-catcher**

Run: `pnpm vitest run lib/games/weak-form-catcher`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add public/games/weak-forms/phrases-001.json
git commit -m "content(weak-form-catcher): add 20 curated phrases (20 -> 40)"
```

**Nota de riesgo (heredada de plan 052):** este contenido debe revisarlo una persona con criterio de pronunciación GA antes de publicarlo a usuarios reales; márcalo como beta hasta esa revisión. 40/60 sigue por debajo de la meta original — si se necesita llegar a 60, repetir Task B3 con 20 frases más siguiendo el mismo patrón.

---

## Fase C — Falsos Amigos: filtrar por nivel CEFR

**Qué resuelve:** punto 3.

### Task C1: Selector de nivel y filtrado en el hook

**Files:**
- Create: `components/practice/false-friends-swipe/SwipeLevelSelector.tsx`
- Modify: `components/practice/false-friends-swipe/FalseFriendsSwipeSession.tsx`
- Modify: `hooks/games/useFalseFriendsSwipeLoop.ts`

- [ ] **Step 1: Crear el selector de nivel**

```tsx
// components/practice/false-friends-swipe/SwipeLevelSelector.tsx
'use client'

import { CEFR_LEVELS, type CefrLevel } from '@/lib/essential-words/types'

interface SwipeLevelSelectorProps {
  value: CefrLevel
  onChange: (level: CefrLevel) => void
}

export default function SwipeLevelSelector({ value, onChange }: SwipeLevelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
        NIVEL
      </label>
      <div className="grid grid-cols-5 gap-2">
        {CEFR_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={`py-2.5 rounded-2xl border-2 font-sans text-body-sm font-bold text-center transition-all cursor-pointer ${
              value === level
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Cambiar el hook para aceptar un nivel y filtrar el banco**

```ts
// hooks/games/useFalseFriendsSwipeLoop.ts
'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { createInitialSwipeState, swipeReducer } from '@/lib/games/false-friends-swipe/engine'
import { buildSwipeDeck } from '@/lib/games/false-friends-swipe/deck-builder'
import { filterByLevel } from '@/lib/false-friends/data'
import type { FalseFriend } from '@/lib/false-friends/types'
import type { CefrLevel } from '@/lib/essential-words/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

/** Below this pool size a level filter would starve the deck; fall back to
 * the full bank rather than show a tiny or repetitive game. */
const MIN_POOL_SIZE = 10

export function useFalseFriendsSwipeLoop(entries: FalseFriend[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(swipeReducer, createInitialSwipeState())
  const [isPlaying, setIsPlaying] = useState(false)

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const recordedRef = useRef(false)

  const startGame = useCallback((level: CefrLevel) => {
    if (entries.length === 0) return
    const filtered = filterByLevel(entries, level)
    const pool = filtered.length >= MIN_POOL_SIZE ? filtered : entries
    const deck = buildSwipeDeck(pool)
    startTimeRef.current = Date.now()
    recordedRef.current = false
    setIsPlaying(true)
    dispatch({ type: 'start', deck })
  }, [entries])

  // Play audio when current card changes
  useEffect(() => {
    if (isPlaying && state.status === 'swiping' && state.currentCard) {
      speak(state.currentCard.word, { rate: 0.9 })
    }
  }, [isPlaying, state.status, state.currentCard])

  // Timer tick for 5s per card
  useEffect(() => {
    if (!isPlaying || state.status !== 'swiping') return

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const delta = timestamp - lastTickRef.current
      lastTickRef.current = timestamp
      const dy = delta * 0.02
      dispatch({ type: 'tick', dy })
      rafRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, state.status])

  useEffect(() => {
    if (state.status === 'completed' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(
        userId,
        'false_friends_swipe',
        elapsed,
        'false-friends-swipe',
        ['vocabulary'],
      )
    }
  }, [state.status, userId, isGuest])

  const answer = useCallback((choice: 'true' | 'trap') => {
    dispatch({ type: 'answer', choice })
  }, [])

  const dismissVerdict = useCallback(() => {
    dispatch({ type: 'dismiss_verdict' })
  }, [])

  const answerRescue = useCallback((choiceIndex: number) => {
    dispatch({ type: 'answer_rescue', choiceIndex })
  }, [])

  return {
    state,
    isPlaying,
    startGame,
    answer,
    dismissVerdict,
    answerRescue,
  }
}
```

- [ ] **Step 3: Añadir el selector de nivel a la sesión, con nivel por defecto del perfil**

```tsx
// components/practice/false-friends-swipe/FalseFriendsSwipeSession.tsx
'use client'

// Planned structure:
// <FalseFriendsSwipeSession>
//   {status === 'completed' ? (
//     <SwipeResults state={state} onRestart={...} />
//   ) : status === 'rescue_round' && miss ? (
//     <SwipeRescueRound .../>
//   ) : !isPlaying || !currentCard ? (
//     <GameIntroPanel copy={FALSE_FRIENDS_INTRO} onStart={...}>
//       <SwipeLevelSelector />
//     </GameIntroPanel>
//   ) : (
//     <GameContainer>
//       <SwipeCardStack .../>
//       {status === 'showing_verdict' && lastVerdict && <SwipeVerdictLine .../>}
//     </GameContainer>
//   )}
// </FalseFriendsSwipeSession>

import { useEffect, useState } from 'react'
import { useFalseFriendsSwipeLoop } from '@/hooks/games/useFalseFriendsSwipeLoop'
import type { FalseFriend } from '@/lib/false-friends/types'
import { CEFR_LEVELS, type CefrLevel } from '@/lib/essential-words/types'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { FALSE_FRIENDS_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import SwipeLevelSelector from './SwipeLevelSelector'
import SwipeCardStack from './SwipeCardStack'
import SwipeVerdictLine from './SwipeVerdictLine'
import SwipeRescueRound from './SwipeRescueRound'
import SwipeResults from './SwipeResults'

interface FalseFriendsSwipeSessionProps {
  entries: FalseFriend[]
}

export default function FalseFriendsSwipeSession({
  entries,
}: FalseFriendsSwipeSessionProps) {
  const { learnerLevel, loading: prefsLoading } = useUserPreferences()
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('A2')
  const [hasInitializedLevel, setHasInitializedLevel] = useState(false)

  useEffect(() => {
    if (!prefsLoading && learnerLevel && !hasInitializedLevel) {
      const level = learnerLevel.level as CefrLevel
      if (CEFR_LEVELS.includes(level)) setSelectedLevel(level)
      setHasInitializedLevel(true)
    }
  }, [prefsLoading, learnerLevel, hasInitializedLevel])

  const {
    state,
    isPlaying,
    startGame,
    answer,
    dismissVerdict,
    answerRescue,
  } = useFalseFriendsSwipeLoop(entries)

  if (state.status === 'completed') {
    return <SwipeResults state={state} onRestart={() => startGame(selectedLevel)} />
  }

  if (state.status === 'rescue_round' && state.missHistory[state.rescueIndex]) {
    return (
      <div className="mx-auto w-full max-w-lg py-8">
        <SwipeRescueRound
          miss={state.missHistory[state.rescueIndex]!}
          rescueIndex={state.rescueIndex}
          totalRescues={state.missHistory.length}
          onAnswerRescue={answerRescue}
        />
      </div>
    )
  }

  if (!isPlaying || !state.currentCard) {
    return (
      <GameIntroPanel
        copy={FALSE_FRIENDS_INTRO}
        onStart={() => startGame(selectedLevel)}
        unavailableReason={
          entries.length === 0
            ? 'No pudimos cargar los falsos amigos. Recarga la página.'
            : undefined
        }
      >
        <SwipeLevelSelector value={selectedLevel} onChange={setSelectedLevel} />
      </GameIntroPanel>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <SwipeCardStack
        card={state.currentCard}
        cardTimeY={state.cardTimeY}
        currentIndex={state.currentIndex}
        totalCards={state.deck.length}
        onAnswer={answer}
      />

      {state.status === 'showing_verdict' && state.lastVerdict && (
        <SwipeVerdictLine
          card={state.lastVerdict.card}
          isCorrect={state.lastVerdict.isCorrect}
          onDismiss={dismissVerdict}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar tests existentes y type-check**

Run: `pnpm vitest run lib/games/false-friends-swipe components/practice/false-friends-swipe`
Expected: PASS (los tests existentes de `engine.ts`/`deck-builder.ts` no cambiaron de contrato)

Run: `pnpm type-check`
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add components/practice/false-friends-swipe/SwipeLevelSelector.tsx components/practice/false-friends-swipe/FalseFriendsSwipeSession.tsx hooks/games/useFalseFriendsSwipeLoop.ts
git commit -m "feat(false-friends-swipe): filter the deck by CEFR level"
```

### Task C2: Test de filtrado por nivel en el hook (vía deck-builder existente)

**Files:**
- Test: `lib/games/false-friends-swipe/__tests__/deck-builder.test.ts` (extender el archivo existente)

- [ ] **Step 1: Añadir un caso que documente el contrato de fallback usado por el hook**

Añadir al final del `describe` existente en `lib/games/false-friends-swipe/__tests__/deck-builder.test.ts`:

```ts
  it('buildSwipeDeck works on an already-level-filtered pool (hook contract)', () => {
    const a1Only = ENTRIES.filter((e) => e.cefr_level === 'A1')
    const deck = buildSwipeDeck(a1Only, () => 0.5, { size: a1Only.length })
    expect(deck.every((card) => card.friend.cefr_level === 'A1')).toBe(true)
  })
```

(Ajustar el nombre de la constante de fixture del archivo existente, p. ej. `ENTRIES`, al nombre real usado en ese archivo — no duplicar el fixture.)

- [ ] **Step 2: Ejecutar y confirmar que pasa**

Run: `pnpm vitest run lib/games/false-friends-swipe/__tests__/deck-builder.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/games/false-friends-swipe/__tests__/deck-builder.test.ts
git commit -m "test(false-friends-swipe): document level-filtered deck contract"
```

---

## Fase D — Memory Match: vocabulario aleatorio por nivel + pronunciación al descubrir

**Qué resuelve:** punto 4.

### Task D1: Loader de palabras por nivel (con fallback offline)

**Files:**
- Create: `lib/games/memory-match/word-loader.ts`
- Test: `lib/games/memory-match/__tests__/word-loader.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/games/memory-match/__tests__/word-loader.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'

const fetchCatalogIndex = vi.fn()
const fetchChunks = vi.fn()

vi.mock('@/lib/essential-words/client', () => ({
  fetchCatalogIndex: (...args: unknown[]) => fetchCatalogIndex(...args),
  fetchChunks: (...args: unknown[]) => fetchChunks(...args),
}))

import { loadMemoryMatchWords } from '../word-loader'

describe('loadMemoryMatchWords', () => {
  beforeEach(() => {
    fetchCatalogIndex.mockReset()
    fetchChunks.mockReset()
  })

  it('returns words for the requested level with translation and ipa', async () => {
    fetchCatalogIndex.mockResolvedValue([
      { rank: 1, word: 'apple', pos: 'noun', cefr_level: 'A1', chunk: 1, ipa_strong: '/ˈæp.əl/' },
      { rank: 2, word: 'chair', pos: 'noun', cefr_level: 'A1', chunk: 1, ipa_strong: '/tʃeər/' },
      { rank: 3, word: 'complex', pos: 'adj', cefr_level: 'B2', chunk: 1, ipa_strong: '/ˈkɒm.pleks/' },
    ])
    fetchChunks.mockResolvedValue(new Map([
      ['ej-apple', { word: 'apple', translation: 'manzana', ipa_strong: '/ˈæp.əl/' }],
      ['ej-chair', { word: 'chair', translation: 'silla', ipa_strong: '/tʃeər/' }],
    ]))

    const words = await loadMemoryMatchWords('A1', 2)

    expect(words).toHaveLength(2)
    expect(words.every((w) => w.meaningEs.length > 0)).toBe(true)
    expect(words.map((w) => w.word).sort()).toEqual(['apple', 'chair'])
  })

  it('falls back to curated words when the catalog fetch fails', async () => {
    fetchCatalogIndex.mockRejectedValue(new Error('offline'))

    const words = await loadMemoryMatchWords('B1', 6)

    expect(words.length).toBeGreaterThan(0)
    expect(words.every((w) => w.word && w.meaningEs && w.ipa)).toBe(true)
  })

  it('falls back when there are not enough candidates with a translation', async () => {
    fetchCatalogIndex.mockResolvedValue([
      { rank: 1, word: 'apple', pos: 'noun', cefr_level: 'A1', chunk: 1, ipa_strong: '/ˈæp.əl/' },
    ])
    fetchChunks.mockResolvedValue(new Map()) // no translations found

    const words = await loadMemoryMatchWords('A1', 6)

    expect(words.length).toBeGreaterThan(0) // fallback list, not the empty catalog result
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `pnpm vitest run lib/games/memory-match/__tests__/word-loader.test.ts`
Expected: FAIL — `Cannot find module '../word-loader'`

- [ ] **Step 3: Implementar `word-loader.ts`**

```ts
// lib/games/memory-match/word-loader.ts
import type { CefrLevel } from '@/lib/essential-words/types'
import { essentialWordId } from '@/lib/essential-words/types'
import { fetchCatalogIndex, fetchChunks } from '@/lib/essential-words/client'
import type { MemoryWordItem } from './schema'

const FALLBACK_WORDS: Record<CefrLevel, MemoryWordItem[]> = {
  A1: [
    { id: 'mem-fb-apple', word: 'apple', meaningEs: 'manzana', ipa: '/ˈæp.əl/' },
    { id: 'mem-fb-water', word: 'water', meaningEs: 'agua', ipa: '/ˈwɔː.tər/' },
    { id: 'mem-fb-house', word: 'house', meaningEs: 'casa', ipa: '/haʊs/' },
    { id: 'mem-fb-smile', word: 'smile', meaningEs: 'sonrisa', ipa: '/smaɪl/' },
    { id: 'mem-fb-chair', word: 'chair', meaningEs: 'silla', ipa: '/tʃeər/' },
    { id: 'mem-fb-table', word: 'table', meaningEs: 'mesa', ipa: '/ˈteɪ.bəl/' },
    { id: 'mem-fb-bread', word: 'bread', meaningEs: 'pan', ipa: '/bred/' },
    { id: 'mem-fb-night', word: 'night', meaningEs: 'noche', ipa: '/naɪt/' },
  ],
  A2: [
    { id: 'mem-fb-travel', word: 'travel', meaningEs: 'viajar', ipa: '/ˈtræv.əl/' },
    { id: 'mem-fb-doctor', word: 'doctor', meaningEs: 'médico', ipa: '/ˈdɒk.tər/' },
    { id: 'mem-fb-market', word: 'market', meaningEs: 'mercado', ipa: '/ˈmɑː.kɪt/' },
    { id: 'mem-fb-window', word: 'window', meaningEs: 'ventana', ipa: '/ˈwɪn.dəʊ/' },
    { id: 'mem-fb-garden', word: 'garden', meaningEs: 'jardín', ipa: '/ˈɡɑː.dən/' },
    { id: 'mem-fb-bridge', word: 'bridge', meaningEs: 'puente', ipa: '/brɪdʒ/' },
    { id: 'mem-fb-winter', word: 'winter', meaningEs: 'invierno', ipa: '/ˈwɪn.tər/' },
    { id: 'mem-fb-friend', word: 'friend', meaningEs: 'amigo', ipa: '/frend/' },
  ],
  B1: [
    { id: 'mem-fb-journey', word: 'journey', meaningEs: 'viaje', ipa: '/ˈdʒɜː.ni/' },
    { id: 'mem-fb-weather', word: 'weather', meaningEs: 'clima', ipa: '/ˈweð.ər/' },
    { id: 'mem-fb-purpose', word: 'purpose', meaningEs: 'propósito', ipa: '/ˈpɜː.pəs/' },
    { id: 'mem-fb-culture', word: 'culture', meaningEs: 'cultura', ipa: '/ˈkʌl.tʃər/' },
    { id: 'mem-fb-freedom', word: 'freedom', meaningEs: 'libertad', ipa: '/ˈfriː.dəm/' },
    { id: 'mem-fb-balance', word: 'balance', meaningEs: 'equilibrio', ipa: '/ˈbæl.əns/' },
    { id: 'mem-fb-history', word: 'history', meaningEs: 'historia', ipa: '/ˈhɪs.tər.i/' },
    { id: 'mem-fb-success', word: 'success', meaningEs: 'éxito', ipa: '/səkˈses/' },
  ],
  B2: [
    { id: 'mem-fb-achieve', word: 'achieve', meaningEs: 'lograr', ipa: '/əˈtʃiːv/' },
    { id: 'mem-fb-advance', word: 'advance', meaningEs: 'avanzar', ipa: '/ədˈvɑːns/' },
    { id: 'mem-fb-capture', word: 'capture', meaningEs: 'capturar', ipa: '/ˈkæp.tʃər/' },
    { id: 'mem-fb-complex', word: 'complex', meaningEs: 'complejo', ipa: '/ˈkɒm.pleks/' },
    { id: 'mem-fb-explore', word: 'explore', meaningEs: 'explorar', ipa: '/ɪkˈsplɔːr/' },
    { id: 'mem-fb-inspire', word: 'inspire', meaningEs: 'inspirar', ipa: '/ɪnˈspaɪər/' },
    { id: 'mem-fb-reflect', word: 'reflect', meaningEs: 'reflexionar', ipa: '/rɪˈflekt/' },
    { id: 'mem-fb-succeed', word: 'succeed', meaningEs: 'tener éxito', ipa: '/səkˈsiːd/' },
  ],
  C1: [
    { id: 'mem-fb-abstract', word: 'abstract', meaningEs: 'abstracto', ipa: '/ˈæb.strækt/' },
    { id: 'mem-fb-coherent', word: 'coherent', meaningEs: 'coherente', ipa: '/kəʊˈhɪə.rənt/' },
    { id: 'mem-fb-diligent', word: 'diligent', meaningEs: 'diligente', ipa: '/ˈdɪl.ɪ.dʒənt/' },
    { id: 'mem-fb-eloquent', word: 'eloquent', meaningEs: 'elocuente', ipa: '/ˈel.ə.kwənt/' },
    { id: 'mem-fb-feasible', word: 'feasible', meaningEs: 'factible', ipa: '/ˈfiː.zə.bəl/' },
    { id: 'mem-fb-genuine', word: 'genuine', meaningEs: 'genuino', ipa: '/ˈdʒen.ju.ɪn/' },
    { id: 'mem-fb-insight', word: 'insight', meaningEs: 'perspicacia', ipa: '/ˈɪn.saɪt/' },
    { id: 'mem-fb-lucid', word: 'lucid', meaningEs: 'lúcido', ipa: '/ˈluː.sɪd/' },
  ],
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function fallback(level: CefrLevel, count: number): MemoryWordItem[] {
  const list = FALLBACK_WORDS[level] ?? FALLBACK_WORDS.A2
  return shuffle(list).slice(0, count)
}

/**
 * Loads `count` random Memory Match words for the given CEFR level, with
 * their Spanish translation and IPA. Mirrors the offline-friendly fetch
 * pattern in lib/exercises/word-rain/word-loader.ts (static, HTTP-cacheable
 * JSON, no Supabase). Falls back to a small curated list per level if the
 * catalog fetch fails or too few candidates have a translation.
 */
export async function loadMemoryMatchWords(
  level: CefrLevel,
  count: number,
): Promise<MemoryWordItem[]> {
  try {
    const index = await fetchCatalogIndex()
    const candidates = index.filter(
      (entry) =>
        entry.cefr_level === level &&
        entry.word.length >= 3 &&
        entry.word.length <= 10 &&
        !entry.word.includes(' ') &&
        !entry.word.includes('-'),
    )
    if (candidates.length === 0) return fallback(level, count)

    const pool = shuffle(candidates).slice(0, count * 3)
    const chunkNumbers = Array.from(new Set(pool.map((c) => c.chunk)))
    const wordMap = await fetchChunks(chunkNumbers)

    const withTranslation: MemoryWordItem[] = []
    for (const candidate of pool) {
      if (withTranslation.length >= count) break
      const full = wordMap.get(essentialWordId(candidate.word))
      if (full?.translation) {
        withTranslation.push({
          id: `mem-${level}-${candidate.rank}-${candidate.word}`,
          word: candidate.word,
          meaningEs: full.translation,
          ipa: candidate.ipa_strong,
        })
      }
    }

    if (withTranslation.length >= Math.min(count, 6)) return withTranslation
    return fallback(level, count)
  } catch (err) {
    console.warn('[MemoryMatch] Fallback to curated vocabulary:', err)
    return fallback(level, count)
  }
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `pnpm vitest run lib/games/memory-match/__tests__/word-loader.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Verificar tipos** (confirma que `EssentialWord.translation` y el shape de `fetchChunks`/`fetchCatalogIndex` coinciden con lo usado)

Run: `pnpm type-check`
Expected: exit 0 — si `essentialWordId` o los campos de `CatalogIndexEntry`/`EssentialWord` no coinciden exactamente, ajustar los nombres de campo al tipo real en `lib/essential-words/types.ts` (no inventar campos).

- [ ] **Step 6: Commit**

```bash
git add lib/games/memory-match/word-loader.ts lib/games/memory-match/__tests__/word-loader.test.ts
git commit -m "feat(memory-match): load random words by CEFR level with offline fallback"
```

### Task D2: Pronunciar la palabra al completar cada pareja

**Files:**
- Modify: `hooks/games/useMemoryMatchLoop.ts`

- [ ] **Step 1: Escribir el test que falla**

No existe carpeta de tests para hooks de juegos (todo pasa por `engine.test.ts`). Para mantener esta lógica testeable sin renderizar el hook completo, se añade una función pura extraída del hook:

```ts
// lib/games/memory-match/__tests__/match-audio.test.ts
import { describe, expect, it } from 'vitest'
import { findJustMatchedWord } from '../match-audio'
import type { MemoryCard } from '../engine'

const cards: MemoryCard[] = [
  { id: 'p1-word', pairId: 'p1', kind: 'word', content: 'apple', word: 'apple', isFlipped: true, isMatched: true },
  { id: 'p1-meaning', pairId: 'p1', kind: 'meaning', content: 'manzana', word: 'apple', isFlipped: true, isMatched: true },
  { id: 'p2-word', pairId: 'p2', kind: 'word', content: 'chair', word: 'chair', isFlipped: false, isMatched: false },
  { id: 'p2-meaning', pairId: 'p2', kind: 'meaning', content: 'silla', word: 'chair', isFlipped: false, isMatched: false },
]

describe('findJustMatchedWord', () => {
  it('returns the word of the most recently matched pair', () => {
    expect(findJustMatchedWord(cards, ['p1'])).toBe('apple')
  })

  it('returns null when there are no matched pairs', () => {
    expect(findJustMatchedWord(cards, [])).toBeNull()
  })

  it('returns null when the matched pairId has no cards (defensive)', () => {
    expect(findJustMatchedWord(cards, ['p1', 'missing'])).toBe('chair')
  })
})
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `pnpm vitest run lib/games/memory-match/__tests__/match-audio.test.ts`
Expected: FAIL — `Cannot find module '../match-audio'`

- [ ] **Step 3: Implementar la función pura**

```ts
// lib/games/memory-match/match-audio.ts
import type { MemoryCard } from './engine'

/**
 * Returns the word for the most recently matched pairId, so the hook can
 * pronounce it exactly once at the moment of discovery (not on every flip).
 * Returns null if the pairId list is empty or matches no card.
 */
export function findJustMatchedWord(
  cards: MemoryCard[],
  matchedPairIds: string[],
): string | null {
  const lastPairId = matchedPairIds[matchedPairIds.length - 1]
  if (!lastPairId) return null
  const card = cards.find((c) => c.pairId === lastPairId && c.kind === 'word')
  return card?.word ?? null
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `pnpm vitest run lib/games/memory-match/__tests__/match-audio.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Conectar la función al hook**

```ts
// hooks/games/useMemoryMatchLoop.ts (reemplazo completo)
'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  createInitialMemoryState,
  memoryReducer,
  type MemoryMatchMode,
} from '@/lib/games/memory-match/engine'
import { findJustMatchedWord } from '@/lib/games/memory-match/match-audio'
import { loadMemoryMatchWords } from '@/lib/games/memory-match/word-loader'
import type { CefrLevel } from '@/lib/essential-words/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useMemoryMatchLoop() {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(
    memoryReducer,
    createInitialMemoryState(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const startTimeRef = useRef<number>(0)
  const mismatchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const matchedCountRef = useRef(0)

  const recordedRef = useRef(false)

  const startGame = useCallback(
    async (mode: MemoryMatchMode, pairCount: number, level: CefrLevel) => {
      setIsLoadingWords(true)
      try {
        const words = await loadMemoryMatchWords(level, pairCount)
        if (words.length === 0) return
        startTimeRef.current = Date.now()
        recordedRef.current = false
        matchedCountRef.current = 0
        setIsPlaying(true)
        dispatch({ type: 'start', words, mode, pairCount })
      } finally {
        setIsLoadingWords(false)
      }
    },
    [],
  )

  // Auto-resolve mismatch after 900ms
  useEffect(() => {
    if (state.isResolvingMismatch) {
      mismatchTimerRef.current = setTimeout(() => {
        dispatch({ type: 'resolve_mismatch' })
      }, 900)
    }
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current)
    }
  }, [state.isResolvingMismatch])

  // Play audio when an audio card is flipped
  const flipCard = useCallback(
    (cardId: string) => {
      const card = state.cards.find((c) => c.id === cardId)
      const speaksWord = card?.kind === 'word' && state.mode !== 'audio_word'
      if (card && (card.kind === 'audio' || speaksWord)) {
        speak(card.word, { rate: 0.9 })
      }
      dispatch({ type: 'flip', cardId })
    },
    [state.cards, state.mode],
  )

  // Pronounce the word once, exactly when a pair is discovered — independent
  // of the flip-time speak above, which some modes intentionally skip
  // (audio_word keeps the word card silent so pairs match by ear alone).
  useEffect(() => {
    if (state.matchedPairIds.length > matchedCountRef.current) {
      const word = findJustMatchedWord(state.cards, state.matchedPairIds)
      if (word) speak(word, { rate: 0.85 })
    }
    matchedCountRef.current = state.matchedPairIds.length
  }, [state.matchedPairIds, state.cards])

  // Record activity when completed
  useEffect(() => {
    if (state.status === 'completed' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(userId, 'memory_match', elapsed, 'memory-match', [
        'vocabulary',
      ])
    }
  }, [state.status, userId, isGuest])

  return {
    state,
    isPlaying,
    isLoadingWords,
    startGame,
    flipCard,
  }
}
```

- [ ] **Step 6: Ejecutar tests y type-check**

Run: `pnpm vitest run lib/games/memory-match`
Expected: PASS

Run: `pnpm type-check`
Expected: exit 0 (fallará aquí hasta completar Task D3, que actualiza los llamadores de `useMemoryMatchLoop` y `startGame`)

- [ ] **Step 7: Commit**

```bash
git add hooks/games/useMemoryMatchLoop.ts lib/games/memory-match/match-audio.ts lib/games/memory-match/__tests__/match-audio.test.ts
git commit -m "feat(memory-match): load words by level in the hook and speak on match"
```

### Task D3: Selector de nivel en el setup + página cliente

**Files:**
- Modify: `components/practice/memory-match/MemorySetup.tsx`
- Modify: `components/practice/memory-match/MemoryMatchSession.tsx`
- Modify: `app/(authenticated)/practice/memory-match/page.tsx`
- Modify: `components/practice/games/shared/GameIntroPanel.tsx` (prop opcional `isLoading`)

- [ ] **Step 1: Añadir `isLoading` opcional a `GameIntroPanel`**

En `components/practice/games/shared/GameIntroPanel.tsx`, extender la interfaz y el botón existente (no cambia el resto del archivo):

```tsx
interface GameIntroPanelProps {
  copy: GameIntroCopy
  onStart: () => void
  unavailableReason?: string
  /** Disables start and swaps its label while content is being fetched. */
  isLoading?: boolean
  children?: ReactNode
}

export default function GameIntroPanel({
  copy,
  onStart,
  unavailableReason,
  isLoading = false,
  children,
}: GameIntroPanelProps) {
```

Y en el botón de inicio existente, añadir `disabled={Boolean(unavailableReason) || isLoading}` (mantener la lógica de `unavailableReason` ya presente) y cambiar el texto a `isLoading ? 'Cargando…' : copy.startLabel` (o el texto/prop que el botón ya use — conservar el literal existente cuando `isLoading` es `false`).

- [ ] **Step 2: MemorySetup recibe nivel controlado desde fuera**

```tsx
// components/practice/memory-match/MemorySetup.tsx
'use client'

// Planned structure:
// <GameIntroPanel copy={MEMORY_MATCH_INTRO} onStart={...} isLoading={...}>
//   <MemoryLevelSelector />
//   <ModeSelector />
//   <PairCountSelector />
// </GameIntroPanel>

import { useState } from 'react'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { MEMORY_MATCH_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import { CEFR_LEVELS, type CefrLevel } from '@/lib/essential-words/types'
import type { MemoryMatchMode } from '@/lib/games/memory-match/engine'

interface MemorySetupProps {
  level: CefrLevel
  onLevelChange: (level: CefrLevel) => void
  isLoading: boolean
  onStart: (mode: MemoryMatchMode, pairCount: number) => void
}

export default function MemorySetup({ level, onLevelChange, isLoading, onStart }: MemorySetupProps) {
  const [mode, setMode] = useState<MemoryMatchMode>('word_meaning')
  const [pairCount, setPairCount] = useState<number>(6)

  return (
    <GameIntroPanel
      copy={MEMORY_MATCH_INTRO}
      onStart={() => onStart(mode, pairCount)}
      isLoading={isLoading}
    >
      <div className="flex flex-col gap-2">
        <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
          NIVEL
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CEFR_LEVELS.map((cefrLevel) => (
            <button
              key={cefrLevel}
              type="button"
              onClick={() => onLevelChange(cefrLevel)}
              className={`py-2.5 rounded-2xl border-2 font-sans text-body-sm font-bold text-center transition-all cursor-pointer ${
                level === cefrLevel
                  ? 'bg-ink text-surface-base border-ink shadow-xs'
                  : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
              }`}
            >
              {cefrLevel}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector (sin cambios respecto a la versión anterior) */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
          MODO DE PAREJAS
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('word_meaning')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'word_meaning'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            📖 Palabra ↔ Significado
          </button>
          <button
            type="button"
            onClick={() => setMode('audio_word')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'audio_word'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            🔊 Audio ↔ Palabra
          </button>
          <button
            type="button"
            onClick={() => setMode('word_ipa')}
            className={`p-3 rounded-2xl border-2 font-sans text-caption font-bold text-center transition-all cursor-pointer ${
              mode === 'word_ipa'
                ? 'bg-ink text-surface-base border-ink shadow-xs'
                : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
            }`}
          >
            🗣️ Palabra ↔ IPA
          </button>
        </div>
      </div>

      {/* Pair Count Selector (sin cambios) */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-tiny font-bold uppercase tracking-wider text-ink-secondary">
          CANTIDAD DE PAREJAS
        </label>
        <div className="flex gap-2">
          {[6, 8, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPairCount(num)}
              className={`flex-1 py-2.5 rounded-2xl border-2 font-sans text-body-sm font-bold transition-all cursor-pointer ${
                pairCount === num
                  ? 'bg-ink text-surface-base border-ink shadow-xs'
                  : 'bg-ink/5 border-ink/10 text-ink hover:bg-ink/10'
              }`}
            >
              {num} parejas ({num * 2} cartas)
            </button>
          ))}
        </div>
      </div>
    </GameIntroPanel>
  )
}
```

- [ ] **Step 3: MemoryMatchSession deja de recibir `words`, gestiona nivel y pasa por el loader**

```tsx
// components/practice/memory-match/MemoryMatchSession.tsx
'use client'

// Planned structure:
// <MemoryMatchSession>
//   {status === 'completed' ? (
//     <MemoryResults state={state} onRestart={...} />
//   ) : !isPlaying ? (
//     <MemorySetup level onLevelChange isLoading onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <BoardHeader attempts={state.attempts} score={state.score} />
//       <MemoryBoard cards={state.cards} isResolvingMismatch={state.isResolvingMismatch} onFlip={flipCard} />
//     </GameContainer>
//   )}
// </MemoryMatchSession>

import { useEffect, useState } from 'react'
import { useMemoryMatchLoop } from '@/hooks/games/useMemoryMatchLoop'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { CEFR_LEVELS, type CefrLevel } from '@/lib/essential-words/types'
import MemorySetup from './MemorySetup'
import MemoryBoard from './MemoryBoard'
import MemoryResults from './MemoryResults'

export default function MemoryMatchSession() {
  const { learnerLevel, loading: prefsLoading } = useUserPreferences()
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('A2')
  const [hasInitializedLevel, setHasInitializedLevel] = useState(false)

  useEffect(() => {
    if (!prefsLoading && learnerLevel && !hasInitializedLevel) {
      const level = learnerLevel.level as CefrLevel
      if (CEFR_LEVELS.includes(level)) setSelectedLevel(level)
      setHasInitializedLevel(true)
    }
  }, [prefsLoading, learnerLevel, hasInitializedLevel])

  const { state, isPlaying, isLoadingWords, startGame, flipCard } = useMemoryMatchLoop()

  if (state.status === 'completed') {
    return (
      <MemoryResults
        state={state}
        onRestart={() => startGame(state.mode, state.totalPairs, selectedLevel)}
      />
    )
  }

  if (!isPlaying) {
    return (
      <MemorySetup
        level={selectedLevel}
        onLevelChange={setSelectedLevel}
        isLoading={isLoadingWords}
        onStart={(mode, pairCount) => startGame(mode, pairCount, selectedLevel)}
      />
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 py-4">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-card border border-border/40 text-fg shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
              PUNTOS
            </span>
            <div className="font-heading text-xl font-extrabold text-fg">
              {state.score}
            </div>
          </div>
          <div className="h-8 w-px bg-border/40" />
          <div>
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
              INTENTOS
            </span>
            <div className="font-sans text-lg font-bold text-fg">
              {state.attempts}
            </div>
          </div>
        </div>

        <div className="font-mono text-caption font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
          {state.matchedPairIds.length} / {state.totalPairs} parejas
        </div>
      </div>

      <MemoryBoard
        cards={state.cards}
        isResolvingMismatch={state.isResolvingMismatch}
        onFlip={flipCard}
      />
    </div>
  )
}
```

- [ ] **Step 4: La página deja de leer JSON en el servidor**

```tsx
// app/(authenticated)/practice/memory-match/page.tsx
import PageLayout from '@/components/layout/PageLayout'
import MemoryMatchSession from '@/components/practice/memory-match/MemoryMatchSession'

export const metadata = {
  title: 'Memory Match | English Journal',
  description: 'Juego de memoria y asociación de vocabulario, audio e IPA',
}

export default function MemoryMatchPage() {
  return (
    <PageLayout archetype="catalog">
      <MemoryMatchSession />
    </PageLayout>
  )
}
```

- [ ] **Step 5: Ejecutar toda la suite de Memory Match y el hub, y type-check**

Run: `pnpm vitest run lib/games/memory-match components/practice/memory-match components/practice/games components/practice/hub`
Expected: PASS

Run: `pnpm type-check`
Expected: exit 0

Run: `pnpm lint`
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add components/practice/memory-match/MemorySetup.tsx components/practice/memory-match/MemoryMatchSession.tsx "app/(authenticated)/practice/memory-match/page.tsx" components/practice/games/shared/GameIntroPanel.tsx
git commit -m "feat(memory-match): pick CEFR level in setup, load words client-side"
```

---

## Verificación final (todas las fases)

- [ ] `pnpm vitest run lib/games components/practice/games components/practice/hub components/practice/phoneme-invaders components/practice/false-friends-swipe components/practice/memory-match lib/progress/__tests__/game-activity.test.ts` → exit 0
- [ ] `pnpm type-check` → exit 0
- [ ] `pnpm lint` && `npm run lint:design` → exit 0
- [ ] `git grep -n "supabase\|/api/gemini" lib/games` → vacío (Phoneme Invaders solo llama `getAllContrastProgress`, que vive en `lib/phoneme-practice/`, no en `lib/games/`)
- [ ] Navegador, offline (DevTools → Network → Offline, tras una carga previa online): Phoneme Invaders prioriza sonidos débiles si hay progreso guardado; Weak Form Catcher muestra 40 frases distintas entre partidas; Falsos Amigos respeta el nivel elegido; Memory Match carga palabras distintas cada partida y pronuncia la palabra al formar cada pareja.
- [ ] Ningún archivo nuevo o modificado por este plan supera 250 líneas.

## Riesgos y matices

- El contenido nuevo de Weak Form Catcher (Task B3) es un borrador propio, no de un hablante nativo — debe revisarse antes de publicarse a usuarios reales (igual que planteaba el riesgo original de plan 052).
- `getAllContrastProgress` ya maneja su propio fallback offline (caché Dexie); Fase A no añade una ruta de red nueva, solo un consumidor más.
- Si el catálogo de `essential-words` cambia de forma (campos de `CatalogIndexEntry` o `EssentialWord`), Task D1 debe releerse contra los tipos reales antes de escribir el código — los campos usados aquí (`translation`, `ipa_strong`, `chunk`, `cefr_level`) ya existen hoy en `lib/essential-words/types.ts`.
- Fase D cambia la firma de `useMemoryMatchLoop` (ya no recibe `words`, ahora `startGame` es async y recibe `level`). No hay otros llamadores del hook fuera de `MemoryMatchSession.tsx` (confirmar con `git grep -n "useMemoryMatchLoop"` antes de dar la fase por cerrada).

## Cierre

Estados por fase: TODO / IN PROGRESS / DONE / BLOCKED con evidencia (salida de tests). Actualizar `plans/README.md` con una fila para el plan 053 al terminar.
