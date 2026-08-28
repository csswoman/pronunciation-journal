# Scripted Speaking Missions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir misiones de diálogo con guión al AI Coach: dos voces, grabación del estudiante, feedback de pronunciación por sílaba, comparación de audio y puntuación persistente por guión.

**Architecture:** `OralMission` se convierte en unión discriminada por `mode`; las misiones actuales pasan a `mode: 'conversational'` sin otro cambio, y la variante `'scripted'` reusa la state machine, la persistencia (`missionSessions`) y la cadencia del plan diario que ya existen. El hueco técnico real es un módulo puro nuevo que agrupa el `PhonemeAlignment[]` ya producido por `analyzePhonemes` en sílabas coloreadas.

**Tech Stack:** TypeScript, Next.js 16 App Router, React 19, Vitest, Dexie, Tailwind v4, Web Speech API, `hyphen/en`.

**Spec:** `docs/superpowers/specs/2026-08-27-scripted-speaking-missions-design.md`

---

## Contexto imprescindible para quien implementa

Lee esto antes de la Tarea 1. Ahorra horas.

**Los fonemas son ARPAbet, no IPA.** El diccionario CMU devuelve `IY`, `IH`,
`AE`, `TH`. El mapa `ARPABET_TO_IPA` en `lib/pronunciation/phonemes.ts:9`
traduce a IPA para mostrar. `stripStress` quita el dígito de acento (`IY1` →
`IY`). Al comparar fonemas, **siempre** compara sin acento.

**El scoring ya baja a fonema.** `analyzePhonemes(target, heard)` en
`lib/pronunciation/phonemes.ts:150` devuelve un `PhonemeResult` con
`alignment: PhonemeAlignment[]`, donde cada entrada tiene
`status: "correct" | "incorrect" | "missing"`. **No hay que construir esto.**

**Lo que falta** es que nadie sabe a qué sílaba pertenece cada fonema.

**La separación silábica es ortográfica, no fonética.** `resolveSyllableWord`
(`lib/pronunciation/syllable-separation.ts:20`) usa `hyphen/en` y es **async**
(importa la librería de forma diferida). Devuelve la palabra con `·` como
separador. Ortográfico ≠ fonético: `com·fort·a·ble` tiene 4 sílabas escritas
pero el CMU da fonemas para 3 habladas. **Esa discrepancia es la razón de que
la Tarea 2 exista.**

**Convención de tests.** Vitest. Entorno `node` por defecto; los tests que
necesitan DOM declaran `// @vitest-environment jsdom` en la primera línea.
Viven en `__tests__/` junto al código. Comando: `pnpm test <ruta>`.

**Reglas del proyecto que este plan debe respetar** (de `CLAUDE.md`):
prompts solo en `lib/ai-prompts.ts`; Gemini solo vía `/api/gemini/*`; Supabase
solo en `lib/*/queries.ts`; componentes ≤250 líneas y ≤8 props; Tailwind con
tokens, sin `style={{}}` salvo runtime; offline debe seguir funcionando.

---

## Estructura de archivos

**Fase 1 — Scoring silábico** (entregable solo)

| Archivo | Responsabilidad |
| - | - |
| `lib/pronunciation/arpabet-vowels.ts` (crear) | Set de vocales ARPAbet + `isVowelPhoneme` |
| `lib/pronunciation/syllable-scoring.ts` (crear) | Puro: `PhonemeAlignment[]` + sílabas → `SyllableResult[]` |
| `components/pronunciation-feedback/SyllableBreakdown.tsx` (crear) | Pinta sílabas verde/amarillo/rojo |
| `components/pronunciation-feedback/SyllableRemediation.tsx` (crear) | Contenido articulatorio del fonema culpable |

**Fase 2 — Misiones con guión** (depende de Fase 1)

| Archivo | Responsabilidad |
| - | - |
| `lib/ai-practice/missions/types.ts` (modificar) | Unión discriminada por `mode` |
| `lib/ai-practice/missions/registry.ts` (modificar) | `mode: 'conversational'` en las existentes |
| `lib/ai-practice/missions/scripted/catalog.ts` (crear) | Guiones autorados |
| `lib/ai-practice/missions/scripted/script-state.ts` (crear) | Avance por línea, mejor intento |
| `lib/ai-practice/missions/scripted/scoring.ts` (crear) | Score del diálogo por fonemas |
| `lib/ai-practice/missions/runner-registry.ts` (crear) | `mode` → runner (evita `switch`) |
| `lib/speech/model-audio.ts` (crear) | `resolveModelAudio`: pregrabado o TTS |
| `lib/db/index.ts` (modificar) | Tabla `generatedScripts` |
| `components/ai-coach/missions/scripted/*.tsx` (crear) | UI del runner |

**Fase 3 — Contexto del estudiante y generación** (depende de Fase 2)

| Archivo | Responsabilidad |
| - | - |
| `lib/ai-coach/learner-context.ts` (crear) | Snapshot CEFR + debilidades + SRS |
| `lib/ai-prompts.ts` (modificar) | Prompt de generación de guiones |
| `app/api/gemini/generate-script/route.ts` (crear) | Endpoint de generación |

**Fase 4 — Mejoras de conexión** (depende de Fase 3)

| Archivo | Responsabilidad |
| - | - |
| `lib/pronunciation/feedback/srs-priority-signal.ts` (crear) | Mejora 2, acotada y reversible |
| `lib/ai-practice/missions/scripted/review-script.ts` (crear) | Mejora 3 |

---

# FASE 1 — Scoring por sílaba

Entregable independiente: mejora el feedback de `SpeakScoredExercise` aunque
las misiones con guión nunca se construyan.

## Task 1: Vocales ARPAbet

**Files:**
- Create: `lib/pronunciation/arpabet-vowels.ts`
- Test: `lib/pronunciation/__tests__/arpabet-vowels.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { isVowelPhoneme } from '../arpabet-vowels'

describe('isVowelPhoneme', () => {
  it('reconoce monoftongos', () => {
    expect(isVowelPhoneme('IY')).toBe(true)
    expect(isVowelPhoneme('IH')).toBe(true)
    expect(isVowelPhoneme('AE')).toBe(true)
  })

  it('reconoce diptongos', () => {
    expect(isVowelPhoneme('AY')).toBe(true)
    expect(isVowelPhoneme('OW')).toBe(true)
  })

  it('rechaza consonantes', () => {
    expect(isVowelPhoneme('TH')).toBe(false)
    expect(isVowelPhoneme('P')).toBe(false)
  })

  it('ignora el dígito de acento', () => {
    expect(isVowelPhoneme('IY1')).toBe(true)
    expect(isVowelPhoneme('AH0')).toBe(true)
  })

  it('es indiferente a mayúsculas', () => {
    expect(isVowelPhoneme('iy')).toBe(true)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/pronunciation/__tests__/arpabet-vowels.test.ts`
Expected: FAIL — no existe el módulo `../arpabet-vowels`

- [ ] **Step 3: Implementa**

```ts
/**
 * Vocales del inventario ARPAbet (CMU). Son las 15 que produce el
 * diccionario en `lib/pronunciation/phonemes.ts`: 10 monoftongos + ER
 * (vocal r-coloreada) + 4 diptongos.
 *
 * Importa porque el núcleo silábico es siempre una vocal: fallar el núcleo
 * rompe la inteligibilidad ("ship" vs "sheep"), mientras que fallar una
 * consonante de borde solo suena raro.
 */
const ARPABET_VOWELS: ReadonlySet<string> = new Set([
  'AA', 'AE', 'AH', 'AO', 'EH', 'ER', 'IH', 'IY', 'UH', 'UW',
  'AW', 'AY', 'EY', 'OW', 'OY',
])

/** Quita el dígito de acento del CMU: `IY1` → `IY`. */
export function stripStressDigit(phoneme: string): string {
  return phoneme.replace(/\d+$/, '')
}

export function isVowelPhoneme(phoneme: string): boolean {
  return ARPABET_VOWELS.has(stripStressDigit(phoneme).toUpperCase())
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/pronunciation/__tests__/arpabet-vowels.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/arpabet-vowels.ts lib/pronunciation/__tests__/arpabet-vowels.test.ts
git commit -m "feat: add ARPAbet vowel detection for syllable nuclei"
```

---

## Task 2: Mapeo de fonemas a sílabas

El corazón de la Fase 1. Reparte un `PhonemeAlignment[]` plano entre las
sílabas de la palabra.

**El problema:** las sílabas vienen de hifenación **ortográfica**
(`com·fort·a·ble`, 4) y los fonemas del CMU son **fonéticos**
(`K AH M F ER T AH B AH L`). No hay correspondencia garantizada.

**La estrategia:** repartir por número de vocales. Cada sílaba hablada tiene
exactamente un núcleo vocálico, así que si el número de vocales del alignment
coincide con el número de sílabas ortográficas, el reparto es fiable. Si no
coincide, **devolvemos `null`** y la UI cae al feedback por fonema.

**Files:**
- Create: `lib/pronunciation/syllable-scoring.ts`
- Test: `lib/pronunciation/__tests__/syllable-scoring.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { scoreSyllables } from '../syllable-scoring'
import type { PhonemeAlignment } from '@/lib/types'

/** "happy" → HH AE P IY, sílabas hap·py */
const happy: PhonemeAlignment[] = [
  { phoneme: 'HH', status: 'correct' },
  { phoneme: 'AE', status: 'correct' },
  { phoneme: 'P', status: 'correct' },
  { phoneme: 'IY', status: 'correct' },
]

describe('scoreSyllables', () => {
  it('marca verde cuando todos los fonemas son correctos', () => {
    const result = scoreSyllables(happy, ['hap', 'py'])
    expect(result).not.toBeNull()
    expect(result!.map((s) => s.status)).toEqual(['correct', 'correct'])
    expect(result!.map((s) => s.text)).toEqual(['hap', 'py'])
  })

  it('marca rojo la sílaba cuyo núcleo vocálico falla', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['error', 'correct'])
  })

  it('marca amarillo cuando solo falla una consonante de borde', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'incorrect', got: 'F' },
      { phoneme: 'AE', status: 'correct' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['warning', 'correct'])
  })

  it('marca amarillo un fonema omitido en el borde', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'correct' },
      { phoneme: 'P', status: 'missing' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result!.map((s) => s.status)).toEqual(['warning', 'correct'])
  })

  it('expone el fonema culpable priorizando el núcleo', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'HH', status: 'incorrect', got: 'F' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['hap', 'py'])
    expect(result![0].culprit?.phoneme).toBe('AE')
  })

  it('devuelve null cuando las vocales no cuadran con las sílabas', () => {
    // "comfortable": 4 sílabas ortográficas, 3 vocales habladas.
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'K', status: 'correct' },
      { phoneme: 'AH', status: 'correct' },
      { phoneme: 'M', status: 'correct' },
      { phoneme: 'F', status: 'correct' },
      { phoneme: 'ER', status: 'correct' },
      { phoneme: 'T', status: 'correct' },
      { phoneme: 'B', status: 'correct' },
      { phoneme: 'AH', status: 'correct' },
      { phoneme: 'L', status: 'correct' },
    ]
    expect(scoreSyllables(alignment, ['com', 'fort', 'a', 'ble'])).toBeNull()
  })

  it('devuelve null con alignment vacío', () => {
    expect(scoreSyllables([], ['hap', 'py'])).toBeNull()
  })

  it('maneja una sola sílaba', () => {
    const alignment: PhonemeAlignment[] = [
      { phoneme: 'SH', status: 'correct' },
      { phoneme: 'IH', status: 'incorrect', got: 'IY' },
      { phoneme: 'P', status: 'correct' },
    ]
    const result = scoreSyllables(alignment, ['ship'])
    expect(result!.map((s) => s.status)).toEqual(['error'])
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/pronunciation/__tests__/syllable-scoring.test.ts`
Expected: FAIL — no existe `../syllable-scoring`

- [ ] **Step 3: Implementa**

```ts
import type { PhonemeAlignment } from '@/lib/types'
import { isVowelPhoneme } from './arpabet-vowels'

export type SyllableStatus = 'correct' | 'warning' | 'error'

export interface SyllableResult {
  /** Texto ortográfico de la sílaba, ej. "hap". */
  text: string
  /** Fonemas asignados a esta sílaba. */
  phonemes: PhonemeAlignment[]
  status: SyllableStatus
  /**
   * El fonema que explica el fallo, para la remediación. Núcleo primero;
   * si el núcleo está bien, el primer borde fallado. `null` si va en verde.
   */
  culprit: PhonemeAlignment | null
}

/**
 * Agrupa un alignment plano de fonemas en sílabas coloreadas.
 *
 * Devuelve `null` cuando el mapeo no es fiable — la hifenación de `hyphen/en`
 * es ortográfica y no siempre coincide con las sílabas habladas del CMU
 * ("comfortable" son 4 escritas y 3 habladas). Ante la duda preferimos que la
 * UI caiga al feedback por fonema antes que pintar sílabas inventadas.
 */
export function scoreSyllables(
  alignment: PhonemeAlignment[],
  syllables: string[],
): SyllableResult[] | null {
  if (alignment.length === 0 || syllables.length === 0) return null

  const vowelCount = alignment.filter((p) => isVowelPhoneme(p.phoneme)).length
  // Un núcleo por sílaba hablada. Si no cuadra, no sabemos repartir.
  if (vowelCount !== syllables.length) return null

  const groups = groupByNucleus(alignment, syllables.length)
  if (!groups) return null

  return syllables.map((text, index) => {
    const phonemes = groups[index]
    return { text, phonemes, ...classify(phonemes) }
  })
}

/**
 * Reparte los fonemas en tantos grupos como sílabas, cortando de modo que
 * cada grupo contenga exactamente una vocal. Las consonantes iniciales van
 * con la vocal siguiente; las finales, con la vocal anterior.
 */
function groupByNucleus(
  alignment: PhonemeAlignment[],
  syllableCount: number,
): PhonemeAlignment[][] | null {
  const groups: PhonemeAlignment[][] = Array.from(
    { length: syllableCount },
    () => [],
  )

  let current = 0
  let seenVowelInCurrent = false

  for (const phoneme of alignment) {
    const isVowel = isVowelPhoneme(phoneme.phoneme)

    // Una segunda vocal abre la siguiente sílaba; las consonantes que la
    // preceden ya se asignaron a la anterior (coda), que es la convención
    // más simple y estable para feedback visual.
    if (isVowel && seenVowelInCurrent) {
      current += 1
      if (current >= syllableCount) return null
      seenVowelInCurrent = false
    }

    groups[current].push(phoneme)
    if (isVowel) seenVowelInCurrent = true
  }

  // Si alguna sílaba quedó vacía el reparto no es utilizable.
  return groups.every((group) => group.length > 0) ? groups : null
}

function classify(phonemes: PhonemeAlignment[]): {
  status: SyllableStatus
  culprit: PhonemeAlignment | null
} {
  const failed = phonemes.filter((p) => p.status !== 'correct')
  if (failed.length === 0) return { status: 'correct', culprit: null }

  const nucleus = failed.find((p) => isVowelPhoneme(p.phoneme))
  if (nucleus) return { status: 'error', culprit: nucleus }

  return { status: 'warning', culprit: failed[0] }
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/pronunciation/__tests__/syllable-scoring.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/syllable-scoring.ts lib/pronunciation/__tests__/syllable-scoring.test.ts
git commit -m "feat: map phoneme alignment onto syllables with nucleus-aware severity"
```

---

## Task 3: Selección del contenido de remediación

Dado un fonema fallado, reunir lo que ya existe en la app para explicarlo.

**Files:**
- Create: `lib/pronunciation/syllable-remediation.ts`
- Test: `lib/pronunciation/__tests__/syllable-remediation.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { buildRemediation } from '../syllable-remediation'

describe('buildRemediation', () => {
  it('reúne guía articulatoria y ejemplos para una vocal conocida', () => {
    const result = buildRemediation({ phoneme: 'IY', status: 'incorrect', got: 'IH' })
    expect(result).not.toBeNull()
    expect(result!.ipa).toBe('/iː/')
    expect(result!.articulationEs.length).toBeGreaterThan(0)
    expect(result!.minimalPairs.length).toBeGreaterThan(0)
  })

  it('devuelve null para un fonema fuera del inventario', () => {
    expect(buildRemediation({ phoneme: 'ZZ', status: 'incorrect' })).toBeNull()
  })

  it('ignora el dígito de acento', () => {
    expect(buildRemediation({ phoneme: 'IY1', status: 'incorrect' })?.ipa).toBe('/iː/')
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/pronunciation/__tests__/syllable-remediation.test.ts`
Expected: FAIL — no existe `../syllable-remediation`

- [ ] **Step 3: Implementa**

Antes de escribir, **verifica las formas reales** de los datos:

```bash
grep -n "ARPABET_TO_IPA" -A 12 lib/pronunciation/phonemes.ts | head -20
grep -n '"/iː/"' -A 20 lib/pronunciation/ipa-data.ts | head -25
grep -n '"/iː/"' -A 12 lib/pronunciation/articulation-guide-data.ts | head -15
```

```ts
import type { PhonemeAlignment } from '@/lib/types'
import { ARPABET_TO_IPA } from './phonemes'
import { IPA_EXTRA } from './ipa-data'
import { ARTICULATION_GUIDE_MAP } from './articulation-guide-data'
import { stripStressDigit } from './arpabet-vowels'

export interface SyllableRemediation {
  /** Clave IPA con barras, ej. "/iː/" — el formato de IPA_EXTRA. */
  ipa: string
  /** Pasos articulatorios en español. */
  articulationEs: string[]
  /** Pista específica para hispanohablantes. */
  spanishTip: string | null
  /** Pista visual de la guía articulatoria. */
  visualCueEs: string | null
  /** Pares mínimos reproducibles como ejemplo. */
  minimalPairs: { wordA: string; wordB: string }[]
}

/**
 * Reúne el contenido que ya existe en la app para explicar un fonema fallado.
 *
 * No autoramos contenido a nivel de sílaba: la sílaba solo localiza el error
 * visualmente, y la explicación cuelga siempre del fonema, que sí tiene
 * material en `IPA_EXTRA` y `ARTICULATION_GUIDE_MAP`.
 */
export function buildRemediation(
  culprit: PhonemeAlignment,
): SyllableRemediation | null {
  const bare = stripStressDigit(culprit.phoneme).toUpperCase()
  const symbol = ARPABET_TO_IPA[bare]
  if (!symbol) return null

  const ipa = `/${symbol}/`
  const extra = IPA_EXTRA[ipa]
  const guide = ARTICULATION_GUIDE_MAP[ipa]
  if (!extra && !guide) return null

  return {
    ipa,
    articulationEs: extra?.articulationEs ?? [],
    spanishTip: extra?.spanishTip ?? null,
    visualCueEs: guide?.visualCueEs ?? null,
    minimalPairs: (extra?.minimalPairs ?? []).map((pair) => ({
      wordA: pair.wordA,
      wordB: pair.wordB,
    })),
  }
}
```

> Si el test de `/iː/` falla por no encontrar la clave, comprueba con el grep
> de arriba si `IPA_EXTRA` usa `"/iː/"` o `"iː"` y ajusta la construcción de
> `ipa`. El resto de la lógica no cambia.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/pronunciation/__tests__/syllable-remediation.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/syllable-remediation.ts lib/pronunciation/__tests__/syllable-remediation.test.ts
git commit -m "feat: gather existing phoneme content for syllable remediation"
```

---

## Task 4: Componente visual de sílabas

**Files:**
- Create: `components/pronunciation-feedback/SyllableBreakdown.tsx`
- Test: `components/pronunciation-feedback/__tests__/SyllableBreakdown.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyllableBreakdown } from '../SyllableBreakdown'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'

const results: SyllableResult[] = [
  { text: 'hap', phonemes: [], status: 'error', culprit: { phoneme: 'AE', status: 'incorrect' } },
  { text: 'py', phonemes: [], status: 'correct', culprit: null },
]

describe('SyllableBreakdown', () => {
  it('muestra cada sílaba', () => {
    render(<SyllableBreakdown syllables={results} />)
    expect(screen.getByText('hap')).toBeInTheDocument()
    expect(screen.getByText('py')).toBeInTheDocument()
  })

  it('etiqueta el estado de cada sílaba para lectores de pantalla', () => {
    render(<SyllableBreakdown syllables={results} />)
    expect(screen.getByLabelText(/hap.*mal/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test components/pronunciation-feedback/__tests__/SyllableBreakdown.test.tsx`
Expected: FAIL — no existe `../SyllableBreakdown`

- [ ] **Step 3: Implementa**

Comprueba primero qué tokens de color existen:

```bash
grep -n "admonitions-color-warning\|color-danger\|color-success" app/globals.css | head
```

```tsx
'use client'

// Planned structure:
// <SyllableBreakdown>
//   <SyllableChip />   (uno por sílaba)

import { cn } from '@/lib/cn'
import type { SyllableResult, SyllableStatus } from '@/lib/pronunciation/syllable-scoring'

interface Props {
  syllables: SyllableResult[]
  onSelect?: (index: number) => void
  selectedIndex?: number | null
}

const STATUS_CLASS: Record<SyllableStatus, string> = {
  correct: 'border-transparent text-fg-muted',
  warning: 'border-[var(--admonitions-color-warning)] text-fg',
  error: 'border-[var(--admonitions-color-danger)] text-fg font-semibold',
}

const STATUS_LABEL: Record<SyllableStatus, string> = {
  correct: 'bien',
  warning: 'casi',
  error: 'mal',
}

export function SyllableBreakdown({ syllables, onSelect, selectedIndex }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {syllables.map((syllable, index) => {
        const interactive = syllable.status !== 'correct' && Boolean(onSelect)
        const label = `${syllable.text}: ${STATUS_LABEL[syllable.status]}`

        if (!interactive) {
          return (
            <span
              key={index}
              aria-label={label}
              className={cn('rounded-md border-b-2 px-1 py-0.5 text-body', STATUS_CLASS[syllable.status])}
            >
              {syllable.text}
            </span>
          )
        }

        return (
          <button
            key={index}
            type="button"
            aria-label={label}
            aria-pressed={selectedIndex === index}
            onClick={() => onSelect?.(index)}
            className={cn(
              'rounded-md border-b-2 px-1 py-0.5 text-body transition-colors hover:bg-surface-raised',
              STATUS_CLASS[syllable.status],
            )}
          >
            {syllable.text}
          </button>
        )
      })}
    </div>
  )
}
```

> Si los tokens `--admonitions-color-danger` no existen, usa el que sí exista
> para error según el grep. **No inventes un color hex.**

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test components/pronunciation-feedback/__tests__/SyllableBreakdown.test.tsx`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation-feedback/SyllableBreakdown.tsx components/pronunciation-feedback/__tests__/SyllableBreakdown.test.tsx
git commit -m "feat: add syllable breakdown component with severity colors"
```

---

## Task 4b: Componente de remediación

Muestra el contenido que reunió `buildRemediation` (Tarea 3). Sin esto, la
sílaba roja localiza el error pero no explica cómo corregirlo.

**Files:**
- Create: `components/pronunciation-feedback/SyllableRemediation.tsx`
- Test: `components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyllableRemediation } from '../SyllableRemediation'
import type { SyllableRemediation as RemediationData } from '@/lib/pronunciation/syllable-remediation'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const data: RemediationData = {
  ipa: '/iː/',
  articulationEs: ['Estira los labios como en una sonrisa amplia'],
  spanishTip: 'En español no existe esta vocal larga.',
  visualCueEs: 'Sonrisa amplia',
  minimalPairs: [{ wordA: 'sheep', wordB: 'ship' }],
}

describe('SyllableRemediation', () => {
  it('muestra el fonema y cómo articularlo', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByText('/iː/')).toBeInTheDocument()
    expect(screen.getByText(/sonrisa amplia/i)).toBeInTheDocument()
  })

  it('muestra la pista para hispanohablantes', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByText(/no existe esta vocal larga/i)).toBeInTheDocument()
  })

  it('ofrece los pares mínimos como ejemplo', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByRole('button', { name: /sheep/i })).toBeInTheDocument()
  })

  it('no rompe cuando faltan campos opcionales', () => {
    render(<SyllableRemediation remediation={{
      ipa: '/p/', articulationEs: [], spanishTip: null,
      visualCueEs: null, minimalPairs: [],
    }} />)
    expect(screen.getByText('/p/')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`
Expected: FAIL — no existe `../SyllableRemediation`

- [ ] **Step 3: Implementa**

```tsx
'use client'

// Planned structure:
// <SyllableRemediation>
//   <PhonemeHeading />
//   <ArticulationSteps />
//   <SpanishTip />
//   <MinimalPairExamples />

import { speak } from '@/lib/phoneme-practice/tts'
import type { SyllableRemediation as RemediationData } from '@/lib/pronunciation/syllable-remediation'

interface Props {
  remediation: RemediationData
}

export function SyllableRemediation({ remediation }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-raised p-3">
      <div className="flex items-baseline gap-2">
        <span className="text-body font-semibold text-fg">{remediation.ipa}</span>
        {remediation.visualCueEs && (
          <span className="text-body-sm text-fg-muted">{remediation.visualCueEs}</span>
        )}
      </div>

      {remediation.articulationEs.length > 0 && (
        <ul className="flex flex-col gap-1">
          {remediation.articulationEs.map((step, index) => (
            <li key={index} className="text-body-sm text-fg-muted">{step}</li>
          ))}
        </ul>
      )}

      {remediation.spanishTip && (
        <p className="text-body-sm text-fg">{remediation.spanishTip}</p>
      )}

      {remediation.minimalPairs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-xs uppercase tracking-wider text-fg-muted">
            Escucha la diferencia
          </span>
          {remediation.minimalPairs.slice(0, 2).flatMap((pair) => [
            <button
              key={`${pair.wordA}-a`}
              type="button"
              onClick={() => speak(pair.wordA)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordA}
            </button>,
            <button
              key={`${pair.wordB}-b`}
              type="button"
              onClick={() => speak(pair.wordB)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordB}
            </button>,
          ])}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation-feedback/SyllableRemediation.tsx components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx
git commit -m "feat: show articulation guidance for failed syllable phonemes"
```

---

## Task 5: Conectar sílabas a `SpeakScoredExercise`

Cierra la Fase 1: el feedback silábico se ve en un ejercicio real.

**Files:**
- Modify: `components/exercises/SpeakScoredExercise.tsx`
- Create: `hooks/useSyllableFeedback.ts`
- Test: `hooks/__tests__/useSyllableFeedback.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSyllableFeedback } from '../useSyllableFeedback'
import type { WordResult } from '@/lib/types'

vi.mock('@/lib/pronunciation/syllable-separation', () => ({
  SYLLABLE_SEPARATOR: '·',
  resolveSyllableWord: vi.fn(async (word: string) =>
    word === 'happy' ? 'hap·py' : word),
  splitBySyllableSeparator: (word: string) => word.split('·'),
}))

const wordResults: WordResult[] = [{
  expected: 'happy',
  got: 'heppy',
  status: 'incorrect',
  phonemes: {
    expected: [], got: [], tip: null,
    alignment: [
      { phoneme: 'HH', status: 'correct' },
      { phoneme: 'AE', status: 'incorrect', got: 'EH' },
      { phoneme: 'P', status: 'correct' },
      { phoneme: 'IY', status: 'correct' },
    ],
  },
}]

describe('useSyllableFeedback', () => {
  it('resuelve sílabas para palabras falladas', async () => {
    const { result } = renderHook(() => useSyllableFeedback(wordResults))
    await waitFor(() => expect(result.current.get('happy')).toBeDefined())
    expect(result.current.get('happy')!.map((s) => s.status)).toEqual(['error', 'correct'])
  })

  it('empieza vacío y no rompe con lista vacía', async () => {
    const { result } = renderHook(() => useSyllableFeedback([]))
    expect(result.current.size).toBe(0)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test hooks/__tests__/useSyllableFeedback.test.ts`
Expected: FAIL — no existe `../useSyllableFeedback`

- [ ] **Step 3: Implementa el hook**

```ts
'use client'

import { useEffect, useState } from 'react'
import {
  resolveSyllableWord,
  splitBySyllableSeparator,
} from '@/lib/pronunciation/syllable-separation'
import { scoreSyllables, type SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { WordResult } from '@/lib/types'

/**
 * Resuelve el desglose silábico de las palabras falladas.
 *
 * Vive en un hook porque `resolveSyllableWord` es async (carga `hyphen/en` de
 * forma diferida), mientras que `scoreSyllables` es puro y síncrono. Las
 * palabras cuyo mapeo no es fiable simplemente no entran en el mapa, y la UI
 * cae al feedback por fonema.
 */
export function useSyllableFeedback(
  wordResults: WordResult[],
): Map<string, SyllableResult[]> {
  const [syllables, setSyllables] = useState<Map<string, SyllableResult[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    const failed = wordResults.filter(
      (result) => result.status === 'incorrect' && result.phonemes?.alignment?.length,
    )
    if (failed.length === 0) {
      setSyllables(new Map())
      return
    }

    void Promise.all(
      failed.map(async (result) => {
        const hyphenated = await resolveSyllableWord(result.expected)
        const parts = splitBySyllableSeparator(hyphenated).filter(Boolean)
        const scored = scoreSyllables(result.phonemes!.alignment, parts)
        return scored ? ([result.expected, scored] as const) : null
      }),
    ).then((entries) => {
      if (cancelled) return
      setSyllables(new Map(entries.filter((entry) => entry !== null)))
    })

    return () => { cancelled = true }
  }, [wordResults])

  return syllables
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test hooks/__tests__/useSyllableFeedback.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Enchufa el hook en el feedback**

En `components/lesson/PronunciationFeedback.tsx`, dentro del bloque que hoy
renderiza `<PhonemeChips alignment={result.phonemes!.alignment} />`
(alrededor de la línea 139), muestra las sílabas cuando existan:

```tsx
// arriba del componente
const syllableMap = useSyllableFeedback(wordResults)

// donde hoy va PhonemeChips:
{syllableMap.get(result.expected)
  ? <SyllableBreakdown syllables={syllableMap.get(result.expected)!} />
  : hasPhonemes && <PhonemeChips alignment={result.phonemes!.alignment} />}
```

Con los imports:

```tsx
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { SyllableBreakdown } from '@/components/pronunciation-feedback/SyllableBreakdown'
```

- [ ] **Step 6: Verifica que no rompiste nada**

```bash
pnpm test components/lesson
pnpm type-check
```
Expected: los tests existentes de `PronunciationFeedback` siguen pasando y no
hay errores de tipos. El fallback por fonema debe seguir activo cuando no hay
sílabas.

- [ ] **Step 7: Commit**

```bash
git add hooks/useSyllableFeedback.ts hooks/__tests__/useSyllableFeedback.test.ts components/lesson/PronunciationFeedback.tsx
git commit -m "feat: show syllable feedback in pronunciation results"
```

**Fin de Fase 1.** El feedback por sílaba ya funciona en toda la app.

---

# FASE 2 — Misiones con guión

## Task 6: Unión discriminada por `mode`

Cambio de tipos puro. Las misiones existentes no cambian de comportamiento.

**Files:**
- Modify: `lib/ai-practice/missions/types.ts`
- Modify: `lib/ai-practice/missions/registry.ts`
- Test: `lib/ai-practice/missions/__tests__/registry.test.ts` (ver si existe)

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { getAllMissions } from '../registry'
import { isScriptedMission, isConversationalMission } from '../types'

describe('mission mode discriminant', () => {
  it('marca todas las misiones autoradas como conversacionales', () => {
    const missions = getAllMissions()
    expect(missions.length).toBeGreaterThan(0)
    expect(missions.every(isConversationalMission)).toBe(true)
  })

  it('los type guards son mutuamente excluyentes', () => {
    for (const mission of getAllMissions()) {
      expect(isScriptedMission(mission)).toBe(false)
    }
  })
})
```

> Antes de escribirlo, comprueba el nombre real del export del registry:
> `grep -n "^export" lib/ai-practice/missions/registry.ts`. Si no existe
> `getAllMissions`, usa el que haya y ajusta el test.

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/__tests__/registry.test.ts`
Expected: FAIL — no existen `isScriptedMission` / `isConversationalMission`

- [ ] **Step 3: Implementa los tipos**

En `lib/ai-practice/missions/types.ts`, sustituye `OralMission` por:

```ts
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export type MissionCategory = 'interview' | 'service' | 'workplace' | 'social'
export type MissionMode = 'conversational' | 'scripted'
export type ScriptOrigin = 'authored' | 'generated'

export interface OralMissionTarget {
  targetId: PronunciationTargetId
  phrase: string
}

export interface RequiredIntent {
  id: string
  label: string
}

/** Campos comunes a toda misión, con independencia del modo. */
export interface MissionBase {
  id: string
  category: MissionCategory
  recommendedCefr: CEFRLevel
  context: string
  communicativeGoal: string
  targets: OralMissionTarget[]
}

/** El roleplay libre que ya existía. Sin cambios de comportamiento. */
export interface ConversationalMission extends MissionBase {
  mode: 'conversational'
  role: { model: string; student: string }
  opening: string
  maxTurns: number
  requiredIntents: RequiredIntent[]
  transferVariant: { context: string; opening: string }
  roleInstructions: string
}

/** Referencia a audio modelo pregenerado (catálogo autorado). */
export interface AuthoredAudioRef {
  /** Ruta relativa dentro del bucket de audio. */
  path: string
  durationMs?: number
}

export interface ScriptLine {
  id: string
  speaker: 'coach' | 'learner'
  text: string
  /** Ausente ⇒ se sintetiza con speechSynthesis. */
  modelAudio?: AuthoredAudioRef
  targetId?: PronunciationTargetId
}

export interface ScriptedMission extends MissionBase {
  mode: 'scripted'
  origin: ScriptOrigin
  script: ScriptLine[]
}

export type OralMission = ConversationalMission | ScriptedMission

export function isScriptedMission(mission: OralMission): mission is ScriptedMission {
  return mission.mode === 'scripted'
}

export function isConversationalMission(
  mission: OralMission,
): mission is ConversationalMission {
  return mission.mode === 'conversational'
}
```

Conserva `LegacyRoleplayScenario` y `MissionRegistryIssue` tal como estaban.

- [ ] **Step 4: Añade `mode` a las misiones existentes**

En `registry.ts`, añade `mode: 'conversational',` como primer campo de cada
entrada del array `MISSIONS`. No cambies nada más.

- [ ] **Step 5: Ejecuta la suite completa de misiones**

```bash
pnpm test lib/ai-practice/missions
pnpm test components/ai-coach/missions
pnpm type-check
```
Expected: todo PASS. Si `type-check` señala accesos a `mission.opening` o
`mission.maxTurns` sobre `OralMission`, protégelos con
`isConversationalMission(mission)` — es exactamente el punto de la unión.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/missions/
git commit -m "refactor: make OralMission a discriminated union on mode"
```

---

## Task 7: Estado del guión y mejor intento

**Files:**
- Create: `lib/ai-practice/missions/scripted/script-state.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/script-state.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import {
  createScriptState,
  recordAttempt,
  advanceLine,
  type ScriptState,
} from '../script-state'
import type { ScriptLine } from '../../types'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

const script: ScriptLine[] = [
  { id: 'l1', speaker: 'coach', text: 'Hello, how are you?' },
  { id: 'l2', speaker: 'learner', text: "I'm doing well, thanks." },
  { id: 'l3', speaker: 'learner', text: 'And you?' },
]

function attempt(score: number, outcome: SpokenAttempt['outcome'] = 'scored'): SpokenAttempt {
  return {
    userId: 'u1', targetText: 'x', transcript: 'x',
    evaluatorVersion: 'test-v1', scoreKind: 'stt_intelligibility',
    overallScore: score, durationMs: 1000, outcome,
  }
}

describe('script-state', () => {
  it('empieza en la primera línea', () => {
    const state = createScriptState('m1', script)
    expect(state.currentIndex).toBe(0)
    expect(state.status).toBe('in_progress')
  })

  it('guarda el mejor intento, no el último', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(80))
    state = recordAttempt(state, attempt(50))
    expect(state.bestByLine.get('l2')?.overallScore).toBe(80)
  })

  it('sustituye el mejor intento cuando mejora', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(50))
    state = recordAttempt(state, attempt(90))
    expect(state.bestByLine.get('l2')?.overallScore).toBe(90)
  })

  it('conserva todos los intentos como evidencia', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(50))
    state = recordAttempt(state, attempt(90))
    expect(state.allAttempts).toHaveLength(2)
  })

  it('nunca deja un intento no puntuado como mejor', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(0, 'failed'))
    expect(state.bestByLine.has('l2')).toBe(false)
    expect(state.allAttempts).toHaveLength(1)
  })

  it('completa la misión al pasar la última línea', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = advanceLine(state)
    state = advanceLine(state)
    expect(state.status).toBe('completed')
  })

  it('no muta el estado anterior', () => {
    const initial = createScriptState('m1', script)
    const next = advanceLine(initial)
    expect(initial.currentIndex).toBe(0)
    expect(next.currentIndex).toBe(1)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/script-state.test.ts`
Expected: FAIL — no existe `../script-state`

- [ ] **Step 3: Implementa**

```ts
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { ScriptLine } from '../types'

export type ScriptStatus = 'in_progress' | 'completed' | 'cancelled'

export interface ScriptState {
  missionId: string
  script: ScriptLine[]
  currentIndex: number
  /**
   * Mejor intento puntuado por línea. Se practica, no se examina: premiar la
   * insistencia es lo pedagógicamente correcto, así que el score final usa
   * esto y no el primer intento.
   */
  bestByLine: Map<string, SpokenAttempt>
  /** Todos los intentos, incluidos los peores: son evidencia para el SRS. */
  allAttempts: SpokenAttempt[]
  status: ScriptStatus
}

export function createScriptState(missionId: string, script: ScriptLine[]): ScriptState {
  return {
    missionId,
    script,
    currentIndex: 0,
    bestByLine: new Map(),
    allAttempts: [],
    status: 'in_progress',
  }
}

export function currentLine(state: ScriptState): ScriptLine | null {
  return state.script[state.currentIndex] ?? null
}

/**
 * Registra un intento. Solo los `scored` compiten por ser el mejor — un
 * fallo de STT o un micrófono ausente no es un 0, es ausencia de dato.
 */
export function recordAttempt(state: ScriptState, attempt: SpokenAttempt): ScriptState {
  const line = currentLine(state)
  if (!line) return state

  const allAttempts = [...state.allAttempts, attempt]
  if (attempt.outcome !== 'scored') {
    return { ...state, allAttempts }
  }

  const bestByLine = new Map(state.bestByLine)
  const previous = bestByLine.get(line.id)
  if (!previous || attempt.overallScore > previous.overallScore) {
    bestByLine.set(line.id, attempt)
  }

  return { ...state, allAttempts, bestByLine }
}

export function advanceLine(state: ScriptState): ScriptState {
  const nextIndex = state.currentIndex + 1
  if (nextIndex >= state.script.length) {
    return { ...state, currentIndex: state.script.length, status: 'completed' }
  }
  return { ...state, currentIndex: nextIndex }
}

export function cancelScript(state: ScriptState): ScriptState {
  return { ...state, status: 'cancelled' }
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/script-state.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/
git commit -m "feat: add scripted mission state with best-attempt tracking"
```

---

## Task 8: Puntuación del diálogo

**Files:**
- Create: `lib/ai-practice/missions/scripted/scoring.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/scoring.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { scoreScriptSession, type LineScore } from '../scoring'

describe('scoreScriptSession', () => {
  it('pondera por número de fonemas, no por media de porcentajes', () => {
    // Línea larga al 50% (10 fonemas) + línea corta al 100% (2 fonemas).
    // Media simple daría 75; la ponderada da (5+2)/12 = 58.
    const lines: LineScore[] = [
      { lineId: 'l1', correctPhonemes: 5, totalPhonemes: 10 },
      { lineId: 'l2', correctPhonemes: 2, totalPhonemes: 2 },
    ]
    expect(scoreScriptSession(lines).score).toBe(58)
  })

  it('devuelve 100 con todo correcto', () => {
    const lines: LineScore[] = [{ lineId: 'l1', correctPhonemes: 4, totalPhonemes: 4 }]
    expect(scoreScriptSession(lines).score).toBe(100)
  })

  it('ignora líneas sin fonemas puntuados en lugar de contarlas como 0', () => {
    const lines: LineScore[] = [
      { lineId: 'l1', correctPhonemes: 4, totalPhonemes: 4 },
      { lineId: 'l2', correctPhonemes: 0, totalPhonemes: 0 },
    ]
    const result = scoreScriptSession(lines)
    expect(result.score).toBe(100)
    expect(result.scoredLines).toBe(1)
  })

  it('marca la sesión como no puntuable si nada se pudo evaluar', () => {
    const result = scoreScriptSession([{ lineId: 'l1', correctPhonemes: 0, totalPhonemes: 0 }])
    expect(result.score).toBeNull()
    expect(result.scoredLines).toBe(0)
  })

  it('maneja una lista vacía', () => {
    expect(scoreScriptSession([]).score).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/scoring.test.ts`
Expected: FAIL — no existe `../scoring`

- [ ] **Step 3: Implementa**

```ts
export interface LineScore {
  lineId: string
  correctPhonemes: number
  totalPhonemes: number
}

export interface ScriptSessionScore {
  /** 0-100, o `null` si no hubo nada puntuable. Nunca un 0 falso. */
  score: number | null
  scoredLines: number
  correctPhonemes: number
  totalPhonemes: number
}

/**
 * Puntúa un diálogo como fonemas acertados sobre el total.
 *
 * Deliberadamente NO es la media de los porcentajes por línea: así una
 * intervención larga pesa más que un "Yes, please", que es lo justo.
 */
export function scoreScriptSession(lines: LineScore[]): ScriptSessionScore {
  const scored = lines.filter((line) => line.totalPhonemes > 0)

  const totalPhonemes = scored.reduce((sum, line) => sum + line.totalPhonemes, 0)
  const correctPhonemes = scored.reduce((sum, line) => sum + line.correctPhonemes, 0)

  return {
    score: totalPhonemes === 0 ? null : Math.round((correctPhonemes / totalPhonemes) * 100),
    scoredLines: scored.length,
    correctPhonemes,
    totalPhonemes,
  }
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/scoring.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/scoring.ts lib/ai-practice/missions/scripted/__tests__/scoring.test.ts
git commit -m "feat: score scripted dialogue by phoneme weight"
```

---

## Task 9: Resolución del audio modelo

**Files:**
- Create: `lib/speech/model-audio.ts`
- Test: `lib/speech/__tests__/model-audio.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { resolveModelAudio } from '../model-audio'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const authored: ScriptLine = {
  id: 'l1', speaker: 'coach', text: 'Hello',
  modelAudio: { path: 'scripts/interview/l1.ogg' },
}
const generated: ScriptLine = { id: 'l2', speaker: 'coach', text: 'Hello' }

describe('resolveModelAudio', () => {
  it('prefiere el audio pregrabado cuando existe', () => {
    const result = resolveModelAudio(authored)
    expect(result.kind).toBe('recorded')
    expect(result.kind === 'recorded' && result.path).toBe('scripts/interview/l1.ogg')
  })

  it('cae a síntesis cuando no hay audio pregrabado', () => {
    const result = resolveModelAudio(generated)
    expect(result.kind).toBe('synthesized')
    expect(result.kind === 'synthesized' && result.text).toBe('Hello')
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/speech/__tests__/model-audio.test.ts`
Expected: FAIL — no existe `../model-audio`

- [ ] **Step 3: Implementa**

```ts
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

export type ModelAudioSource =
  | { kind: 'recorded'; path: string; durationMs?: number }
  | { kind: 'synthesized'; text: string }

/**
 * Decide cómo suena una línea del coach.
 *
 * Los guiones autorados traen audio de alta calidad pregenerado; los
 * generados por Gemini caen en `speechSynthesis`. El componente que reproduce
 * no debe conocer la diferencia — mismo patrón que `ipa-audio.ts`.
 */
export function resolveModelAudio(line: ScriptLine): ModelAudioSource {
  if (line.modelAudio) {
    return {
      kind: 'recorded',
      path: line.modelAudio.path,
      durationMs: line.modelAudio.durationMs,
    }
  }
  return { kind: 'synthesized', text: line.text }
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/speech/__tests__/model-audio.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add lib/speech/model-audio.ts lib/speech/__tests__/model-audio.test.ts
git commit -m "feat: resolve model audio from recorded file or synthesis"
```

---

## Task 10: Catálogo de guiones autorados

**Files:**
- Create: `lib/ai-practice/missions/scripted/catalog.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/catalog.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { SCRIPTED_MISSIONS } from '../catalog'
import { isScriptedMission } from '../../types'

describe('scripted catalog', () => {
  it('trae al menos un guión', () => {
    expect(SCRIPTED_MISSIONS.length).toBeGreaterThan(0)
  })

  it('todas son de modo scripted y origen autorado', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(isScriptedMission(mission)).toBe(true)
      expect(mission.origin).toBe('authored')
    }
  })

  it('no repite ids de misión', () => {
    const ids = SCRIPTED_MISSIONS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no repite ids de línea dentro de un guión', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      const ids = mission.script.map((line) => line.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('cada guión alterna e incluye turnos del estudiante', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(mission.script.some((line) => line.speaker === 'learner')).toBe(true)
      expect(mission.script.some((line) => line.speaker === 'coach')).toBe(true)
    }
  })

  it('empieza siempre con el coach', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(mission.script[0].speaker).toBe('coach')
    }
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/catalog.test.ts`
Expected: FAIL — no existe `../catalog`

- [ ] **Step 3: Implementa**

Comprueba primero cómo se construyen los target ids:
`grep -n "targetId\|contrastTargetId\|phonemeTargetId" lib/pronunciation/targets/registry.ts | head`

```ts
import { contrastTargetId } from '@/lib/pronunciation/targets/registry'
import type { ScriptedMission } from '../types'

/**
 * Guiones autorados. Sin `modelAudio` por ahora: el pipeline de audio
 * pregenerado es trabajo aparte, y `resolveModelAudio` cae limpiamente en
 * síntesis mientras tanto. Al añadir los OGG, basta con rellenar el campo.
 */
export const SCRIPTED_MISSIONS: readonly ScriptedMission[] = [
  {
    id: 'scripted.cafe.order',
    mode: 'scripted',
    origin: 'authored',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'Pides algo de beber en una cafetería.',
    communicativeGoal: 'Pedir una bebida y responder a las preguntas del camarero.',
    targets: [],
    script: [
      { id: 'cafe-1', speaker: 'coach', text: 'Hi there! What can I get for you today?' },
      { id: 'cafe-2', speaker: 'learner', text: "I'd like a large coffee, please." },
      { id: 'cafe-3', speaker: 'coach', text: 'Sure. Room for milk?' },
      { id: 'cafe-4', speaker: 'learner', text: 'Yes, just a little bit.' },
      { id: 'cafe-5', speaker: 'coach', text: "That'll be four fifty." },
      { id: 'cafe-6', speaker: 'learner', text: 'Here you go. Thank you!' },
    ],
  },
  {
    id: 'scripted.interview.intro',
    mode: 'scripted',
    origin: 'authored',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'Los primeros minutos de una entrevista de trabajo.',
    communicativeGoal: 'Presentarte y explicar por qué te interesa el puesto.',
    targets: [{ targetId: contrastTargetId('/iː/', '/ɪ/'), phrase: 'this team' }],
    script: [
      { id: 'int-1', speaker: 'coach', text: 'Thanks for coming in. Tell me a little about yourself.' },
      {
        id: 'int-2', speaker: 'learner',
        text: "I'm a software developer with three years of experience.",
      },
      { id: 'int-3', speaker: 'coach', text: 'What interests you about this position?' },
      {
        id: 'int-4', speaker: 'learner',
        text: 'I really like the problems this team is solving.',
        targetId: contrastTargetId('/iː/', '/ɪ/'),
      },
      { id: 'int-5', speaker: 'coach', text: 'Great. What would you say is your biggest strength?' },
      { id: 'int-6', speaker: 'learner', text: 'I learn quickly and I ask good questions.' },
    ],
  },
]
```

> Si `contrastTargetId('/iː/', '/ɪ/')` lanza o no valida, usa el helper que el
> registry exponga y un contraste que sí exista. El test de catálogo no depende
> del target concreto.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/catalog.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/catalog.ts lib/ai-practice/missions/scripted/__tests__/catalog.test.ts
git commit -m "feat: add authored scripted mission catalog"
```

---

## Task 11: Tabla Dexie de guiones generados

**Files:**
- Modify: `lib/db/index.ts`
- Test: `lib/db/__tests__/generated-scripts.test.ts`

- [ ] **Step 1: Mira la versión actual del esquema**

```bash
grep -n "this.version(" lib/db/index.ts | tail -3
```
Anota el número más alto — la versión nueva es ese **+1**. El plan asume 33;
usa el que corresponda.

- [ ] **Step 2: Escribe el test que falla**

```ts
import { describe, expect, it, afterEach } from 'vitest'
import { db, type GeneratedScriptRecord } from '@/lib/db'

function record(overrides: Partial<GeneratedScriptRecord> = {}): GeneratedScriptRecord {
  return {
    id: 'gs-1',
    userId: 'user-a',
    mission: {
      id: 'gs-1', mode: 'scripted', origin: 'generated',
      category: 'workplace', recommendedCefr: 'B1',
      context: 'Backend interview', communicativeGoal: 'Explicar tu stack',
      targets: [],
      script: [{ id: 'g-1', speaker: 'coach', text: 'Tell me about your stack.' }],
    },
    topic: 'backend interview',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('generatedScripts table', () => {
  afterEach(async () => { await db.generatedScripts.clear() })

  it('guarda y recupera por usuario', async () => {
    await db.generatedScripts.put(record())
    const rows = await db.generatedScripts.where('userId').equals('user-a').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].topic).toBe('backend interview')
  })

  it('aísla los guiones entre usuarios', async () => {
    await db.generatedScripts.put(record())
    await db.generatedScripts.put(record({ id: 'gs-2', userId: 'user-b' }))
    const rows = await db.generatedScripts.where('userId').equals('user-b').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('gs-2')
  })
})
```

- [ ] **Step 3: Ejecuta para verificar que falla**

Run: `pnpm test lib/db/__tests__/generated-scripts.test.ts`
Expected: FAIL — `db.generatedScripts` no existe

- [ ] **Step 4: Implementa**

Junto a las demás interfaces de registro en `lib/db/index.ts`:

```ts
export interface GeneratedScriptRecord {
  id: string
  userId: string
  /** La misión completa, lista para ejecutar sin volver a llamar a la API. */
  mission: ScriptedMission
  /** Tema que pidió el usuario, para poder buscarlo después. */
  topic: string
  createdAt: string
}
```

Con el import de tipo:

```ts
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'
```

Declara la tabla junto a `missionSessions!` (línea ~344):

```ts
generatedScripts!: Table<GeneratedScriptRecord, string>;
```

Y añade la versión nueva **al final** de la cadena de versiones:

```ts
this.version(33).stores({
  generatedScripts: 'id, userId, [userId+createdAt], createdAt',
});
```

- [ ] **Step 5: Ejecuta para verificar que pasa**

Run: `pnpm test lib/db/__tests__/generated-scripts.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 6: Verifica que no rompiste el esquema**

```bash
pnpm test lib/db
pnpm type-check
```
Expected: todos los tests de Dexie siguen pasando.

- [ ] **Step 7: Commit**

```bash
git add lib/db/index.ts lib/db/__tests__/generated-scripts.test.ts
git commit -m "feat: persist Gemini-generated scripts in Dexie"
```

---

## Task 12: Registry de runners por modo

Evita el `switch` largo que prohíbe `ENGINEERING_STANDARDS.md`.

**Files:**
- Create: `lib/ai-practice/missions/runner-registry.ts`
- Test: `lib/ai-practice/missions/__tests__/runner-registry.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { getRunnerFor, MISSION_RUNNERS } from '../runner-registry'
import type { MissionMode } from '../types'

describe('runner registry', () => {
  it('cubre todos los modos declarados', () => {
    const modes: MissionMode[] = ['conversational', 'scripted']
    for (const mode of modes) {
      expect(MISSION_RUNNERS[mode]).toBeDefined()
    }
  })

  it('devuelve el runner del modo pedido', () => {
    expect(getRunnerFor('scripted').mode).toBe('scripted')
    expect(getRunnerFor('conversational').mode).toBe('conversational')
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/__tests__/runner-registry.test.ts`
Expected: FAIL — no existe `../runner-registry`

- [ ] **Step 3: Implementa**

```ts
import type { ComponentType } from 'react'
import type { MissionMode, OralMission } from './types'

export interface MissionRunnerEntry {
  mode: MissionMode
  /** Etiqueta en español para la biblioteca de misiones. */
  label: string
  /** Carga diferida del componente runner. */
  load: () => Promise<{ default: ComponentType<{ mission: OralMission }> }>
}

/**
 * Registry de runners por modo.
 *
 * `Record<MissionMode, ...>` obliga a que añadir un modo nuevo sin su runner
 * sea un error de compilación, en vez de un `switch` que se olvida un caso.
 */
export const MISSION_RUNNERS: Record<MissionMode, MissionRunnerEntry> = {
  conversational: {
    mode: 'conversational',
    label: 'Conversación libre',
    load: () => import('@/components/ai-coach/missions/MissionRunner'),
  },
  scripted: {
    mode: 'scripted',
    label: 'Diálogo con guión',
    load: () => import('@/components/ai-coach/missions/scripted/ScriptedMissionRunner'),
  },
}

export function getRunnerFor(mode: MissionMode): MissionRunnerEntry {
  return MISSION_RUNNERS[mode]
}
```

> El import de `ScriptedMissionRunner` apunta a un archivo que aún no existe;
> se crea en la Tarea 13. El test solo comprueba el registry, no ejecuta
> `load()`, así que pasa. Si `MissionRunner` no tiene export default, ajusta la
> firma de `load` al export real.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/__tests__/runner-registry.test.ts`
Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/runner-registry.ts lib/ai-practice/missions/__tests__/runner-registry.test.ts
git commit -m "feat: add mission runner registry keyed by mode"
```

---

## Task 13: UI — turno del coach

**Files:**
- Create: `components/ai-coach/missions/scripted/CoachLine.tsx`
- Test: `components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoachLine } from '../CoachLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...args: unknown[]) => speak(...args) }))

const line: ScriptLine = { id: 'l1', speaker: 'coach', text: 'How are you?' }

describe('CoachLine', () => {
  beforeEach(() => speak.mockClear())

  it('muestra el texto de la línea', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    expect(screen.getByText('How are you?')).toBeInTheDocument()
  })

  it('reproduce la línea al pulsar escuchar', () => {
    render(<CoachLine line={line} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /escuchar/i }))
    expect(speak).toHaveBeenCalled()
  })

  it('avanza al pulsar continuar', () => {
    const onContinue = vi.fn()
    render(<CoachLine line={line} onContinue={onContinue} />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx`
Expected: FAIL — no existe `../CoachLine`

- [ ] **Step 3: Implementa**

```tsx
'use client'

// Planned structure:
// <CoachLine>
//   <LineText />
//   <ListenButton />
//   <ContinueButton />

import { useCallback, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { resolveModelAudio } from '@/lib/speech/model-audio'
import Button from '@/components/ui/Button'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  line: ScriptLine
  onContinue: () => void
}

export function CoachLine({ line, onContinue }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleListen = useCallback(() => {
    const source = resolveModelAudio(line)
    setIsPlaying(true)

    if (source.kind === 'synthesized') {
      speak(source.text, () => setIsPlaying(false))
      return
    }

    const audio = new Audio(source.path)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => {
      // El OGG pregrabado puede faltar; la síntesis mantiene la línea audible.
      speak(line.text, () => setIsPlaying(false))
    }
    void audio.play().catch(() => speak(line.text, () => setIsPlaying(false)))
  }, [line])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-raised p-4">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Coach
      </span>
      <p className="text-body text-fg">{line.text}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={handleListen} disabled={isPlaying}>
          {isPlaying ? 'Reproduciendo…' : 'Escuchar'}
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
```

> Comprueba las variantes reales de `Button`:
> `grep -n "variant" components/ui/Button.tsx | head`. Ajusta si `primary` o
> `secondary` no existen.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/missions/scripted/CoachLine.tsx components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx
git commit -m "feat: add coach turn component for scripted missions"
```

---

## Task 14: UI — turno del estudiante

El componente más denso. Vigila el límite de 250 líneas: si lo rozas,
extrae el bloque de resultado a `LearnerLineResult.tsx`.

**Files:**
- Create: `components/ai-coach/missions/scripted/LearnerLine.tsx`
- Test: `components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LearnerLine } from '../LearnerLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: 'idle', result: null, userAudioUrl: null, errorCode: null,
    isSupported: true, start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

const line: ScriptLine = { id: 'l2', speaker: 'learner', text: 'I would like a coffee.' }

describe('LearnerLine', () => {
  it('muestra la línea que hay que decir', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByText('I would like a coffee.')).toBeInTheDocument()
  })

  it('ofrece grabar cuando el reconocimiento está disponible', () => {
    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /hablar|grabar/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx`
Expected: FAIL — no existe `../LearnerLine`

- [ ] **Step 3: Implementa**

Lee primero el patrón ya resuelto en `SpeakScoredExercise.tsx` (líneas 60-110):
hace el mismo ciclo STT → evaluación → `wordResults`. Reúsalo.

```tsx
'use client'

// Planned structure:
// <LearnerLine>
//   <TargetText />
//   <SpeakMicButton />
//   <SyllableBreakdown />        (feedback por sílaba)
//   <SyllableRemediation />      (fonema culpable)
//   <SelfPlaybackAudioBar />     (comparación IA vs tú)
//   <RetryAndContinue />

import { useCallback, useEffect, useState } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getEvaluationWordResults } from '@/lib/exercises/evaluation/word-results'
import { useSyllableFeedback } from '@/hooks/useSyllableFeedback'
import { SyllableBreakdown } from '@/components/pronunciation-feedback/SyllableBreakdown'
import { SyllableRemediation } from '@/components/pronunciation-feedback/SyllableRemediation'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import { SelfPlaybackAudioBar } from '@/components/pronunciation/SelfPlaybackAudioBar'
import Button from '@/components/ui/Button'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

/** Exportado: `ScriptedMissionRunner` (Tarea 15) consume este mismo tipo. */
export interface LineAttemptResult {
  score: number
  transcript: string
  wordResults: WordResult[]
}

interface Props {
  line: ScriptLine
  onLineComplete: (result: LineAttemptResult | null) => void
}

export function LearnerLine({ line, onLineComplete }: Props) {
  const { status, result: speechResult, userAudioUrl, isSupported, start, reset } =
    useSpeechRecognition()
  const [attempt, setAttempt] = useState<LineAttemptResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)

  const syllableMap = useSyllableFeedback(attempt?.wordResults ?? [])

  useEffect(() => {
    if (status !== 'done' || !speechResult || isScoring || attempt) return
    setIsScoring(true)

    void defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: line.text,
        actual: { kind: 'speech', transcript: speechResult.transcript },
      })
      .then((evaluation) => {
        setAttempt({
          score: evaluation.score ?? 0,
          transcript: speechResult.transcript,
          wordResults: getEvaluationWordResults(evaluation),
        })
      })
      .finally(() => setIsScoring(false))
  }, [status, speechResult, isScoring, attempt, line.text])

  const handleRetry = useCallback(() => {
    setAttempt(null)
    reset()
  }, [reset])

  // Sin reconocimiento no hay puntuación: se avanza sin inventar un 0.
  if (!isSupported) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border-default p-4">
        <p className="text-body text-fg">{line.text}</p>
        <p className="text-body-sm text-fg-muted">
          Tu navegador no permite evaluar la pronunciación. Practica en voz alta y continúa.
        </p>
        <Button variant="primary" onClick={() => onLineComplete(null)}>Continuar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-strong p-4">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Tu turno
      </span>
      <p className="text-body text-fg">{line.text}</p>

      {!attempt && (
        <Button variant="primary" onClick={start} disabled={status === 'listening' || isScoring}>
          {status === 'listening' ? 'Escuchando…' : 'Hablar'}
        </Button>
      )}

      {attempt && (
        <>
          <div className="flex flex-col gap-2">
            {attempt.wordResults.map((word, index) => {
              const syllables = syllableMap.get(word.expected)
              if (!syllables) {
                return <span key={index} className="text-body text-fg-muted">{word.expected}</span>
              }
              // Una sola tarjeta articulatoria por palabra: la de la primera
              // sílaba fallada. Volcar una por cada fallo sería ruido.
              const culprit = syllables.find((s) => s.culprit !== null)?.culprit ?? null
              const remediation = culprit ? buildRemediation(culprit) : null
              return (
                <div key={index} className="flex flex-col gap-2">
                  <SyllableBreakdown syllables={syllables} />
                  {remediation && <SyllableRemediation remediation={remediation} />}
                </div>
              )
            })}
          </div>

          <SelfPlaybackAudioBar targetWord={line.text} userAudioUrl={userAudioUrl} />

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleRetry}>Repetir</Button>
            <Button variant="primary" onClick={() => onLineComplete(attempt)}>Continuar</Button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx`
Expected: PASS — 2 tests

- [ ] **Step 5: Comprueba el límite de tamaño**

```bash
wc -l components/ai-coach/missions/scripted/LearnerLine.tsx
```
Expected: <250. Si se pasa, extrae el bloque `{attempt && (...)}` a
`LearnerLineResult.tsx` con props `{ attempt, syllableMap, userAudioUrl,
onRetry, onContinue }`.

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/missions/scripted/LearnerLine.tsx components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx
git commit -m "feat: add learner turn with syllable feedback and audio comparison"
```

---

## Task 15: Runner del guión

**Files:**
- Create: `components/ai-coach/missions/scripted/ScriptedMissionRunner.tsx`
- Test: `components/ai-coach/missions/scripted/__tests__/ScriptedMissionRunner.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

```tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScriptedMissionRunner from '../ScriptedMissionRunner'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))
vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: 'idle', result: null, userAudioUrl: null, errorCode: null,
    isSupported: true, start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

const mission: ScriptedMission = {
  id: 'm1', mode: 'scripted', origin: 'authored',
  category: 'service', recommendedCefr: 'A2',
  context: 'Cafetería', communicativeGoal: 'Pedir café', targets: [],
  script: [
    { id: 'l1', speaker: 'coach', text: 'What can I get you?' },
    { id: 'l2', speaker: 'learner', text: 'A coffee, please.' },
  ],
}

describe('ScriptedMissionRunner', () => {
  it('empieza por la línea del coach', () => {
    render(<ScriptedMissionRunner mission={mission} />)
    expect(screen.getByText('What can I get you?')).toBeInTheDocument()
  })

  it('avanza al turno del estudiante', () => {
    render(<ScriptedMissionRunner mission={mission} />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByText('A coffee, please.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/ScriptedMissionRunner.test.tsx`
Expected: FAIL — no existe `../ScriptedMissionRunner`

- [ ] **Step 3: Implementa**

```tsx
'use client'

// Planned structure:
// <ScriptedMissionRunner>
//   <CoachLine />        (turno del coach)
//   <LearnerLine />      (turno del estudiante)
//   <ScriptedResult />   (puntuación final)

import { useCallback, useState } from 'react'
import {
  advanceLine,
  createScriptState,
  currentLine,
  type ScriptState,
} from '@/lib/ai-practice/missions/scripted/script-state'
import { scoreScriptSession, type LineScore } from '@/lib/ai-practice/missions/scripted/scoring'
import { CoachLine } from './CoachLine'
import { LearnerLine, type LineAttemptResult } from './LearnerLine'
import { ScriptedResult } from './ScriptedResult'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'
import type { WordResult } from '@/lib/types'

interface Props {
  mission: ScriptedMission
}

/** Cuenta fonemas acertados de una línea, para la puntuación ponderada. */
function toLineScore(lineId: string, wordResults: WordResult[]): LineScore {
  let correctPhonemes = 0
  let totalPhonemes = 0

  for (const word of wordResults) {
    const alignment = word.phonemes?.alignment
    if (!alignment?.length) {
      // Sin datos de fonema, cae a binario por palabra.
      totalPhonemes += 1
      if (word.status === 'correct') correctPhonemes += 1
      continue
    }
    totalPhonemes += alignment.length
    correctPhonemes += alignment.filter((p) => p.status === 'correct').length
  }

  return { lineId, correctPhonemes, totalPhonemes }
}

export default function ScriptedMissionRunner({ mission }: Props) {
  const [state, setState] = useState<ScriptState>(() =>
    createScriptState(mission.id, mission.script))
  const [lineScores, setLineScores] = useState<LineScore[]>([])

  const handleLineComplete = useCallback(
    (result: LineAttemptResult | null) => {
      const line = currentLine(state)
      if (line && result) {
        setLineScores((previous) => [...previous, toLineScore(line.id, result.wordResults)])
      }
      setState(advanceLine(state))
    },
    [state],
  )

  const handleCoachContinue = useCallback(() => setState(advanceLine(state)), [state])

  const line = currentLine(state)

  if (state.status === 'completed' || !line) {
    return <ScriptedResult mission={mission} sessionScore={scoreScriptSession(lineScores)} />
  }

  return line.speaker === 'coach'
    ? <CoachLine line={line} onContinue={handleCoachContinue} />
    : <LearnerLine line={line} onLineComplete={handleLineComplete} />
}
```

- [ ] **Step 4: Crea `ScriptedResult`**

`components/ai-coach/missions/scripted/ScriptedResult.tsx`:

```tsx
'use client'

import type { ScriptSessionScore } from '@/lib/ai-practice/missions/scripted/scoring'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'

interface Props {
  mission: ScriptedMission
  sessionScore: ScriptSessionScore
  /** Mejor score anterior en este mismo guión, si lo hay. */
  previousBest?: number | null
}

export function ScriptedResult({ mission, sessionScore, previousBest }: Props) {
  const improved =
    sessionScore.score !== null && previousBest != null && sessionScore.score > previousBest

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-raised p-5">
      <h2 className="text-heading-sm text-fg">{mission.context}</h2>

      {sessionScore.score === null ? (
        <p className="text-body text-fg-muted">
          No se pudo evaluar la pronunciación en esta sesión.
        </p>
      ) : (
        <>
          <p className="text-display-sm text-fg">{sessionScore.score}%</p>
          {previousBest != null && (
            <p className="text-body-sm text-fg-muted">
              {improved
                ? `Mejoraste: antes ${previousBest}%`
                : `Tu mejor marca sigue siendo ${previousBest}%`}
            </p>
          )}
        </>
      )}
    </div>
  )
}
```

> Verifica los nombres de las clases tipográficas:
> `grep -n "text-display-sm\|text-heading-sm" app/globals.css | head`.
> Si no existen, usa las que sí.
>
> **Sobre los exports:** `ScriptedMissionRunner` necesita `export default`
> porque el registry de la Tarea 12 lo carga como `.default`. `ScriptedResult`,
> `CoachLine` y `LearnerLine` usan exports nombrados como el resto del proyecto.

- [ ] **Step 5: Ejecuta para verificar que pasa**

Run: `pnpm test components/ai-coach/missions/scripted`
Expected: PASS — todos los tests de la carpeta

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/missions/scripted/
git commit -m "feat: add scripted mission runner and result screen"
```

---

## Task 16: Persistencia e histórico de puntuación

Cierra la Fase 2: el "antes 68% → ahora 84%" empieza a funcionar.

**Files:**
- Create: `lib/ai-practice/missions/scripted/persistence.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/persistence.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { saveScriptedSession, loadBestScore } from '../persistence'

describe('scripted session persistence', () => {
  afterEach(async () => { await db.missionSessions.clear() })

  it('devuelve null cuando no hay intentos previos', async () => {
    expect(await loadBestScore('user-a', 'scripted.cafe.order')).toBeNull()
  })

  it('guarda una sesión y recupera su score', async () => {
    await saveScriptedSession('user-a', 'scripted.cafe.order', {
      score: 68, scoredLines: 3, correctPhonemes: 17, totalPhonemes: 25,
    })
    expect(await loadBestScore('user-a', 'scripted.cafe.order')).toBe(68)
  })

  it('devuelve el mejor score, no el más reciente', async () => {
    await saveScriptedSession('user-a', 'scripted.cafe.order', {
      score: 84, scoredLines: 3, correctPhonemes: 21, totalPhonemes: 25,
    })
    await saveScriptedSession('user-a', 'scripted.cafe.order', {
      score: 60, scoredLines: 3, correctPhonemes: 15, totalPhonemes: 25,
    })
    expect(await loadBestScore('user-a', 'scripted.cafe.order')).toBe(84)
  })

  it('no mezcla el histórico entre usuarios', async () => {
    await saveScriptedSession('user-a', 'scripted.cafe.order', {
      score: 84, scoredLines: 3, correctPhonemes: 21, totalPhonemes: 25,
    })
    expect(await loadBestScore('user-b', 'scripted.cafe.order')).toBeNull()
  })

  it('ignora sesiones sin puntuación al calcular el mejor', async () => {
    await saveScriptedSession('user-a', 'scripted.cafe.order', {
      score: null, scoredLines: 0, correctPhonemes: 0, totalPhonemes: 0,
    })
    expect(await loadBestScore('user-a', 'scripted.cafe.order')).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/persistence.test.ts`
Expected: FAIL — no existe `../persistence`

- [ ] **Step 3: Implementa**

Antes, mira la forma exacta de `MissionSessionRecord`:
`grep -n "MissionSessionRecord" -A 16 lib/db/index.ts | head -25`

```ts
'use client'

import { db, type MissionSessionRecord } from '@/lib/db'
import type { ScriptSessionScore } from './scoring'

/**
 * Guarda la sesión reusando la tabla `missionSessions` que ya existe. Su
 * índice `[userId+missionId]` es justo el que hace falta para responder
 * "¿cómo me fue la vez pasada en este guión?".
 */
export async function saveScriptedSession(
  userId: string,
  missionId: string,
  sessionScore: ScriptSessionScore,
): Promise<void> {
  const now = new Date().toISOString()
  const record: MissionSessionRecord = {
    id: globalThis.crypto.randomUUID(),
    userId,
    missionId,
    targetIds: [],
    outcome: { kind: 'scripted', ...sessionScore } as unknown as Record<string, unknown>,
    turnCount: sessionScore.scoredLines,
    status: 'completed',
    startedAt: now,
    completedAt: now,
  }
  await db.missionSessions.put(record)
}

/** Mejor puntuación histórica del usuario en este guión, o `null`. */
export async function loadBestScore(
  userId: string,
  missionId: string,
): Promise<number | null> {
  const sessions = await db.missionSessions
    .where('[userId+missionId]')
    .equals([userId, missionId])
    .toArray()

  const scores = sessions
    .map((session) => (session.outcome as { score?: number | null })?.score)
    .filter((score): score is number => typeof score === 'number')

  return scores.length === 0 ? null : Math.max(...scores)
}
```

> Si `MissionSessionRecord` exige campos que aquí no se rellenan
> (`launchSource`, `sourceStepId`), añádelos como `undefined` o con el valor
> que corresponda según su definición.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/persistence.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Enchufa la persistencia al runner**

En `ScriptedMissionRunner.tsx`, guarda al completar y carga la mejor marca:

```tsx
import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { loadBestScore, saveScriptedSession } from '@/lib/ai-practice/missions/scripted/persistence'

// dentro del componente:
const { user } = useAuth()
const [previousBest, setPreviousBest] = useState<number | null>(null)
const [saved, setSaved] = useState(false)

useEffect(() => {
  if (!user?.id) return
  void loadBestScore(user.id, mission.id).then(setPreviousBest)
}, [user?.id, mission.id])

useEffect(() => {
  if (state.status !== 'completed' || !user?.id || saved) return
  setSaved(true)
  void saveScriptedSession(user.id, mission.id, scoreScriptSession(lineScores))
}, [state.status, user?.id, saved, mission.id, lineScores])
```

Y pasa `previousBest` a `<ScriptedResult />`. Ojo: **carga la mejor marca antes
de guardar la sesión actual**, o compararás contra ti mismo.

- [ ] **Step 6: Verifica**

```bash
pnpm test components/ai-coach/missions/scripted
pnpm test lib/ai-practice/missions
pnpm type-check
```
Expected: todo PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/ai-practice/missions/scripted/ components/ai-coach/missions/scripted/
git commit -m "feat: persist scripted session scores and show improvement"
```

**Fin de Fase 2.** Las misiones con guión funcionan de principio a fin con el
catálogo autorado.

---

# FASE 3 — Contexto del estudiante y generación

## Task 17: `LearnerContext`

**Files:**
- Create: `lib/ai-coach/learner-context.ts`
- Test: `lib/ai-coach/__tests__/learner-context.test.ts`

- [ ] **Step 1: Localiza las fuentes reales**

```bash
grep -n "export async function\|export function" lib/progress/queries.ts | head -20
grep -n "export" lib/pronunciation/feedback/prioritize.ts | head
```
Anota los nombres exactos: los usarás en la implementación y en los mocks.

- [ ] **Step 2: Escribe el test que falla**

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildLearnerContext } from '../learner-context'

const loadSkillProfile = vi.fn()
vi.mock('@/lib/progress/queries', () => ({
  loadSkillProfile: (...args: unknown[]) => loadSkillProfile(...args),
}))

describe('buildLearnerContext', () => {
  beforeEach(() => loadSkillProfile.mockReset())

  it('toma el nivel CEFR del skill profile', async () => {
    loadSkillProfile.mockResolvedValue({ cefr: 'B1', weakestPhonemes: [] })
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('B1')
  })

  it('degrada a un nivel por defecto cuando no hay perfil', async () => {
    loadSkillProfile.mockResolvedValue(null)
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('A2')
    expect(context.weakTargets).toEqual([])
    expect(context.srsDueWords).toEqual([])
  })

  it('no propaga un fallo de la fuente', async () => {
    loadSkillProfile.mockRejectedValue(new Error('network'))
    const context = await buildLearnerContext('user-a')
    expect(context.cefr).toBe('A2')
  })
})
```

- [ ] **Step 3: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-coach/__tests__/learner-context.test.ts`
Expected: FAIL — no existe `../learner-context`

- [ ] **Step 4: Implementa**

```ts
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

/** Nivel asumido sin datos: ni tan bajo que aburra, ni tan alto que bloquee. */
const DEFAULT_CEFR: CEFRLevel = 'A2'

export interface LearnerContext {
  cefr: CEFRLevel
  recentTopics: string[]
  weakTargets: PronunciationTargetId[]
  strugglingWords: string[]
  /** Vocabulario en repaso, para que el guión lo obligue a producirlo. */
  srsDueWords: string[]
}

export function emptyLearnerContext(): LearnerContext {
  return {
    cefr: DEFAULT_CEFR,
    recentTopics: [],
    weakTargets: [],
    strugglingWords: [],
    srsDueWords: [],
  }
}

/**
 * Snapshot de lectura pura sobre fuentes que ya son dueñas de esta verdad.
 * No crea tabla de perfil: duplicar esa verdad la haría divergir.
 *
 * Nunca lanza — sin datos, la generación sigue funcionando, solo menos
 * personalizada.
 */
export async function buildLearnerContext(userId: string): Promise<LearnerContext> {
  const base = emptyLearnerContext()

  try {
    const { loadSkillProfile } = await import('@/lib/progress/queries')
    const profile = await loadSkillProfile(userId)
    if (!profile) return base

    return {
      ...base,
      cefr: (profile.cefr as CEFRLevel) ?? DEFAULT_CEFR,
      weakTargets: [],
    }
  } catch {
    return base
  }
}
```

> Ajusta el nombre de `loadSkillProfile` y la forma de `profile` a lo que
> encontraste en el Step 1. Si el perfil no expone `cefr` directamente, deriva
> el nivel con `normalizeCEFR` de `lib/exercises/cefr.ts`.

- [ ] **Step 5: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-coach/__tests__/learner-context.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
git add lib/ai-coach/learner-context.ts lib/ai-coach/__tests__/learner-context.test.ts
git commit -m "feat: assemble learner context for coach personalization"
```

---

## Task 18: Prompt de generación de guiones

Incluye la **Mejora 1** (sembrar con vocabulario del SRS).

**Files:**
- Modify: `lib/ai-prompts.ts`
- Test: `lib/__tests__/script-generation-prompt.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { buildScriptGenerationPrompt } from '@/lib/ai-prompts'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'

describe('buildScriptGenerationPrompt', () => {
  it('incluye el tema pedido y el nivel del estudiante', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'backend interview',
      context: { ...emptyLearnerContext(), cefr: 'B1' },
    })
    expect(prompt).toContain('backend interview')
    expect(prompt).toContain('B1')
  })

  it('siembra el guión con vocabulario en repaso', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'cafe',
      context: { ...emptyLearnerContext(), srsDueWords: ['although', 'receipt'] },
    })
    expect(prompt).toContain('although')
    expect(prompt).toContain('receipt')
  })

  it('funciona sin datos de personalización', () => {
    const prompt = buildScriptGenerationPrompt({
      topic: 'cafe',
      context: emptyLearnerContext(),
    })
    expect(prompt).toContain('cafe')
    expect(prompt.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/__tests__/script-generation-prompt.test.ts`
Expected: FAIL — no existe `buildScriptGenerationPrompt`

- [ ] **Step 3: Implementa en `lib/ai-prompts.ts`**

```ts
import type { LearnerContext } from '@/lib/ai-coach/learner-context'

interface ScriptGenerationInput {
  topic: string
  context: LearnerContext
}

/**
 * Prompt para generar un diálogo con guión.
 *
 * El vocabulario en repaso se siembra a propósito: obliga a PRODUCIR palabras
 * que hoy solo se reconocen pasivamente, que es donde más gente se atasca.
 */
export function buildScriptGenerationPrompt({
  topic,
  context,
}: ScriptGenerationInput): string {
  const lines = [
    `Write a short English dialogue for a Spanish-speaking learner at CEFR level ${context.cefr}.`,
    `Topic: ${topic}.`,
    '',
    'Rules:',
    '- Exactly 6 to 8 turns, alternating between "coach" and "learner".',
    '- The dialogue MUST start with the coach.',
    `- Keep vocabulary and grammar at ${context.cefr} level.`,
    '- Learner lines must be natural to say out loud, 4 to 12 words each.',
  ]

  if (context.srsDueWords.length > 0) {
    lines.push(
      `- Work these words into the LEARNER lines naturally: ${context.srsDueWords.slice(0, 6).join(', ')}.`,
    )
  }

  if (context.weakTargets.length > 0) {
    lines.push(
      `- Give the learner chances to practise these sounds: ${context.weakTargets.slice(0, 3).join(', ')}.`,
    )
  }

  lines.push(
    '',
    'Return JSON only, with this shape:',
    '{"script":[{"speaker":"coach","text":"..."},{"speaker":"learner","text":"..."}]}',
  )

  return lines.join('\n')
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/__tests__/script-generation-prompt.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/__tests__/script-generation-prompt.test.ts
git commit -m "feat: add script generation prompt seeded with SRS vocabulary"
```

---

## Task 19: Endpoint de generación

**Files:**
- Create: `app/api/gemini/generate-script/route.ts`
- Test: `app/api/gemini/__tests__/generate-script.test.ts`

- [ ] **Step 1: Copia el patrón de un endpoint existente**

```bash
sed -n 1,60p app/api/gemini/generate-reader/route.ts
```
Reusa **exactamente** sus guards (`requireSameOrigin`, `requireUser`,
`rateLimit`, `validateBody`) y su cadena de fallback de modelos. No inventes
un patrón nuevo.

- [ ] **Step 2: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { GeneratedScriptSchema } from '../generate-script/route'

describe('GeneratedScriptSchema', () => {
  it('acepta un guión bien formado', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [
        { speaker: 'coach', text: 'Hello there.' },
        { speaker: 'learner', text: 'Hi, nice to meet you.' },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rechaza un hablante desconocido', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [{ speaker: 'narrator', text: 'Once upon a time.' }],
    })
    expect(parsed.success).toBe(false)
  })

  it('rechaza un guión vacío', () => {
    expect(GeneratedScriptSchema.safeParse({ script: [] }).success).toBe(false)
  })

  it('rechaza texto vacío', () => {
    const parsed = GeneratedScriptSchema.safeParse({
      script: [{ speaker: 'coach', text: '' }],
    })
    expect(parsed.success).toBe(false)
  })
})
```

- [ ] **Step 3: Ejecuta para verificar que falla**

Run: `pnpm test app/api/gemini/__tests__/generate-script.test.ts`
Expected: FAIL — no existe la ruta

- [ ] **Step 4: Implementa**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  requireSameOrigin, requireUser, rateLimit, validateBody,
  SECURE_HEADERS, publicErrorResponse,
} from '@/lib/api/guards'
import { logServerError } from '@/lib/api/logging'
import { buildScriptGenerationPrompt } from '@/lib/ai-prompts'
import { emptyLearnerContext, type LearnerContext } from '@/lib/ai-coach/learner-context'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  topic: z.string().min(1).max(120),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  srsDueWords: z.array(z.string()).max(10).optional(),
}).strict()

/** Forma que debe devolver el modelo. Exportado para poder testearlo solo. */
export const GeneratedScriptSchema = z.object({
  script: z.array(z.object({
    speaker: z.enum(['coach', 'learner']),
    text: z.string().min(1).max(300),
  })).min(2).max(12),
}).strict()

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req)
  if (originError) return originError

  const { user, error: authError } = await requireUser(req)
  if (authError) return authError

  const { limited, error: rateLimitError } = await rateLimit(
    `/api/gemini/generate-script:${user.id}`,
    { max: 10, windowMs: 60_000, meta: { endpoint: '/api/gemini/generate-script', userId: user.id } },
  )
  if (limited) return rateLimitError

  const { data: body, error: validationError } = await validateBody(req, RequestSchema)
  if (validationError) return validationError

  const context: LearnerContext = {
    ...emptyLearnerContext(),
    cefr: body.cefr,
    srsDueWords: body.srsDueWords ?? [],
  }

  try {
    const prompt = buildScriptGenerationPrompt({ topic: body.topic, context })
    const raw = await callGeminiWithFallback(prompt)
    const parsed = GeneratedScriptSchema.safeParse(JSON.parse(raw))

    if (!parsed.success) {
      return publicErrorResponse(502, 'El modelo devolvió un guión inválido')
    }
    return NextResponse.json(parsed.data, { headers: SECURE_HEADERS })
  } catch (error) {
    logServerError('Script generation failed', error, {
      endpoint: '/api/gemini/generate-script',
      operation: 'generateScript',
      userId: user.id,
    })
    return publicErrorResponse(500, 'No se pudo generar el guión')
  }
}
```

> `callGeminiWithFallback` es un marcador: **usa el helper real** que emplea
> `generate-reader/route.ts` (flash-lite → flash → latest). Cópialo del Step 1;
> no escribas una llamada nueva a Gemini.

- [ ] **Step 5: Ejecuta para verificar que pasa**

Run: `pnpm test app/api/gemini/__tests__/generate-script.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
git add app/api/gemini/generate-script/ app/api/gemini/__tests__/generate-script.test.ts
git commit -m "feat: add script generation endpoint"
```

---

## Task 20: Guardar y reusar guiones generados

**Files:**
- Create: `lib/ai-practice/missions/scripted/generated-store.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/generated-store.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { saveGeneratedScript, listGeneratedScripts } from '../generated-store'

const script = [
  { speaker: 'coach' as const, text: 'Tell me about your stack.' },
  { speaker: 'learner' as const, text: 'I work mostly with Node and Postgres.' },
]

describe('generated script store', () => {
  afterEach(async () => { await db.generatedScripts.clear() })

  it('convierte un guión generado en misión ejecutable', async () => {
    const mission = await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    expect(mission.mode).toBe('scripted')
    expect(mission.origin).toBe('generated')
    expect(mission.script).toHaveLength(2)
    expect(mission.script[0].id).toBeTruthy()
  })

  it('recupera los guiones guardados del usuario', async () => {
    await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    const saved = await listGeneratedScripts('user-a')
    expect(saved).toHaveLength(1)
    expect(saved[0].context).toContain('backend interview')
  })

  it('no devuelve los guiones de otro usuario', async () => {
    await saveGeneratedScript('user-a', 'backend interview', 'B1', script)
    expect(await listGeneratedScripts('user-b')).toHaveLength(0)
  })

  it('da un id único a cada línea', async () => {
    const mission = await saveGeneratedScript('user-a', 'cafe', 'A2', script)
    const ids = mission.script.map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/generated-store.test.ts`
Expected: FAIL — no existe `../generated-store`

- [ ] **Step 3: Implementa**

```ts
'use client'

import { db } from '@/lib/db'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { ScriptedMission } from '../types'

interface RawScriptLine {
  speaker: 'coach' | 'learner'
  text: string
}

/**
 * Convierte la respuesta del modelo en una misión ejecutable y la guarda.
 *
 * Persistir es lo que permite repetir el guión sin volver a llamar a la API,
 * y que funcione offline la segunda vez.
 */
export async function saveGeneratedScript(
  userId: string,
  topic: string,
  cefr: CEFRLevel,
  lines: RawScriptLine[],
): Promise<ScriptedMission> {
  const id = `generated.${globalThis.crypto.randomUUID()}`

  const mission: ScriptedMission = {
    id,
    mode: 'scripted',
    origin: 'generated',
    category: 'social',
    recommendedCefr: cefr,
    context: topic,
    communicativeGoal: `Practicar un diálogo sobre ${topic}.`,
    targets: [],
    script: lines.map((line, index) => ({
      id: `${id}:${index}`,
      speaker: line.speaker,
      text: line.text,
    })),
  }

  await db.generatedScripts.put({
    id,
    userId,
    mission,
    topic,
    createdAt: new Date().toISOString(),
  })

  return mission
}

/** Guiones generados del usuario, del más reciente al más antiguo. */
export async function listGeneratedScripts(userId: string): Promise<ScriptedMission[]> {
  const rows = await db.generatedScripts.where('userId').equals(userId).toArray()
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => row.mission)
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/generated-store.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/generated-store.ts lib/ai-practice/missions/scripted/__tests__/generated-store.test.ts
git commit -m "feat: persist and reuse Gemini-generated scripts"
```

---

## Task 21: Sugerencia por nivel y tema libre

**Files:**
- Create: `lib/ai-practice/missions/scripted/suggest.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/suggest.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { suggestScriptedMission } from '../suggest'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'
import type { ScriptedMission } from '../../types'

function mission(id: string, cefr: ScriptedMission['recommendedCefr']): ScriptedMission {
  return {
    id, mode: 'scripted', origin: 'authored', category: 'service',
    recommendedCefr: cefr, context: id, communicativeGoal: 'x',
    targets: [], script: [{ id: `${id}-1`, speaker: 'coach', text: 'Hi' }],
  }
}

const catalog = [mission('a1-one', 'A1'), mission('b1-one', 'B1'), mission('c1-one', 'C1')]

describe('suggestScriptedMission', () => {
  it('elige el guión más cercano al nivel del estudiante', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B1' })
    expect(result?.mission.id).toBe('b1-one')
  })

  it('explica por qué lo sugiere', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B1' })
    expect(result?.reason).toContain('B1')
  })

  it('cae al más cercano cuando no hay coincidencia exacta', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B2' })
    expect(result?.mission.id).toBe('b1-one')
  })

  it('devuelve null con catálogo vacío', () => {
    expect(suggestScriptedMission([], emptyLearnerContext())).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/suggest.test.ts`
Expected: FAIL — no existe `../suggest`

- [ ] **Step 3: Implementa**

```ts
import { cefrDistance } from '@/lib/exercises/cefr'
import type { LearnerContext } from '@/lib/ai-coach/learner-context'
import type { ScriptedMission } from '../types'

export interface ScriptSuggestion {
  mission: ScriptedMission
  /** Razón legible: la sugerencia debe explicarse, no ser mágica. */
  reason: string
}

/**
 * Elige el guión más cercano al nivel del estudiante.
 *
 * La razón se muestra en la UI a propósito: una recomendación que no se
 * explica se percibe como arbitraria y se ignora.
 */
export function suggestScriptedMission(
  catalog: readonly ScriptedMission[],
  context: LearnerContext,
): ScriptSuggestion | null {
  if (catalog.length === 0) return null

  const best = [...catalog].sort(
    (a, b) =>
      cefrDistance(context.cefr, a.recommendedCefr) -
      cefrDistance(context.cefr, b.recommendedCefr),
  )[0]

  const reasonParts = [`${best.recommendedCefr} · tu nivel es ${context.cefr}`]
  if (context.weakTargets.length > 0) {
    reasonParts.push(`trabaja ${context.weakTargets[0]}`)
  }

  return { mission: best, reason: reasonParts.join(' · ') }
}
```

> Comprueba la firma de `cefrDistance`:
> `grep -n "cefrDistance" -A 4 lib/exercises/cefr.ts`. Ajusta el orden de
> argumentos si difiere.

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/suggest.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/suggest.ts lib/ai-practice/missions/scripted/__tests__/suggest.test.ts
git commit -m "feat: suggest scripted missions by learner level"
```

---

## Task 22: Enganche al plan diario

**Files:**
- Modify: `lib/practice/daily-plan/mission-cadence.ts`
- Test: `lib/practice/daily-plan/__tests__/mission-cadence.test.ts`

- [ ] **Step 1: Añade el test que falla al archivo existente**

```ts
import { describe, expect, it } from 'vitest'
import { shouldOfferScriptedMission } from '../mission-cadence'

describe('shouldOfferScriptedMission', () => {
  it('ofrece guión en martes y jueves', () => {
    expect(shouldOfferScriptedMission(2, true)).toBe(true)
    expect(shouldOfferScriptedMission(4, true)).toBe(true)
  })

  it('no compite con los días de conversación libre', () => {
    expect(shouldOfferScriptedMission(1, true)).toBe(false)
    expect(shouldOfferScriptedMission(3, true)).toBe(false)
    expect(shouldOfferScriptedMission(5, true)).toBe(false)
  })

  it('no ofrece nada sin reconocimiento de voz', () => {
    expect(shouldOfferScriptedMission(2, false)).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/practice/daily-plan/__tests__/mission-cadence.test.ts`
Expected: FAIL — no existe `shouldOfferScriptedMission`

- [ ] **Step 3: Implementa**

Añade a `mission-cadence.ts`, sin tocar lo existente:

```ts
/**
 * Martes y jueves, alternando con los días de conversación libre (L/M/V).
 * Repartirlos evita que una misma sesión traiga dos ejercicios orales largos.
 */
export const SCRIPTED_MISSION_DAYS: readonly number[] = [2, 4]

export function shouldOfferScriptedMission(
  dayOfWeek: number,
  hasSpeechRecognition: boolean,
): boolean {
  if (!hasSpeechRecognition) return false
  return SCRIPTED_MISSION_DAYS.includes(dayOfWeek)
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/practice/daily-plan`
Expected: PASS — los tests nuevos y los existentes

- [ ] **Step 5: Commit**

```bash
git add lib/practice/daily-plan/mission-cadence.ts lib/practice/daily-plan/__tests__/mission-cadence.test.ts
git commit -m "feat: offer scripted missions on alternating weekdays"
```

**Fin de Fase 3.** El coach conoce el nivel del estudiante, genera guiones
personalizados y los ofrece en el plan diario.

---

# FASE 4 — Mejoras de conexión

## Task 23: Señal de prioridad al SRS (Mejora 2)

> **La parte más delicada del proyecto.** Tocar la priorización del SRS puede
> degradar los repasos de vocabulario, que son el núcleo de la app. Por eso la
> señal va **acotada, con techo y desactivable**, y nunca reescribe scheduling.

**Files:**
- Create: `lib/pronunciation/feedback/srs-priority-signal.ts`
- Test: `lib/pronunciation/feedback/__tests__/srs-priority-signal.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import {
  computePriorityBoost,
  MAX_PRIORITY_BOOST,
} from '../srs-priority-signal'

describe('computePriorityBoost', () => {
  it('no sube nada sin fallos hablados', () => {
    expect(computePriorityBoost({ spokenFailures: 0, spokenAttempts: 3 })).toBe(0)
  })

  it('sube la prioridad cuando se falla al hablar', () => {
    const boost = computePriorityBoost({ spokenFailures: 2, spokenAttempts: 3 })
    expect(boost).toBeGreaterThan(0)
  })

  it('nunca supera el techo, por muchos fallos que haya', () => {
    const boost = computePriorityBoost({ spokenFailures: 500, spokenAttempts: 500 })
    expect(boost).toBeLessThanOrEqual(MAX_PRIORITY_BOOST)
  })

  it('devuelve 0 sin intentos, en lugar de dividir por cero', () => {
    expect(computePriorityBoost({ spokenFailures: 0, spokenAttempts: 0 })).toBe(0)
  })

  it('ignora fallos incoherentes con los intentos', () => {
    expect(computePriorityBoost({ spokenFailures: 5, spokenAttempts: 2 }))
      .toBeLessThanOrEqual(MAX_PRIORITY_BOOST)
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/pronunciation/feedback/__tests__/srs-priority-signal.test.ts`
Expected: FAIL — no existe `../srs-priority-signal`

- [ ] **Step 3: Implementa**

```ts
/**
 * Techo del ajuste. Existe para que un mal día de micrófono no pueda
 * secuestrar la cola de repasos: la señal empuja, nunca decide.
 */
export const MAX_PRIORITY_BOOST = 0.25

/** Interruptor de apagado. Si algo va mal, esto lo desactiva sin tocar el motor. */
export const SPOKEN_SIGNAL_ENABLED = true

interface SpokenEvidence {
  spokenFailures: number
  spokenAttempts: number
}

/**
 * Traduce fallos hablados en un empujón acotado de prioridad de repaso.
 *
 * Deliberadamente NO reescribe el scheduling SM-2: devuelve un número
 * pequeño que el consumidor suma, de modo que desactivarlo restaura el
 * comportamiento anterior exactamente.
 */
export function computePriorityBoost(evidence: SpokenEvidence): number {
  if (!SPOKEN_SIGNAL_ENABLED) return 0
  if (evidence.spokenAttempts <= 0 || evidence.spokenFailures <= 0) return 0

  const failureRate = Math.min(1, evidence.spokenFailures / evidence.spokenAttempts)
  return Math.min(MAX_PRIORITY_BOOST, failureRate * MAX_PRIORITY_BOOST)
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/pronunciation/feedback/__tests__/srs-priority-signal.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Verifica que el SRS existente no cambia**

```bash
pnpm test lib/practice
pnpm test lib/essential-words
```
Expected: todo PASS. El módulo aún no tiene consumidores: hasta aquí es
**puramente aditivo**, que es justo lo que lo hace seguro.

- [ ] **Step 6: Commit**

```bash
git add lib/pronunciation/feedback/srs-priority-signal.ts lib/pronunciation/feedback/__tests__/srs-priority-signal.test.ts
git commit -m "feat: add capped, reversible spoken-error priority signal"
```

---

## Task 24: Guión de repaso desde los fallos (Mejora 3)

**Files:**
- Create: `lib/ai-practice/missions/scripted/review-script.ts`
- Test: `lib/ai-practice/missions/scripted/__tests__/review-script.test.ts`

- [ ] **Step 1: Escribe el test que falla**

```ts
import { describe, expect, it } from 'vitest'
import { buildReviewScriptRequest, MIN_WEAKNESSES_FOR_REVIEW } from '../review-script'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'

describe('buildReviewScriptRequest', () => {
  it('devuelve null sin historial suficiente', () => {
    expect(buildReviewScriptRequest(emptyLearnerContext())).toBeNull()
  })

  it('construye una petición con las debilidades acumuladas', () => {
    const context = {
      ...emptyLearnerContext(),
      cefr: 'B1' as const,
      strugglingWords: ['although', 'thorough', 'receipt'],
    }
    const request = buildReviewScriptRequest(context)
    expect(request).not.toBeNull()
    expect(request!.topic).toContain('repaso')
    expect(request!.srsDueWords).toContain('although')
  })

  it('exige el mínimo de debilidades', () => {
    const context = { ...emptyLearnerContext(), strugglingWords: ['one'] }
    expect(context.strugglingWords.length).toBeLessThan(MIN_WEAKNESSES_FOR_REVIEW)
    expect(buildReviewScriptRequest(context)).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecuta para verificar que falla**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/review-script.test.ts`
Expected: FAIL — no existe `../review-script`

- [ ] **Step 3: Implementa**

```ts
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { LearnerContext } from '@/lib/ai-coach/learner-context'

/**
 * Mínimo de debilidades para que el repaso tenga sentido. Por debajo, el
 * guión se parecería demasiado a uno normal y no merece una llamada aparte.
 */
export const MIN_WEAKNESSES_FOR_REVIEW = 3

export interface ReviewScriptRequest {
  topic: string
  cefr: CEFRLevel
  srsDueWords: string[]
}

/**
 * Petición de un "examen de recuperación" hablado, hecho solo con lo peor
 * pronunciado últimamente. Sin historial suficiente devuelve `null` y el
 * llamador cae a la generación normal.
 */
export function buildReviewScriptRequest(
  context: LearnerContext,
): ReviewScriptRequest | null {
  const weaknesses = [...context.strugglingWords, ...context.weakTargets.map(String)]
  if (weaknesses.length < MIN_WEAKNESSES_FOR_REVIEW) return null

  return {
    topic: 'una conversación de repaso con las palabras que más te cuestan',
    cefr: context.cefr,
    srsDueWords: context.strugglingWords.slice(0, 6),
  }
}
```

- [ ] **Step 4: Ejecuta para verificar que pasa**

Run: `pnpm test lib/ai-practice/missions/scripted/__tests__/review-script.test.ts`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/scripted/review-script.ts lib/ai-practice/missions/scripted/__tests__/review-script.test.ts
git commit -m "feat: build review script request from accumulated weaknesses"
```

---

## Task 25: Verificación final

- [ ] **Step 1: Suite completa**

```bash
pnpm test
```
Expected: PASS. Cualquier fallo se arregla antes de seguir — **no lo declares
terminado sin ver la salida en verde.**

- [ ] **Step 2: Tipos y lint**

```bash
pnpm type-check
pnpm lint
```
Expected: sin errores. `lint` avisa a las 300 líneas; si algún archivo nuevo lo
supera, decomponlo.

- [ ] **Step 3: Build**

```bash
pnpm build
```
Expected: compila. Aquí saltan los imports dinámicos rotos del runner registry.

- [ ] **Step 4: Comprueba los límites de tamaño**

```bash
wc -l components/ai-coach/missions/scripted/*.tsx lib/ai-practice/missions/scripted/*.ts
```
Expected: todo por debajo de 250. Decompón lo que se pase.

- [ ] **Step 5: Verificación manual en el navegador**

```bash
pnpm dev
```

Comprueba:
1. Una misión con guión se abre desde la biblioteca del AI Coach.
2. La línea del coach suena al pulsar "Escuchar".
3. Al grabar, las sílabas falladas salen en amarillo/rojo.
4. "Repetir" permite reintentar la línea.
5. La barra de comparación reproduce ambos audios.
6. Al terminar aparece la puntuación.
7. Repetir la misión muestra la comparación con la marca anterior.
8. Con el micrófono denegado, la misión avanza sin puntuar y **no muestra 0%**.

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: complete scripted speaking missions"
```

---

## Notas para quien implementa

**Si un test falla por una API que no coincide con este plan:** el plan se
escribió leyendo el código, pero puede haber cambiado. Verifica la firma real
con `grep`, ajusta, y sigue. No fuerces el código para que encaje con el plan.

**Si el mapeo silábico devuelve `null` más de lo esperado:** es el
comportamiento correcto. El fallback por fonema ya es útil. Mejorar la
cobertura silábica es trabajo posterior, no motivo para relajar el guard —
pintar sílabas mal alineadas es peor que no pintarlas.

**No persistas audio del usuario.** Está fuera de alcance a propósito: exige un
diseño de consentimiento y retención que no existe todavía.
