# Quiz & Exercise Interactivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make quiz options clickable with immediate correct/wrong feedback and a score summary, and add check-off interactivity to exercise items.

**Architecture:** `MiniLessonQuiz` is rewritten to replace the reveal-button pattern with selectable option buttons and auto-expanded explanations. A new `ExerciseBlock` client component isolates check-off state from the Server Component page. All new visual states are CSS classes using existing semantic tokens — no inline styles.

**Tech Stack:** React 19, Next.js 15 App Router, Vitest + Testing Library, CSS custom properties (existing token system)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/mini-lessons/MiniLessonQuiz.tsx` | Rewrite | Quiz selection state, feedback, score |
| `components/mini-lessons/ExerciseBlock.tsx` | Create | Check-off state per exercise block |
| `app/mini-lessons/[slug]/page.tsx` | Modify | Replace exercise `div` + `ol` with `<ExerciseBlock>` |
| `app/styles/mini-lessons.css` | Modify | New classes: option states, score, check-off |
| `components/mini-lessons/__tests__/MiniLessonQuiz.test.tsx` | Create | Quiz interaction tests |
| `components/mini-lessons/__tests__/ExerciseBlock.test.tsx` | Create | Check-off interaction tests |

---

## Task 1: CSS — quiz option states

**Files:**
- Modify: `app/styles/mini-lessons.css`

- [ ] **Step 1: Add option button base styles and all state variants**

Find the `/* Exercise / quiz blocks */` comment block in `mini-lessons.css` and add after `.mini-lessons__list` rule:

```css
/* ── Quiz option buttons ──────────────────────────────────────────────────── */

.mini-lessons__quiz-options {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-lessons__quiz-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--ml-radius-sm);
  border: 1px solid var(--border-default);
  background: var(--surface-sunken);
  font-size: 0.9rem;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    opacity 200ms ease-out;
}

.mini-lessons__quiz-option:hover:not([aria-disabled="true"]) {
  background: var(--surface-raised);
  border-color: var(--border-strong);
}

.mini-lessons__quiz-option:focus-visible {
  outline: 2px solid var(--focus-ring, var(--primary));
  outline-offset: 2px;
}

.mini-lessons__quiz-option--correct {
  background: var(--success-soft);
  border-color: var(--success-border);
  color: var(--text-primary);
}

.mini-lessons__quiz-option--wrong {
  background: var(--error-soft);
  border-color: var(--error-border);
  color: var(--text-primary);
}

.mini-lessons__quiz-option--dimmed {
  opacity: 0.45;
  pointer-events: none;
}

/* ── Quiz score summary ───────────────────────────────────────────────────── */

.mini-lessons__quiz-score {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: var(--ml-radius-sm);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  font-weight: 600;
  animation: ml-score-in 250ms ease-out 200ms both;
}

.mini-lessons__quiz-score--good {
  background: var(--success-soft);
  border-color: var(--success-border);
  color: var(--success-value);
}

.mini-lessons__quiz-score--mid {
  background: var(--warning-soft);
  border-color: var(--warning-border);
  color: var(--warning-value);
}

.mini-lessons__quiz-score--low {
  background: var(--error-soft);
  border-color: var(--error-border);
  color: var(--error-value);
}

@keyframes ml-score-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Exercise check-off ───────────────────────────────────────────────────── */

.mini-lessons__exercise-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: opacity 150ms ease-out;
}

.mini-lessons__exercise-item:last-child {
  border-bottom: none;
}

.mini-lessons__exercise-item:focus-visible {
  outline: 2px solid var(--focus-ring, var(--primary));
  outline-offset: 2px;
  border-radius: 3px;
}

.mini-lessons__exercise-item--checked {
  opacity: 0.5;
}

.mini-lessons__exercise-item--checked .mini-lessons__exercise-text {
  text-decoration: line-through;
}

.mini-lessons__exercise-marker {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  position: relative;
}

.mini-lessons__exercise-number {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.mini-lessons__exercise-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
  color: var(--success-value);
}

.mini-lessons__exercise-item--checked .mini-lessons__exercise-number {
  opacity: 0;
  transform: scale(0);
}

.mini-lessons__exercise-item--checked .mini-lessons__exercise-check {
  opacity: 1;
  transform: scale(1);
}

.mini-lessons__exercise-text {
  flex: 1;
  line-height: 1.5;
}

.mini-lessons__exercise-list {
  display: flex;
  flex-direction: column;
}

@media (prefers-reduced-motion: reduce) {
  .mini-lessons__quiz-option,
  .mini-lessons__quiz-score,
  .mini-lessons__exercise-item,
  .mini-lessons__exercise-number,
  .mini-lessons__exercise-check {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
  }
}
```

- [ ] **Step 2: Verify no existing token names are wrong**

Check that `--success-border`, `--error-border`, `--warning-border` exist:

```bash
grep -n "success-border\|error-border\|warning-border" "d:/proyectos/english-journal/app/styles/tokens.css"
```

Expected output includes lines defining each. If any is missing, use `--success` / `--error` / `--warning` as the border-color fallback instead.

- [ ] **Step 3: Commit**

```bash
git add app/styles/mini-lessons.css
git commit -m "style(mini-lessons): add quiz option, score, and exercise check-off CSS"
```

---

## Task 2: Rewrite MiniLessonQuiz

**Files:**
- Modify: `components/mini-lessons/MiniLessonQuiz.tsx`

- [ ] **Step 1: Write the failing tests first**

Create `components/mini-lessons/__tests__/MiniLessonQuiz.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MiniLessonQuiz from '../MiniLessonQuiz'

const questions = [
  {
    question: 'Which vowel sound is in "ship"?',
    options: ['/iː/', '/ɪ/', '/e/', '/æ/'],
    correct: 1,
    explanation: 'The short /ɪ/ sound appears in "ship", "hit", "bin".',
  },
  {
    question: 'Which word rhymes with "beat"?',
    options: ['bit', 'bat', 'feet', 'but'],
    correct: 2,
    explanation: '"Feet" shares the /iː/ sound with "beat".',
  },
]

describe('MiniLessonQuiz', () => {
  it('renders all questions and their options as buttons', () => {
    render(<MiniLessonQuiz questions={questions} />)
    expect(screen.getByText('1. Which vowel sound is in "ship"?')).toBeInTheDocument()
    expect(screen.getByText('2. Which word rhymes with "beat"?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A.*\/iː\// })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /B.*\/ɪ\// })).toBeInTheDocument()
  })

  it('does not show explanation before selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    expect(screen.queryByText('The short /ɪ/ sound appears')).not.toBeInTheDocument()
  })

  it('marks correct option green and shows explanation on correct selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const correctBtn = screen.getByRole('button', { name: /B.*\/ɪ\// })
    fireEvent.click(correctBtn)
    expect(correctBtn.className).toContain('--correct')
    expect(screen.getByText('The short /ɪ/ sound appears in "ship", "hit", "bin".')).toBeInTheDocument()
  })

  it('marks selected wrong and correct green on wrong selection', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const wrongBtn = screen.getByRole('button', { name: /A.*\/iː\// })
    fireEvent.click(wrongBtn)
    expect(wrongBtn.className).toContain('--wrong')
    const correctBtn = screen.getByRole('button', { name: /B.*\/ɪ\// })
    expect(correctBtn.className).toContain('--correct')
  })

  it('locks question after selection — clicking another option does nothing', () => {
    render(<MiniLessonQuiz questions={questions} />)
    const firstBtn = screen.getByRole('button', { name: /A.*\/iː\// })
    fireEvent.click(firstBtn)
    const secondBtn = screen.getByRole('button', { name: /C.*\/e\// })
    fireEvent.click(secondBtn)
    expect(firstBtn.className).toContain('--wrong')
    expect(secondBtn.className).not.toContain('--correct')
    expect(secondBtn.className).not.toContain('--wrong')
  })

  it('does not show score until all questions answered', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows score summary after all questions answered', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    fireEvent.click(screen.getByRole('button', { name: /C.*feet/ }))
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.textContent).toMatch(/2\s*\/\s*2/)
  })

  it('sets aria-disabled on all options after answering', () => {
    render(<MiniLessonQuiz questions={questions} />)
    fireEvent.click(screen.getByRole('button', { name: /B.*\/ɪ\// }))
    const allOptions = screen.getAllByRole('button', { name: /^[ABCD]/ }).slice(0, 4)
    allOptions.forEach(btn => {
      expect(btn).toHaveAttribute('aria-disabled', 'true')
    })
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
pnpm test components/mini-lessons/__tests__/MiniLessonQuiz.test.tsx
```

Expected: multiple failures (MiniLessonQuiz still has old implementation).

- [ ] **Step 3: Rewrite MiniLessonQuiz.tsx**

Replace the entire file content:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
}

function scoreClass(correct: number, total: number): string {
  const pct = correct / total;
  if (pct >= 0.7) return "mini-lessons__quiz-score--good";
  if (pct >= 0.5) return "mini-lessons__quiz-score--mid";
  return "mini-lessons__quiz-score--low";
}

export default function MiniLessonQuiz({ questions }: Props) {
  const [selected, setSelected] = useState<Record<number, number>>({});

  function choose(questionIdx: number, optionIdx: number) {
    if (selected[questionIdx] !== undefined) return;
    setSelected((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  }

  const answeredCount = Object.keys(selected).length;
  const allAnswered = answeredCount === questions.length;
  const correctCount = questions.filter(
    (q, i) => selected[i] === q.correct
  ).length;

  return (
    <div className="mini-lessons__quiz">
      {questions.map((q, qIdx) => {
        const chosen = selected[qIdx];
        const isAnswered = chosen !== undefined;

        return (
          <div key={qIdx} className="mini-lessons__block">
            <p className="mini-lessons__block-label">
              {qIdx + 1}. {q.question}
            </p>

            <ul className="mini-lessons__quiz-options">
              {q.options.map((option, oIdx) => {
                const isCorrect = oIdx === q.correct;
                const isChosen = oIdx === chosen;
                const isDimmed = isAnswered && !isChosen && !isCorrect;

                const optionClass = cn(
                  "mini-lessons__quiz-option",
                  isAnswered && isCorrect && "mini-lessons__quiz-option--correct",
                  isAnswered && isChosen && !isCorrect && "mini-lessons__quiz-option--wrong",
                  isDimmed && "mini-lessons__quiz-option--dimmed"
                );

                const letter = String.fromCharCode(65 + oIdx);
                const ariaLabel = isAnswered && isCorrect
                  ? `${letter} ${option} — correct answer`
                  : `${letter} ${option}`;

                return (
                  <li key={oIdx}>
                    <button
                      type="button"
                      className={optionClass}
                      onClick={() => choose(qIdx, oIdx)}
                      aria-disabled={isAnswered ? "true" : undefined}
                      aria-pressed={isChosen}
                      aria-label={ariaLabel}
                    >
                      <span className="mini-lessons__quiz-letter" aria-hidden>
                        {letter}
                      </span>
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div
              className={cn(
                "mini-lessons__quiz-answer-wrap",
                isAnswered && "mini-lessons__quiz-answer-wrap--open"
              )}
              aria-hidden={!isAnswered}
            >
              <div className="mini-lessons__quiz-answer">
                <p>
                  <strong>Answer: {String.fromCharCode(65 + q.correct)}</strong>
                </p>
                <p>{q.explanation}</p>
              </div>
            </div>
          </div>
        );
      })}

      {allAnswered && (
        <div
          role="status"
          className={cn("mini-lessons__quiz-score", scoreClass(correctCount, questions.length))}
        >
          {correctCount} / {questions.length} correct
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
pnpm test components/mini-lessons/__tests__/MiniLessonQuiz.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/mini-lessons/MiniLessonQuiz.tsx components/mini-lessons/__tests__/MiniLessonQuiz.test.tsx
git commit -m "feat(mini-lessons): rewrite MiniLessonQuiz with selectable options and score"
```

---

## Task 3: Create ExerciseBlock component

**Files:**
- Create: `components/mini-lessons/ExerciseBlock.tsx`
- Create: `components/mini-lessons/__tests__/ExerciseBlock.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/mini-lessons/__tests__/ExerciseBlock.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseBlock from '../ExerciseBlock'

const props = {
  instruction: 'Read these sentences aloud:',
  items: ['The ship sank slowly.', 'She sells seashells.', 'How much wood would a woodchuck chuck?'],
}

describe('ExerciseBlock', () => {
  it('renders instruction and all items', () => {
    render(<ExerciseBlock {...props} />)
    expect(screen.getByText('Read these sentences aloud:')).toBeInTheDocument()
    expect(screen.getByText('The ship sank slowly.')).toBeInTheDocument()
    expect(screen.getByText('She sells seashells.')).toBeInTheDocument()
  })

  it('renders items as buttons with numbered markers', () => {
    render(<ExerciseBlock {...props} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks item as checked on click', () => {
    render(<ExerciseBlock {...props} />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    expect(btn.className).toContain('--checked')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('unchecks item on second click', () => {
    render(<ExerciseBlock {...props} />)
    const btn = screen.getAllByRole('button')[0]
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn.className).not.toContain('--checked')
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('checking one item does not affect others', () => {
    render(<ExerciseBlock {...props} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(buttons[1].className).not.toContain('--checked')
    expect(buttons[2].className).not.toContain('--checked')
  })
})
```

- [ ] **Step 2: Run tests — expect them to fail**

```bash
pnpm test components/mini-lessons/__tests__/ExerciseBlock.test.tsx
```

Expected: fail with "Cannot find module '../ExerciseBlock'".

- [ ] **Step 3: Create ExerciseBlock.tsx**

Create `components/mini-lessons/ExerciseBlock.tsx`:

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ExerciseBlockProps {
  instruction: string;
  items: string[];
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ExerciseBlock({ instruction, items }: ExerciseBlockProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  function toggle(idx: number) {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <div className="mini-lessons__block">
      <p className="mini-lessons__block-label">{instruction}</p>
      <div className="mini-lessons__exercise-list">
        {items.map((item, idx) => {
          const isChecked = checked[idx] ?? false;
          return (
            <button
              key={idx}
              type="button"
              className={cn(
                "mini-lessons__exercise-item",
                isChecked && "mini-lessons__exercise-item--checked"
              )}
              onClick={() => toggle(idx)}
              aria-pressed={isChecked}
            >
              <span className="mini-lessons__exercise-marker" aria-hidden>
                <span className="mini-lessons__exercise-number">
                  {idx + 1}
                </span>
                <span className="mini-lessons__exercise-check">
                  <CheckIcon />
                </span>
              </span>
              <span className="mini-lessons__exercise-text">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
pnpm test components/mini-lessons/__tests__/ExerciseBlock.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/mini-lessons/ExerciseBlock.tsx components/mini-lessons/__tests__/ExerciseBlock.test.tsx
git commit -m "feat(mini-lessons): add ExerciseBlock with check-off interactivity"
```

---

## Task 4: Wire ExerciseBlock into the detail page

**Files:**
- Modify: `app/mini-lessons/[slug]/page.tsx`

- [ ] **Step 1: Add import and replace exercise rendering**

In `app/mini-lessons/[slug]/page.tsx`, add the import after the existing imports:

```tsx
import ExerciseBlock from "@/components/mini-lessons/ExerciseBlock";
```

Then replace the exercises section (the block that renders `content.exercises`):

```tsx
{content.exercises.length > 0 && (
  <section className="mini-lessons__section">
    <h2 className="mini-lessons__section-title">Exercises</h2>
    {content.exercises.map((exercise, idx) => (
      <ExerciseBlock
        key={idx}
        instruction={exercise.instruction}
        items={exercise.items}
      />
    ))}
  </section>
)}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Run all mini-lessons tests**

```bash
pnpm test components/mini-lessons
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/mini-lessons/[slug]/page.tsx
git commit -m "feat(mini-lessons): wire ExerciseBlock into detail page"
```

---

## Task 5: Verify full test suite and token check

**Files:** none modified

- [ ] **Step 1: Confirm token names resolve**

```bash
grep "success-border\|error-border\|warning-border" "d:/proyectos/english-journal/app/styles/tokens.css"
```

If any are missing (e.g. `--warning-border` not defined), open `mini-lessons.css` and replace the missing token reference with its fallback. For example if `--warning-border` is absent, replace `var(--warning-border)` with `var(--warning)` in `.mini-lessons__quiz-score--mid`.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass. If any unrelated tests fail, check if they pre-existed with `git stash && pnpm test && git stash pop`.

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Final commit if any token fixes were needed**

```bash
git add app/styles/mini-lessons.css
git commit -m "fix(mini-lessons): correct semantic token references in quiz score CSS"
```

Only run this step if Step 1 required fixes.
