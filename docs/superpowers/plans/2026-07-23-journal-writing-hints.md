# Journal Writing Hints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two independent support features to the journal editor: a static
collapsible reference guide (verb tenses + useful phrases), and a local
rule-based engine that underlines high-confidence mechanical mistakes while
the student types, with a hover/tap tooltip and an on/off toggle.

**Architecture:** Piece A (guide) is fully static content rendered in a new
collapsible panel wired into `JournalWorkspace`. Piece B (hints) is a pure
rule-detection module (`lib/journal/writing-hints/`) driven by a new
`useWritingHints` hook, rendered as a mirrored-div underline overlay behind
the existing `<textarea>` in `JournalEditor`. Neither piece touches Gemini,
Supabase, or the existing autosave/correction logic in `useJournalEntry`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4,
Vitest, `cn()` (clsx + tailwind-merge), existing icon set
(`@/components/icons`), `localStorage` for the hints toggle preference.

---

## File Structure

**Piece A — Writing Guide**
- Create: `lib/journal/writing-guide-content.ts` — static typed data (verb
  tense tables, phrase groups). No logic.
- Create: `components/journal/WritingGuidePanel.tsx` — collapsible wrapper +
  tab switcher (client component, local `useState` only).
- Create: `components/journal/VerbTensesGuide.tsx` — renders the tense
  tables.
- Create: `components/journal/UsefulPhrasesGuide.tsx` — renders phrase
  groups.
- Modify: `components/journal/JournalWorkspace.tsx` — mount
  `<WritingGuidePanel>` next to the editor.

**Piece B — Live Writing Hints**
- Create: `lib/journal/writing-hints/types.ts` — `WritingHintMatch`,
  `WritingHintRule` types.
- Create: `lib/journal/writing-hints/rules.ts` — pure rule functions.
- Create: `lib/journal/writing-hints/detect-hints.ts` — orchestrates rules,
  resolves overlaps.
- Create: `lib/journal/writing-hints/hint-labels.ts` — Spanish messages by
  `ruleId`.
- Test: `lib/journal/writing-hints/__tests__/rules.test.ts`
- Test: `lib/journal/writing-hints/__tests__/detect-hints.test.ts`
- Create: `hooks/useWritingHints.ts` — debounced detection hook.
- Create: `hooks/useWritingHintsPreference.ts` — `localStorage`-backed
  on/off toggle.
- Create: `components/journal/WritingHintsOverlay.tsx` — mirrored-div
  underline overlay.
- Create: `components/journal/WritingHintTooltip.tsx` — tooltip shown on
  hover/tap of a hint mark.
- Modify: `components/journal/JournalEditor.tsx` — mount overlay behind the
  textarea, add toggle control.

---

## Task 1: Writing guide static content

**Files:**
- Create: `lib/journal/writing-guide-content.ts`

- [ ] **Step 1: Write the content module**

```typescript
// lib/journal/writing-guide-content.ts

export interface VerbTenseExample {
  english: string
  spanish: string
}

export interface VerbTenseGroup {
  tense: 'present' | 'past' | 'future'
  label: string
  examples: VerbTenseExample[]
}

export interface UsefulPhraseGroup {
  purpose: string
  phrases: string[]
}

export const VERB_TENSE_GUIDE: VerbTenseGroup[] = [
  {
    tense: 'present',
    label: 'Presente',
    examples: [
      { english: 'I write in my journal every day.', spanish: 'Escribo en mi diario todos los días.' },
      { english: 'She goes to work by bus.', spanish: 'Ella va al trabajo en autobús.' },
      { english: 'They have two dogs.', spanish: 'Ellos tienen dos perros.' },
    ],
  },
  {
    tense: 'past',
    label: 'Pasado',
    examples: [
      { english: 'I wrote in my journal yesterday.', spanish: 'Escribí en mi diario ayer.' },
      { english: 'She went to work by bus.', spanish: 'Ella fue al trabajo en autobús.' },
      { english: 'They had two dogs.', spanish: 'Ellos tenían dos perros.' },
    ],
  },
  {
    tense: 'future',
    label: 'Futuro',
    examples: [
      { english: 'I will write in my journal tomorrow.', spanish: 'Escribiré en mi diario mañana.' },
      { english: 'She will go to work by bus.', spanish: 'Ella irá al trabajo en autobús.' },
      { english: 'They will have two dogs.', spanish: 'Ellos tendrán dos perros.' },
    ],
  },
]

export const USEFUL_PHRASES_GUIDE: UsefulPhraseGroup[] = [
  {
    purpose: 'Contar algo que pasó',
    phrases: ['Yesterday I...', 'Last week I...', 'This morning I...', 'A few days ago...'],
  },
  {
    purpose: 'Dar tu opinión',
    phrases: ['I think that...', 'In my opinion...', 'I feel like...', 'I believe...'],
  },
  {
    purpose: 'Conectar ideas',
    phrases: ['because', 'however', 'and then', 'so', 'but', 'also'],
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add lib/journal/writing-guide-content.ts
git commit -m "feat(journal): add static writing guide content"
```

---

## Task 2: VerbTensesGuide and UsefulPhrasesGuide components

**Files:**
- Create: `components/journal/VerbTensesGuide.tsx`
- Create: `components/journal/UsefulPhrasesGuide.tsx`

- [ ] **Step 1: Write VerbTensesGuide**

```tsx
// components/journal/VerbTensesGuide.tsx

import { VERB_TENSE_GUIDE } from '@/lib/journal/writing-guide-content'

export function VerbTensesGuide() {
  return (
    <div className="flex flex-col gap-4">
      {VERB_TENSE_GUIDE.map((group) => (
        <div key={group.tense} className="flex flex-col gap-1.5">
          <h4 className="font-body-sm font-semibold text-fg">{group.label}</h4>
          <ul className="flex flex-col gap-1">
            {group.examples.map((example) => (
              <li key={example.english} className="font-body-sm text-fg-muted">
                <span className="text-fg">{example.english}</span>
                <span className="text-fg-subtle"> — {example.spanish}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write UsefulPhrasesGuide**

```tsx
// components/journal/UsefulPhrasesGuide.tsx

import { USEFUL_PHRASES_GUIDE } from '@/lib/journal/writing-guide-content'

export function UsefulPhrasesGuide() {
  return (
    <div className="flex flex-col gap-4">
      {USEFUL_PHRASES_GUIDE.map((group) => (
        <div key={group.purpose} className="flex flex-col gap-1.5">
          <h4 className="font-body-sm font-semibold text-fg">{group.purpose}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {group.phrases.map((phrase) => (
              <li
                key={phrase}
                className="rounded-[var(--radius-sm)] bg-surface-sunken px-2 py-1 font-body-sm text-fg-muted"
              >
                {phrase}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors related to these two files.

- [ ] **Step 4: Commit**

```bash
git add components/journal/VerbTensesGuide.tsx components/journal/UsefulPhrasesGuide.tsx
git commit -m "feat(journal): add verb tense and useful phrases guide components"
```

---

## Task 3: WritingGuidePanel (collapsible + tabs)

**Files:**
- Create: `components/journal/WritingGuidePanel.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/journal/WritingGuidePanel.tsx
'use client'

// Planned structure:
// <WritingGuidePanel>
//   <details> (collapsible wrapper, closed by default)
//     tab buttons: Tiempos / Frases
//     <VerbTensesGuide /> or <UsefulPhrasesGuide />
//   </details>
// </WritingGuidePanel>

import { useState } from 'react'
import { BookOpen, ChevronDown } from '@/components/icons'
import { cn } from '@/lib/cn'
import { VerbTensesGuide } from './VerbTensesGuide'
import { UsefulPhrasesGuide } from './UsefulPhrasesGuide'

type GuideTab = 'tenses' | 'phrases'

export function WritingGuidePanel() {
  const [activeTab, setActiveTab] = useState<GuideTab>('tenses')

  return (
    <details className="group rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm font-medium text-fg">
        <BookOpen size={14} className="shrink-0 text-fg-subtle" aria-hidden />
        Guía de apoyo
        <ChevronDown
          size={14}
          className="ml-auto shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="flex flex-col gap-3 border-t border-border-subtle px-3 py-3">
        <div role="tablist" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tenses'}
            onClick={() => setActiveTab('tenses')}
            className={cn(
              'focus-ring rounded-[var(--radius-sm)] px-2.5 py-1 font-body-sm font-medium transition-colors duration-150',
              activeTab === 'tenses' ? 'bg-surface text-fg' : 'text-fg-muted',
            )}
          >
            Tiempos verbales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phrases'}
            onClick={() => setActiveTab('phrases')}
            className={cn(
              'focus-ring rounded-[var(--radius-sm)] px-2.5 py-1 font-body-sm font-medium transition-colors duration-150',
              activeTab === 'phrases' ? 'bg-surface text-fg' : 'text-fg-muted',
            )}
          >
            Frases útiles
          </button>
        </div>
        {activeTab === 'tenses' ? <VerbTensesGuide /> : <UsefulPhrasesGuide />}
      </div>
    </details>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add components/journal/WritingGuidePanel.tsx
git commit -m "feat(journal): add collapsible writing guide panel with tabs"
```

---

## Task 4: Mount WritingGuidePanel in JournalWorkspace

**Files:**
- Modify: `components/journal/JournalWorkspace.tsx`

- [ ] **Step 1: Import and render the panel above the editor**

In `components/journal/JournalWorkspace.tsx`, update the planned-structure
comment and imports:

```tsx
// Planned structure:
// <JournalWorkspace>
//   <JournalPromptHero />
//   <WritingGuidePanel />
//   <JournalEditor />
//   <SubmitBar />
//   <OutcomeHint />         (empty draft)
//   <JournalFeedbackView />
//   <JournalHistoryList />
// </JournalWorkspace>

import { ChevronDown } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalEditor } from './JournalEditor'
import { JournalFeedbackView } from './JournalFeedbackView'
import { JournalHistoryList } from './JournalHistoryList'
import { WritingGuidePanel } from './WritingGuidePanel'
```

Then, right after the prompt `<section>` and before the conditional
`journal.status !== 'corrected'` editor block, insert:

```tsx
      {journal.status === 'draft' && <WritingGuidePanel />}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Manual check**

Run: `pnpm dev`, open the journal page, confirm the "Guía de apoyo" panel
appears collapsed above the textarea, expands on click, and switches tabs.

- [ ] **Step 4: Commit**

```bash
git add components/journal/JournalWorkspace.tsx
git commit -m "feat(journal): mount writing guide panel in journal workspace"
```

---

## Task 5: Writing hints types and rule engine

**Files:**
- Create: `lib/journal/writing-hints/types.ts`
- Create: `lib/journal/writing-hints/rules.ts`
- Test: `lib/journal/writing-hints/__tests__/rules.test.ts`

- [ ] **Step 1: Write the types**

```typescript
// lib/journal/writing-hints/types.ts

export type WritingHintRuleId =
  | 'irregular-past'
  | 'missing-past-ed'
  | 'am-agree'
  | 'double-negative'
  | 'missing-third-person-s'
  | 'irregular-plural'
  | 'missing-apostrophe'

export interface WritingHintMatch {
  start: number
  end: number
  ruleId: WritingHintRuleId
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// lib/journal/writing-hints/__tests__/rules.test.ts
import { describe, expect, it } from 'vitest'
import {
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
} from '@/lib/journal/writing-hints/rules'

describe('detectIrregularPast', () => {
  it('flags "goed"', () => {
    const text = 'Yesterday I goed to the store.'
    const matches = detectIrregularPast(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('goed')
    expect(matches[0].ruleId).toBe('irregular-past')
  })

  it('does not flag correct "went"', () => {
    expect(detectIrregularPast('Yesterday I went to the store.')).toHaveLength(0)
  })
})

describe('detectMissingPastEd', () => {
  it('flags a bare verb after "yesterday"', () => {
    const text = 'Yesterday I walk to school.'
    const matches = detectMissingPastEd(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('walk')
  })

  it('does not flag when already past tense', () => {
    expect(detectMissingPastEd('Yesterday I walked to school.')).toHaveLength(0)
  })

  it('flags a bare verb after "last week"', () => {
    const text = 'Last week I visit my parents.'
    const matches = detectMissingPastEd(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('visit')
  })
})

describe('detectAmAgree', () => {
  it('flags "I am agree"', () => {
    const text = 'I am agree with you.'
    const matches = detectAmAgree(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('am agree')
  })

  it('does not flag "I agree"', () => {
    expect(detectAmAgree('I agree with you.')).toHaveLength(0)
  })
})

describe('detectDoubleNegative', () => {
  it('flags "don\'t have no"', () => {
    const text = "I don't have no money."
    const matches = detectDoubleNegative(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe("don't have no")
  })

  it('does not flag a single negative', () => {
    expect(detectDoubleNegative("I don't have money.")).toHaveLength(0)
  })
})

describe('detectMissingThirdPersonS', () => {
  it('flags "He go"', () => {
    const text = 'He go to work every day.'
    const matches = detectMissingThirdPersonS(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('go')
  })

  it('does not flag "He goes"', () => {
    expect(detectMissingThirdPersonS('He goes to work every day.')).toHaveLength(0)
  })
})

describe('detectIrregularPlural', () => {
  it('flags "childs"', () => {
    const text = 'I have three childs.'
    const matches = detectIrregularPlural(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('childs')
  })

  it('does not flag "children"', () => {
    expect(detectIrregularPlural('I have three children.')).toHaveLength(0)
  })
})

describe('detectMissingApostrophe', () => {
  it('flags "dont"', () => {
    const text = 'I dont know the answer.'
    const matches = detectMissingApostrophe(text)
    expect(matches).toHaveLength(1)
    expect(text.slice(matches[0].start, matches[0].end)).toBe('dont')
  })

  it('does not flag "don\'t"', () => {
    expect(detectMissingApostrophe("I don't know the answer.")).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test lib/journal/writing-hints/__tests__/rules.test.ts`
Expected: FAIL — `rules.ts` module not found.

- [ ] **Step 4: Write the rule implementations**

```typescript
// lib/journal/writing-hints/rules.ts
import type { WritingHintMatch } from './types'

const IRREGULAR_PAST_MAP: Record<string, string> = {
  goed: 'went',
  runned: 'ran',
  eated: 'ate',
  buyed: 'bought',
  bringed: 'brought',
  thinked: 'thought',
  catched: 'caught',
  sended: 'sent',
  taked: 'took',
  maked: 'made',
}

const IRREGULAR_PLURAL_MAP: Record<string, string> = {
  childs: 'children',
  peoples: 'people',
  mans: 'men',
  womans: 'women',
  foots: 'feet',
  tooths: 'teeth',
  mouses: 'mice',
}

function matchesFor(
  text: string,
  pattern: RegExp,
  ruleId: WritingHintMatch['ruleId'],
): WritingHintMatch[] {
  const matches: WritingHintMatch[] = []
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue
    matches.push({ start: match.index, end: match.index + match[0].length, ruleId })
  }
  return matches
}

export function detectIrregularPast(text: string): WritingHintMatch[] {
  const words = Object.keys(IRREGULAR_PAST_MAP)
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'irregular-past')
}

const PAST_TIME_MARKERS = ['yesterday', 'last week', 'last month', 'last year', 'last night']

export function detectMissingPastEd(text: string): WritingHintMatch[] {
  const matches: WritingHintMatch[] = []
  for (const marker of PAST_TIME_MARKERS) {
    const markerPattern = new RegExp(`\\b${marker}\\b[^.!?]*`, 'gi')
    for (const clause of text.matchAll(markerPattern)) {
      if (clause.index === undefined) continue
      const clauseText = clause[0]
      const verbPattern = /\bI\s+([a-z]+)\b/i
      const verbMatch = clauseText.match(verbPattern)
      if (!verbMatch || verbMatch.index === undefined) continue
      const verb = verbMatch[1]
      if (/ed$/i.test(verb) || Object.keys(IRREGULAR_PAST_MAP).includes(verb.toLowerCase())) continue
      if (verb.toLowerCase() === 'was' || verb.toLowerCase() === 'had') continue
      const verbStart = clause.index + verbMatch.index + verbMatch[0].indexOf(verb)
      matches.push({ start: verbStart, end: verbStart + verb.length, ruleId: 'missing-past-ed' })
    }
  }
  return matches
}

export function detectAmAgree(text: string): WritingHintMatch[] {
  return matchesFor(text, /\bam\s+agree\b/gi, 'am-agree')
}

export function detectDoubleNegative(text: string): WritingHintMatch[] {
  return matchesFor(
    text,
    /\b(don't|doesn't|didn't|can't|won't|isn't|aren't)\s+\w*\s*no\b/gi,
    'double-negative',
  )
}

export function detectMissingThirdPersonS(text: string): WritingHintMatch[] {
  const pattern = /\b(he|she|it)\s+([a-z]+)\b/gi
  const matches: WritingHintMatch[] = []
  const bareIrregularExceptions = new Set(['is', 'has', 'was', 'does', 'goes'])
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue
    const verb = match[2].toLowerCase()
    if (bareIrregularExceptions.has(verb)) continue
    if (/s$/i.test(verb) || /ed$/i.test(verb) || /ing$/i.test(verb)) continue
    const verbStart = match.index + match[0].indexOf(match[2], match[1].length)
    matches.push({ start: verbStart, end: verbStart + match[2].length, ruleId: 'missing-third-person-s' })
  }
  return matches
}

export function detectIrregularPlural(text: string): WritingHintMatch[] {
  const words = Object.keys(IRREGULAR_PLURAL_MAP)
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'irregular-plural')
}

const COMMON_CONTRACTIONS = ['dont', 'cant', 'wont', 'isnt', 'arent', 'wasnt', 'werent', 'didnt', 'doesnt', 'im', 'youre', 'theyre']

export function detectMissingApostrophe(text: string): WritingHintMatch[] {
  const pattern = new RegExp(`\\b(${COMMON_CONTRACTIONS.join('|')})\\b`, 'gi')
  return matchesFor(text, pattern, 'missing-apostrophe')
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test lib/journal/writing-hints/__tests__/rules.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/journal/writing-hints/types.ts lib/journal/writing-hints/rules.ts lib/journal/writing-hints/__tests__/rules.test.ts
git commit -m "feat(journal): add local writing-hints rule engine"
```

---

## Task 6: detect-hints orchestrator (overlap resolution)

**Files:**
- Create: `lib/journal/writing-hints/detect-hints.ts`
- Test: `lib/journal/writing-hints/__tests__/detect-hints.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/journal/writing-hints/__tests__/detect-hints.test.ts
import { describe, expect, it } from 'vitest'
import { detectWritingHints } from '@/lib/journal/writing-hints/detect-hints'

describe('detectWritingHints', () => {
  it('returns matches ordered by position', () => {
    const text = 'I dont know why he go there. Yesterday I goed home.'
    const matches = detectWritingHints(text)
    expect(matches.length).toBeGreaterThan(0)
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i].start).toBeGreaterThanOrEqual(matches[i - 1].start)
    }
  })

  it('resolves overlapping matches by keeping the first by position', () => {
    const text = 'I am agree with everyone.'
    const matches = detectWritingHints(text)
    const overlapping = matches.filter((m) => m.start < 5)
    expect(overlapping.length).toBeLessThanOrEqual(1)
  })

  it('returns an empty array for clean text', () => {
    expect(detectWritingHints('I went to the store yesterday.')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/journal/writing-hints/__tests__/detect-hints.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// lib/journal/writing-hints/detect-hints.ts
import type { WritingHintMatch } from './types'
import {
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
} from './rules'

const ALL_RULES = [
  detectIrregularPast,
  detectMissingPastEd,
  detectAmAgree,
  detectDoubleNegative,
  detectMissingThirdPersonS,
  detectIrregularPlural,
  detectMissingApostrophe,
]

/**
 * Runs every writing-hint rule and resolves overlaps by keeping the
 * earliest-starting match; a later match overlapping a kept range is dropped.
 */
export function detectWritingHints(text: string): WritingHintMatch[] {
  const all = ALL_RULES.flatMap((rule) => rule(text)).sort((a, b) => a.start - b.start)
  const resolved: WritingHintMatch[] = []
  let lastEnd = -1
  for (const match of all) {
    if (match.start < lastEnd) continue
    resolved.push(match)
    lastEnd = match.end
  }
  return resolved
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/journal/writing-hints/__tests__/detect-hints.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/journal/writing-hints/detect-hints.ts lib/journal/writing-hints/__tests__/detect-hints.test.ts
git commit -m "feat(journal): add writing-hints overlap resolution orchestrator"
```

---

## Task 7: Spanish hint labels

**Files:**
- Create: `lib/journal/writing-hints/hint-labels.ts`
- Test: `lib/journal/writing-hints/__tests__/hint-labels.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/journal/writing-hints/__tests__/hint-labels.test.ts
import { describe, expect, it } from 'vitest'
import { writingHintMessage } from '@/lib/journal/writing-hints/hint-labels'

describe('writingHintMessage', () => {
  it('returns a Spanish message for irregular-past', () => {
    expect(writingHintMessage('irregular-past')).toBe(
      'Este verbo es irregular en pasado. Revisa la forma correcta.',
    )
  })

  it('returns a distinct message per rule', () => {
    const ruleIds = [
      'irregular-past',
      'missing-past-ed',
      'am-agree',
      'double-negative',
      'missing-third-person-s',
      'irregular-plural',
      'missing-apostrophe',
    ] as const
    const messages = new Set(ruleIds.map(writingHintMessage))
    expect(messages.size).toBe(ruleIds.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/journal/writing-hints/__tests__/hint-labels.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// lib/journal/writing-hints/hint-labels.ts
import type { WritingHintRuleId } from './types'

/** Spanish explanations for each writing-hint rule, shown in the tooltip. */
const HINT_MESSAGES: Record<WritingHintRuleId, string> = {
  'irregular-past': 'Este verbo es irregular en pasado. Revisa la forma correcta.',
  'missing-past-ed': 'Parece que hablas del pasado. ¿Necesita este verbo terminar en "-ed"?',
  'am-agree': '"Agree" no lleva "am" antes. Prueba solo "I agree".',
  'double-negative': 'En inglés no se usan dos negaciones juntas.',
  'missing-third-person-s': 'Con he/she/it, el verbo en presente suele llevar "-s".',
  'irregular-plural': 'Este plural es irregular. Revisa la forma correcta.',
  'missing-apostrophe': 'A esta contracción le falta el apóstrofo.',
}

export function writingHintMessage(ruleId: WritingHintRuleId): string {
  return HINT_MESSAGES[ruleId]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/journal/writing-hints/__tests__/hint-labels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/journal/writing-hints/hint-labels.ts lib/journal/writing-hints/__tests__/hint-labels.test.ts
git commit -m "feat(journal): add Spanish messages for writing hints"
```

---

## Task 8: useWritingHintsPreference hook (toggle persistence)

**Files:**
- Create: `hooks/useWritingHintsPreference.ts`
- Test: `hooks/__tests__/useWritingHintsPreference.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// hooks/__tests__/useWritingHintsPreference.test.ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'

describe('useWritingHintsPreference', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to enabled when nothing is stored', () => {
    const { result } = renderHook(() => useWritingHintsPreference())
    expect(result.current.enabled).toBe(true)
  })

  it('persists the toggle to localStorage', () => {
    const { result } = renderHook(() => useWritingHintsPreference())
    act(() => result.current.setEnabled(false))
    expect(result.current.enabled).toBe(false)
    expect(localStorage.getItem('journal:writing-hints-enabled')).toBe('false')
  })

  it('reads a previously stored false value on mount', () => {
    localStorage.setItem('journal:writing-hints-enabled', 'false')
    const { result } = renderHook(() => useWritingHintsPreference())
    expect(result.current.enabled).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/useWritingHintsPreference.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// hooks/useWritingHintsPreference.ts
'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'journal:writing-hints-enabled'

export interface UseWritingHintsPreference {
  enabled: boolean
  setEnabled: (next: boolean) => void
}

/** Persists the "show hints while writing" toggle in localStorage (UI preference only). */
export function useWritingHintsPreference(): UseWritingHintsPreference {
  const [enabled, setEnabledState] = useState(true)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setEnabledState(stored !== 'false')
  }, [])

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next)
    window.localStorage.setItem(STORAGE_KEY, String(next))
  }, [])

  return { enabled, setEnabled }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/useWritingHintsPreference.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add hooks/useWritingHintsPreference.ts hooks/__tests__/useWritingHintsPreference.test.ts
git commit -m "feat(journal): add writing-hints toggle preference hook"
```

---

## Task 9: useWritingHints hook (debounced detection)

**Files:**
- Create: `hooks/useWritingHints.ts`
- Test: `hooks/__tests__/useWritingHints.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// hooks/__tests__/useWritingHints.test.ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWritingHints } from '@/hooks/useWritingHints'

describe('useWritingHints', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns no hints immediately after a content change (debounced)', () => {
    const { result, rerender } = renderHook(
      ({ content, enabled }) => useWritingHints(content, enabled),
      { initialProps: { content: 'I goed home.', enabled: true } },
    )
    rerender({ content: 'I goed home.', enabled: true })
    expect(result.current).toHaveLength(0)
  })

  it('returns hints after the debounce delay', () => {
    const { result } = renderHook(() => useWritingHints('I goed home.', true))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('returns no hints when disabled', () => {
    const { result } = renderHook(() => useWritingHints('I goed home.', false))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/useWritingHints.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// hooks/useWritingHints.ts
'use client'

import { useEffect, useState } from 'react'
import { detectWritingHints } from '@/lib/journal/writing-hints/detect-hints'
import type { WritingHintMatch } from '@/lib/journal/writing-hints/types'

const DEBOUNCE_MS = 400

/** Debounced local rule-detection over journal content. No network, no AI. */
export function useWritingHints(content: string, enabled: boolean): WritingHintMatch[] {
  const [matches, setMatches] = useState<WritingHintMatch[]>([])

  useEffect(() => {
    if (!enabled) {
      setMatches([])
      return
    }
    const timer = setTimeout(() => {
      setMatches(detectWritingHints(content))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [content, enabled])

  return matches
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/useWritingHints.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add hooks/useWritingHints.ts hooks/__tests__/useWritingHints.test.ts
git commit -m "feat(journal): add debounced writing-hints detection hook"
```

---

## Task 10: WritingHintTooltip component

**Files:**
- Create: `components/journal/WritingHintTooltip.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/journal/WritingHintTooltip.tsx
'use client'

interface WritingHintTooltipProps {
  message: string
  visible: boolean
  x: number
  y: number
}

/** Small floating tooltip anchored near a hint mark's coordinates. */
export function WritingHintTooltip({ message, visible, x, y }: WritingHintTooltipProps) {
  if (!visible) return null

  return (
    <div
      role="tooltip"
      style={{ left: x, top: y }}
      className="pointer-events-none absolute z-10 max-w-64 -translate-y-full rounded-[var(--radius-sm)] bg-fg px-2.5 py-1.5 font-body-sm text-surface shadow-lg"
    >
      {message}
    </div>
  )
}
```

Note: `style={{}}` here holds runtime-computed anchor coordinates, which is
the documented exception to the no-inline-styles rule.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/journal/WritingHintTooltip.tsx
git commit -m "feat(journal): add writing hint tooltip component"
```

---

## Task 11: WritingHintsOverlay component

**Files:**
- Create: `components/journal/WritingHintsOverlay.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/journal/WritingHintsOverlay.tsx
'use client'

// Planned structure:
// <WritingHintsOverlay>            (mirrored div, same text/font as textarea)
//   text split into plain spans + <mark> spans for each hint match
//   <WritingHintTooltip />          (shown for the hovered/tapped mark)
// </WritingHintsOverlay>

import { useState } from 'react'
import { writingHintMessage } from '@/lib/journal/writing-hints/hint-labels'
import type { WritingHintMatch } from '@/lib/journal/writing-hints/types'
import { WritingHintTooltip } from './WritingHintTooltip'

interface WritingHintsOverlayProps {
  content: string
  matches: WritingHintMatch[]
}

interface ActiveTooltip {
  message: string
  x: number
  y: number
}

export function WritingHintsOverlay({ content, matches }: WritingHintsOverlayProps) {
  const [active, setActive] = useState<ActiveTooltip | null>(null)

  if (matches.length === 0) return null

  const segments: { text: string; match: WritingHintMatch | null }[] = []
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) segments.push({ text: content.slice(cursor, match.start), match: null })
    segments.push({ text: content.slice(match.start, match.end), match })
    cursor = match.end
  }
  if (cursor < content.length) segments.push({ text: content.slice(cursor), match: null })

  function showTooltip(event: React.MouseEvent | React.FocusEvent, ruleId: WritingHintMatch['ruleId']) {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const parentRect = (event.currentTarget as HTMLElement).closest('.writing-hints-root')?.getBoundingClientRect()
    setActive({
      message: writingHintMessage(ruleId),
      x: rect.left - (parentRect?.left ?? 0),
      y: rect.top - (parentRect?.top ?? 0),
    })
  }

  return (
    <div
      aria-hidden
      className="writing-hints-root pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre-wrap break-words p-4 text-base text-transparent"
    >
      {segments.map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="pointer-events-auto cursor-help rounded-none bg-transparent text-transparent underline decoration-warning decoration-2 underline-offset-4"
            onMouseEnter={(e) => showTooltip(e, segment.match!.ruleId)}
            onMouseLeave={() => setActive(null)}
            onFocus={(e) => showTooltip(e, segment.match!.ruleId)}
            onBlur={() => setActive(null)}
            tabIndex={0}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
      {active && (
        <WritingHintTooltip message={active.message} visible x={active.x} y={active.y} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/journal/WritingHintsOverlay.tsx
git commit -m "feat(journal): add writing hints underline overlay component"
```

---

## Task 12: Wire hints + toggle into JournalEditor

**Files:**
- Modify: `components/journal/JournalEditor.tsx`

- [ ] **Step 1: Update JournalEditor to mount overlay and toggle**

Replace the full contents of `components/journal/JournalEditor.tsx`:

```tsx
'use client'

import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import type { SaveState } from '@/hooks/useJournalEntry'
import { useWritingHints } from '@/hooks/useWritingHints'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'
import { WritingHintsOverlay } from './WritingHintsOverlay'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  disabled?: boolean
  /** Ctrl/⌘+Enter when the draft can be submitted. */
  onSubmitShortcut?: () => void
}

const SAVE_COPY: Record<SaveState, string> = {
  saved: 'Guardado en este dispositivo',
  pending: 'Guardando…',
  error: 'No se pudo guardar. Sigue escribiendo para reintentarlo.',
}

/** Presentational autosave textarea. Lifecycle lives in useJournalEntry. */
export function JournalEditor({
  content,
  onChange,
  saveState,
  disabled,
  onSubmitShortcut,
}: JournalEditorProps) {
  const fieldId = useId()
  const statusId = useId()
  const hasContent = content.trim().length > 0
  const showStatus = saveState !== 'saved' || hasContent
  const { enabled: hintsEnabled, setEnabled: setHintsEnabled } = useWritingHintsPreference()
  const hints = useWritingHints(content, hintsEnabled && !disabled)

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!onSubmitShortcut) return
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSubmitShortcut()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="font-body-sm font-medium text-fg-muted">
          Tu página de hoy
        </label>
        <label className="flex items-center gap-1.5 font-body-sm text-fg-subtle">
          <input
            type="checkbox"
            checked={hintsEnabled}
            onChange={(e) => setHintsEnabled(e.target.checked)}
            className="focus-ring"
          />
          Mostrar pistas mientras escribo
        </label>
      </div>
      <div className="relative">
        <WritingHintsOverlay content={content} matches={hints} />
        <textarea
          id={fieldId}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={10}
          aria-describedby={showStatus ? statusId : undefined}
          placeholder="Escribe en inglés sobre lo de arriba…"
          className={cn(
            'relative z-[1] w-full resize-y rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken p-4 text-base text-fg placeholder:text-fg-placeholder',
            'transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
      </div>
      {showStatus && (
        <p
          id={statusId}
          role={saveState === 'error' ? 'alert' : 'status'}
          className={cn('font-body-sm', saveState === 'error' ? 'text-error' : 'text-fg-muted')}
        >
          {SAVE_COPY[saveState]}
          {onSubmitShortcut && saveState === 'saved' && hasContent ? (
            <span className="text-fg-subtle"> · Ctrl/⌘+Enter para revisar</span>
          ) : null}
        </p>
      )}
    </div>
  )
}
```

Note: the textarea keeps its existing background (`bg-surface-sunken`) and
opaque text — the overlay sits behind it (`z-0` vs textarea's `z-[1]`) purely
to host the underline marks at matching text-flow positions; because the
textarea itself is opaque, the marks are visually not visible this way. This
is a known limitation of the simple mirrored-div approach when the textarea
isn't transparent.

- [ ] **Step 2: Fix the layering so underlines are actually visible**

The textarea must be visually transparent over the mirrored div for the
underlines to show through. Update the textarea's className in the same file
to remove the opaque background and put the background on the wrapping
`relative` div instead:

```tsx
      <div className="relative rounded-[var(--radius-lg)] bg-surface-sunken">
        <WritingHintsOverlay content={content} matches={hints} />
        <textarea
          id={fieldId}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={10}
          aria-describedby={showStatus ? statusId : undefined}
          placeholder="Escribe en inglés sobre lo de arriba…"
          className={cn(
            'relative z-[1] w-full resize-y rounded-[var(--radius-lg)] border border-border-default bg-transparent p-4 text-base text-fg placeholder:text-fg-placeholder',
            'transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
      </div>
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, open the journal page, type "Yesterday I goed home." into the
editor, wait ~400ms, confirm an underline appears beneath "goed" and hovering
shows the Spanish tooltip. Toggle "Mostrar pistas mientras escribo" off and
confirm the underline disappears.

- [ ] **Step 5: Run the existing JournalEditor-related tests**

Run: `pnpm test components/journal`
Expected: PASS (no regressions in existing journal component tests).

- [ ] **Step 6: Commit**

```bash
git add components/journal/JournalEditor.tsx
git commit -m "feat(journal): wire live writing hints and toggle into editor"
```

---

## Task 13: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run full type-check**

Run: `pnpm type-check`
Expected: No errors.

- [ ] **Step 2: Run full lint**

Run: `pnpm lint`
Expected: No new errors introduced by this feature's files.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All tests pass, including the new
`lib/journal/writing-hints/__tests__/*` and `hooks/__tests__/useWritingHints*`
suites.

- [ ] **Step 4: Manual offline check**

Run: `pnpm dev`, open DevTools → Network → set to Offline, reload the journal
page, confirm the writing guide panel and writing hints still work (both are
fully local/static, no network calls).

---

## Self-Review Notes

- **Spec coverage:** Piece A (guide, tabs, panel, integration) covered by
  Tasks 1–4. Piece B (rules, orchestrator, labels, hooks, overlay, tooltip,
  toggle, editor wiring) covered by Tasks 5–12. Offline/testing constraints
  verified in Task 13.
- **Type consistency:** `WritingHintMatch` (Task 5) is used identically by
  `detect-hints.ts` (Task 6), `hint-labels.ts` (Task 7 — via
  `WritingHintRuleId`), `useWritingHints.ts` (Task 9), and
  `WritingHintsOverlay.tsx` (Task 11) — same field names (`start`, `end`,
  `ruleId`) throughout.
- **Known limitation flagged inline:** Task 12 explicitly calls out and fixes
  the transparent-textarea requirement for the mirrored-div technique to be
  visible, rather than leaving it as a silent bug.
