# Phoneme Feedback Table (estilo ELSA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una tabla de feedback fonético estilo ELSA (SONIDO / DIJISTE) al flujo de práctica Core-1000 (`SpeakReviewCard`), mostrando un desglose por fonema con explicación articulatoria en los errores.

**Architecture:** La comparación ya la produce el motor local (`scorePronunciation` → `analyzePhonemes`), que enriquece cada `WordResult` con `phonemes.alignment`. Se añaden dos piezas puras: una constante de descripciones articulatorias por fonema IPA (`articulation.ts`) y un componente de presentación (`PhonemeFeedbackTable.tsx`). Sin IA nueva, sin Supabase, sin caché nuevo.

**Tech Stack:** React 19, TypeScript, Tailwind v4 (tokens CSS), Vitest + @testing-library/react.

---

## File Structure

| Archivo | Responsabilidad |
|---------|-----------------|
| `lib/pronunciation/articulation.ts` | Constante `ARTICULATION: Record<string,string>` (IPA → descripción ES) + helper `getArticulation`. Pura data. |
| `lib/pronunciation/__tests__/articulation.test.ts` | Tests del helper y cobertura de fonemas. |
| `components/lesson/PhonemeFeedbackTable.tsx` | Componente de presentación: renderiza la tabla SONIDO/DIJISTE desde `wordResults`. |
| `components/lesson/__tests__/PhonemeFeedbackTable.test.tsx` | Tests del componente. |
| `components/practice/core-1000/SpeakReviewCard.tsx` | Editar: insertar `<PhonemeFeedbackTable>` bajo el resumen. |

### Tipos existentes (NO crear — ya en `lib/types.ts`)

```ts
interface PhonemeAlignment {
  phoneme: string;
  ipa?: string;
  status: "correct" | "incorrect" | "missing";
  got?: string;
  gotIpa?: string;
}
interface PhonemeResult { expected: string[]; got: string[]; tip: string | null; alignment: PhonemeAlignment[] }
interface WordResult { expected: string; got: string; status: WordStatus; phonemes?: PhonemeResult }
```

Nota verificada: `scoring.ts` enriquece con `phonemes` a TODAS las palabras (correctas e incorrectas), no solo las incorrectas.

El mapa de símbolos IPA disponible está en `lib/pronunciation/phonemes.ts` → `ARPABET_TO_IPA` (export). Sus valores son los símbolos IPA que usaremos como claves de `ARTICULATION`.

---

## Task 1: Constante de articulación + helper

**Files:**
- Create: `lib/pronunciation/articulation.ts`
- Test: `lib/pronunciation/__tests__/articulation.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `lib/pronunciation/__tests__/articulation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ARTICULATION, getArticulation } from '../articulation'
import { ARPABET_TO_IPA } from '../phonemes'

describe('getArticulation', () => {
  it('devuelve una descripción para un fonema conocido', () => {
    expect(getArticulation('t')).toMatch(/lengua/i)
    expect(typeof getArticulation('s')).toBe('string')
  })

  it('devuelve null para un símbolo desconocido', () => {
    expect(getArticulation('zzz')).toBeNull()
    expect(getArticulation('')).toBeNull()
  })

  it('tiene una entrada para cada símbolo IPA de ARPABET_TO_IPA', () => {
    // Previene huecos: todo fonema que el motor puede emitir debe tener texto.
    const ipaSymbols = Array.from(new Set(Object.values(ARPABET_TO_IPA)))
    const missing = ipaSymbols.filter((ipa) => !(ipa in ARTICULATION))
    expect(missing).toEqual([])
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test articulation`
Expected: FAIL — `Cannot find module '../articulation'`

- [ ] **Step 3: Implementar la constante**

Create `lib/pronunciation/articulation.ts`. Las claves deben cubrir TODOS los valores únicos de `ARPABET_TO_IPA` en `phonemes.ts`. Símbolos a cubrir (valores de `ARPABET_TO_IPA`):

`ɑ æ ʌ ɔ aʊ aɪ ɛ ɜr eɪ ɪ iː oʊ ɔɪ ʊ uː b tʃ d ð f ɡ h dʒ k l m n ŋ p ɹ s ʃ t θ v w j z ʒ`

```ts
/**
 * Descripciones articulatorias en español, una por símbolo IPA.
 * Texto fijo (sin IA): cómo producir cada sonido del inglés. Indexado por el
 * mismo símbolo IPA que ARPABET_TO_IPA (lib/pronunciation/phonemes.ts) emite,
 * de modo que se enlaza directo con PhonemeAlignment.ipa.
 */
export const ARTICULATION: Record<string, string> = {
  // Vocales
  ɑ: "Abre bien la boca y mantén la lengua baja y atrás, como en 'father'.",
  æ: "Abre la boca y baja la lengua al frente, como la 'a' de 'cat'.",
  ʌ: "Relaja la boca con una abertura media, sonido corto como en 'but'.",
  ɔ: "Redondea los labios ligeramente con la lengua atrás, como en 'law'.",
  aʊ: "Empieza con la boca abierta ('a') y cierra hacia 'u', como en 'cow'.",
  aɪ: "Empieza con 'a' abierta y desliza hacia 'i', como en 'bite'.",
  ɛ: "Boca entreabierta, lengua media al frente, como la 'e' de 'bet'.",
  ɜr: "Lengua central con los labios neutros y el sonido de 'r', como en 'bird'.",
  eɪ: "Empieza en 'e' y desliza hacia 'i', como en 'bake'.",
  ɪ: "Sonido corto y relajado, como la 'i' de 'bit' (no tan tenso como 'beet').",
  iː: "Estira los labios y tensa la lengua arriba al frente, como en 'beet'.",
  oʊ: "Empieza redondeando los labios y desliza hacia 'u', como en 'boat'.",
  ɔɪ: "Empieza en 'o' redondeada y desliza hacia 'i', como en 'boy'.",
  ʊ: "Sonido corto con labios algo redondeados, como en 'book'.",
  uː: "Redondea bien los labios y eleva la lengua atrás, como en 'boot'.",
  // Consonantes
  b: "Junta los labios y suéltalos con voz (vibración en la garganta).",
  tʃ: "Combina 't' + 'sh' en un golpe, como en 'cheese'.",
  d: "Presiona la lengua contra las encías superiores y suéltala con voz.",
  ð: "Saca un poco la lengua entre los dientes y vibra, como en 'the'.",
  f: "Apoya los dientes superiores sobre el labio inferior y deja salir el aire.",
  ɡ: "Eleva la parte de atrás de la lengua contra el paladar y suelta con voz.",
  h: "Deja salir un soplo de aire suave desde la garganta, como en 'hat'.",
  dʒ: "Combina 'd' + el sonido suave de 'g', como en 'jump'.",
  k: "Eleva la parte de atrás de la lengua contra el paladar y suelta sin voz.",
  l: "Toca con la punta de la lengua las encías superiores dejando salir el aire por los lados.",
  m: "Junta los labios dejando salir el aire por la nariz.",
  n: "Apoya la punta de la lengua en las encías superiores y deja salir el aire por la nariz.",
  ŋ: "Eleva la parte de atrás de la lengua y deja salir el aire por la nariz, como en 'sing'.",
  p: "Junta los labios y suéltalos con un golpe de aire, sin voz.",
  ɹ: "Curva la lengua hacia atrás sin tocar el paladar, como la 'r' inglesa de 'red'.",
  s: "Deja que el aire fluya suavemente entre la lengua y el paladar, sin detenerlo.",
  ʃ: "Redondea un poco los labios y deja salir el aire, como el 'sh' de 'shoe'.",
  t: "Presiona la lengua contra las encías superiores, detrás de los dientes, y suéltala con un golpe de aire.",
  θ: "Saca un poco la lengua entre los dientes y deja salir el aire sin voz, como en 'think'.",
  v: "Apoya los dientes superiores sobre el labio inferior y vibra con voz.",
  w: "Redondea los labios y deslízalos hacia la vocal, como en 'we'.",
  j: "Empieza con la lengua alta al frente y desliza hacia la vocal, como la 'y' de 'yes'.",
  z: "Como la 's' pero con voz: deja fluir el aire vibrando, como en 'zoo'.",
  ʒ: "Como 'sh' pero con voz, como en 'vision'.",
}

export function getArticulation(ipa: string): string | null {
  return ARTICULATION[ipa] ?? null
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `pnpm test articulation`
Expected: PASS (3 tests). Si el test de cobertura falla, añade la clave faltante que reporte `missing`.

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/articulation.ts lib/pronunciation/__tests__/articulation.test.ts
git commit -m "feat(pronunciation): add articulation descriptions per IPA phoneme

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Componente PhonemeFeedbackTable

**Files:**
- Create: `components/lesson/PhonemeFeedbackTable.tsx`
- Test: `components/lesson/__tests__/PhonemeFeedbackTable.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Create `components/lesson/__tests__/PhonemeFeedbackTable.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhonemeFeedbackTable } from '../PhonemeFeedbackTable'
import type { WordResult } from '@/lib/types'

const wordResults: WordResult[] = [
  {
    expected: 'staff',
    got: 'stiff',
    status: 'incorrect',
    phonemes: {
      expected: [], got: [], tip: null,
      alignment: [
        { phoneme: 's', ipa: 's', status: 'correct' },
        { phoneme: 't', ipa: 't', status: 'correct' },
        { phoneme: 'æ', ipa: 'æ', status: 'incorrect', got: 'ɪ', gotIpa: 'ɪ' },
        { phoneme: 'f', ipa: 'f', status: 'correct' },
      ],
    },
  },
]

describe('PhonemeFeedbackTable', () => {
  it('muestra la articulación en fonemas incorrectos', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    // El fonema /æ/ es incorrecto → su descripción articulatoria aparece
    expect(screen.getByText(/baja la lengua al frente/i)).toBeInTheDocument()
    // El IPA dicho se muestra
    expect(screen.getByText('/ɪ/')).toBeInTheDocument()
  })

  it('muestra ¡Excelente! en fonemas correctos sin texto articulatorio', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    // 3 fonemas correctos → 3 "¡Excelente!"
    expect(screen.getAllByText('¡Excelente!')).toHaveLength(3)
  })

  it('no renderiza nada con wordResults vacío', () => {
    const { container } = render(<PhonemeFeedbackTable wordResults={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('omite palabras sin datos de fonemas sin romper', () => {
    const noPhonemes: WordResult[] = [{ expected: 'a', got: 'a', status: 'correct' }]
    const { container } = render(<PhonemeFeedbackTable wordResults={noPhonemes} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `pnpm test PhonemeFeedbackTable`
Expected: FAIL — `Cannot find module '../PhonemeFeedbackTable'`

- [ ] **Step 3: Implementar el componente**

Create `components/lesson/PhonemeFeedbackTable.tsx`:

```tsx
'use client'

// Planned structure:
// <PhonemeFeedbackTable>
//   <PhonemeRow />   — un fonema: SONIDO | DIJISTE/¡Excelente! + articulación
// </PhonemeFeedbackTable>

import { getArticulation } from '@/lib/pronunciation/articulation'
import type { PhonemeAlignment, WordResult } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
}

interface FlatPhoneme extends PhonemeAlignment {
  key: string
}

// --- PhonemeRow ---
function PhonemeRow({ p }: { p: FlatPhoneme }) {
  const expectedIpa = p.ipa ? `/${p.ipa}/` : `/${p.phoneme}/`
  const isCorrect = p.status === 'correct'

  return (
    <div className="grid grid-cols-[72px_1fr] gap-2 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="text-lg font-semibold text-[var(--text-primary)] [font-family:var(--font-ipa),monospace]">
        {expectedIpa}
      </div>
      {isCorrect ? (
        <div className="text-sm font-semibold text-[var(--success)]">¡Excelente!</div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold text-[var(--error)] [font-family:var(--font-ipa),monospace]">
            {p.status === 'missing' ? '—' : p.gotIpa ? `/${p.gotIpa}/` : `/${p.got}/`}
          </div>
          {getArticulation(p.ipa ?? p.phoneme) && (
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] m-0">
              {getArticulation(p.ipa ?? p.phoneme)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PhonemeFeedbackTable({ wordResults }: Props) {
  const phonemes: FlatPhoneme[] = wordResults.flatMap((w, wi) =>
    (w.phonemes?.alignment ?? []).map((p, pi) => ({ ...p, key: `${wi}-${pi}` })),
  )

  if (phonemes.length === 0) return null

  return (
    <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="grid grid-cols-[72px_1fr] gap-2 px-4 py-2 border-b border-[var(--border-subtle)] text-xs font-semibold uppercase tracking-[.05em] text-[var(--text-tertiary)]">
        <span>Sonido</span>
        <span>Dijiste</span>
      </div>
      {phonemes.map((p) => (
        <PhonemeRow key={p.key} p={p} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verificar que el token `--success` existe**

Run: `grep -n "\-\-success" app/globals.css`
Expected: una línea que define `--success`. Si NO existe, reemplaza `var(--success)` por `var(--primary)` en el componente (verde no disponible → usa el color de marca). Verifica también `--radius-lg`; si no existe, usa `--radius-md` o `--radius`.

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `pnpm test PhonemeFeedbackTable`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add components/lesson/PhonemeFeedbackTable.tsx components/lesson/__tests__/PhonemeFeedbackTable.test.tsx
git commit -m "feat(lesson): add PhonemeFeedbackTable (ELSA-style sound breakdown)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Integrar en SpeakReviewCard

**Files:**
- Modify: `components/practice/core-1000/SpeakReviewCard.tsx`

- [ ] **Step 1: Añadir el import**

En `components/practice/core-1000/SpeakReviewCard.tsx`, junto al import de `PronunciationFeedback` (línea ~20), añadir:

```tsx
import { PhonemeFeedbackTable } from '@/components/lesson/PhonemeFeedbackTable'
```

- [ ] **Step 2: Insertar la tabla bajo el resumen**

Localizar el bloque de resultado (la rama `else` con `<PronunciationFeedback ... />`, ~líneas 209-214). Inmediatamente DESPUÉS de la etiqueta `<PronunciationFeedback ... />` y ANTES del `<div className="flex gap-2">` de los botones, insertar:

```tsx
          <PhonemeFeedbackTable wordResults={scored.wordResults} />
```

El bloque queda así:

```tsx
          <PronunciationFeedback
            wordResults={scored.wordResults}
            accuracy={scored.score}
            feedback={getFeedbackMessage(scored.score, 70)}
            xpEarned={calculateXP(scored.score)}
          />
          <PhonemeFeedbackTable wordResults={scored.wordResults} />
          <div className="flex gap-2">
```

- [ ] **Step 3: Verificar tipos**

Run: `pnpm type-check`
Expected: EXIT 0 (sin errores).

- [ ] **Step 4: Verificar que la suite de tests pasa**

Run: `pnpm test`
Expected: PASS — sin regresiones; los tests nuevos de Task 1 y 2 incluidos.

- [ ] **Step 5: Commit**

```bash
git add components/practice/core-1000/SpeakReviewCard.tsx
git commit -m "feat(core-1000): show phoneme feedback table after speak review

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificación final (manual, opcional)

1. `pnpm dev`, ir a la práctica Core-1000 con modo speak.
2. Grabar una oración pronunciando mal una palabra (en Chrome para WebSpeech, o cualquier navegador vía fallback Gemini).
3. Confirmar: aparece el resumen (`PronunciationFeedback`) seguido de la tabla SONIDO/DIJISTE; los fonemas correctos dicen "¡Excelente!" y los incorrectos muestran el IPA dicho + la descripción articulatoria.
