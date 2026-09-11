# Mission Learner Feedback Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the *result* state of a learner's turn in scripted missions so it has a three-weight visual hierarchy (verdict → the fix → study material) and explains *why* a sound failed by anchoring it to the real spelling of the word ("in «goes» the final -s sounds /z/").

**Architecture:** Two new pure modules under `lib/pronunciation/` compute what to explain (`pickPrimaryFix`) and how to phrase it against the word's spelling (`describePhonemeInWord`, a pattern table covering ~10 top Spanish-speaker errors, with a safe generic fallback). Five new presentational components under `components/ai-coach/missions/scripted/` and `components/pronunciation-feedback/` render the redesigned block; `LearnerLine` stays the capture/scoring orchestrator and delegates the whole result block to a new `<LineResult>`. Copy in `lib/pronunciation/ipa-data.ts` gains a short `spanishTip` + memorable `hookEs`, with the current long text preserved in a new `spanishTipLongEs` read by the 6 deep-study views. `SyllableRemediation` (used only by `LearnerLine`) and its test are deleted.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (utility classes + CSS custom-property tokens only, `cn()` for conditionals, no `style={{}}`), Vitest + `@testing-library/react` (jsdom).

---

## File Structure

**New — pure logic (`lib/pronunciation/`):**
- `phoneme-in-word.ts` — `describePhonemeInWord()` + its typed pattern table + `ExplanationSegment` / `PhonemeInWordExplanation` types.
- `pick-primary-fix.ts` — `pickPrimaryFix()`; picks the single failure to explain from `wordResults` + `syllableMap`.

**New — components:**
- `components/ai-coach/missions/scripted/LineResult.tsx` — composes the redesigned result block. Receives an already-computed result; no capture/scoring logic.
- `components/ai-coach/missions/scripted/ScoreVerdict.tsx` — big score coloured by band + `feedbackHeadline` phrase. ~35 lines.
- `components/pronunciation-feedback/PhonemeFix.tsx` — the "why" sentence with grapheme + IPA emphasised, `contrastEs`, isolated-phoneme audio button, `SoundHowTo` collapsible inside. ~95 lines.
- `components/pronunciation-feedback/SoundHowTo.tsx` — collapsible: `hookEs` title + `articulationEs` `<ul>` + short `spanishTip`. ~45 lines.
- `components/pronunciation-feedback/ListenPanel.tsx` — one card: minimal-pair chips row + Nativo/Mi voz row (wraps `SelfPlaybackAudioBar`'s dual-playback via a new `useDualPlayback` hook). ~90 lines.
- `hooks/useDualPlayback.ts` — extracted native (`speak`) + user (`new Audio`) playback state from `SelfPlaybackAudioBar`. ~55 lines.

**Modified:**
- `lib/pronunciation/syllable-remediation.ts` — `SyllableRemediation` interface + `buildRemediation()` gain a `hookEs: string | null` field.
- `lib/pronunciation/ipa-data.ts` — `PhonemeExtra` gains `hookEs?` + `spanishTipLongEs?`; `/z/` (and the other ~15 sounds with `spanishTip`) get a short `spanishTip`, the old text moves to `spanishTipLongEs`, and a `hookEs` is added.
- `components/pronunciation/SelfPlaybackAudioBar.tsx` — refactored to consume `useDualPlayback` (behaviour unchanged; still used by the practice-playback path in `LearnerLine`).
- `components/ai-coach/missions/scripted/LearnerLine.tsx` — `attempt` branch now renders `<LineResult>`; `remediation` IIFE replaced by `pickPrimaryFix` + `describePhonemeInWord` + `buildRemediation`.
- `components/phoneme-practice/SoundLabDetailDialog.tsx`, `components/lesson/SentenceErrorDetailPanel.tsx`, `components/phoneme-practice/ExerciseHints.tsx`, `components/ipa/SpanishSpeakersGrid.tsx`, `components/sounds/SoundDetail.tsx`, `components/phoneme-practice/PhonemeIntroTray.tsx` — read `spanishTipLongEs ?? spanishTip` so deep study keeps the long text.

**Deleted:**
- `components/pronunciation-feedback/SyllableRemediation.tsx`
- `components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`

**New tests (alongside source):**
- `lib/pronunciation/__tests__/phoneme-in-word.test.ts`
- `lib/pronunciation/__tests__/pick-primary-fix.test.ts`
- `components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx`
- `components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx`
- `components/pronunciation-feedback/__tests__/ListenPanel.test.tsx`
- `hooks/__tests__/useDualPlayback.test.ts`

---

## Task 1: `describePhonemeInWord` — types + generic fallback

**Files:**
- Create: `lib/pronunciation/phoneme-in-word.ts`
- Test: `lib/pronunciation/__tests__/phoneme-in-word.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/__tests__/phoneme-in-word.test.ts
import { describe, expect, it } from 'vitest'
import { describePhonemeInWord } from '../phoneme-in-word'
import type { PhonemeAlignment } from '@/lib/types'

const A = (over: Partial<PhonemeAlignment>): PhonemeAlignment => ({
  phoneme: 'Z',
  ipa: 'z',
  status: 'incorrect',
  ...over,
})

describe('describePhonemeInWord — fallback and contrast', () => {
  it('returns a generic explanation when no pattern matches', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd' }))
    expect(r).not.toBeNull()
    expect(r!.plainEs).toContain('blorf')
    expect(r!.plainEs).toContain('/ð/')
    expect(r!.segments.some((s) => s.emphasis === 'ipa' && s.text.includes('ð'))).toBe(true)
  })

  it('builds contrastEs from status === "missing"', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'missing', got: undefined, gotIpa: undefined }))
    expect(r!.contrastEs).toBe('ese sonido no se te oyó')
  })

  it('builds contrastEs from a distinct got/gotIpa', () => {
    const r = describePhonemeInWord('blorf', A({ phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd' }))
    expect(r!.contrastEs).toContain('dijiste')
    expect(r!.contrastEs).toContain('/d/')
  })

  it('returns null when there is no IPA symbol to name', () => {
    const r = describePhonemeInWord('blorf', { phoneme: 'ZZZ', status: 'incorrect' } as PhonemeAlignment)
    expect(r).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/pronunciation/__tests__/phoneme-in-word.test.ts`
Expected: FAIL — `Failed to resolve import "../phoneme-in-word"`.

- [ ] **Step 3: Write the module skeleton — types, IPA resolution, contrast, generic fallback**

```ts
// lib/pronunciation/phoneme-in-word.ts
import type { PhonemeAlignment } from '@/lib/types'
import { ARPABET_TO_IPA } from './phonemes'
import { stripStressDigit } from './arpabet-vowels'

export type ExplanationSegment = { text: string; emphasis?: 'grapheme' | 'ipa' }

export interface PhonemeInWordExplanation {
  /** Sentence split into segments; the UI emphasises the marked ones. */
  segments: ExplanationSegment[]
  /** Same sentence as flat text — used for aria-label and tests. */
  plainEs: string
  /** "dijiste /s/ (sin voz)" | "ese sonido no se te oyó" | null */
  contrastEs: string | null
}

/** Bare IPA symbol (no slashes) for an alignment entry, or null. */
function ipaSymbol(a: Pick<PhonemeAlignment, 'phoneme' | 'ipa'>): string | null {
  if (a.ipa) return a.ipa
  const bare = stripStressDigit(a.phoneme ?? '').toUpperCase()
  return ARPABET_TO_IPA[bare] ?? null
}

/** Voicing note for the sound actually produced, when it clarifies the error. */
function voicingNote(gotIpa: string, targetIpa: string): string {
  const voiceless = new Set(['s', 'f', 'θ', 'p', 't', 'k', 'ʃ', 'tʃ'])
  const voiced = new Set(['z', 'v', 'ð', 'b', 'd', 'g', 'ʒ', 'dʒ'])
  if (voiceless.has(gotIpa) && voiced.has(targetIpa)) return ' (sin voz)'
  if (voiced.has(gotIpa) && voiceless.has(targetIpa)) return ' (con voz)'
  return ''
}

function buildContrast(culprit: PhonemeAlignment, targetIpa: string): string | null {
  if (culprit.status === 'missing') return 'ese sonido no se te oyó'
  const gotIpa = culprit.gotIpa ?? (culprit.got ? ipaSymbol({ phoneme: culprit.got }) : null)
  if (gotIpa && gotIpa !== targetIpa) {
    return `dijiste /${gotIpa}/${voicingNote(gotIpa, targetIpa)}`
  }
  return null
}

function flatten(segments: ExplanationSegment[]): string {
  return segments.map((s) => s.text).join('')
}

export function describePhonemeInWord(
  syllableText: string,
  culprit: PhonemeAlignment,
): PhonemeInWordExplanation | null {
  const targetIpa = ipaSymbol(culprit)
  if (!targetIpa) return null

  const contrastEs = buildContrast(culprit, targetIpa)

  // Pattern table wired in Task 2. For now: generic fallback only.
  const segments: ExplanationSegment[] = [
    { text: 'el sonido ' },
    { text: `/${targetIpa}/`, emphasis: 'ipa' },
    { text: ' en «' },
    { text: syllableText, emphasis: 'grapheme' },
    { text: '»' },
  ]

  return { segments, plainEs: flatten(segments), contrastEs }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/pronunciation/__tests__/phoneme-in-word.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/phoneme-in-word.ts lib/pronunciation/__tests__/phoneme-in-word.test.ts
git commit -m "feat(pronunciation): add describePhonemeInWord skeleton with generic fallback"
```

---

## Task 2: `describePhonemeInWord` — pattern table (~10 Spanish-speaker errors)

**Files:**
- Modify: `lib/pronunciation/phoneme-in-word.ts`
- Test: `lib/pronunciation/__tests__/phoneme-in-word.test.ts:1` (add cases)

- [ ] **Step 1: Add the failing pattern tests**

Append inside the test file:

```ts
describe('describePhonemeInWord — pattern table', () => {
  const seg = (r: NonNullable<ReturnType<typeof describePhonemeInWord>>) =>
    r.segments.map((s) => `${s.emphasis ?? '_'}:${s.text}`)

  it('/z/ final voiced → anchors the final «s» of the word', () => {
    const r = describePhonemeInWord('goes', {
      phoneme: 'Z', ipa: 'z', status: 'incorrect', got: 'S', gotIpa: 's',
    })!
    expect(r.plainEs).toBe('la «s» final de «goes» suena /z/ (con voz), no /s/')
    expect(r.segments.some((s) => s.emphasis === 'grapheme' && s.text === 's')).toBe(true)
    expect(r.segments.some((s) => s.emphasis === 'ipa' && s.text === '/z/')).toBe(true)
  })

  it('/ɪ/ vs /iː/ → short-i explanation', () => {
    const r = describePhonemeInWord('ship', {
      phoneme: 'IH', ipa: 'ɪ', status: 'incorrect', got: 'IY', gotIpa: 'iː',
    })!
    expect(r.plainEs).toBe('la «i» de «ship» es corta /ɪ/, no larga /iː/')
  })

  it('long vowel /iː/ shortened → keep-it-long explanation', () => {
    const r = describePhonemeInWord('seat', {
      phoneme: 'IY', ipa: 'iː', status: 'incorrect', got: 'IH', gotIpa: 'ɪ',
    })!
    expect(r.plainEs).toBe('la vocal de «seat» es larga /iː/; te salió corta')
  })

  it('/θ/ (th) → tongue-between-teeth explanation', () => {
    const r = describePhonemeInWord('think', {
      phoneme: 'TH', ipa: 'θ', status: 'incorrect', got: 'T', gotIpa: 't',
    })!
    expect(r.plainEs).toBe('la «th» de «think» es /θ/ (lengua entre los dientes), no /t/')
  })

  it('/ð/ (th) → voiced-th explanation', () => {
    const r = describePhonemeInWord('this', {
      phoneme: 'DH', ipa: 'ð', status: 'incorrect', got: 'D', gotIpa: 'd',
    })!
    expect(r.plainEs).toBe('la «th» de «this» es /ð/ (lengua entre los dientes, con voz), no /d/')
  })

  it('-ed ending → /t/ ending explanation', () => {
    const r = describePhonemeInWord('walked', {
      phoneme: 'T', ipa: 't', status: 'incorrect', got: undefined, gotIpa: undefined,
    })!
    expect(r.plainEs).toBe('la «-ed» de «walked» suena /t/, no «ed»')
  })

  it('/v/ as /b/ → top-teeth-on-lip explanation', () => {
    const r = describePhonemeInWord('very', {
      phoneme: 'V', ipa: 'v', status: 'incorrect', got: 'B', gotIpa: 'b',
    })!
    expect(r.plainEs).toBe('la «v» de «very» es /v/ (dientes sobre el labio), no /b/')
  })

  it('/h/ missing → aspirate-the-h explanation', () => {
    const r = describePhonemeInWord('house', {
      phoneme: 'HH', ipa: 'h', status: 'missing', got: undefined, gotIpa: undefined,
    })!
    expect(r.plainEs).toBe('la «h» de «house» sí se pronuncia: un soplo suave /h/')
    expect(r.contrastEs).toBe('ese sonido no se te oyó')
  })

  it('schwa /ə/ → reduce-the-vowel explanation', () => {
    const r = describePhonemeInWord('about', {
      phoneme: 'AH', ipa: 'ə', status: 'incorrect', got: 'AA', gotIpa: 'ɑː',
    })!
    expect(r.plainEs).toBe('la vocal átona de «about» se relaja a /ə/, no se pronuncia entera')
  })

  it('/ŋ/ final (ng) → back-of-tongue explanation', () => {
    const r = describePhonemeInWord('sing', {
      phoneme: 'NG', ipa: 'ŋ', status: 'incorrect', got: 'N', gotIpa: 'n',
    })!
    expect(r.plainEs).toBe('la «ng» final de «sing» es un solo sonido nasal /ŋ/, sin «g» marcada')
  })

  it('/j/ initial (y) → glide explanation', () => {
    const r = describePhonemeInWord('yes', {
      phoneme: 'Y', ipa: 'j', status: 'incorrect', got: 'JH', gotIpa: 'dʒ',
    })!
    expect(r.plainEs).toBe('la «y» inicial de «yes» es un deslizamiento suave /j/, no /dʒ/')
  })
})
```

- [ ] **Step 2: Run test to verify the new cases fail**

Run: `pnpm test lib/pronunciation/__tests__/phoneme-in-word.test.ts`
Expected: the 11 new cases FAIL (each `plainEs` is the generic `el sonido /…/ en «…»`). Task 1's 4 cases still PASS.

- [ ] **Step 3: Implement the pattern table**

In `lib/pronunciation/phoneme-in-word.ts`, add above `describePhonemeInWord`:

```ts
interface Pattern {
  /** True when this pattern explains the given culprit in the given syllable. */
  match: (culprit: PhonemeAlignment, syllableText: string, targetIpa: string) => boolean
  /** Build the emphasised sentence. */
  build: (syllableText: string, targetIpa: string, culprit: PhonemeAlignment) => ExplanationSegment[]
}

const LONG_VOWELS = new Set(['iː', 'uː', 'ɑː', 'ɔː', 'ɜː'])
const lower = (s: string) => s.toLowerCase()

const PATTERNS: Pattern[] = [
  // /z/ final, spelled with "s" (plurals, 3rd person, "is/was")
  {
    match: (c, syl) => c.ipa === 'z' && /s$/i.test(syl),
    build: (syl) => [
      { text: 'la ' },
      { text: '«s»', emphasis: 'grapheme' },
      { text: ' final de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» suena ' },
      { text: '/z/', emphasis: 'ipa' },
      { text: ' (con voz), no /s/' },
    ],
  },
  // /ɪ/ produced as /iː/
  {
    match: (c) => c.ipa === 'ɪ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«i»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es corta ' },
      { text: '/ɪ/', emphasis: 'ipa' },
      { text: ', no larga /iː/' },
    ],
  },
  // long vowel shortened
  {
    match: (c) => !!c.ipa && LONG_VOWELS.has(c.ipa),
    build: (syl, ipa) => [
      { text: 'la vocal de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es larga ' },
      { text: `/${ipa}/`, emphasis: 'ipa' },
      { text: '; te salió corta' },
    ],
  },
  // voiceless th
  {
    match: (c) => c.ipa === 'θ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«th»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/θ/', emphasis: 'ipa' },
      { text: ' (lengua entre los dientes), no /t/' },
    ],
  },
  // voiced th
  {
    match: (c) => c.ipa === 'ð',
    build: (syl) => [
      { text: 'la ' },
      { text: '«th»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/ð/', emphasis: 'ipa' },
      { text: ' (lengua entre los dientes, con voz), no /d/' },
    ],
  },
  // "-ed" past ending realised as /t/ or /d/
  {
    match: (c, syl) => (c.ipa === 't' || c.ipa === 'd') && /ed$/i.test(syl),
    build: (syl, ipa) => [
      { text: 'la ' },
      { text: '«-ed»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» suena ' },
      { text: `/${ipa}/`, emphasis: 'ipa' },
      { text: ', no «ed»' },
    ],
  },
  // /v/ as /b/
  {
    match: (c) => c.ipa === 'v',
    build: (syl) => [
      { text: 'la ' },
      { text: '«v»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es ' },
      { text: '/v/', emphasis: 'ipa' },
      { text: ' (dientes sobre el labio), no /b/' },
    ],
  },
  // /h/ omitted
  {
    match: (c) => c.ipa === 'h',
    build: (syl) => [
      { text: 'la ' },
      { text: '«h»', emphasis: 'grapheme' },
      { text: ' de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» sí se pronuncia: un soplo suave ' },
      { text: '/h/', emphasis: 'ipa' },
    ],
  },
  // schwa
  {
    match: (c) => c.ipa === 'ə',
    build: (syl) => [
      { text: 'la vocal átona de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» se relaja a ' },
      { text: '/ə/', emphasis: 'ipa' },
      { text: ', no se pronuncia entera' },
    ],
  },
  // /ŋ/ final
  {
    match: (c) => c.ipa === 'ŋ',
    build: (syl) => [
      { text: 'la ' },
      { text: '«ng»', emphasis: 'grapheme' },
      { text: ' final de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es un solo sonido nasal ' },
      { text: '/ŋ/', emphasis: 'ipa' },
      { text: ', sin «g» marcada' },
    ],
  },
  // /j/ initial
  {
    match: (c) => c.ipa === 'j',
    build: (syl) => [
      { text: 'la ' },
      { text: '«y»', emphasis: 'grapheme' },
      { text: ' inicial de «' },
      { text: lower(syl), emphasis: 'grapheme' },
      { text: '» es un deslizamiento suave ' },
      { text: '/j/', emphasis: 'ipa' },
      { text: ', no /dʒ/' },
    ],
  },
]
```

Then in `describePhonemeInWord`, replace the hard-coded generic `segments` with:

```ts
  const pattern = PATTERNS.find((p) => p.match(culprit, syllableText, targetIpa))
  const segments: ExplanationSegment[] = pattern
    ? pattern.build(syllableText, targetIpa, culprit)
    : [
        { text: 'el sonido ' },
        { text: `/${targetIpa}/`, emphasis: 'ipa' },
        { text: ' en «' },
        { text: syllableText, emphasis: 'grapheme' },
        { text: '»' },
      ]
```

- [ ] **Step 4: Run test to verify all cases pass**

Run: `pnpm test lib/pronunciation/__tests__/phoneme-in-word.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/phoneme-in-word.ts lib/pronunciation/__tests__/phoneme-in-word.test.ts
git commit -m "feat(pronunciation): pattern table for phoneme-in-word explanations"
```

---

## Task 3: `pickPrimaryFix` selector

**Files:**
- Create: `lib/pronunciation/pick-primary-fix.ts`
- Test: `lib/pronunciation/__tests__/pick-primary-fix.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/__tests__/pick-primary-fix.test.ts
import { describe, expect, it } from 'vitest'
import { pickPrimaryFix } from '../pick-primary-fix'
import type { SyllableResult } from '../syllable-scoring'
import type { PhonemeAlignment, WordResult } from '@/lib/types'

const vowelCulprit: PhonemeAlignment = { phoneme: 'IH', ipa: 'ɪ', status: 'incorrect', got: 'IY', gotIpa: 'iː' }
const consCulprit: PhonemeAlignment = { phoneme: 'Z', ipa: 'z', status: 'incorrect', got: 'S', gotIpa: 's' }

const wordResult = (over: Partial<WordResult>): WordResult => ({
  expected: 'ship', got: 'sheep', status: 'incorrect', ...over,
})

describe('pickPrimaryFix', () => {
  it('prefers a vowel culprit in a failed syllable', () => {
    const syllableMap = new Map<string, SyllableResult[]>([
      ['ship', [{ text: 'ship', phonemes: [], status: 'error', culprit: vowelCulprit }]],
      ['goes', [{ text: 'goes', phonemes: [], status: 'warning', culprit: consCulprit }]],
    ])
    const results = [wordResult({ expected: 'goes' }), wordResult({ expected: 'ship' })]
    expect(pickPrimaryFix(results, syllableMap)).toEqual({ syllableText: 'ship', culprit: vowelCulprit })
  })

  it('falls back to a consonant culprit when no vowel culprit exists', () => {
    const syllableMap = new Map<string, SyllableResult[]>([
      ['goes', [{ text: 'goes', phonemes: [], status: 'warning', culprit: consCulprit }]],
    ])
    const results = [wordResult({ expected: 'goes' })]
    expect(pickPrimaryFix(results, syllableMap)).toEqual({ syllableText: 'goes', culprit: consCulprit })
  })

  it('falls back to the first non-correct alignment of the first incorrect word, using the whole word', () => {
    const results: WordResult[] = [
      wordResult({
        expected: 'would', got: 'wood', status: 'incorrect',
        phonemes: {
          expected: [], got: [], tip: null,
          alignment: [
            { phoneme: 'W', status: 'correct' },
            { phoneme: 'UH', ipa: 'ʊ', status: 'incorrect', got: 'UW', gotIpa: 'uː' },
          ],
        },
      }),
    ]
    expect(pickPrimaryFix(results, new Map())).toEqual({
      syllableText: 'would',
      culprit: { phoneme: 'UH', ipa: 'ʊ', status: 'incorrect', got: 'UW', gotIpa: 'uː' },
    })
  })

  it('returns null when nothing failed', () => {
    const results: WordResult[] = [{ expected: 'I', got: 'I', status: 'correct' }]
    expect(pickPrimaryFix(results, new Map())).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/pronunciation/__tests__/pick-primary-fix.test.ts`
Expected: FAIL — `Failed to resolve import "../pick-primary-fix"`.

- [ ] **Step 3: Implement**

```ts
// lib/pronunciation/pick-primary-fix.ts
import type { PhonemeAlignment, WordResult } from '@/lib/types'
import type { SyllableResult } from './syllable-scoring'
import { isVowelPhoneme } from './arpabet-vowels'

export interface PrimaryFix {
  syllableText: string
  culprit: PhonemeAlignment
}

/**
 * Picks the single failure worth explaining after a spoken line.
 * Priority: vowel culprit in a failed syllable > consonant culprit in a failed
 * syllable > first non-correct phoneme of the first incorrect word (whole word).
 */
export function pickPrimaryFix(
  wordResults: WordResult[],
  syllableMap: Map<string, SyllableResult[]>,
): PrimaryFix | null {
  const syllableCulprits: { syllableText: string; culprit: PhonemeAlignment }[] = []
  for (const word of wordResults) {
    for (const syllable of syllableMap.get(word.expected) ?? []) {
      if (syllable.culprit) {
        syllableCulprits.push({ syllableText: syllable.text, culprit: syllable.culprit })
      }
    }
  }

  const vowel = syllableCulprits.find((c) => isVowelPhoneme(c.culprit.phoneme))
  if (vowel) return vowel
  if (syllableCulprits.length > 0) return syllableCulprits[0]

  const firstIncorrect = wordResults.find((w) => w.status === 'incorrect')
  const failed = firstIncorrect?.phonemes?.alignment?.find((p) => p.status !== 'correct')
  if (firstIncorrect && failed) {
    return { syllableText: firstIncorrect.expected, culprit: failed }
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/pronunciation/__tests__/pick-primary-fix.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/pick-primary-fix.ts lib/pronunciation/__tests__/pick-primary-fix.test.ts
git commit -m "feat(pronunciation): add pickPrimaryFix selector"
```

---

## Task 4: `hookEs` + short/long `spanishTip` in phoneme data

**Files:**
- Modify: `lib/pronunciation/ipa-data.ts:18-33` (`PhonemeExtra` interface), `:476-500` (`/z/` entry) and every other `IPA_EXTRA` entry with a `spanishTip`
- Modify: `lib/pronunciation/syllable-remediation.ts:8-21` (interface), `:42-52` (return)
- Test: none new here — covered by Task 8 via `buildRemediation`; run existing suite to confirm no regressions

- [ ] **Step 1: Extend the `PhonemeExtra` type**

In `lib/pronunciation/ipa-data.ts`, add to the `PhonemeExtra` interface (after `spanishTip: string;`):

```ts
  /**
   * Short, memorable hook (≤ 40 chars) used as the SoundHowTo title in mission
   * feedback. Absent ⇒ SoundHowTo falls back to the IPA symbol.
   */
  hookEs?: string;
  /**
   * Full original tip for deep-study views. When present, `spanishTip` is the
   * shortened mission version and study views read `spanishTipLongEs ?? spanishTip`.
   */
  spanishTipLongEs?: string;
```

- [ ] **Step 2: Rewrite the `/z/` entry copy**

In the `"/z/"` entry, replace the `spanishTip` line with:

```ts
    hookEs: "El zumbido de la abeja",
    spanishTip: "No existe en español. Pon los dedos en la garganta: al pasar de «sss» a «zzz» notas la vibración.",
    spanishTipLongEs: "¡El zumbido de la abeja! No existe en español, pero es ultra frecuente en inglés (is, was, easy, music, dogs, eyes). Pon tus dedos en la garganta mientras haces 'ssss' y luego enciende la voz: notarás un zumbido inmediato. Este sonido distingue rice (arroz) de rise (levantarse).",
```

- [ ] **Step 3: Shorten the remaining `spanishTip`s and add `hookEs`**

For **every other** `IPA_EXTRA` entry that has a `spanishTip`, apply the same three-field shape: move the existing string verbatim to `spanishTipLongEs`, write a 1–2 sentence `spanishTip`, add a `hookEs` (≤ 40 chars). Use these values:

| Key | `hookEs` | short `spanishTip` |
|---|---|---|
| `/iː/` | `"La 'i' tensa y sonriente"` | `"Como la «i» del español pero con más tensión: sonrisa amplia y músculos firmes."` |
| `/ɪ/` | `"La 'i' floja, casi 'e'"` | `"Di una «i» pero afloja toda la mandíbula y no sonrías. Suena a «e» perezosa."` |
| `/ɛ/` | `"La 'e' abierta"` | `"Abre la mandíbula un poco más que para la «e» española."` |
| `/æ/` | `"La 'a' de la sonrisa ancha"` | `"Entre «a» y «e»: baja la mandíbula y estira los labios a los lados."` |
| `/ʌ/` | `"La 'a' corta y central"` | `"Una «a» breve y relajada, hecha en el centro de la boca."` |
| `/ɑː/` | `"La 'a' larga de médico"` | `"Abre bien la boca y alarga: «aaa», como en el médico."` |
| `/ɔː/` | `"La 'o' larga y redonda"` | `"Redondea los labios y alarga la «o»."` |
| `/ʊ/` | `"La 'u' floja y corta"` | `"Una «u» breve y sin fuerza; no redondees tanto los labios."` |
| `/uː/` | `"La 'u' larga con labios de beso"` | `"Redondea fuerte los labios y alarga la «u»."` |
| `/ɜː/` | `"La vocal del gruñido"` | `"Sin equivalente en español: lengua a media altura, sonido largo y neutro."` |
| `/ə/` | `"La vocal perezosa (schwa)"` | `"En sílabas átonas la vocal se relaja hasta un sonido neutro y corto."` |
| `/s/` | `"Tu 's' de siempre, sorda"` | `"Es tu «s» de sol. Resérvala para palabras sin voz; muchas «s» finales son /z/."` |
| `/θ/` | `"La lengua asoma entre los dientes"` | `"Saca un poco la punta de la lengua entre los dientes y sopla, sin voz."` |
| `/ð/` | `"'th' con voz y lengua fuera"` | `"Como /θ/ pero encendiendo la voz: this, the, mother."` |
| `/ʃ/` | `"El gesto de pedir silencio"` | `"«¡Shhh!»: continuo y suave, no lo conviertas en «ch» seca."` |
| `/ʒ/` | `"'shhh' con motor encendido"` | `"«¡Shhh!» pero con voz, como la «y» rioplatense: vision, measure."` |
| `/h/` | `"Un soplo tibio, no la 'j'"` | `"La «h» no es muda y no raspa: es un suspiro tibio, como para empañar un cristal."` |
| `/tʃ/` | `"La 'ch' de siempre"` | `"Es tu «ch» de coche; cuida no suavizarla en «sh»."` |
| `/dʒ/` | `"'ch' con voz: la 'j' inglesa"` | `"Como «ch» pero con voz: jam, gym, bridge."` |
| `/v/` | `"Dientes de arriba sobre el labio"` | `"Apoya los dientes superiores en el labio inferior y vibra; no es «b»."` |
| `/w/` | `"La 'u' que arranca la sílaba"` | `"Empieza con labios de «u» y desliza rápido a la vocal: water, one."` |
| `/j/` | `"La 'y' suave de «hielo»"` | `"Un deslizamiento suave desde «i», no la «y» fuerte: yes, year."` |
| `/ŋ/` | `"La 'n' del fondo de la boca"` | `"Un solo sonido nasal con el dorso de la lengua atrás; no marques la «g»."` |
| `/r/` | `"La 'r' sin tocar nada"` | `"La lengua no toca el paladar: retráela y curva la punta hacia atrás."` |
| `/l/` | `"La 'l' clara y con punta arriba"` | `"Punta de la lengua en los alvéolos; al final de sílaba suena más oscura."` |

> If an entry above is not present in `IPA_EXTRA`, skip it. If an entry has a `spanishTip` but is missing from this table, keep its `spanishTip` as `spanishTipLongEs`, write a one-sentence `spanishTip` summarising it, and add a `hookEs` derived from its first phrase.

- [ ] **Step 4: Thread `hookEs` through `buildRemediation`**

In `lib/pronunciation/syllable-remediation.ts`, add to the `SyllableRemediation` interface (after `spanishTip`):

```ts
  /** Memorable hook for the SoundHowTo title; null ⇒ use the IPA symbol. */
  hookEs: string | null
```

And in the returned object (after `spanishTip: extra?.spanishTip ?? null,`):

```ts
    hookEs: extra?.hookEs ?? null,
```

- [ ] **Step 5: Wire the 6 deep-study views to the long text**

In each of these files, change the `spanishTip` read to `spanishTipLongEs ?? spanishTip`:

- `components/phoneme-practice/SoundLabDetailDialog.tsx` — `{extra?.spanishTip && (` → `{(extra?.spanishTipLongEs ?? extra?.spanishTip) && (`, and `{extra.spanishTip}` → `{extra.spanishTipLongEs ?? extra.spanishTip}`
- `components/lesson/SentenceErrorDetailPanel.tsx`
- `components/phoneme-practice/ExerciseHints.tsx`
- `components/ipa/SpanishSpeakersGrid.tsx`
- `components/sounds/SoundDetail.tsx`
- `components/phoneme-practice/PhonemeIntroTray.tsx`

For each: locate every `.spanishTip` property access that renders text (not a `hookEs`/length check unrelated to display) and replace `X.spanishTip` with `(X.spanishTipLongEs ?? X.spanishTip)`. Grep each file first: `rg "spanishTip" <file>`.

- [ ] **Step 6: Run type-check + full test suite**

Run: `pnpm type-check && pnpm test`
Expected: type-check clean. Tests: existing `SyllableRemediation.test.tsx` still passes (it builds `RemediationData` inline — add `hookEs: null` to both literals in that file so the type matches):

In `components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`, add `hookEs: null,` to the `data` object and to the inline object in the "no rompe" test.

Expected after that: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/pronunciation/ipa-data.ts lib/pronunciation/syllable-remediation.ts components/phoneme-practice/SoundLabDetailDialog.tsx components/lesson/SentenceErrorDetailPanel.tsx components/phoneme-practice/ExerciseHints.tsx components/ipa/SpanishSpeakersGrid.tsx components/sounds/SoundDetail.tsx components/phoneme-practice/PhonemeIntroTray.tsx components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx
git commit -m "feat(pronunciation): short mission spanishTip + hookEs, long text preserved for study views"
```

---

## Task 5: `useDualPlayback` hook (extracted from `SelfPlaybackAudioBar`)

**Files:**
- Create: `hooks/useDualPlayback.ts`
- Test: `hooks/__tests__/useDualPlayback.test.ts`
- Modify: `components/pronunciation/SelfPlaybackAudioBar.tsx:14-51`

- [ ] **Step 1: Write the failing test**

```ts
// hooks/__tests__/useDualPlayback.test.ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const speak = vi.fn((_t: string, onEnd?: () => void) => { onEnd?.() })
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...(a as [string, () => void])) }))

import { useDualPlayback } from '../useDualPlayback'

afterEach(() => { speak.mockClear() })

describe('useDualPlayback', () => {
  it('playNative calls speak with the target word', () => {
    const { result } = renderHook(() => useDualPlayback('coffee', null))
    act(() => result.current.playNative())
    expect(speak).toHaveBeenCalledWith('coffee', expect.any(Function))
  })

  it('playNative is a no-op without a target word', () => {
    const { result } = renderHook(() => useDualPlayback(undefined, null))
    act(() => result.current.playNative())
    expect(speak).not.toHaveBeenCalled()
  })

  it('exposes isPlayingUser false and does not throw without a user url', () => {
    const { result } = renderHook(() => useDualPlayback('coffee', null))
    expect(result.current.isPlayingUser).toBe(false)
    act(() => result.current.playUser())
    expect(result.current.isPlayingUser).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/useDualPlayback.test.ts`
Expected: FAIL — `Failed to resolve import "../useDualPlayback"`.

- [ ] **Step 3: Implement the hook (move logic verbatim from `SelfPlaybackAudioBar`)**

```ts
// hooks/useDualPlayback.ts
'use client'

import { useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'

export interface DualPlayback {
  isPlayingNative: boolean
  isPlayingUser: boolean
  playNative: () => void
  playUser: () => void
}

/**
 * Native (TTS) vs user-recording playback state, mutually exclusive.
 * Extracted from SelfPlaybackAudioBar so ListenPanel can reuse it.
 */
export function useDualPlayback(
  targetWord: string | undefined,
  userAudioUrl: string | null | undefined,
): DualPlayback {
  const [isPlayingNative, setIsPlayingNative] = useState(false)
  const [isPlayingUser, setIsPlayingUser] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playNative = () => {
    if (!targetWord) return
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlayingUser(false)
    }
    setIsPlayingNative(true)
    speak(targetWord, () => setIsPlayingNative(false))
  }

  const playUser = () => {
    if (!userAudioUrl) return
    window.speechSynthesis?.cancel()
    setIsPlayingNative(false)

    if (isPlayingUser && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingUser(false)
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(userAudioUrl)
      audioRef.current.onended = () => setIsPlayingUser(false)
      audioRef.current.onerror = () => setIsPlayingUser(false)
    } else {
      audioRef.current.src = userAudioUrl
      audioRef.current.currentTime = 0
    }

    setIsPlayingUser(true)
    audioRef.current.play().catch(() => setIsPlayingUser(false))
  }

  return { isPlayingNative, isPlayingUser, playNative, playUser }
}
```

- [ ] **Step 4: Run the hook test**

Run: `pnpm test hooks/__tests__/useDualPlayback.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Refactor `SelfPlaybackAudioBar` to consume the hook**

Replace lines 14–51 (the `useState`/`useRef`/`playNative`/`playUser` block) with:

```tsx
export function SelfPlaybackAudioBar({ targetWord, userAudioUrl, className }: Props) {
  const { isPlayingNative, isPlayingUser, playNative, playUser } = useDualPlayback(
    targetWord,
    userAudioUrl,
  );
```

Add the import near the top (after the `speak` import — which is now unused here, so remove it):

```tsx
import { useDualPlayback } from "@/hooks/useDualPlayback";
```

Remove now-unused imports: `useRef`, `useState` from `react` (keep none if that leaves the line empty), and `speak`.

- [ ] **Step 6: Run the existing suite for regressions**

Run: `pnpm test components/pronunciation components/ai-coach/missions`
Expected: PASS (SelfPlaybackAudioBar behaviour unchanged; `LearnerLine` practice-playback tests still green).

- [ ] **Step 7: Commit**

```bash
git add hooks/useDualPlayback.ts hooks/__tests__/useDualPlayback.test.ts components/pronunciation/SelfPlaybackAudioBar.tsx
git commit -m "refactor(pronunciation): extract useDualPlayback from SelfPlaybackAudioBar"
```

---

## Task 6: `SoundHowTo` collapsible

**Files:**
- Create: `components/pronunciation-feedback/SoundHowTo.tsx`
- Test: covered by `PhonemeFix.test.tsx` (Task 7) and `LineResult.test.tsx` (Task 8); no standalone test file

- [ ] **Step 1: Implement**

```tsx
// components/pronunciation-feedback/SoundHowTo.tsx
'use client'

// Planned structure:
// <SoundHowTo>  — collapsible "Cómo se hace" block
//   <button> toggle
//   <div> hookEs title + articulationEs <ul> + short spanishTip

import { useState } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  /** IPA symbol with slashes, e.g. "/z/" — fallback title when hookEs is null. */
  ipa: string
  hookEs: string | null
  articulationEs: string[]
  spanishTip: string | null
  /** Start expanded (used when the score is low). */
  defaultOpen?: boolean
}

export function SoundHowTo({ ipa, hookEs, articulationEs, spanishTip, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  if (articulationEs.length === 0 && !spanishTip) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-caption text-fg-subtle hover:text-fg-muted"
      >
        Cómo se hace {open ? '↓' : '→'}
      </button>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <p className="m-0 text-caption font-semibold text-fg">{hookEs ?? ipa}</p>
          {articulationEs.length > 0 && (
            <ul className={cn('m-0 flex list-disc flex-col gap-1 pl-4')}>
              {articulationEs.map((step, i) => (
                <li key={i} className="text-caption text-fg-muted">{step}</li>
              ))}
            </ul>
          )}
          {spanishTip && <p className="m-0 text-caption text-fg-muted">{spanishTip}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/pronunciation-feedback/SoundHowTo.tsx
git commit -m "feat(pronunciation-feedback): add SoundHowTo collapsible"
```

---

## Task 7: `PhonemeFix` block

**Files:**
- Create: `components/pronunciation-feedback/PhonemeFix.tsx`
- Test: `components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PhonemeFix } from '../PhonemeFix'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...a) }))

const explanation: PhonemeInWordExplanation = {
  segments: [
    { text: 'la ' },
    { text: '«s»', emphasis: 'grapheme' },
    { text: ' final de «goes» suena ' },
    { text: '/z/', emphasis: 'ipa' },
    { text: ' (con voz), no /s/' },
  ],
  plainEs: 'la «s» final de «goes» suena /z/ (con voz), no /s/',
  contrastEs: 'dijiste /s/ (sin voz)',
}

const remediation = {
  ipa: '/z/',
  articulationEs: ['Enciende la voz al hacer «sss»'],
  spanishTip: 'No existe en español.',
  hookEs: 'El zumbido de la abeja',
  visualCueEs: null,
  vowelDuration: null,
  minimalPairs: [],
}

describe('PhonemeFix', () => {
  it('renders the plain sentence as the block aria-label', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    expect(screen.getByLabelText(explanation.plainEs)).toBeInTheDocument()
  })

  it('renders the IPA segment with an underline class', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    const ipa = screen.getByText('/z/', { selector: 'span' })
    expect(ipa.className).toMatch(/underline/)
  })

  it('speaks the isolated phoneme when the audio button is clicked', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    fireEvent.click(screen.getByRole('button', { name: /\/z\// }))
    expect(speak).toHaveBeenCalledWith('/z/')
  })

  it('shows contrastEs when present', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    expect(screen.getByText('dijiste /s/ (sin voz)')).toBeInTheDocument()
  })

  it('omits the contrast line when contrastEs is null', () => {
    render(
      <PhonemeFix
        explanation={{ ...explanation, contrastEs: null }}
        remediation={remediation}
        phonemeIpa="/z/"
        score={95}
        status="incorrect"
      />,
    )
    expect(screen.queryByText(/dijiste/)).not.toBeInTheDocument()
  })

  it('opens SoundHowTo by default when score < 70', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={55} status="incorrect" />)
    expect(screen.getByText('El zumbido de la abeja')).toBeInTheDocument()
  })

  it('keeps SoundHowTo collapsed when score >= 70', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={88} status="incorrect" />)
    expect(screen.queryByText('El zumbido de la abeja')).not.toBeInTheDocument()
  })

  it('renders without SoundHowTo when remediation is null', () => {
    render(<PhonemeFix explanation={explanation} remediation={null} phonemeIpa="/z/" score={55} status="incorrect" />)
    expect(screen.queryByRole('button', { name: /cómo se hace/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx`
Expected: FAIL — `Failed to resolve import "../PhonemeFix"`.

- [ ] **Step 3: Implement**

```tsx
// components/pronunciation-feedback/PhonemeFix.tsx
'use client'

// Planned structure:
// <PhonemeFix>  — the "why it failed" block, anchored to the word's spelling
//   <p aria-label={plainEs}>  segments → <span> (grapheme / ipa emphasis)
//   <button> 🔊 {ipa}  — isolated phoneme
//   <p> contrastEs
//   <SoundHowTo />

import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import { SoundHowTo } from './SoundHowTo'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'
import type { SyllableRemediation } from '@/lib/pronunciation/syllable-remediation'

interface Props {
  explanation: PhonemeInWordExplanation
  remediation: SyllableRemediation | null
  /** IPA with slashes for the audio button + SoundHowTo fallback title. */
  phonemeIpa: string
  score: number
  /** Culprit alignment status — picks the accent border colour. */
  status: 'incorrect' | 'missing'
}

export function PhonemeFix({ explanation, remediation, phonemeIpa, score, status }: Props) {
  const speakPhoneme = () => {
    try {
      speak(phonemeIpa)
    } catch {
      /* TTS failure must not break the turn */
    }
  }

  return (
    <div
      aria-label={explanation.plainEs}
      className={cn(
        'flex flex-col rounded-lg border-l-2 bg-surface-sunken px-3 py-2.5',
        status === 'incorrect' ? 'border-[var(--error)]' : 'border-[var(--warning)]',
      )}
    >
      <p className="m-0 text-body-sm text-fg">
        {explanation.segments.map((seg, i) => {
          if (seg.emphasis === 'grapheme') {
            return <span key={i} className="font-semibold">{seg.text}</span>
          }
          if (seg.emphasis === 'ipa') {
            return (
              <span
                key={i}
                className="font-semibold text-fg underline decoration-[var(--warning)] decoration-2 underline-offset-2"
              >
                {seg.text}
              </span>
            )
          }
          return <span key={i}>{seg.text}</span>
        })}
      </p>

      <button
        type="button"
        onClick={speakPhoneme}
        className="mt-1 self-start text-caption text-fg-muted hover:text-fg"
        aria-label={`Escuchar ${phonemeIpa}`}
      >
        🔊 {phonemeIpa}
      </button>

      {explanation.contrastEs && (
        <p className="m-0 mt-1 text-caption text-fg-muted">{explanation.contrastEs}</p>
      )}

      {remediation && (
        <SoundHowTo
          ipa={phonemeIpa}
          hookEs={remediation.hookEs}
          articulationEs={remediation.articulationEs}
          spanishTip={remediation.spanishTip}
          defaultOpen={score < 70}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation-feedback/PhonemeFix.tsx components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx
git commit -m "feat(pronunciation-feedback): add PhonemeFix block"
```

---

## Task 8: `ListenPanel` (merges minimal-pair chips + Nativo/Mi voz)

**Files:**
- Create: `components/pronunciation-feedback/ListenPanel.tsx`
- Test: `components/pronunciation-feedback/__tests__/ListenPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/pronunciation-feedback/__tests__/ListenPanel.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ListenPanel } from '../ListenPanel'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...a) }))

describe('ListenPanel', () => {
  const pairs = [{ wordA: 'zoo', wordB: 'sue' }, { wordA: 'zip', wordB: 'sip' }]

  it('renders minimal-pair chips and speaks the word on click', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    const chip = screen.getByRole('button', { name: 'zoo' })
    fireEvent.click(chip)
    expect(speak).toHaveBeenCalledWith('zoo')
  })

  it('renders Nativo and Mi voz buttons', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar mi propia voz/i })).toBeInTheDocument()
  })

  it('disables Mi voz without a user audio url', () => {
    render(<ListenPanel minimalPairs={pairs} targetText="goes" userAudioUrl={null} />)
    expect(screen.getByRole('button', { name: /escuchar mi propia voz/i })).toBeDisabled()
  })

  it('omits the chips row when there are no minimal pairs', () => {
    render(<ListenPanel minimalPairs={[]} targetText="goes" userAudioUrl={null} />)
    expect(screen.queryByText(/escucha la diferencia/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/pronunciation-feedback/__tests__/ListenPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "../ListenPanel"`.

- [ ] **Step 3: Implement**

```tsx
// components/pronunciation-feedback/ListenPanel.tsx
'use client'

// Planned structure:
// <ListenPanel>  — one card, merges the two old audio cards
//   row 1: "ESCUCHA LA DIFERENCIA" + minimal-pair chips
//   row 2: Nativo / Mi voz buttons (useDualPlayback)

import { Volume2, Mic, Pause } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import { useDualPlayback } from '@/hooks/useDualPlayback'

interface Props {
  minimalPairs: { wordA: string; wordB: string }[]
  targetText: string
  userAudioUrl: string | null | undefined
}

export function ListenPanel({ minimalPairs, targetText, userAudioUrl }: Props) {
  const { isPlayingNative, isPlayingUser, playNative, playUser } = useDualPlayback(
    targetText,
    userAudioUrl,
  )
  const pairs = minimalPairs.slice(0, 2)

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-border-default bg-surface-raised p-3.5">
      {pairs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-xs uppercase tracking-wider text-fg-muted">
            Escucha la diferencia
          </span>
          {pairs.flatMap((pair) => [
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

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={playNative}
          disabled={!targetText}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-3 py-2 text-caption font-semibold text-fg hover:bg-surface-sunken transition-colors',
            isPlayingNative && 'border-primary text-primary animate-pulse',
          )}
          aria-label="Escuchar modelo nativo"
        >
          <Volume2 size={16} className={isPlayingNative ? 'text-primary' : 'text-fg-muted'} />
          <span>Nativo</span>
        </button>

        <button
          type="button"
          onClick={playUser}
          disabled={!userAudioUrl}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-caption font-semibold transition-colors',
            userAudioUrl
              ? 'border-primary/40 bg-primary-soft text-primary hover:bg-primary/20'
              : 'border-border-subtle bg-surface-sunken text-fg-muted opacity-50 cursor-not-allowed',
            isPlayingUser && 'border-primary ring-2 ring-primary/30',
          )}
          aria-label="Escuchar mi propia voz grabada"
        >
          {isPlayingUser ? <Pause size={16} /> : <Mic size={16} />}
          <span>Mi voz</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/pronunciation-feedback/__tests__/ListenPanel.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/pronunciation-feedback/ListenPanel.tsx components/pronunciation-feedback/__tests__/ListenPanel.test.tsx
git commit -m "feat(pronunciation-feedback): add ListenPanel merging audio cards"
```

---

## Task 9: `ScoreVerdict`

**Files:**
- Create: `components/ai-coach/missions/scripted/ScoreVerdict.tsx`
- Test: covered by `LineResult.test.tsx` (Task 10)

- [ ] **Step 1: Implement**

```tsx
// components/ai-coach/missions/scripted/ScoreVerdict.tsx
'use client'

// Planned structure:
// <ScoreVerdict>  — big score coloured by band + one-line headline

import { cn } from '@/lib/cn'

interface Props {
  score: number
  headline: string
}

function bandClass(score: number): string {
  if (score >= 90) return 'text-[var(--success)]'
  if (score >= 70) return 'text-[var(--warning)]'
  return 'text-[var(--error)]'
}

export function ScoreVerdict({ score, headline }: Props) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('text-h3 font-semibold', bandClass(score))}>{score}%</span>
      <span className="text-body-sm text-fg-muted">{headline}</span>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ai-coach/missions/scripted/ScoreVerdict.tsx
git commit -m "feat(missions): add ScoreVerdict"
```

---

## Task 10: `LineResult` — composes the redesigned block

**Files:**
- Create: `components/ai-coach/missions/scripted/LineResult.tsx`
- Test: `components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineResult } from '../LineResult'
import type { WordResult } from '@/lib/types'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const wordResults: WordResult[] = [
  { expected: 'goes', got: 'goes', status: 'correct' },
]

const explanation: PhonemeInWordExplanation = {
  segments: [{ text: 'la ' }, { text: '/z/', emphasis: 'ipa' }, { text: ' final' }],
  plainEs: 'la /z/ final',
  contrastEs: null,
}

const remediation = {
  ipa: '/z/', articulationEs: ['paso'], spanishTip: 'tip', hookEs: 'El zumbido de la abeja',
  visualCueEs: null, vowelDuration: null, minimalPairs: [{ wordA: 'zoo', wordB: 'sue' }],
}

const base = {
  wordResults,
  syllableMap: new Map(),
  targetText: 'goes',
  userAudioUrl: null,
  onRetry: vi.fn(),
  onContinue: vi.fn(),
}

describe('LineResult', () => {
  it('colours the score by band (success ≥ 90)', () => {
    render(<LineResult {...base} score={96} fix={null} remediation={null} />)
    const score = screen.getByText('96%')
    expect(score.className).toMatch(/var\(--success\)/)
  })

  it('colours the score by band (warning 70–89)', () => {
    render(<LineResult {...base} score={80} fix={null} remediation={null} />)
    expect(screen.getByText('80%').className).toMatch(/var\(--warning\)/)
  })

  it('colours the score by band (error < 70)', () => {
    render(<LineResult {...base} score={55} fix={null} remediation={null} />)
    expect(screen.getByText('55%').className).toMatch(/var\(--error\)/)
  })

  it('hides PhonemeFix when fix is null', () => {
    render(<LineResult {...base} score={96} fix={null} remediation={null} />)
    expect(screen.queryByRole('button', { name: /🔊/ })).not.toBeInTheDocument()
  })

  it('renders PhonemeFix and opens SoundHowTo when score < 70', () => {
    render(
      <LineResult
        {...base}
        score={55}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={remediation}
      />,
    )
    expect(screen.getByText('El zumbido de la abeja')).toBeInTheDocument()
  })

  it('keeps SoundHowTo collapsed when score >= 70', () => {
    render(
      <LineResult
        {...base}
        score={82}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={remediation}
      />,
    )
    expect(screen.queryByText('El zumbido de la abeja')).not.toBeInTheDocument()
  })

  it('omits the ListenPanel chips row when there are no minimal pairs', () => {
    render(
      <LineResult
        {...base}
        score={82}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={{ ...remediation, minimalPairs: [] }}
      />,
    )
    expect(screen.queryByText(/escucha la diferencia/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx`
Expected: FAIL — `Failed to resolve import "../LineResult"`.

- [ ] **Step 3: Implement**

```tsx
// components/ai-coach/missions/scripted/LineResult.tsx
'use client'

// Planned structure:
// <LineResult>  — the whole `attempt` block, three visual weights
//   <ScoreVerdict />
//   <SpokenLineFeedback />
//   <PhonemeFix />        (only when `fix` is set)
//   <ListenPanel />
//   <RetryAndContinue />

import { SpokenLineFeedback } from '@/components/pronunciation-feedback/SpokenLineFeedback'
import { PhonemeFix } from '@/components/pronunciation-feedback/PhonemeFix'
import { ListenPanel } from '@/components/pronunciation-feedback/ListenPanel'
import { ScoreVerdict } from './ScoreVerdict'
import { RetryAndContinue } from './RetryAndContinue'
import type { WordResult } from '@/lib/types'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'
import type { SyllableRemediation } from '@/lib/pronunciation/syllable-remediation'

export interface LineResultFix {
  explanation: PhonemeInWordExplanation
  /** IPA with slashes for the audio button. */
  phonemeIpa: string
  status: 'incorrect' | 'missing'
}

interface Props {
  score: number
  wordResults: WordResult[]
  syllableMap: Map<string, SyllableResult[]>
  fix: LineResultFix | null
  remediation: SyllableRemediation | null
  targetText: string
  userAudioUrl: string | null | undefined
  onRetry: () => void
  onContinue: () => void
}

function feedbackHeadline(score: number): string {
  if (score >= 90) return 'Muy bien'
  if (score >= 70) return 'Casi: fíjate en lo marcado'
  return 'Repite fijándote en lo marcado'
}

export function LineResult({
  score,
  wordResults,
  syllableMap,
  fix,
  remediation,
  targetText,
  userAudioUrl,
  onRetry,
  onContinue,
}: Props) {
  return (
    <>
      <div className="flex w-full flex-col gap-2.5 rounded-lg rounded-tr-sm border border-border-subtle bg-surface-raised/95 px-4 py-3 shadow-xs">
        <ScoreVerdict score={score} headline={feedbackHeadline(score)} />
        <SpokenLineFeedback wordResults={wordResults} syllableMap={syllableMap} />
        {fix && (
          <PhonemeFix
            explanation={fix.explanation}
            remediation={remediation}
            phonemeIpa={fix.phonemeIpa}
            score={score}
            status={fix.status}
          />
        )}
      </div>

      <div className="w-full">
        <ListenPanel
          minimalPairs={remediation?.minimalPairs ?? []}
          targetText={targetText}
          userAudioUrl={userAudioUrl}
        />
      </div>

      <RetryAndContinue onRetry={onRetry} onContinue={onContinue} />
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/missions/scripted/LineResult.tsx components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx
git commit -m "feat(missions): add LineResult composing the redesigned turn result"
```

---

## Task 11: Wire `LearnerLine` to `LineResult`; delete `SyllableRemediation`

**Files:**
- Modify: `components/ai-coach/missions/scripted/LearnerLine.tsx:1-30` (imports + comment block), `:96-112` (remediation IIFE), `:173-195` (attempt branch)
- Modify: `components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx:128-153`
- Delete: `components/pronunciation-feedback/SyllableRemediation.tsx`, `components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx`

- [ ] **Step 1: Update the `LearnerLine` "remediación fonética" test to the new tree**

Replace the `it('muestra remediación fonética si hay fallo', …)` test (lines ~128–153) with:

```tsx
  it('explica el fallo anclado a la palabra si hay fallo', async () => {
    evaluation.wordResults = [
      {
        expected: 'yes',
        got: 'jes',
        status: 'incorrect',
        phonemes: {
          expected: [],
          got: [],
          tip: null,
          alignment: [
            { phoneme: 'Y', ipa: 'j', status: 'incorrect', got: 'JH', gotIpa: 'dʒ' },
            { phoneme: 'EH', ipa: 'ɛ', status: 'correct' },
            { phoneme: 'S', ipa: 's', status: 'correct' },
          ],
        },
      },
    ]
    captureState.status = 'done'
    captureState.transcript = 'jes'
    captureState.hasRecording = true
    captureState.captureState = 'stopped'

    render(<LearnerLine line={line} onLineComplete={vi.fn()} />)
    expect(await screen.findByText(/deslizamiento suave/i)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run it to confirm it fails against the current component**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx -t "explica el fallo"`
Expected: FAIL — current `LearnerLine` renders `SyllableRemediation` (no "deslizamiento suave" copy).

- [ ] **Step 3: Refactor `LearnerLine`**

In `components/ai-coach/missions/scripted/LearnerLine.tsx`:

**a. Comment block (lines 3–11)** — replace the `<SyllableRemediation />` line:

```tsx
// Planned structure:
// <LearnerLine>
//   <ShadowingPanel />           (escuchar el modelo antes/después de hablar)
//   <LearnerSpeechControls />    (captura con osciloscopio real)
//   <LineResult />               (veredicto + línea coloreada + fix + escucha)
//   <SelfPlaybackAudioBar />     (comparación en modo práctica sin STT)
//   <RetryAndContinue />         (repetir / continuar)
// </LearnerLine>
```

**b. Imports** — remove:

```tsx
import { SpokenLineFeedback } from '@/components/pronunciation-feedback/SpokenLineFeedback'
import { SyllableRemediation } from '@/components/pronunciation-feedback/SyllableRemediation'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
```

and add:

```tsx
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import { pickPrimaryFix } from '@/lib/pronunciation/pick-primary-fix'
import { describePhonemeInWord } from '@/lib/pronunciation/phoneme-in-word'
import { LineResult, type LineResultFix } from './LineResult'
```

(`buildRemediation` stays; `SpokenLineFeedback` moves into `LineResult`.)

**c. Delete `feedbackHeadline`** (lines 38–42) — it now lives in `LineResult`.

**d. Replace the `remediation` IIFE (lines 96–112)** with:

```tsx
  const primaryFix = attempt
    ? pickPrimaryFix(attempt.wordResults, syllableMap)
    : null

  const remediation = primaryFix ? buildRemediation(primaryFix.culprit) : null

  const fix: LineResultFix | null = (() => {
    if (!primaryFix) return null
    const explanation = describePhonemeInWord(primaryFix.syllableText, primaryFix.culprit)
    if (!explanation) return null
    const phonemeIpa = remediation?.ipa ?? `/${primaryFix.culprit.ipa ?? ''}/`
    const status = primaryFix.culprit.status === 'missing' ? 'missing' : 'incorrect'
    return { explanation, phonemeIpa, status }
  })()
```

**e. Replace the `attempt` branch (lines 173–195)** with:

```tsx
        {attempt && (
          <LineResult
            score={attempt.score}
            wordResults={attempt.wordResults}
            syllableMap={syllableMap}
            fix={fix}
            remediation={remediation}
            targetText={line.text}
            userAudioUrl={capture.userAudioUrl}
            onRetry={handleRetry}
            onContinue={() => onLineComplete(attempt)}
          />
        )}
```

- [ ] **Step 4: Delete `SyllableRemediation` and its test**

```bash
git rm components/pronunciation-feedback/SyllableRemediation.tsx components/pronunciation-feedback/__tests__/SyllableRemediation.test.tsx
```

- [ ] **Step 5: Run the `LearnerLine` suite**

Run: `pnpm test components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx`
Expected: PASS. Notes for the worker:
- The `colorea cada palabra y muestra puntuación` test uses `evaluation.wordResults` with `status: 'incorrect'` for `would` and no `phonemes` → `pickPrimaryFix` returns `null` (no alignment) → no `PhonemeFix`; `60%` and per-word labels still render via `ScoreVerdict` + `SpokenLineFeedback`. Keep that test as-is.
- `muestra SelfPlaybackAudioBar y RetryAndContinue si grabó en modo práctica` and `ofrece reescuchar la propia voz…` rely on the practice-playback branch (`showPracticePlayback`) and the post-score `SelfPlaybackAudioBar` — the post-score bar is now inside `LineResult` as `ListenPanel`. Update the `ofrece reescuchar…` assertion target if needed: `screen.getByRole('button', { name: /escuchar mi propia voz grabada/i })` still resolves (ListenPanel keeps that aria-label). No change expected, but re-run to confirm.

- [ ] **Step 6: Full suite + type-check + lint**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: all green. If `LearnerLine.tsx` now exceeds ~185 lines, it should be *shorter* (the IIFE and `feedbackHeadline` moved out) — confirm < 250.

- [ ] **Step 7: Commit**

```bash
git add components/ai-coach/missions/scripted/LearnerLine.tsx components/ai-coach/missions/scripted/__tests__/LearnerLine.test.tsx
git commit -m "feat(missions): render redesigned LineResult, remove SyllableRemediation"
```

---

## Task 12: Final verification pass

**Files:** none — verification only

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors. Check specifically: no `style={{}}` added; class order layout → spacing → typography → color → state → responsive in new files; every new file < 120 lines (`SoundHowTo` ~55, `PhonemeFix` ~95, `ListenPanel` ~110, `ScoreVerdict` ~30, `LineResult` ~95).

- [ ] **Step 3: Full test suite**

Run: `pnpm test`
Expected: green. New test files: `phoneme-in-word.test.ts` (15), `pick-primary-fix.test.ts` (4), `useDualPlayback.test.ts` (3), `PhonemeFix.test.tsx` (8), `ListenPanel.test.tsx` (4), `LineResult.test.tsx` (8). Deleted: `SyllableRemediation.test.tsx`.

- [ ] **Step 4: Manual smoke (dev server)**

Run: `pnpm dev`, open a scripted mission, speak a learner line badly (e.g. a line containing "goes" or "very"), and confirm:
- Big coloured score at the top, headline beside it.
- Coloured line below.
- A sunken block with the anchored sentence, the IPA underlined, a "🔊 /…/" button, and "Cómo se hace →" (expanded if score < 70).
- One "Escucha la diferencia" card with chips + Nativo / Mi voz.
- Offline (DevTools → Network → Offline): the turn still renders; audio buttons no-op without throwing.

- [ ] **Step 5: Commit any doc/cleanup**

```bash
git add -A
git commit -m "chore(missions): finalize learner feedback redesign" --allow-empty
```

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| `LineResult` composes sub-blocks; `LearnerLine` stays orchestrator | 10, 11 |
| `ScoreVerdict` — big score, colour by band, headline | 9, 10 |
| `PhonemeFix` — anchored sentence, grapheme/IPA emphasis, `contrastEs`, isolated-phoneme audio, `SoundHowTo` inside, border colour by status | 7 |
| `SoundHowTo` — `hookEs` title, `articulationEs` `<ul>`, short `spanishTip`, open by default if score < 70 | 6, 7 |
| `ListenPanel` — one card, chips row + Nativo/Mi voz, drop duplicate header | 5, 8 |
| `describePhonemeInWord` — types, ~10 pattern table, generic fallback, `null` only when no IPA | 1, 2 |
| `contrastEs` — missing / distinct got / null; voicing note | 1 |
| `pickPrimaryFix` — vowel > consonant > alignment > null | 3 |
| `hookEs` field + short `spanishTip` + `spanishTipLongEs`; `/z/` copy | 4 |
| 6 deep-study views read `spanishTipLongEs ?? spanishTip` | 4 |
| `buildRemediation` returns `hookEs` | 4 |
| Delete `SyllableRemediation` + test | 11 |
| Edge: no fix → no `PhonemeFix`; `buildRemediation` null → generic only, no "Cómo se hace"; no `userAudioUrl` → Mi voz disabled; offline; score null→0 | 10, 11 (LearnerLine already coerces `evaluation.score ?? 0`) |
| Tests enumerated in spec §Tests | 1–3, 5–11 |
| `pnpm type-check` / `lint` / `test` green | 11, 12 |

No gaps.

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Task 4's copy table is fully specified; the fallback instruction ("if missing from this table…") is a concrete rule, not a placeholder. Every code step shows complete code.

**3. Type consistency:**
- `describePhonemeInWord(syllableText, culprit) → PhonemeInWordExplanation | null` — same signature in Tasks 1, 2, 7, 10, 11.
- `pickPrimaryFix(wordResults, syllableMap) → PrimaryFix | null` where `PrimaryFix = { syllableText, culprit }` — Tasks 3, 11.
- `SyllableRemediation.hookEs: string | null` — added Task 4, consumed Tasks 7, 10, 11.
- `LineResultFix = { explanation, phonemeIpa, status: 'incorrect' | 'missing' }` — defined Task 10, built Task 11, consumed by `PhonemeFix` (Task 7 `status` prop matches).
- `useDualPlayback(targetWord?, userAudioUrl?) → { isPlayingNative, isPlayingUser, playNative, playUser }` — Task 5, consumed Tasks 5 (SelfPlaybackAudioBar), 8 (ListenPanel).
- `ScoreVerdict({ score, headline })` — Task 9, used Task 10.

No mismatches.
