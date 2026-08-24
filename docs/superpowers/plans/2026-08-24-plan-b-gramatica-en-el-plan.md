# Plan B — Gramática con plaza fija en el plan diario

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garantizar un paso de gramática todos los días, elegido por los temas débiles del usuario, que termine siempre en producción libre (hablar o escribir) en vez de en reordenar palabras.

**Architecture:** Hoy la gramática entra por `sentence_builder` (reorder_words), que además solo aparece si fallan habla conectada y falsos amigos. Este plan crea un paso `grammar_focus` con reserva de plaza en el compositor, alimentado por un mapa tema→mazo ampliado y por un umbral de debilidad más sensible. El paso presenta la regla (desde el JSON del mazo que ya existe) y luego exige producirla.

**Tech Stack:** TypeScript, Vitest, Next.js server components, JSON decks en `public/grammar-decks/`.

**Cubre el problema #3 de la auditoría.** Depende del **Plan A** (usa `SpeechConstraint` y `generateSpokenProductionFromWordBank`).

---

## File Structure

| Archivo | Responsabilidad |
| - | - |
| `lib/practice/topic-decks.ts` (modificar) | Ampliar `TOPIC_DECK_MAP` con la cobertura B1/B2 que falta y bajar el umbral de debilidad. |
| `lib/practice/daily-plan/grammar-focus.ts` (nuevo) | Construir el paso `grammar_focus`: regla + producción restringida. |
| `lib/practice/grammar-constraint-map.ts` (nuevo) | Mapa puro deck slug → `SpeechConstraintId`, para que la producción practique la estructura del mazo. |
| `lib/practice/types.ts` (modificar) | Añadir `'grammar_focus'` a `DailyStepKind` y el campo `grammarRule`. |
| `lib/practice/daily-plan/composer.ts` (modificar) | Reservar plaza fija para el paso de gramática. |
| `lib/practice/daily-plan/policy.ts` (modificar) | Nueva razón de selección `grammar_slot` con prioridad alta. |

---

## Task 1: Ampliar el mapa tema → mazo

**Files:**
- Modify: `lib/practice/topic-decks.ts`
- Test: `lib/practice/__tests__/topic-decks-coverage.test.ts`

**Contexto:** `TOPIC_DECK_MAP` tiene 20 entradas para 240 mazos, y no cubre present perfect, condicionales, modales, pasiva, gerundios ni estilo indirecto — justo los huecos B1 declarados por la usuaria. Además `deckSlugForWeakTopics` exige `errorRate > 0.4 && sampleCount >= 3`, que en la práctica casi nunca se cumple.

- [ ] **Step 1: Write the failing test**

Create `lib/practice/__tests__/topic-decks-coverage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  TOPIC_DECK_MAP,
  deckSlugForTopic,
  deckSlugForWeakTopics,
  WEAK_TOPIC_MIN_ERROR_RATE,
  WEAK_TOPIC_MIN_SAMPLES,
} from '@/lib/practice/topic-decks'

const DECKS_DIR = path.join(process.cwd(), 'public', 'grammar-decks')

describe('TOPIC_DECK_MAP coverage', () => {
  it('covers the B1 structures the learner is missing', () => {
    const required = [
      'present perfect',
      'conditional',
      'modal',
      'passive',
      'gerund',
      'reported speech',
      'phrasal verb',
      'relative clause',
      'used to',
      'connector',
    ]
    for (const keyword of required) {
      expect(deckSlugForTopic(keyword), `no deck for "${keyword}"`).not.toBeNull()
    }
  })

  it('points every mapping at a deck file that exists', () => {
    for (const { keyword, deckSlug } of TOPIC_DECK_MAP) {
      const file = path.join(DECKS_DIR, `${deckSlug}.json`)
      expect(fs.existsSync(file), `${keyword} → missing deck ${deckSlug}.json`).toBe(true)
    }
  })

  it('has no duplicate keywords', () => {
    const keywords = TOPIC_DECK_MAP.map((e) => e.keyword)
    expect(new Set(keywords).size).toBe(keywords.length)
  })
})

describe('weak topic thresholds', () => {
  it('triggers on a moderate error rate, not only a severe one', () => {
    expect(WEAK_TOPIC_MIN_ERROR_RATE).toBeLessThanOrEqual(0.25)
    expect(WEAK_TOPIC_MIN_SAMPLES).toBeLessThanOrEqual(2)
  })

  it('selects a deck for a topic failed twice out of three', () => {
    const slug = deckSlugForWeakTopics([
      { topic: 'present perfect', errorRate: 0.3, sampleCount: 2 },
    ])
    expect(slug).not.toBeNull()
  })

  it('ignores topics with no evidence at all', () => {
    expect(deckSlugForWeakTopics([])).toBeNull()
    expect(
      deckSlugForWeakTopics([{ topic: 'present perfect', errorRate: 0, sampleCount: 5 }]),
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/__tests__/topic-decks-coverage.test.ts`
Expected: FAIL — `WEAK_TOPIC_MIN_ERROR_RATE` is not exported, and `deckSlugForTopic('present perfect')` returns null.

- [ ] **Step 3: Verify the deck slugs before writing them**

Run this to confirm each slug used below actually exists:

```bash
for s in a2-presente-perfecto-experiencias b1-segundo-condicional b1-condicional-cero \
  b1-modales-deduccion b1-voz-pasiva-consejos b1-gerundios-infinitivos b1-estilo-indirecto \
  b1-phrasal-verbs-tipos b1-pronombres-clausulas-relativas a2-used-to b1-conectores-discurso \
  a2-experiencias-pasadas-planes b1-pasado-perfecto b1-presente-perfecto-continuo \
  a2-will-going-to a2-obligacion-prohibicion b1-wish-presente b1-habitos-pasados; do
  test -f "public/grammar-decks/$s.json" && echo "OK  $s" || echo "MISSING  $s"
done
```

Expected: every line `OK`. If any is `MISSING`, run `ls public/grammar-decks/ | grep <tema>` and substitute the real slug in the next step.

- [ ] **Step 4: Rewrite the map and thresholds**

In `lib/practice/topic-decks.ts`, replace the whole file with:

```ts
/**
 * Maps weak grammar topics (as reported by the AI Coach and by exercise
 * results) to grammar-deck slugs under public/grammar-decks/.
 * Keys are lowercase keyword fragments matched with .includes().
 *
 * Ordering matters: more specific keywords must come before the generic ones
 * they contain ("present perfect continuous" before "present perfect", and
 * both before "perfect"), because the first match wins.
 */
export const TOPIC_DECK_MAP: Array<{ keyword: string; deckSlug: string }> = [
  // ── Tenses ────────────────────────────────────────────────────────────────
  { keyword: 'present perfect continuous', deckSlug: 'b1-presente-perfecto-continuo' },
  { keyword: 'present perfect',    deckSlug: 'a2-presente-perfecto-experiencias' },
  { keyword: 'presente perfecto',  deckSlug: 'a2-presente-perfecto-experiencias' },
  { keyword: 'past perfect',       deckSlug: 'b1-pasado-perfecto' },
  { keyword: 'past continuous',    deckSlug: 'a2-pasado-continuo' },
  { keyword: 'past simple',        deckSlug: 'a2-experiencias-pasadas-planes' },
  { keyword: 'pasado',             deckSlug: 'a2-experiencias-pasadas-planes' },
  { keyword: 'used to',            deckSlug: 'a2-used-to' },
  { keyword: 'past habit',         deckSlug: 'b1-habitos-pasados' },
  { keyword: 'future',             deckSlug: 'a2-will-going-to' },
  { keyword: 'futuro',             deckSlug: 'a2-will-going-to' },
  { keyword: 'going to',           deckSlug: 'a2-will-going-to' },

  // ── Conditionals & hypotheticals ──────────────────────────────────────────
  { keyword: 'second conditional', deckSlug: 'b1-segundo-condicional' },
  { keyword: 'zero conditional',   deckSlug: 'b1-condicional-cero' },
  { keyword: 'first conditional',  deckSlug: 'b1-primer-condicional-pasado-continuo' },
  { keyword: 'conditional',        deckSlug: 'b1-segundo-condicional' },
  { keyword: 'condicional',        deckSlug: 'b1-segundo-condicional' },
  { keyword: 'wish',               deckSlug: 'b1-wish-presente' },

  // ── Modality, voice, non-finite ───────────────────────────────────────────
  { keyword: 'modal',              deckSlug: 'b1-modales-deduccion' },
  { keyword: 'obligation',         deckSlug: 'a2-obligacion-prohibicion' },
  { keyword: 'passive',            deckSlug: 'b1-voz-pasiva-consejos' },
  { keyword: 'pasiva',             deckSlug: 'b1-voz-pasiva-consejos' },
  { keyword: 'gerund',             deckSlug: 'b1-gerundios-infinitivos' },
  { keyword: 'infinitive',         deckSlug: 'b1-gerundios-infinitivos' },
  { keyword: 'reported speech',    deckSlug: 'b1-estilo-indirecto' },
  { keyword: 'estilo indirecto',   deckSlug: 'b1-estilo-indirecto' },

  // ── Discourse & structure ─────────────────────────────────────────────────
  { keyword: 'relative clause',    deckSlug: 'b1-pronombres-clausulas-relativas' },
  { keyword: 'connector',          deckSlug: 'b1-conectores-discurso' },
  { keyword: 'conector',           deckSlug: 'b1-conectores-discurso' },
  { keyword: 'phrasal verb',       deckSlug: 'b1-phrasal-verbs-tipos' },
  { keyword: 'comparativ',         deckSlug: 'b1-comparativos-planes-futuros' },
  { keyword: 'question',           deckSlug: 'a1-preguntas-do-does' },
  { keyword: 'negative',           deckSlug: 'b1-preguntas-negativas-recomendaciones' },

  // ── Word classes ──────────────────────────────────────────────────────────
  { keyword: 'article',            deckSlug: 'a1-articulos-basicos' },
  { keyword: 'pronoun',            deckSlug: 'a1-pronombres-objeto' },
  { keyword: 'determiner',         deckSlug: 'a2-determinantes' },
  { keyword: 'adjective',          deckSlug: 'a2-orden-adjetivos' },
  { keyword: 'preposition',        deckSlug: 'b1-preposiciones-dependientes' },
  { keyword: 'quantifier',         deckSlug: 'b1-cuantificadores' },
  { keyword: 'verb',               deckSlug: 'a1-verbos-comunes' },

  // ── Pronunciation & domain ────────────────────────────────────────────────
  { keyword: 'causative',          deckSlug: 'b2-causativo' },
  { keyword: 'connected speech',   deckSlug: 'cs-linking' },
  { keyword: 'reduction',          deckSlug: 'cs-reductions' },
  { keyword: 'interview',          deckSlug: 'biz-entrevistas-trabajo' },
  { keyword: 'finance',            deckSlug: 'b1-finanzas-personales' },
  { keyword: 'tech',               deckSlug: 'tech-ingles-programadores' },
  { keyword: 'ai',                 deckSlug: 'tech-ingles-inteligencia-artificial' },
  { keyword: 'code review',        deckSlug: 'biz-code-review' },
  { keyword: 'pull request',       deckSlug: 'biz-code-review' },
  { keyword: 'standup',            deckSlug: 'biz-code-review' },
  { keyword: 'hedging',            deckSlug: 'biz-code-review' },
]

/**
 * Weakness thresholds.
 *
 * Previously 0.4 / 3: a topic had to be failed almost half the time, three
 * times over, before it could ever be targeted — so in practice the grammar
 * targeting almost never fired. Lowered so two attempts with one mistake is
 * enough evidence to schedule practice.
 */
export const WEAK_TOPIC_MIN_ERROR_RATE = 0.2
export const WEAK_TOPIC_MIN_SAMPLES = 2

export function deckSlugForTopic(topic: string): string | null {
  const normalized = topic.toLowerCase()
  return TOPIC_DECK_MAP.find((entry) => normalized.includes(entry.keyword))?.deckSlug ?? null
}

export interface WeakTopicLike {
  topic: string
  errorRate: number
  sampleCount: number
}

/** Weak topics that clear the evidence thresholds, worst first. */
export function eligibleWeakTopics(weakTopics: readonly WeakTopicLike[]): WeakTopicLike[] {
  return weakTopics
    .filter(
      (t) => t.errorRate >= WEAK_TOPIC_MIN_ERROR_RATE && t.sampleCount >= WEAK_TOPIC_MIN_SAMPLES,
    )
    .sort((a, b) => b.errorRate - a.errorRate)
}

/**
 * Given a list of weak topics, return the deck slug of the best match.
 * Returns null if no keyword matches any topic.
 */
export function deckSlugForWeakTopics(weakTopics: readonly WeakTopicLike[]): string | null {
  for (const { topic } of eligibleWeakTopics(weakTopics)) {
    const slug = deckSlugForTopic(topic)
    if (slug) return slug
  }
  return null
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npx vitest run lib/practice/__tests__/topic-decks-coverage.test.ts lib/practice/__tests__/`
Expected: PASS. If an existing test asserted the old 0.4/3 thresholds, update it to the new constants — the looser threshold is the intended behaviour change.

- [ ] **Step 6: Commit**

```bash
git add lib/practice/topic-decks.ts lib/practice/__tests__/topic-decks-coverage.test.ts
git commit -m "feat(practice): broaden weak-topic deck coverage and lower thresholds"
```

---

## Task 2: Mapa mazo → restricción de producción

**Files:**
- Create: `lib/practice/grammar-constraint-map.ts`
- Test: `lib/practice/__tests__/grammar-constraint-map.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/__tests__/grammar-constraint-map.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { constraintIdForDeck } from '@/lib/practice/grammar-constraint-map'
import { constraintById } from '@/lib/exercises/speech-constraints'

describe('constraintIdForDeck', () => {
  it('maps a past-tense deck to the past narrative constraint', () => {
    expect(constraintIdForDeck('a2-experiencias-pasadas-planes')).toBe('past_simple_narrative')
  })

  it('maps the present perfect deck to the present perfect constraint', () => {
    expect(constraintIdForDeck('a2-presente-perfecto-experiencias'))
      .toBe('present_perfect_experience')
  })

  it('maps the second conditional deck to the hypothesis constraint', () => {
    expect(constraintIdForDeck('b1-segundo-condicional')).toBe('second_conditional')
  })

  it('returns null for a deck with no natural constraint', () => {
    expect(constraintIdForDeck('a1-alfabeto-deletreo')).toBeNull()
  })

  it('only ever names constraints that exist', () => {
    const decks = [
      'a2-experiencias-pasadas-planes',
      'a2-presente-perfecto-experiencias',
      'b1-segundo-condicional',
      'a2-will-going-to',
      'b1-comparativos-planes-futuros',
      'b1-conectores-discurso',
      'a2-pasado-continuo',
    ]
    for (const deck of decks) {
      const id = constraintIdForDeck(deck)
      expect(id, `no constraint for ${deck}`).not.toBeNull()
      expect(constraintById(id!), `unknown constraint ${id}`).not.toBeNull()
    }
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/__tests__/grammar-constraint-map.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/practice/grammar-constraint-map.ts`:

```ts
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'

/**
 * Deck slug → the spoken constraint that makes the learner USE that deck's
 * structure. Without this the grammar step would explain a rule and then ask
 * for a sentence the learner could satisfy in present simple.
 *
 * Matched by prefix fragment (`.includes`), so one entry covers deck families.
 */
const DECK_CONSTRAINT_MAP: Array<{ fragment: string; constraintId: SpeechConstraintId }> = [
  { fragment: 'presente-perfecto',   constraintId: 'present_perfect_experience' },
  { fragment: 'pasado-perfecto',     constraintId: 'past_simple_narrative' },
  { fragment: 'pasado-continuo',     constraintId: 'past_continuous_interrupted' },
  { fragment: 'experiencias-pasadas', constraintId: 'past_simple_narrative' },
  { fragment: 'habitos-pasados',     constraintId: 'past_simple_narrative' },
  { fragment: 'used-to',             constraintId: 'past_simple_narrative' },
  { fragment: 'segundo-condicional', constraintId: 'second_conditional' },
  { fragment: 'condicional',         constraintId: 'second_conditional' },
  { fragment: 'wish',                constraintId: 'second_conditional' },
  { fragment: 'will-going-to',       constraintId: 'future_plan' },
  { fragment: 'planes-futuros',      constraintId: 'future_plan' },
  { fragment: 'futuro',              constraintId: 'future_plan' },
  { fragment: 'comparativ',          constraintId: 'comparison' },
  { fragment: 'superlativ',          constraintId: 'comparison' },
  { fragment: 'conectores',          constraintId: 'opinion_connector' },
  { fragment: 'opiniones',           constraintId: 'opinion_connector' },
  { fragment: 'preguntas',           constraintId: 'question_form' },
  { fragment: 'negativas',           constraintId: 'negative_experience' },
  { fragment: 'obligacion',          constraintId: 'justify_decision' },
  { fragment: 'modales',             constraintId: 'justify_decision' },
  { fragment: 'cuantificadores',     constraintId: 'quantity_frequency' },
  { fragment: 'adverbios-frecuencia', constraintId: 'quantity_frequency' },
]

/** The constraint a grammar deck should be practised with, or null. */
export function constraintIdForDeck(deckSlug: string): SpeechConstraintId | null {
  const slug = deckSlug.toLowerCase()
  return DECK_CONSTRAINT_MAP.find((e) => slug.includes(e.fragment))?.constraintId ?? null
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/practice/__tests__/grammar-constraint-map.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/practice/grammar-constraint-map.ts lib/practice/__tests__/grammar-constraint-map.test.ts
git commit -m "feat(practice): map grammar decks to their spoken constraint"
```

---

## Task 3: Construir el paso `grammar_focus`

**Files:**
- Create: `lib/practice/daily-plan/grammar-focus.ts`
- Modify: `lib/practice/types.ts` (`DailyStep.kind` union + `grammarRule` field)
- Test: `lib/practice/daily-plan/__tests__/grammar-focus.test.ts`

- [ ] **Step 1: Inspect the deck shape you will read**

Run: `head -30 public/grammar-decks/a2-presente-perfecto-experiencias.json`

Confirm it has `meta.title`, `meta.goal`, and `cards[].blocks[]` with a `rules` block containing `rows: [{ key, value }]`. The implementation below reads exactly those fields.

- [ ] **Step 2: Add the step kind and rule field**

In `lib/practice/types.ts`, add `'grammar_focus'` to the **`DailyStepKind`** union at line 189 (alongside `'word_review'`, `'sentence_builder'`, etc.) with a trailing comment, and add to `interface DailyStep`:

```ts
  /** Rule shown before the grammar step's production exercises. */
  grammarRule?: {
    deckSlug: string
    title: string
    goal: string
    /** Two or three `key: value` rows lifted from the deck's rules block. */
    rows: Array<{ key: string; value: string }>
  }
```

- [ ] **Step 3: Write the failing test**

Create `lib/practice/daily-plan/__tests__/grammar-focus.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildGrammarFocusStep } from '@/lib/practice/daily-plan/grammar-focus'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(i: number): WordBankEntry {
  return {
    id: `w${i}`,
    text: `word${i}`,
    meaning: `meaning ${i}`,
    example: `I really enjoyed the word${i} last summer.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

const words = Array.from({ length: 6 }, (_, i) => entry(i))

describe('buildGrammarFocusStep', () => {
  it('returns null without a deck slug', async () => {
    expect(await buildGrammarFocusStep(null, words)).toBeNull()
  })

  it('returns null when there are no usable words', async () => {
    expect(await buildGrammarFocusStep('b1-segundo-condicional', [])).toBeNull()
  })

  it('builds a step carrying the deck rule', async () => {
    const step = await buildGrammarFocusStep('a2-presente-perfecto-experiencias', words)
    expect(step).not.toBeNull()
    expect(step!.kind).toBe('grammar_focus')
    expect(step!.grammarRule?.deckSlug).toBe('a2-presente-perfecto-experiencias')
    expect(step!.grammarRule?.title.length).toBeGreaterThan(0)
    expect(step!.grammarRule!.rows.length).toBeGreaterThan(0)
  })

  it('produces spoken production exercises, never reorder', async () => {
    const step = await buildGrammarFocusStep('b1-segundo-condicional', words)
    expect(step).not.toBeNull()
    const types = step!.exercises.map((ex) =>
      ex.payload.kind === 'generic' ? ex.payload.data.type : 'other',
    )
    expect(types).toContain('spoken_production')
    expect(types).not.toContain('reorder_words')
  })

  it('applies the deck constraint to its exercises', async () => {
    const step = await buildGrammarFocusStep('b1-segundo-condicional', words)
    const first = step!.exercises.find((ex) => ex.payload.kind === 'generic')
    expect(first).toBeDefined()
    const data = (first!.payload as { data: { constraint?: { id: string } } }).data
    expect(data.constraint?.id).toBe('second_conditional')
  })

  it('survives an unknown deck slug without throwing', async () => {
    await expect(buildGrammarFocusStep('does-not-exist', words)).resolves.toBeNull()
  })
})
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/grammar-focus.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Write the implementation**

Create `lib/practice/daily-plan/grammar-focus.ts`:

```ts
import { generateSpokenProductionFromWordBank } from '@/lib/exercises/generators/production'
import { constraintIdForDeck } from '@/lib/practice/grammar-constraint-map'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { DailyStep, PracticeContext } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { dedupeByContentId } from './selectors'

/** Production items in the grammar step. Enough reps to feel the pattern. */
const GRAMMAR_PRODUCTION_COUNT = 5

interface DeckRuleRow {
  key: string
  value: string
}

interface LoadedDeckRule {
  title: string
  goal: string
  rows: DeckRuleRow[]
}

/**
 * Read the rule summary out of a grammar deck JSON.
 * Returns null for a missing deck or an unexpected shape — a grammar step is
 * optional, so a bad deck must never break the whole daily plan.
 */
async function loadDeckRule(deckSlug: string): Promise<LoadedDeckRule | null> {
  try {
    const res = await fetch(`/grammar-decks/${deckSlug}.json`)
    if (!res.ok) return null
    const json: unknown = await res.json()
    return extractRule(json)
  } catch {
    return null
  }
}

/** Pure extraction so it can be unit-tested without network. */
export function extractRule(json: unknown): LoadedDeckRule | null {
  if (!json || typeof json !== 'object') return null
  const deck = json as {
    meta?: { title?: unknown; titleEmphasis?: unknown; goal?: unknown }
    cards?: Array<{ blocks?: Array<{ type?: unknown; rows?: unknown }> }>
  }

  const titleParts = [deck.meta?.title, deck.meta?.titleEmphasis]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
  const title = titleParts.join(' ')
  const goal = typeof deck.meta?.goal === 'string' ? deck.meta.goal : ''
  if (!title) return null

  const rows: DeckRuleRow[] = []
  for (const card of deck.cards ?? []) {
    for (const block of card.blocks ?? []) {
      if (block.type !== 'rules' || !Array.isArray(block.rows)) continue
      for (const row of block.rows) {
        if (!row || typeof row !== 'object') continue
        const { key, value } = row as { key?: unknown; value?: unknown }
        if (typeof key === 'string' && typeof value === 'string') {
          rows.push({ key, value })
        }
        if (rows.length >= 3) break
      }
      if (rows.length >= 3) break
    }
    if (rows.length >= 3) break
  }

  if (rows.length === 0) return null
  return { title, goal, rows }
}

/**
 * Grammar step: show the rule, then make the learner PRODUCE it.
 *
 * Deliberately not reorder_words — being handed every token is recognition
 * with extra steps, and recognition is exactly what the learner already has.
 */
export async function buildGrammarFocusStep(
  deckSlug: string | null,
  words: WordBankEntry[],
  context: PracticeContext = 'daily',
): Promise<DailyStep | null> {
  if (!deckSlug || words.length === 0) return null

  const rule = await loadDeckRule(deckSlug)
  if (!rule) return null

  const constraintId = constraintIdForDeck(deckSlug)
  const { exercises: generated } = generateSpokenProductionFromWordBank(
    words,
    GRAMMAR_PRODUCTION_COUNT,
    constraintId ? [constraintId] : [],
  )

  const exercises = dedupeByContentId(
    generated.map((ex) => fromGenericExercise(ex, context)),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'grammar_focus',
    id: `grammar_focus:${deckSlug}`,
    title: 'Estructura del día',
    subtitle: rule.goal || rule.title,
    icon: 'Blocks',
    exercises,
    grammarRule: {
      deckSlug,
      title: rule.title,
      goal: rule.goal,
      rows: rule.rows,
    },
    estMinutes: Math.max(3, Math.round(exercises.length * 1.3)),
  }
}
```

- [ ] **Step 6: Make the test able to read decks**

The test runs in Node, where relative `fetch('/grammar-decks/...')` has no origin. Add this mock at the top of `lib/practice/daily-plan/__tests__/grammar-focus.test.ts`, right after the imports:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'

const realFetch = globalThis.fetch

beforeAll(() => {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const slug = url.split('/').pop()?.replace('.json', '') ?? ''
    const file = path.join(process.cwd(), 'public', 'grammar-decks', `${slug}.json`)
    if (!fs.existsSync(file)) {
      return new Response('not found', { status: 404 })
    }
    return new Response(fs.readFileSync(file, 'utf8'), { status: 200 })
  }) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = realFetch
})
```

- [ ] **Step 7: Run the test and confirm it passes**

Run: `npx vitest run lib/practice/daily-plan/__tests__/grammar-focus.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/practice/daily-plan/grammar-focus.ts lib/practice/types.ts lib/practice/daily-plan/__tests__/grammar-focus.test.ts
git commit -m "feat(daily): add grammar_focus step that ends in production"
```

---

## Task 4: Reservar plaza fija en el compositor

**Files:**
- Modify: `lib/practice/daily-plan/policy.ts` (add `grammar_slot` reason)
- Modify: `lib/practice/daily-plan/composer.ts:240-265`
- Test: `lib/practice/daily-plan/__tests__/grammar-slot.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/grammar-slot.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { selectDailyCandidates, candidate } from '@/lib/practice/daily-plan/policy'
import type { DailyStep } from '@/lib/practice/types'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return {
    kind,
    id,
    title: id,
    subtitle: '',
    icon: 'Sparkles',
    exercises: [],
    estMinutes: 2,
  } as DailyStep
}

describe('grammar slot priority', () => {
  it('keeps the grammar step even when lower-priority steps are plentiful', () => {
    const candidates = [
      candidate(step('variety-1', 'connected_speech'), {
        reason: 'variety', targetRefs: [], source: 'connected_speech',
      }),
      candidate(step('variety-2', 'false_friends'), {
        reason: 'variety', targetRefs: [], source: 'false_friends',
      }),
      candidate(step('variety-3', 'reader'), {
        reason: 'variety', targetRefs: [], source: 'reader',
      }),
      candidate(step('grammar_focus:x', 'grammar_focus'), {
        reason: 'grammar_slot', targetRefs: [], source: 'grammar_focus',
      }),
    ]

    const selected = selectDailyCandidates(candidates, { limit: 2 })
    expect(selected.map((s) => s.id)).toContain('grammar_focus:x')
  })

  it('still lets due SRS work outrank the grammar slot', () => {
    const candidates = [
      candidate(step('due-1', 'word_review'), {
        reason: 'due', targetRefs: [], source: 'word_review',
      }),
      candidate(step('grammar_focus:x', 'grammar_focus'), {
        reason: 'grammar_slot', targetRefs: [], source: 'grammar_focus',
      }),
    ]
    const selected = selectDailyCandidates(candidates, { limit: 1 })
    expect(selected[0]!.id).toBe('due-1')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/grammar-slot.test.ts`
Expected: FAIL — `'grammar_slot'` is not a valid `DailySelectionReason`.

- [ ] **Step 3: Add the reason**

In `lib/practice/types.ts`, add `'grammar_slot'` to the `DailySelectionReason` union.

In `lib/practice/daily-plan/policy.ts`, add it to `REASON_PRIORITY` just below the `due` tier:

```ts
const REASON_PRIORITY: Record<DailySelectionReason, number> = {
  due: 0,
  verification_due: 0,
  // The grammar slot outranks everything except genuinely due SRS work:
  // its whole purpose is to stop phonetics from silently evicting grammar.
  grammar_slot: 1,
  recent_error: 2,
  weak_target: 2,
  route_next: 3,
  saved_intent: 4,
  variety: 5,
}
```

- [ ] **Step 4: Run the policy test and confirm it passes**

Run: `npx vitest run lib/practice/daily-plan/__tests__/grammar-slot.test.ts lib/practice/daily-plan/__tests__/`
Expected: PASS.

- [ ] **Step 5: Wire the step into the composer**

In `lib/practice/daily-plan/composer.ts`:

Add the import:

```ts
import { buildGrammarFocusStep } from './grammar-focus'
```

After the existing line that computes `weakDeckSlug` (around line 242), add:

```ts
  // Grammar gets a reserved slot: previously it only appeared when both
  // connected speech and false friends failed to build, so most days shipped
  // no grammar practice at all.
  const grammarStep = await buildGrammarFocusStep(
    weakDeckSlug ?? DEFAULT_GRAMMAR_DECK,
    reviewWords,
  )
```

Add near the other constants at the top of the file:

```ts
/** Deck used when the learner has no weak-topic evidence yet (B1 baseline). */
const DEFAULT_GRAMMAR_DECK = 'a2-presente-perfecto-experiencias'
```

Then, in the `candidates` array construction (around line 395), include the grammar step and give it its reason. Change:

```ts
  const candidates = [...steps, ...(studyDeckStep ? [studyDeckStep] : []), ...(missionStep ? [missionStep] : [])]
```

to:

```ts
  const candidates = [
    ...steps,
    ...(grammarStep ? [grammarStep] : []),
    ...(studyDeckStep ? [studyDeckStep] : []),
    ...(missionStep ? [missionStep] : []),
  ]
```

And in `reasonForStep`, add the grammar case as the first check inside the function body:

```ts
    if (step.kind === 'grammar_focus') return 'grammar_slot' as const
```

- [ ] **Step 6: Run the full daily-plan suite**

Run: `npx vitest run lib/practice/daily-plan/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0. Composer tests asserting an exact step list will now include `grammar_focus` — update those expectations.

- [ ] **Step 7: Commit**

```bash
git add lib/practice/daily-plan/policy.ts lib/practice/daily-plan/composer.ts lib/practice/types.ts lib/practice/daily-plan/__tests__/grammar-slot.test.ts
git commit -m "feat(daily): reserve a fixed slot for the grammar step"
```

---

## Task 5: Renderizar la regla antes de los ejercicios

**Files:**
- Create: `components/daily/GrammarRuleCard.tsx`
- Modify: `components/daily/DailyStepSession.tsx` (render the card for `grammar_focus`)

- [ ] **Step 1: Find the existing intro pattern**

The `false_friends` step already renders an intro before its exercises via `FalseFriendsIntroStep`. Read it to match the convention:

Run: `cat components/daily/FalseFriendsIntroStep.tsx`

- [ ] **Step 2: Write the component**

Create `components/daily/GrammarRuleCard.tsx`:

```tsx
// Planned structure:
// <GrammarRuleCard>
//   <RuleHeading />
//   <RuleRows />
// </GrammarRuleCard>

import type { DailyStep } from '@/lib/practice/types'

interface Props {
  rule: NonNullable<DailyStep['grammarRule']>
}

/** The rule shown before the grammar step's production exercises. */
export function GrammarRuleCard({ rule }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-title-sm font-semibold text-fg">{rule.title}</h2>
        {rule.goal && <p className="text-body-sm text-fg-muted">{rule.goal}</p>}
      </header>

      <dl className="flex flex-col gap-2">
        {rule.rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-0.5">
            <dt className="text-label-sm font-medium text-fg-muted">{row.key}</dt>
            <dd className="text-body-sm text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

Before committing, verify the token names against the project's own classes:

Run: `grep -rn "text-title-sm\|text-body-sm\|border-border\|bg-surface" components/daily/ | head -5`

If any class does not appear elsewhere in `components/daily/`, replace it with the token that file actually uses. Never hardcode a color.

- [ ] **Step 3: Render it in the session**

In `components/daily/DailyStepSession.tsx`, find where `FalseFriendsIntroStep` is conditionally rendered and add an equivalent branch:

```tsx
      {step.kind === 'grammar_focus' && step.grammarRule && (
        <GrammarRuleCard rule={step.grammarRule} />
      )}
```

with the import:

```tsx
import { GrammarRuleCard } from '@/components/daily/GrammarRuleCard'
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx next lint --dir components/daily`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add components/daily/GrammarRuleCard.tsx components/daily/DailyStepSession.tsx
git commit -m "feat(daily): render the grammar rule before its production exercises"
```

---

## Task 6: Verificación completa

- [ ] **Step 1: Full suite**

Run: `npx vitest run && npx tsc --noEmit && npx next lint`
Expected: all green, exit 0.

- [ ] **Step 2: Manual smoke test**

Run `pnpm dev`, open `/daily`, and confirm:
- A step titled **"Estructura del día"** appears every day, not only when other steps fail.
- It opens with a rule card (form + examples) taken from a real grammar deck.
- Its exercises are spoken production carrying the deck's constraint badge — no reorder-words.
- After failing a grammar topic a couple of times, the step targets that topic's deck on a later day.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "test(daily): update composer expectations for the grammar slot"
```

---

## Notas de riesgo

- **`fetch` relativo en servidor.** `buildGrammarFocusStep` usa `fetch('/grammar-decks/...')`, que funciona en cliente pero no en un Server Component sin origen absoluto. Confirma dónde se ejecuta `buildDailyPlan` (`grep -rn "buildDailyPlan" hooks app`): si corre en servidor, sustituye el `fetch` por `fs.readFile` a través de `lib/courses/grammar-deck/decks.ts`, que ya resuelve `process.cwd()`.
- **Offline.** El paso de gramática depende de leer un JSON de `public/`, que el service worker debería cachear. Verifica que `app/sw-runtime-caching.ts` incluye `/grammar-decks/` antes de dar el plan por terminado; si no, añádelo.
- **Un solo mazo por defecto.** `DEFAULT_GRAMMAR_DECK` fija present perfect para usuarios sin evidencia. Es intencional (es el hueco B1 declarado), pero rota este valor cuando el Plan C empiece a producir datos reales de debilidad.
