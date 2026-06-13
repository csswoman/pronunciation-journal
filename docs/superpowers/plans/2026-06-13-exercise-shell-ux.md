# Exercise Shell UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all generic vocabulary exercises under a consistent `ExerciseShell` wrapper that provides: exercise title, always-visible hint, delayed Continue button (shown after answering), and an exit confirmation bottom sheet across all session types.

**Architecture:** `ExerciseShell` is a pure presentational wrapper rendered by `ExerciseRenderer`. Exercise components lose their skip/submit footer and call `onResult` instead of `onSubmit`. `ExerciseRenderer` holds `result` state, bridges to `onContinue`, and passes the shell title + hint. `ExitConfirmSheet` is a fixed bottom overlay intercepting X in `SessionExercisingBody`.

**Tech Stack:** React 19, Next.js 15 App Router, Tailwind v4, TypeScript. Tests: Vitest + React Testing Library.

---

## File Map

**Create:**
- `components/exercises/ExerciseShell.tsx` — title eyebrow, hint chip, Continue/Skip buttons
- `components/exercises/ExitConfirmSheet.tsx` — bottom sheet overlay with backdrop

**Modify:**
- `lib/exercises/types.ts` — add `targetWord?`, `targetMeaning?` to `SentenceDictationExercise`
- `lib/exercises/generators/sentence-dictation.ts` — populate new fields
- `components/practice/session/ExerciseRenderer.tsx` — result state, shell wrapper, title map
- `components/exercises/FillBlankExercise.tsx` — `onSubmit` → `onResult`, remove footer
- `components/exercises/SentenceDictationExercise.tsx` — `onSubmit` → `onResult`, remove footer
- `components/exercises/ReorderWordsExercise.tsx` — `onSubmit` → `onResult`, remove footer (non-focusUi path only)
- `components/exercises/MultipleChoiceExercise.tsx` — `onSubmit` → `onResult`, remove footer
- `components/exercises/SentenceContextExercise.tsx` — `onSubmit` → `onResult`, remove ConfirmBar/FeedbackPanel footer
- `components/exercises/MatchPairsExercise.tsx` — `onSubmit` → `onResult`, remove Check button footer
- `components/practice/session/SessionExercisingBody.tsx` — wire ExitConfirmSheet

---

## Task 1: Add targetWord/targetMeaning to SentenceDictationExercise type and generator

**Files:**
- Modify: `lib/exercises/types.ts`
- Modify: `lib/exercises/generators/sentence-dictation.ts`
- Test: `lib/exercises/generators/__tests__/sentence-dictation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/exercises/generators/__tests__/sentence-dictation.test.ts` (or add to existing):

```typescript
import { describe, it, expect } from 'vitest'
import { generateSentenceDictationFromWordBank } from '../sentence-dictation'
import type { WordBankEntry } from '@/lib/word-bank/types'

const mockEntries: WordBankEntry[] = [
  {
    id: 'entry-1',
    text: 'idyllic',
    example: 'They lived in an idyllic village, far from the city noise.',
    meaning: 'pleasantly simple and peaceful',
    translation: 'idílico',
    difficulty: 'B2',
    audio_url: null,
  } as WordBankEntry,
]

describe('generateSentenceDictationFromWordBank', () => {
  it('populates targetWord and targetMeaning from entry', () => {
    const exercises = generateSentenceDictationFromWordBank(mockEntries, 1)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].targetWord).toBe('idyllic')
    expect(exercises[0].targetMeaning).toBe('pleasantly simple and peaceful')
  })

  it('omits targetMeaning when entry has no meaning', () => {
    const entries = [{ ...mockEntries[0], meaning: undefined }] as WordBankEntry[]
    const exercises = generateSentenceDictationFromWordBank(entries, 1)
    expect(exercises[0].targetWord).toBe('idyllic')
    expect(exercises[0].targetMeaning).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/exercises/generators/__tests__/sentence-dictation
```

Expected: FAIL — `targetWord` is undefined.

- [ ] **Step 3: Update the type**

In `lib/exercises/types.ts`, update `SentenceDictationExercise`:

```typescript
export interface SentenceDictationExercise extends BaseGenericExercise {
  type: 'sentence_dictation'
  /** The full sentence to transcribe. */
  sentence: string
  /** Remote audio URL if available; fallback to TTS when null. */
  audioUrl: string | null
  /** The target vocabulary word being practiced. */
  targetWord?: string
  /** English meaning/definition of the target word. */
  targetMeaning?: string
}
```

- [ ] **Step 4: Update the generator**

Replace the entire `generateSentenceDictationFromWordBank` function in `lib/exercises/generators/sentence-dictation.ts`:

```typescript
import type { SentenceDictationExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { exerciseId, pick } from '@/lib/exercises/utils'

export function generateSentenceDictationFromWordBank(
  entries: WordBankEntry[],
  count: number
): SentenceDictationExercise[] {
  const usable = entries.filter(e => Boolean(e.example))

  return pick(usable, count).map(entry => ({
    id: exerciseId('sentence_dictation', entry.id, entry.example!),
    type: 'sentence_dictation',
    exerciseType: { domain: 'vocabulary', mode: 'sentence_dictation' },
    sourceRef: { source: 'word_bank', id: entry.id },
    level: entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined,
    sentence: entry.example!,
    audioUrl: entry.audio_url ?? null,
    targetWord: entry.text ?? undefined,
    targetMeaning: entry.meaning ?? undefined,
  }))
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test lib/exercises/generators/__tests__/sentence-dictation
```

Expected: PASS.

- [ ] **Step 6: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/exercises/types.ts lib/exercises/generators/sentence-dictation.ts lib/exercises/generators/__tests__/sentence-dictation.test.ts
git commit -m "feat(exercises): add targetWord/targetMeaning to SentenceDictationExercise"
```

---

## Task 2: Create ExerciseShell component

**Files:**
- Create: `components/exercises/ExerciseShell.tsx`
- Test: `components/exercises/__tests__/ExerciseShell.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/exercises/__tests__/ExerciseShell.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseShell } from '../ExerciseShell'

describe('ExerciseShell', () => {
  const baseProps = {
    title: 'Listen and type',
    result: null,
    onContinue: vi.fn(),
    onSkip: vi.fn(),
    children: <div>exercise content</div>,
  }

  it('renders title eyebrow', () => {
    render(<ExerciseShell {...baseProps} />)
    expect(screen.getByText('Listen and type')).toBeInTheDocument()
  })

  it('renders hint chip when hint provided', () => {
    render(
      <ExerciseShell {...baseProps} hint={{ word: 'idyllic', meaning: 'pleasantly peaceful' }} />
    )
    expect(screen.getByText('idyllic')).toBeInTheDocument()
    expect(screen.getByText('pleasantly peaceful')).toBeInTheDocument()
  })

  it('shows Skip while idle (result null)', () => {
    render(<ExerciseShell {...baseProps} />)
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('shows Continue and hides Skip when result is set', () => {
    render(
      <ExerciseShell
        {...baseProps}
        result={{ isCorrect: true, userAnswer: 'hello', timeMs: 1000 }}
      />
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('calls onSkip when Skip is clicked', () => {
    const onSkip = vi.fn()
    render(<ExerciseShell {...baseProps} onSkip={onSkip} />)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('calls onContinue when Continue is clicked', () => {
    const onContinue = vi.fn()
    render(
      <ExerciseShell
        {...baseProps}
        onContinue={onContinue}
        result={{ isCorrect: false, userAnswer: 'wrong', timeMs: 500 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/exercises/__tests__/ExerciseShell
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ExerciseShell**

Create `components/exercises/ExerciseShell.tsx`:

```tsx
'use client'

// Planned structure:
// <ExerciseShell>
//   <ShellHeader />    — eyebrow title (left) + Skip button (right, idle only)
//   <HintChip />       — word + meaning, always visible when provided
//   [children]         — exercise mechanics
//   <ContinueButton /> — full-width primary, shown after answer

import { cn } from '@/lib/cn'

export interface ExerciseResult {
  isCorrect: boolean
  userAnswer: string
  timeMs: number
}

interface HintShape {
  word: string
  meaning?: string
}

interface ExerciseShellProps {
  title: string
  hint?: HintShape
  result: ExerciseResult | null
  onContinue: () => void
  onSkip: () => void
  children: React.ReactNode
}

export function ExerciseShell({ title, hint, result, onContinue, onSkip, children }: ExerciseShellProps) {
  const done = result !== null

  return (
    <div className="flex w-full flex-col gap-5">
      <ShellHeader title={title} done={done} onSkip={onSkip} />
      {hint && <HintChip word={hint.word} meaning={hint.meaning} />}
      {children}
      {done && <ContinueButton onContinue={onContinue} />}
    </div>
  )
}

function ShellHeader({ title, done, onSkip }: { title: string; done: boolean; onSkip: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-fg-muted">
        {title}
      </p>
      {!done && (
        <button
          type="button"
          onClick={onSkip}
          className="text-[12px] font-medium text-fg-subtle transition-opacity hover:opacity-70 cursor-pointer"
        >
          Skip
        </button>
      )}
    </div>
  )
}

function HintChip({ word, meaning }: { word: string; meaning?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-raised px-3 py-2 text-[13px]">
      <span className="font-semibold text-fg">{word}</span>
      {meaning && (
        <>
          <span className="text-fg-subtle">·</span>
          <span className="italic text-fg-muted">{meaning}</span>
        </>
      )}
    </div>
  )
}

function ContinueButton({ onContinue }: { onContinue: () => void }) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className={cn(
        'w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold',
        'bg-primary text-white shadow-sm transition-all hover:bg-primary/90 cursor-pointer',
      )}
    >
      Continue
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test components/exercises/__tests__/ExerciseShell
```

Expected: PASS.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/exercises/ExerciseShell.tsx components/exercises/__tests__/ExerciseShell.test.tsx
git commit -m "feat(exercises): add ExerciseShell wrapper component"
```

---

## Task 3: Update ExerciseRenderer to use ExerciseShell

**Files:**
- Modify: `components/practice/session/ExerciseRenderer.tsx`

- [ ] **Step 1: Replace ExerciseRenderer**

Replace the entire content of `components/practice/session/ExerciseRenderer.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { SpeakScoredExercise } from '@/components/exercises/SpeakScoredExercise'
import { IdentifyExercise } from '@/components/phoneme-practice/IdentifyExercise'
import { AxSameDifferentExercise } from '@/components/phoneme-practice/AxSameDifferentExercise'
import { OddOneOutExercise } from '@/components/phoneme-practice/OddOneOutExercise'
import { ABXExercise } from '@/components/phoneme-practice/ABXExercise'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { FillBlankExercise } from '@/components/exercises/FillBlankExercise'
import { ReorderWordsExercise } from '@/components/exercises/ReorderWordsExercise'
import { SentenceDictationExercise } from '@/components/exercises/SentenceDictationExercise'
import { SentenceContextExercise } from '@/components/lexicon/SentenceContextExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { ExerciseShell } from '@/components/exercises/ExerciseShell'
import type { ExerciseResult } from '@/components/exercises/ExerciseShell'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type {
  MatchPairsExercise as MatchPairsExerciseType,
  FillBlankExercise as FillBlankExerciseType,
  ReorderWordsExercise as ReorderWordsExerciseType,
  SentenceDictationExercise as SentenceDictationExerciseType,
  SentenceContextExercise as SentenceContextExerciseType,
  MultipleChoiceExercise as MultipleChoiceExerciseType,
} from '@/lib/exercises/types'
import type { PracticeExercise } from '@/lib/practice/types'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

const EXERCISE_TITLES: Record<string, string> = {
  sentence_dictation: 'Listen and type',
  fill_blank: 'Complete the sentence',
  reorder_words: 'Put in order',
  multiple_choice: 'Choose the correct answer',
  sentence_context: 'Choose the best option',
  match_pairs: 'Match the pairs',
}

export function ExerciseRenderer({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const { slug, payload, soundId } = exercise
  const [result, setResult] = useState<ExerciseResult | null>(null)

  useEffect(() => {
    setResult(null)
  }, [exercise.id])

  function handleResult(isCorrect: boolean, userAnswer: string, timeMs: number) {
    setResult({ isCorrect, userAnswer, timeMs })
  }

  function handleContinue() {
    if (!result) return
    onSubmit(result.isCorrect, result.userAnswer)
  }

  function handleSkip() {
    onSubmit(false, 'skip')
  }

  if (payload.kind !== 'generic') {
    return renderPhoneme()
  }

  const title = EXERCISE_TITLES[slug] ?? slug
  const hint = getHint(slug, payload.data)

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      <ExerciseShell
        title={title}
        hint={hint}
        result={result}
        onContinue={handleContinue}
        onSkip={handleSkip}
      >
        {renderGeneric()}
      </ExerciseShell>
    </div>
  )

  function getHint(exerciseSlug: string, data: unknown): { word: string; meaning?: string } | undefined {
    if (exerciseSlug === 'sentence_dictation') {
      const d = data as SentenceDictationExerciseType
      if (d.targetWord) return { word: d.targetWord, meaning: d.targetMeaning }
    }
    if (exerciseSlug === 'fill_blank') {
      const d = data as FillBlankExerciseType
      if (d.hint) return { word: d.hint }
    }
    return undefined
  }

  function renderGeneric() {
    if (slug === 'match_pairs') {
      return (
        <MatchPairsExercise
          exercise={payload.data as MatchPairsExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'fill_blank') {
      return (
        <FillBlankExercise
          exercise={payload.data as FillBlankExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'reorder_words') {
      return (
        <ReorderWordsExercise
          exercise={payload.data as ReorderWordsExerciseType}
          onResult={handleResult}
          focusUi={focusUi}
        />
      )
    }
    if (slug === 'sentence_dictation') {
      return (
        <SentenceDictationExercise
          exercise={payload.data as SentenceDictationExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'sentence_context') {
      return (
        <SentenceContextExercise
          exercise={payload.data as SentenceContextExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'multiple_choice') {
      return (
        <MultipleChoiceExercise
          exercise={payload.data as MultipleChoiceExerciseType}
          onResult={handleResult}
        />
      )
    }
    return <UnsupportedExercise slug={slug} onSkip={handleSkip} />
  }

  function renderPhoneme() {
    const legacy: Exercise = {
      type: slug as Exercise['type'],
      soundId: soundId ?? 0,
      ipa: payload.ipa,
      targetWord: payload.targetWord,
      options: payload.options,
      correctIds: payload.correctIds,
      level: exercise.level,
    }

    const phonemeNode = (() => {
      switch (slug) {
        case 'pick_word':
          return <PickWordExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
        case 'pick_sound':
          return <PickSoundExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'minimal_pair':
          return <MinimalPairExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'dictation':
          return <DictationExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'speak_word':
          return exercise.context === 'daily'
            ? <SpeakScoredExercise exercise={legacy} onSubmit={onSubmit} />
            : <SpeakExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
        case 'identify':
          return <IdentifyExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'ax_same_different':
          return <AxSameDifferentExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'odd_one_out':
          return <OddOneOutExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'abx':
          return <ABXExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        default:
          return <UnsupportedExercise slug={slug} onSkip={handleSkip} />
      }
    })()

    return (
      <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
        {phonemeNode}
        {!focusUi && (
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip exercise"
            className="self-center py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] transition-opacity hover:opacity-70"
          >
            Skip
          </button>
        )}
      </div>
    )
  }
}

function UnsupportedExercise({ slug, onSkip }: { slug: string; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-fg-subtle">
        This exercise type ({slug}) is not yet available here.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium bg-surface-raised text-fg-muted"
      >
        Skip
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: errors on `onResult` prop not existing yet — that's expected, tasks 4–9 fix each component.

- [ ] **Step 3: Commit (even with type errors — they'll be fixed task by task)**

```bash
git add components/practice/session/ExerciseRenderer.tsx
git commit -m "feat(exercises): wire ExerciseShell into ExerciseRenderer with result state"
```

---

## Task 4: Migrate FillBlankExercise to onResult

**Files:**
- Modify: `components/exercises/FillBlankExercise.tsx`

- [ ] **Step 1: Replace Props interface and call site**

In `components/exercises/FillBlankExercise.tsx`, make these changes:

1. Change the `Props` interface:
```tsx
interface Props {
  exercise: FillBlankExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}
```

2. Update the destructured prop in the function signature:
```tsx
export function FillBlankExercise({ exercise, onResult }: Props) {
```

3. In `handlePick`, replace `onSubmit` with `onResult` and add `timeMs`:
```tsx
function handlePick(option: string) {
  if (state !== 'idle') return
  const isCorrect = option === exercise.answer
  setSelected(option)
  setState(isCorrect ? 'correct' : 'wrong')
  onResult(isCorrect, option, Date.now() - startMs.current)
}
```

4. Add `startMs` ref (it's missing from this component — add after the state declarations):
```tsx
const startMs = useRef(Date.now())
```

5. Reset `startMs` in the `useEffect`:
```tsx
useEffect(() => {
  setSelected(null)
  setState('idle')
  setHintLevel(0)
  startMs.current = Date.now()
}, [exercise.id])
```

6. Remove the `FeedbackBar` sub-component and its usage — the shell will show Continue, the options themselves already highlight correct/wrong visually.

Remove this block from the JSX:
```tsx
{state !== 'idle' && (
  <FeedbackBar isCorrect={state === 'correct'} answer={exercise.answer} />
)}
```

And delete the `FeedbackBar` function at the bottom of the file.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: one fewer error (FillBlankExercise now matches `onResult`).

- [ ] **Step 3: Commit**

```bash
git add components/exercises/FillBlankExercise.tsx
git commit -m "feat(exercises): migrate FillBlankExercise to onResult interface"
```

---

## Task 5: Migrate SentenceDictationExercise to onResult

**Files:**
- Modify: `components/exercises/SentenceDictationExercise.tsx`

- [ ] **Step 1: Update Props interface**

In `components/exercises/SentenceDictationExercise.tsx`:

1. Change `Props`:
```tsx
interface Props {
  exercise: SentenceDictationExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}
```

2. Update function signature:
```tsx
export function SentenceDictationExercise({ exercise, onResult }: Props) {
```

3. In `handleSubmit`, replace `onSubmit` with `onResult`:
```tsx
function handleSubmit() {
  if (state !== 'idle' || !input.trim()) return
  const isCorrect = normalize(input) === normalize(exercise.sentence)
  setState(isCorrect ? 'correct' : 'wrong')
  onResult(isCorrect, input.trim(), Date.now() - startMs.current)
}
```

4. Remove `FeedbackBar` from the JSX return and delete the `FeedbackBar` sub-component. The shell's Continue button replaces it. The `done` state still disables the textarea.

Remove from JSX:
```tsx
{done && (
  <FeedbackBar isCorrect={state === 'correct'} sentence={exercise.sentence} />
)}
```

Delete the `FeedbackBar` function.

5. Also remove `SubmitButton` from the JSX and delete the sub-component — the shell handles Continue:
```tsx
{!done && (
  <SubmitButton disabled={!input.trim()} onSubmit={handleSubmit} />
)}
```

Keep `handleSubmit` triggerable via Enter key only (the `onKeyDown` handler stays). But we still need a visible "Check" button while idle. Keep `SubmitButton` but rename the prop and wire it:

Actually — keep `SubmitButton` as-is (it's the "Check answer" button while typing, before submitting). Remove only `FeedbackBar`. The shell's Continue appears after `onResult` is called.

Final JSX structure:
```tsx
return (
  <div className="flex w-full flex-col gap-5">
    <PlayButton isPlaying={isPlaying} onPlay={handlePlay} />
    <AnswerInput
      value={input}
      disabled={done}
      onChange={setInput}
      onKeyDown={handleKeyDown}
    />
    {!done && (
      <SubmitButton disabled={!input.trim()} onSubmit={handleSubmit} />
    )}
  </div>
)
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: one fewer error.

- [ ] **Step 3: Commit**

```bash
git add components/exercises/SentenceDictationExercise.tsx
git commit -m "feat(exercises): migrate SentenceDictationExercise to onResult interface"
```

---

## Task 6: Migrate ReorderWordsExercise to onResult

**Files:**
- Modify: `components/exercises/ReorderWordsExercise.tsx`

- [ ] **Step 1: Update Props and handleCheck**

In `components/exercises/ReorderWordsExercise.tsx`:

1. Change `Props`:
```tsx
interface Props {
  exercise: ReorderWordsExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
  focusUi?: boolean
}
```

2. Add `startMs` ref after state declarations:
```tsx
const startMs = useRef(Date.now())
```

Add `useRef` to the import if not already present.

3. Reset in `useEffect`:
```tsx
useEffect(() => {
  setBank(makeChips(exercise.tokens))
  setAnswer([])
  setState('idle')
  startMs.current = Date.now()
}, [exercise.id, exercise.tokens])
```

4. Update `handleCheck` (non-focusUi path only — focusUi still calls `onSubmit`... but we're removing `onSubmit` entirely, so update both):
```tsx
function handleCheck() {
  if (state !== 'idle' || answer.length === 0) return
  const userAnswer = answer.map((c) => c.word).join(' ')
  const isCorrect = userAnswer === exercise.sentence
  setState(isCorrect ? 'correct' : 'wrong')
  onResult(isCorrect, userAnswer, Date.now() - startMs.current)
}
```

5. In the non-focusUi JSX, remove `FeedbackBar` and its usage:
```tsx
{state !== 'idle' && (
  <FeedbackBar isCorrect={state === 'correct'} sentence={exercise.sentence} />
)}
```

Keep the "Check" button (it's used before submitting to lock in the answer). Remove only `FeedbackBar`. Delete the `FeedbackBar` function.

6. In the `focusUi` JSX, the `pf-answer-note` paragraph stays (it's inside the phoneme shell, not `ExerciseShell`). Keep as-is.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: one fewer error.

- [ ] **Step 3: Commit**

```bash
git add components/exercises/ReorderWordsExercise.tsx
git commit -m "feat(exercises): migrate ReorderWordsExercise to onResult interface"
```

---

## Task 7: Migrate MultipleChoiceExercise to onResult

**Files:**
- Modify: `components/exercises/MultipleChoiceExercise.tsx`

- [ ] **Step 1: Update Props and handleSelect**

In `components/exercises/MultipleChoiceExercise.tsx`:

1. Change `Props`:
```tsx
interface Props {
  exercise: MultipleChoiceExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}
```

2. Add `startMs` ref:
```tsx
const startMs = useRef(Date.now())
```

3. Reset in `useEffect`:
```tsx
useEffect(() => {
  setSelected(null)
  setState('idle')
  startMs.current = Date.now()
}, [exercise.id])
```

4. Update `handleSelect` — remove the `setTimeout` (the shell's Continue button now controls advancement):
```tsx
function handleSelect(idx: number) {
  if (state !== 'idle') return
  const isCorrect = idx === exercise.answerIndex
  setSelected(idx)
  setState(isCorrect ? 'correct' : 'wrong')
  onResult(isCorrect, exercise.options[idx], Date.now() - startMs.current)
}
```

5. The explanation paragraph stays — it's feedback content, not a footer button. No removal needed.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: one fewer error.

- [ ] **Step 3: Commit**

```bash
git add components/exercises/MultipleChoiceExercise.tsx
git commit -m "feat(exercises): migrate MultipleChoiceExercise to onResult interface"
```

---

## Task 8: Migrate SentenceContextExercise to onResult

**Files:**
- Modify: `components/lexicon/SentenceContextExercise.tsx`

- [ ] **Step 1: Update Props and handleConfirm**

In `components/lexicon/SentenceContextExercise.tsx`:

1. Change `Props`:
```tsx
interface Props {
  exercise: SentenceContextExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}
```

2. Update function signature:
```tsx
export function SentenceContextExercise({ exercise, onResult }: Props) {
```

3. Update `handleConfirm`:
```tsx
function handleConfirm() {
  if (!selected || phase !== 'selecting') return
  const selectedOption = exercise.options.find((o) => o.id === selected)
  const correct = selectedOption?.word === exercise.answer
  setIsCorrect(correct)
  setPhase('feedback')
  onResult(correct, selectedOption?.word ?? '', Date.now() - startMs.current)
}
```

4. `FeedbackPanel` stays in the JSX — it shows the full sentence + definition, which is valuable post-answer context. It's not a footer button. `ConfirmBar` also stays (it's the "Confirm" button while selecting, analogous to "Check" in other exercises). No removals needed.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: one fewer error.

- [ ] **Step 3: Commit**

```bash
git add components/lexicon/SentenceContextExercise.tsx
git commit -m "feat(exercises): migrate SentenceContextExercise to onResult interface"
```

---

## Task 9: Migrate MatchPairsExercise to onResult

**Files:**
- Modify: `components/exercises/MatchPairsExercise.tsx`

- [ ] **Step 1: Update Props and handleCheck**

In `components/exercises/MatchPairsExercise.tsx`:

1. Change `Props`:
```tsx
interface Props {
  exercise: MatchPairsExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
}
```

2. Add `startMs` ref after existing refs:
```tsx
const startMs = useRef(Date.now())
```

3. Add `useEffect` to reset `startMs` on exercise change (add after the existing `useIsoLayoutEffect`):
```tsx
useEffect(() => {
  startMs.current = Date.now()
}, [exercise.id])
```

4. Update `handleCheck`:
```tsx
function handleCheck() {
  if (submitted) return
  const newResults: MatchResult = {}
  let allCorrect = true
  for (const pair of exercise.pairs) {
    const correct = matches[pair.id] === pair.id
    newResults[pair.id] = correct ? 'correct' : 'wrong'
    if (!correct) allCorrect = false
  }
  setResults(newResults)
  setSubmitted(true)
  onResult(allCorrect, JSON.stringify(matches), Date.now() - startMs.current)
}
```

5. The "Check" button in the JSX stays — it's the submit trigger, not a footer Continue. The shell provides Continue after `onResult` fires. No removal needed.

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors remaining.

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: all passing (or same failures as before this feature branch).

- [ ] **Step 4: Commit**

```bash
git add components/exercises/MatchPairsExercise.tsx
git commit -m "feat(exercises): migrate MatchPairsExercise to onResult interface"
```

---

## Task 10: Create ExitConfirmSheet and wire into SessionExercisingBody

**Files:**
- Create: `components/exercises/ExitConfirmSheet.tsx`
- Modify: `components/practice/session/SessionExercisingBody.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/exercises/__tests__/ExitConfirmSheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExitConfirmSheet } from '../ExitConfirmSheet'

describe('ExitConfirmSheet', () => {
  it('renders when open', () => {
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Quit this session?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep practicing/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ExitConfirmSheet open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.queryByText('Quit this session?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when End session is clicked', () => {
    const onConfirm = vi.fn()
    render(<ExitConfirmSheet open onConfirm={onConfirm} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Keep practicing is clicked', () => {
    const onCancel = vi.fn()
    render(<ExitConfirmSheet open={false} onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.queryByRole('button', { name: /keep practicing/i }) ?? document.body)
    // sheet is closed, button not rendered — cancel via backdrop instead
    render(<ExitConfirmSheet open onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /keep practicing/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/exercises/__tests__/ExitConfirmSheet
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ExitConfirmSheet**

Create `components/exercises/ExitConfirmSheet.tsx`:

```tsx
'use client'

// Planned structure:
// <ExitConfirmSheet>
//   <Backdrop />    — fixed overlay, click cancels
//   <Sheet />       — bottom panel with title, subtitle, two buttons

interface ExitConfirmSheetProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ExitConfirmSheet({ open, onConfirm, onCancel }: ExitConfirmSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Keep practicing"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 cursor-default"
      />
      <div className="relative z-10 rounded-t-[var(--radius-xl)] bg-surface px-6 pb-10 pt-6 shadow-xl flex flex-col gap-4">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-border-subtle" />
        <h2 className="text-[18px] font-bold text-fg">Quit this session?</h2>
        <p className="text-[14px] text-fg-muted leading-snug">
          You&apos;ll lose your progress in this session.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold bg-error text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          End session
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold bg-surface-raised text-fg transition-opacity hover:opacity-80 cursor-pointer"
        >
          Keep practicing
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test components/exercises/__tests__/ExitConfirmSheet
```

Expected: PASS.

- [ ] **Step 5: Wire ExitConfirmSheet into SessionExercisingBody**

In `components/practice/session/SessionExercisingBody.tsx`:

1. Add import at top:
```tsx
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
```

2. Add `useState` to the React import (if not already imported).

3. Add state inside `SessionExercisingBody`:
```tsx
const [showExitConfirm, setShowExitConfirm] = useState(false)
```

4. The current `onExit` in `handlers` is what `PhonemeFocusShell` and the plain-layout X button call. Intercept it by wrapping it. Find where `onExit` is passed down and replace with:

In the `PhonemeFocusShell` call, change:
```tsx
onExit={() => onExit(buildPartialResult(results))}
```
to:
```tsx
onExit={() => setShowExitConfirm(true)}
```

5. Add `ExitConfirmSheet` as the last child in both branches of the return (before closing tags):

In the `focusUi` branch, add inside `<PhonemeFocusShell>` (or just after closing tag, as a sibling rendered outside):

Actually render it as a sibling after the shell since it's a fixed overlay:
```tsx
if (focusUi && displayBadge) {
  return (
    <>
      <PhonemeFocusShell
        badge={displayBadge}
        progressPct={progressPct}
        onExit={() => setShowExitConfirm(true)}
        ...
      >
        {sessionBody}
      </PhonemeFocusShell>
      <ExitConfirmSheet
        open={showExitConfirm}
        onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </>
  )
}
```

For the plain layout return:
```tsx
return (
  <>
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">{sessionBody}</div>
    <ExitConfirmSheet
      open={showExitConfirm}
      onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
      onCancel={() => setShowExitConfirm(false)}
    />
  </>
)
```

6. Find any plain-layout X / close button that directly calls `onExit` and replace it with `() => setShowExitConfirm(true)`. Check `SessionLoadingShell` and `SessionProgress` — if the X is in `SessionProgress`, update that call site too:

```bash
grep -n "onExit" components/practice/session/SessionExercisingBody.tsx
```

Update all remaining direct `onExit(...)` calls in this file to go through `setShowExitConfirm(true)` (except the one inside the sheet confirm handler).

- [ ] **Step 6: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
pnpm test
```

Expected: all passing.

- [ ] **Step 8: Commit**

```bash
git add components/exercises/ExitConfirmSheet.tsx components/exercises/__tests__/ExitConfirmSheet.test.tsx components/practice/session/SessionExercisingBody.tsx
git commit -m "feat(exercises): add ExitConfirmSheet and wire into all session types"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full type-check and test run**

```bash
pnpm type-check && pnpm test
```

Expected: no type errors, all tests pass.

- [ ] **Step 2: Start dev server and manually verify each exercise type**

```bash
pnpm dev
```

Check:
- `fill_blank`: title "Complete the sentence" shows top-left; Skip top-right; options highlight on pick; Continue appears; no "option1/option2" placeholders.
- `sentence_dictation`: title "Listen and type"; hint chip with word + meaning visible above Play button; Check answer button active after typing; Continue after submit.
- `reorder_words`: title "Put in order"; Skip visible; Continue after Check.
- `multiple_choice`: title "Choose the correct answer"; Continue after picking.
- `sentence_context`: title "Choose the best option"; Continue after Confirm.
- `match_pairs`: title "Match the pairs"; Continue after Check.
- All sessions: X button shows ExitConfirmSheet with "End session" (red) + "Keep practicing".
- Phoneme exercises (focusUi): unchanged behavior, ExitConfirmSheet on X.

- [ ] **Step 3: Final commit if any minor fixes applied**

```bash
git add -p
git commit -m "fix(exercises): post-verification tweaks"
```
