# Save the Coach's Full Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the AI Coach flag a turn as a teachable concept so the learner can save the whole explanation (not just a word) into "Mi inglés" under a new **Explicaciones** filter and under **Del coach**.

**Architecture:** The coach adds an optional `concept: { title }` to its existing `annotate_turn` tool call. `AIBubble` shows a "+ Guardar explicación" chip when that flag is present; tapping it persists the message's rendered prose as a `tracked_items` row with the new `kind = "explanation"`, tagged `payload.source = "ai_coach"`. Storage reuses the existing outbox sync and RLS — only a one-line CHECK-constraint migration is new. The explanation is reference-only and is explicitly excluded from the review queue.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie.js (IndexedDB), Supabase (Postgres + RLS), Vitest + @testing-library/react, Tailwind v4 with CSS-custom-property design tokens.

---

## Background for the implementing engineer

**Read these files before starting — they are the ground truth for existing patterns:**

- `lib/ai-practice/tools/registry.ts` — validates tool calls that come back from Gemini. Note `parseTurnCorrection` (lines ~213-232): a *malformed* annotation must **never throw** — it returns `undefined` and the turn's prose still renders. `parseTurnConcept` follows this exact pattern.
- `lib/ai-practice/tools/declarations.ts` — the function-calling contract sent *to* Gemini. `annotate_turn` is at the bottom.
- `lib/ai-practice/correction.ts` — `extractTurnCorrection` / `extractTurnSaveables` pull data out of a model turn's tool calls. `extractTurnConcept` is a third sibling.
- `lib/ai-coach/saveables/persist.ts` — routes a saved item to the right store. `persistSaveable` handles `word` → word_bank and `phrase` → tracked_items. `persistConcept` is added here.
- `lib/ai-coach/saveables/source.ts` — `AI_COACH_SOURCE = "ai_coach"`; `isFromCoach(row)` checks `row.payload?.source === AI_COACH_SOURCE`. No change needed — an explanation row already matches.
- `lib/tracking/queries.ts` — `saveTrackedItem` / `removeTrackedItem` write to Dexie + enqueue an outbox op. Upsert key is `[userId + kind + ref]`.
- `lib/tracking/types.ts` — `TrackedKind`, `PersistedTrackedKind`, `TrackingFilter`.
- `lib/tracking/review-queue.ts` — `buildTrackingReviewQueue`. **Careful:** after the `word` and `phrase` branches, anything else falls through and is treated as a **lesson**. An `explanation` must be `continue`d *before* that fall-through.
- `hooks/useTracking.ts` — builds `TrackingReviewSource[]` from words + tracked items for the "Mi inglés" page.
- `components/ai-coach/SaveChips.tsx` — the existing per-item chip with `idle → saving → saved → error` states. `SaveConceptChip` mirrors its look and state machine.
- `components/ai-coach/chat/AIBubble.tsx` — renders one model message. Computes `fullText` and `proseBody`; already calls `extractTurnSaveables` and renders `<SaveChips>`.
- Prop chain for the save callback: `useSavedWords` → `useAIPractice` → `AICoachPanel` → `AICoachPanelViews` → `ChatView` → `MessageBubble` → `AIBubble`. `ChatView` is *also* rendered by `components/ai-coach/missions/MissionWorkspace.tsx`.

**Commands:**

```bash
pnpm test <path>       # run one Vitest file
pnpm type-check        # tsc --noEmit
pnpm lint              # eslint
```

**Conventions:**

- Absolute imports from `@/`.
- Tailwind utility classes only, design tokens only (no hardcoded colors/spacing). Use `cn()` for conditional classes.
- No component over 250 lines; ESLint warns at 300.
- Spanish user-facing copy (this is an English-learning app for Spanish speakers).
- Test files live in `__tests__/` subdirs next to the source. React component tests start with `// @vitest-environment jsdom`.

---

## File Structure

### New files

| File | Responsibility |
| - | - |
| `supabase/migrations/<timestamp>_tracked_items_allow_explanation.sql` | Widen the `tracked_items.kind` CHECK constraint to allow `'explanation'`. |
| `components/ai-coach/SaveConceptChip.tsx` | One button that saves the coach's explanation; `idle → saving → saved → error` state machine. |
| `components/ai-coach/__tests__/SaveConceptChip.test.tsx` | Unit tests for the chip. |
| `components/tracking/DeleteExplanationDialog.tsx` | Confirm dialog for deleting a saved explanation (parallels `DeleteWordDialog`). |

### Modified files

| File | Change |
| - | - |
| `lib/tracking/types.ts` | Add `"explanation"` to `TrackedKind`; update the `TrackingFilter` doc-comment. |
| `lib/ai-practice/tools/registry.ts` | `TurnConcept` type, `AnnotateTurnArgs.concept`, `parseTurnConcept`, wire into `parseToolArgs`. |
| `lib/ai-practice/tools/declarations.ts` | Add `concept` property to the `annotate_turn` declaration. |
| `lib/ai-practice/correction.ts` | Add `extractTurnConcept`. |
| `lib/ai-practice/__tests__/registry.test.ts` | Update two exact-match assertions; add `concept` tests. |
| `lib/ai-practice/__tests__/correction.test.ts` | Add `extractTurnConcept` tests. |
| `lib/ai-prompts.ts` | One line in the coach guidance about `annotate_turn`. |
| `lib/ai-coach/saveables/persist.ts` | Add `slug()` + `persistConcept()`. |
| `lib/ai-coach/saveables/__tests__/persist.test.ts` | Add `persistConcept` tests. |
| `hooks/useSavedWords.ts` | Add `saveConcept` callback. |
| `hooks/useAIPractice.ts` | Re-export `saveConcept`; add to return type. |
| `components/ai-coach/AICoachPanel.tsx` | Pull `saveConcept` from the hook; pass into `renderActiveChat`. |
| `components/ai-coach/AICoachPanelViews.tsx` | Add `saveConcept` to `RenderActiveChatParams`; forward as `onSaveConcept`. |
| `components/ai-coach/ChatView.tsx` | Add optional `onSaveConcept`; forward to `MessageBubble`. |
| `components/ai-coach/MessageBubble.tsx` | Add optional `onSaveConcept`; forward to `AIBubble`. |
| `components/ai-coach/chat/AIBubble.tsx` | `extractTurnConcept`; render `<SaveConceptChip>` when a concept is present. |
| `hooks/useTracking.ts` | Render `explanation` items (body as `description`, no progress badge). |
| `components/tracking/TrackingToolbar.tsx` | Add the `explanation` filter chip. |
| `components/tracking/TrackingCard.tsx` | `explanation` registry entry + render branch + delete button. |
| `components/tracking/TrackingClient.tsx` | Delete-explanation state + dialog wiring. |
| `components/tracking/TrackingEmptyState.tsx` | Empty state for the `explanation` filter. |
| `lib/tracking/review-queue.ts` | Skip `explanation` before the lesson fall-through. |

---

## Task 1: Widen the `tracked_items.kind` constraint (migration)

**Files:**
- Create: `supabase/migrations/<timestamp>_tracked_items_allow_explanation.sql`

- [ ] **Step 1: Find the next migration timestamp**

Run: `ls supabase/migrations/ | tail -5`
Take the format from the newest filename (`YYYYMMDDHHMMSS_name.sql`). Use a timestamp later than the newest one, e.g. today's date + a time.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/<timestamp>_tracked_items_allow_explanation.sql`:

```sql
-- Allow AI-Coach explanations to be stored as tracked items.
-- The original constraint (20260718211317_create_tracked_items.sql) is the
-- Postgres-default name for `kind text not null check (kind in ('phrase','lesson'))`.
alter table public.tracked_items drop constraint tracked_items_kind_check;
alter table public.tracked_items add constraint tracked_items_kind_check
  check (kind in ('phrase', 'lesson', 'explanation'));
```

- [ ] **Step 3: Verify the constraint name**

Run: `grep -n "kind" supabase/migrations/20260718211317_create_tracked_items.sql`
Expected: a line `kind text not null check (kind in ('phrase', 'lesson')),`. Postgres names such a constraint `<table>_<column>_check` → `tracked_items_kind_check`. If your project already has an explicitly named constraint, adjust the `drop constraint` line to match.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(tracking): allow 'explanation' kind on tracked_items"
```

> RLS note: no new policy needed — the existing "Manage own tracked items" policy scopes every row by `user_id` regardless of `kind`.

---

## Task 2: Add `"explanation"` to the tracking type union

**Files:**
- Modify: `lib/tracking/types.ts`

- [ ] **Step 1: Edit the union and doc-comment**

In `lib/tracking/types.ts`, change:

```ts
export type TrackedKind = "word" | "phrase" | "lesson";
```

to:

```ts
export type TrackedKind = "word" | "phrase" | "lesson" | "explanation";
```

`PersistedTrackedKind` (`Exclude<TrackedKind, "word">`) now includes `"explanation"` automatically — no edit.

Update the `TrackingFilter` doc-comment (currently "The first four narrow by item kind"):

```ts
/**
 * Guardadas filters. Every filter except "ai_coach" narrows by item kind
 * (word, phrase, lesson, explanation); "ai_coach" narrows by origin instead,
 * so it cuts across all kinds.
 */
export type TrackingFilter = "all" | TrackedKind | "ai_coach";
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS (no new usages yet; downstream `switch`/`if` on `kind` all have fall-through or default branches — verified in later tasks).

- [ ] **Step 3: Commit**

```bash
git add lib/tracking/types.ts
git commit -m "feat(tracking): add 'explanation' to TrackedKind"
```

---

## Task 3: Parse `concept` in the tool registry

**Files:**
- Modify: `lib/ai-practice/tools/registry.ts`
- Test: `lib/ai-practice/__tests__/registry.test.ts`

- [ ] **Step 1: Write the failing tests**

In `lib/ai-practice/__tests__/registry.test.ts`, inside `describe("parseToolArgs: annotate_turn", ...)`, **update the two exact-match assertions** and add new ones.

Change the "parses a correction with all required fields" expectation from:

```ts
    expect(args).toEqual({
      correction: {
        original: "I go to the cinema yesterday",
        corrected: "I went to the cinema yesterday",
        rule: "Past simple: 'yesterday' requires the past form of the verb",
        kind: "error",
      },
      saveables: undefined,
    });
```

to:

```ts
    expect(args).toEqual({
      correction: {
        original: "I go to the cinema yesterday",
        corrected: "I went to the cinema yesterday",
        rule: "Past simple: 'yesterday' requires the past form of the verb",
        kind: "error",
      },
      saveables: undefined,
      concept: undefined,
    });
```

Change the "accepts an empty call" expectation from:

```ts
    expect(parseToolArgs("annotate_turn", {})).toEqual({
      correction: undefined,
      saveables: undefined,
    });
```

to:

```ts
    expect(parseToolArgs("annotate_turn", {})).toEqual({
      correction: undefined,
      saveables: undefined,
      concept: undefined,
    });
```

Then add these tests to the same `describe`:

```ts
  it("parses a concept with a title", () => {
    const args = parseToolArgs("annotate_turn", {
      concept: { title: '"actually" — falso amigo' },
    }) as AnnotateTurnArgs;
    expect(args.concept).toEqual({ title: '"actually" — falso amigo' });
  });

  it("trims the concept title", () => {
    const args = parseToolArgs("annotate_turn", {
      concept: { title: "  phrasal verbs  " },
    }) as AnnotateTurnArgs;
    expect(args.concept).toEqual({ title: "phrasal verbs" });
  });

  it("drops a concept with a blank or missing title instead of throwing", () => {
    expect((parseToolArgs("annotate_turn", { concept: { title: "   " } }) as AnnotateTurnArgs).concept).toBeUndefined();
    expect((parseToolArgs("annotate_turn", { concept: {} }) as AnnotateTurnArgs).concept).toBeUndefined();
    expect((parseToolArgs("annotate_turn", { concept: "nope" }) as AnnotateTurnArgs).concept).toBeUndefined();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test lib/ai-practice/__tests__/registry.test.ts`
Expected: FAIL — the new tests fail (`args.concept` is `undefined`/property missing) and the two updated `toEqual` assertions fail (actual object has no `concept` key).

- [ ] **Step 3: Implement the parser**

In `lib/ai-practice/tools/registry.ts`:

Add the type next to `TurnCorrection` / `TurnSaveable` (after line ~78):

```ts
export type TurnConcept = { title: string };
```

Add `concept` to `AnnotateTurnArgs`:

```ts
export type AnnotateTurnArgs = {
  correction?: TurnCorrection;
  saveables?: TurnSaveable[];
  concept?: TurnConcept;
};
```

Add the parser near `parseTurnCorrection` (after line ~232):

```ts
/**
 * Like parseTurnCorrection, a malformed concept must never throw — the turn's
 * prose is still valid. A blank or missing title means "no concept".
 */
function parseTurnConcept(val: unknown): TurnConcept | undefined {
  if (!val || typeof val !== "object") return undefined;
  const o = val as Record<string, unknown>;
  if (typeof o.title !== "string" || !o.title.trim()) return undefined;
  return { title: o.title.trim() };
}
```

Wire it into the `annotate_turn` case of `parseToolArgs` (around line 355):

```ts
    case "annotate_turn":
      return {
        correction: parseTurnCorrection(obj.correction),
        saveables: parseTurnSaveables(obj.saveables),
        concept: parseTurnConcept(obj.concept),
      } satisfies AnnotateTurnArgs;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test lib/ai-practice/__tests__/registry.test.ts`
Expected: PASS (all, including the two updated assertions).

- [ ] **Step 5: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/tools/registry.ts lib/ai-practice/__tests__/registry.test.ts
git commit -m "feat(ai-coach): parse annotate_turn.concept from the model"
```

---

## Task 4: Advertise `concept` in the tool declaration

**Files:**
- Modify: `lib/ai-practice/tools/declarations.ts`

- [ ] **Step 1: Add the `concept` property**

In `lib/ai-practice/tools/declarations.ts`, in the `annotate_turn` entry's `parameters.properties`, after the `saveables` property (around line 163), add:

```ts
        concept: {
          type: "object",
          description:
            "Include ONLY when this turn explains a concept the learner should be able to revisit later " +
            "(a false friend, a grammar point, a usage contrast). Omit it for ordinary conversational replies.",
          properties: {
            title: {
              type: "string",
              description: "A short label in SPANISH for the concept, e.g. '\"actually\" — falso amigo'.",
            },
          },
          required: ["title"],
        },
```

- [ ] **Step 2: Confirm the existing declaration test still passes**

Run: `pnpm test lib/ai-practice/__tests__/registry.test.ts`
Expected: PASS — the test that iterates `TOOL_DECLARATIONS` only checks `names` contains `"annotate_turn"`; adding a property does not break it.

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/ai-practice/tools/declarations.ts
git commit -m "feat(ai-coach): declare annotate_turn.concept to Gemini"
```

---

## Task 5: Extract the concept from a model turn

**Files:**
- Modify: `lib/ai-practice/correction.ts`
- Test: `lib/ai-practice/__tests__/correction.test.ts`

- [ ] **Step 1: Write the failing tests**

In `lib/ai-practice/__tests__/correction.test.ts`, add at the bottom:

```ts
import { extractTurnConcept } from "../correction";

describe("extractTurnConcept", () => {
  it("returns the concept carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: { concept: { title: '"actually" — falso amigo' } },
      },
    ]);
    expect(extractTurnConcept(calls)).toEqual({ title: '"actually" — falso amigo' });
  });

  it("returns null when no annotate_turn call carries a concept", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { saveables: [] } },
    ]);
    expect(extractTurnConcept(calls)).toBeNull();
  });

  it("ignores an errored annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "error",
        args: { concept: { title: "x" } },
      },
    ]);
    expect(extractTurnConcept(calls)).toBeNull();
  });
});
```

> `callMap` is already defined at the top of this test file. `ToolCall.status` values in this file's existing tests are `"answered"` and `"error"`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test lib/ai-practice/__tests__/correction.test.ts`
Expected: FAIL — `extractTurnConcept` is not exported.

- [ ] **Step 3: Implement `extractTurnConcept`**

In `lib/ai-practice/correction.ts`:

Change the import line:

```ts
import type { AnnotateTurnArgs, TurnCorrection, TurnSaveable } from "./tools/registry";
```

to also import `TurnConcept`:

```ts
import type { AnnotateTurnArgs, TurnConcept, TurnCorrection, TurnSaveable } from "./tools/registry";
```

Add at the end of the file:

```ts
/** Companion to extractTurnCorrection: the concept the coach flagged as worth keeping. */
export function extractTurnConcept(
  toolCalls: Map<string, ToolCall>,
): TurnConcept | null {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.concept) return args.concept;
  }
  return null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test lib/ai-practice/__tests__/correction.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/correction.ts lib/ai-practice/__tests__/correction.test.ts
git commit -m "feat(ai-coach): extractTurnConcept from a model turn"
```

---

## Task 6: `persistConcept` — write the explanation to tracked_items

**Files:**
- Modify: `lib/ai-coach/saveables/persist.ts`
- Test: `lib/ai-coach/saveables/__tests__/persist.test.ts`

- [ ] **Step 1: Write the failing tests**

In `lib/ai-coach/saveables/__tests__/persist.test.ts`:

Change the import line at the top:

```ts
const { persistSaveable } = await import("../persist");
```

to:

```ts
const { persistSaveable, persistConcept } = await import("../persist");
```

Add a new `describe` block at the end:

```ts
describe("persistConcept", () => {
  it("saves the explanation as a coach-sourced tracked item", async () => {
    await persistConcept("u1", '"actually" — falso amigo', "One common false friend is 'actually'.");

    expect(saveTrackedItem).toHaveBeenCalledWith({
      userId: "u1",
      kind: "explanation",
      ref: '"actually" — falso amigo',
      title: '"actually" — falso amigo',
      payload: {
        body: "One common false friend is 'actually'.",
        source: "ai_coach",
      },
    });
  });

  it("normalizes the ref (lowercase, collapsed whitespace) so re-saving upserts", async () => {
    await persistConcept("u1", "  Phrasal   Verbs  ", "body");
    expect(saveTrackedItem).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "phrasal verbs", title: "  Phrasal   Verbs  " }),
    );
  });

  it("does not touch the word bank", async () => {
    await persistConcept("u1", "title", "body");
    expect(quickAddWord).not.toHaveBeenCalled();
  });
});
```

> `saveTrackedItem`, `quickAddWord` mocks and the `beforeEach` reset are already set up in this file.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test lib/ai-coach/saveables/__tests__/persist.test.ts`
Expected: FAIL — `persistConcept` is not exported.

- [ ] **Step 3: Implement `slug` and `persistConcept`**

In `lib/ai-coach/saveables/persist.ts`, add after the imports:

```ts
/** Stable idempotency key for an explanation: lowercase, trimmed, single-spaced. */
function slug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}
```

Add at the end of the file:

```ts
/**
 * Saves a coach explanation as a reference note in Guardadas. `body` is the
 * coach message's rendered prose; `title` is the short label the coach gave it.
 * Idempotent per (user, title): re-saving updates the existing row.
 */
export async function persistConcept(userId: string, title: string, body: string): Promise<void> {
  await saveTrackedItem({
    userId,
    kind: "explanation",
    ref: slug(title),
    title,
    payload: { body, source: AI_COACH_SOURCE },
  });
}
```

> `saveTrackedItem` and `AI_COACH_SOURCE` are already imported at the top of this file.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test lib/ai-coach/saveables/__tests__/persist.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `pnpm type-check`
Expected: PASS — `kind: "explanation"` is now a valid `PersistedTrackedKind` (Task 2).

- [ ] **Step 6: Commit**

```bash
git add lib/ai-coach/saveables/persist.ts lib/ai-coach/saveables/__tests__/persist.test.ts
git commit -m "feat(ai-coach): persistConcept writes explanations to tracked_items"
```

---

## Task 7: `SaveConceptChip` component

**Files:**
- Create: `components/ai-coach/SaveConceptChip.tsx`
- Test: `components/ai-coach/__tests__/SaveConceptChip.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/ai-coach/__tests__/SaveConceptChip.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveConceptChip from "../SaveConceptChip";

describe("SaveConceptChip", () => {
  it("renders the idle label", () => {
    render(<SaveConceptChip onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: /guardar explicación/i })).toBeInTheDocument();
  });

  it("calls onSave when tapped", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveConceptChip onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("shows the saved state and disables the button after a successful save", async () => {
    render(<SaveConceptChip onSave={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardada/i })).toBeDisabled();
    });
  });

  it("offers a retry when the save fails, and retries on tap", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(undefined);
    render(<SaveConceptChip onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /guardar explicación/i }));
    const retry = await screen.findByRole("button", { name: /reintentar/i });
    await userEvent.click(retry);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test components/ai-coach/__tests__/SaveConceptChip.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `components/ai-coach/SaveConceptChip.tsx`:

```tsx
"use client";

import { useState } from "react";
import { BookMarked, Check, RotateCcw } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <SaveConceptChip> — one pill; saves the whole coach explanation

type ChipState = "idle" | "saving" | "saved" | "error";

interface SaveConceptChipProps {
  onSave: () => Promise<void>;
}

export default function SaveConceptChip({ onSave }: SaveConceptChipProps) {
  const [state, setState] = useState<ChipState>("idle");

  const handleSave = async () => {
    setState("saving");
    try {
      await onSave();
      setState("saved");
    } catch (err) {
      console.error("[SaveConceptChip] save failed", err);
      setState("error");
    }
  };

  const isSaved = state === "saved";
  const isError = state === "error";

  return (
    <div className="flex" aria-label="Guardar la explicación del coach">
      <button
        type="button"
        disabled={state === "saving" || isSaved}
        onClick={() => void handleSave()}
        className={cn(
          "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3",
          "text-caption font-medium whitespace-nowrap",
          "transition-colors duration-150 focus-ring",
          "disabled:cursor-default",
          isSaved
            ? "border-success bg-success-soft text-success"
            : isError
              ? "border-warning bg-warning-soft text-warning"
              : "border-border-subtle bg-surface-raised text-fg-muted hover:border-primary hover:bg-primary-soft hover:text-primary",
        )}
      >
        {isSaved ? (
          <Check size={13} strokeWidth={2.25} aria-hidden />
        ) : isError ? (
          <RotateCcw size={13} strokeWidth={2} aria-hidden />
        ) : (
          <BookMarked size={13} strokeWidth={2} aria-hidden />
        )}
        {isSaved
          ? "Guardada"
          : isError
            ? "Guardar explicación · reintentar"
            : "Guardar explicación"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test components/ai-coach/__tests__/SaveConceptChip.test.tsx`
Expected: PASS.

- [ ] **Step 5: Lint + type-check**

Run: `pnpm lint && pnpm type-check`
Expected: PASS. Confirm `BookMarked` is a valid export: `grep -n "BookMarked" components/icons/index.ts` → should print a line.

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/SaveConceptChip.tsx components/ai-coach/__tests__/SaveConceptChip.test.tsx
git commit -m "feat(ai-coach): SaveConceptChip for saving coach explanations"
```

---

## Task 8: Render the chip in `AIBubble`

**Files:**
- Modify: `components/ai-coach/chat/AIBubble.tsx`

- [ ] **Step 1: Wire in the concept extraction and chip**

In `components/ai-coach/chat/AIBubble.tsx`:

Add to the imports:

```tsx
import { extractTurnCorrection, extractTurnSaveables, extractTurnConcept } from "@/lib/ai-practice/correction";
import SaveConceptChip from "../SaveConceptChip";
```

(The `extractTurnCorrection, extractTurnSaveables` import already exists — extend it. `SaveChips` is imported as `import SaveChips from "../SaveChips";` — add the `SaveConceptChip` line next to it.)

Update the "Planned structure" comment to add `//   <SaveConceptChip />` after `//   <SaveChips />`.

Add to `AIBubbleProps`:

```tsx
  onSaveConcept?: (title: string, body: string) => Promise<void>;
```

Add to the destructured params in the function signature:

```tsx
  onSaveConcept,
```

After `const saveables = extractTurnSaveables(message.toolCalls);` (line ~67) add:

```tsx
  const concept = extractTurnConcept(message.toolCalls);
```

At the bottom of the JSX, after the `SaveChips` line (line ~233):

```tsx
        {saveables.length > 0 && <SaveChips saveables={saveables} onSave={onSaveSaveable} />}
        {concept && onSaveConcept && (
          <SaveConceptChip onSave={() => onSaveConcept(concept.title, proseBody || fullText)} />
        )}
```

> `proseBody` and `fullText` are already computed earlier in the component. `onSaveConcept` is optional so `MissionWorkspace`'s `ChatView` (which does not pass it) keeps compiling and simply shows no chip.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Run the AI-coach component tests**

Run: `pnpm test components/ai-coach/`
Expected: PASS — existing bubble/ChatView tests do not pass `onSaveConcept` and no test fixture carries `annotate_turn.concept`, so the new branch is inert.

- [ ] **Step 4: Commit**

```bash
git add components/ai-coach/chat/AIBubble.tsx
git commit -m "feat(ai-coach): show SaveConceptChip when a turn flags a concept"
```

---

## Task 9: Thread `onSaveConcept` through the chat prop chain

**Files:**
- Modify: `components/ai-coach/MessageBubble.tsx`
- Modify: `components/ai-coach/ChatView.tsx`
- Modify: `components/ai-coach/AICoachPanelViews.tsx`

- [ ] **Step 1: `MessageBubble.tsx`**

Add to `MessageBubbleProps`:

```tsx
  onSaveConcept?: (title: string, body: string) => Promise<void>;
```

Add `onSaveConcept` to the destructured params, and forward it to `<AIBubble>`:

```tsx
      onSaveConcept={onSaveConcept}
```

(Place it next to the existing `onSaveSaveable={onSaveSaveable}` line.)

- [ ] **Step 2: `ChatView.tsx`**

Add to `ChatViewProps`:

```tsx
  onSaveConcept?: (title: string, body: string) => Promise<void>;
```

Add `onSaveConcept` to the destructured params. Forward to `<MessageBubble>` next to `onSaveSaveable={onSaveSaveable}`:

```tsx
              onSaveConcept={onSaveConcept}
```

- [ ] **Step 3: `AICoachPanelViews.tsx`**

Add to `RenderActiveChatParams` (next to `saveSaveable`):

```tsx
  saveConcept: (title: string, body: string) => Promise<void>;
```

In `renderActiveChat`'s `<ChatView>` call, next to `onSaveSaveable={p.saveSaveable}`:

```tsx
          onSaveConcept={p.saveConcept}
```

> Leave `RenderMissionParams` and `renderMission` untouched — missions do not surface concept chips.

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: FAIL — `AICoachPanel.tsx` does not yet pass `saveConcept` to `renderActiveChat`. That is fixed in Task 10; this is expected mid-chain. If you want a green checkpoint, do Steps 1-4 of Task 10 before committing.

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/MessageBubble.tsx components/ai-coach/ChatView.tsx components/ai-coach/AICoachPanelViews.tsx
git commit -m "feat(ai-coach): thread onSaveConcept through the chat view chain"
```

---

## Task 10: Provide `saveConcept` from the hooks and panel

**Files:**
- Modify: `hooks/useSavedWords.ts`
- Modify: `hooks/useAIPractice.ts`
- Modify: `components/ai-coach/AICoachPanel.tsx`
- Test: `hooks/__tests__/useAIPractice.test.tsx`

- [ ] **Step 1: `hooks/useSavedWords.ts`**

Add the import:

```ts
import { persistSaveable, persistConcept } from "@/lib/ai-coach/saveables/persist";
```

Add the callback (next to `saveSaveable`):

```ts
  const saveConcept = useCallback(
    async (title: string, body: string) => {
      if (!userId) throw new Error("Not authenticated");
      await persistConcept(userId, title, body);
    },
    [userId],
  );
```

Add `saveConcept` to the returned `useMemo` object and to its dependency array:

```ts
  return useMemo(
    () => ({
      wordToSave,
      setWordToSave,
      openSaveWordModal,
      closeSaveWordModal,
      confirmSaveWord,
      saveSaveable,
      saveConcept,
    }),
    [wordToSave, openSaveWordModal, closeSaveWordModal, confirmSaveWord, saveSaveable, saveConcept],
  );
```

- [ ] **Step 2: `hooks/useAIPractice.ts`**

Add to the `UseAIPracticeReturn` type (next to `saveSaveable`):

```ts
  saveConcept: (title: string, body: string) => Promise<void>;
```

Add to the returned object (next to `saveSaveable: words.saveSaveable,`):

```ts
    saveConcept: words.saveConcept,
```

- [ ] **Step 3: `components/ai-coach/AICoachPanel.tsx`**

Add `saveConcept` to the destructuring of `useAIPractice()` (the block around line 54-59, next to `saveSaveable`).

In **both** `renderActiveChat({ ... })` call sites — there is one at line ~187 (chat tab). Add `saveConcept` to the params object:

```tsx
                renderActiveChat({
                  messages, isStreaming, error, quotaExhausted, resetSession, openSaveWordModal,
                  saveSaveable, saveConcept, saveAllFromSummary, saveTranslation, inputPrefill, setInputPrefill, answerToolCall, sendMessage,
                })
```

> `renderActiveChat` is only called once (the missions tab uses `renderMission`/`renderHome`). Search the file for `renderActiveChat(` to confirm — if there is only one call, update that one.

- [ ] **Step 4: Update the hook test mock**

In `hooks/__tests__/useAIPractice.test.tsx`, find the mock that provides `saveSaveable: vi.fn(async () => undefined)` (around line 42) and add alongside it:

```ts
    saveConcept: vi.fn(async () => undefined),
```

- [ ] **Step 5: Type-check + run affected tests**

Run: `pnpm type-check`
Expected: PASS (the whole chain is now connected).

Run: `pnpm test hooks/__tests__/useAIPractice.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add hooks/useSavedWords.ts hooks/useAIPractice.ts components/ai-coach/AICoachPanel.tsx hooks/__tests__/useAIPractice.test.tsx
git commit -m "feat(ai-coach): provide saveConcept from useSavedWords through the panel"
```

---

## Task 11: Add the coach prompt guidance

**Files:**
- Modify: `lib/ai-prompts.ts`

- [ ] **Step 1: Locate the coach system prompt's `annotate_turn` guidance**

Run: `grep -n "annotate_turn\|saveables" lib/ai-prompts.ts`
The system prompt for the coach mentions offering words "via annotate_turn saveables". Find the coach system-prompt string (search for the constant used by the chat route — likely `AI_COACH_SYSTEM_PROMPT` or similar; `grep -n "FEEDBACK DISCIPLINE\|annotate_turn" lib/ai-prompts.ts`).

- [ ] **Step 2: Add one line**

In that system-prompt string, in the section describing `annotate_turn`, add:

```
When a turn explains a concept the learner should be able to revisit later — a false friend, a grammar point, a usage contrast — also pass `concept.title` (a short Spanish label) so they can save the whole explanation, not just the word.
```

Keep it adjacent to the existing sentence about `saveables`. Match the surrounding prose style (these prompts are plain instructional English).

- [ ] **Step 3: Run the prompt/route tests**

Run: `pnpm test lib/gemini/ lib/ai-practice/__tests__/annotate-turn.integration.test.ts`
Expected: PASS — no test snapshots the full prompt string verbatim (verify: `grep -rn "via annotate_turn saveables" lib/**/__tests__ 2>/dev/null` should return nothing).

- [ ] **Step 4: Commit**

```bash
git add lib/ai-prompts.ts
git commit -m "feat(ai-coach): tell the coach to flag revisit-worthy concepts"
```

---

## Task 12: Render explanation items in `useTracking`

**Files:**
- Modify: `hooks/useTracking.ts`

- [ ] **Step 1: Branch on `explanation` in the `saved` map**

In `hooks/useTracking.ts`, in the `trackedItems.map((trackedItem) => { ... })` block, replace the `item` construction with:

```ts
    const saved = trackedItems.map((trackedItem) => {
      const isExplanation = trackedItem.kind === "explanation";
      const canonicalTitle =
        trackedItem.kind === "lesson"
          ? resolveLessonTitle(trackedItem.ref, trackedItem.title)
          : (trackedItem.title ?? trackedItem.ref);
      const item: TrackingItem = {
        id: trackedItem.id,
        kind: trackedItem.kind,
        title: canonicalTitle,
        description: isExplanation
          ? (typeof trackedItem.payload.body === "string" ? trackedItem.payload.body : null)
          : (typeof trackedItem.payload.context === "string" ? trackedItem.payload.context : null),
        href: trackedItem.kind === "lesson" ? resolveLessonHref(trackedItem.ref, trackedItem.payload) : undefined,
        progressState: isExplanation ? undefined : "saved",
        progressLabel: isExplanation ? undefined : WORD_PROGRESS_LABELS.saved,
        fromCoach: isFromCoach(trackedItem),
      };
      return { item, trackedItem };
    });
```

> `TrackingItem.progressState` / `progressLabel` are already optional in `lib/tracking/types.ts` — passing `undefined` is valid.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Run tracking tests**

Run: `pnpm test hooks/ components/tracking/`
Expected: PASS — existing tests use `word`/`phrase`/`lesson` fixtures only.

- [ ] **Step 4: Commit**

```bash
git add hooks/useTracking.ts
git commit -m "feat(tracking): surface explanation items with their body text"
```

---

## Task 13: Exclude explanations from the review queue

**Files:**
- Modify: `lib/tracking/review-queue.ts`
- Test: `lib/tracking/__tests__/review-queue.test.ts`

- [ ] **Step 1: Write the failing test**

In `lib/tracking/__tests__/review-queue.test.ts`, add a test. First check the existing helper for building a source (search the file for `buildTrackingReviewQueue(` and how sources are shaped — a source is `{ item: TrackingItem; trackedItem: TrackedItem }`). Add:

```ts
  it("never puts an explanation into the queue or the skip list", () => {
    const source = {
      item: {
        id: "x1",
        kind: "explanation" as const,
        title: '"actually" — falso amigo',
        description: "One common false friend…",
      },
      trackedItem: {
        id: "x1",
        userId: "u1",
        kind: "explanation" as const,
        ref: '"actually" — falso amigo',
        title: '"actually" — falso amigo',
        payload: { body: "One common false friend…", source: "ai_coach" },
        createdAt: "2026-09-06T00:00:00.000Z",
        updatedAt: "2026-09-06T00:00:00.000Z",
      },
    };
    const queue = buildTrackingReviewQueue([source]);
    expect(queue.exercises).toHaveLength(0);
    expect(queue.items).toHaveLength(0);
    expect(queue.skipped).toHaveLength(0);
  });
```

> Match the import style and any `as const` / type casts the other tests in the file use. If TS complains about the literal `item` shape, cast the source `as TrackingReviewSource` (imported from `../review-queue`).

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test lib/tracking/__tests__/review-queue.test.ts`
Expected: FAIL — the explanation falls through to the lesson branch and lands in `queue.items` (or `skipped` with `missing_lesson_ref`).

- [ ] **Step 3: Add the guard**

In `lib/tracking/review-queue.ts`, inside the `for (const source of sources)` loop, **after** the `if (source.item.kind === 'phrase') { … continue }` block and **before** the lesson fall-through (`const trackedItem = 'trackedItem' in source ? …`), add:

```ts
    if (source.item.kind === 'explanation') continue // reference-only, never reviewable
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test lib/tracking/__tests__/review-queue.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tracking/review-queue.ts lib/tracking/__tests__/review-queue.test.ts
git commit -m "feat(tracking): keep explanations out of the review queue"
```

---

## Task 14: Add the "Explicaciones" filter chip

**Files:**
- Modify: `components/tracking/TrackingToolbar.tsx`

- [ ] **Step 1: Add the filter**

In `components/tracking/TrackingToolbar.tsx`, in the `FILTERS` array, add after the `lesson` entry:

```ts
  { id: "explanation", label: "Explicaciones" },
```

Final array:

```ts
const FILTERS: { id: TrackingFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" },
  { id: "lesson", label: "Lecciones" },
  { id: "explanation", label: "Explicaciones" },
  { id: "ai_coach", label: "Del coach" },
];
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS — `"explanation"` is a valid `TrackingFilter` (Task 2).

- [ ] **Step 3: Run toolbar tests**

Run: `pnpm test components/tracking/__tests__/TrackingToolbar.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/tracking/TrackingToolbar.tsx
git commit -m "feat(tracking): add Explicaciones filter chip"
```

---

## Task 15: Render the explanation card

**Files:**
- Modify: `components/tracking/TrackingCard.tsx`
- Test: `components/tracking/__tests__/TrackingCard.test.tsx` (create if it does not exist)

- [ ] **Step 1: Check for an existing card test file**

Run: `ls components/tracking/__tests__/`
If `TrackingCard.test.tsx` does not exist, create it in Step 2 with the full skeleton below. If it exists, add the new `describe` block to it.

- [ ] **Step 2: Write the failing test**

Create/extend `components/tracking/__tests__/TrackingCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackingCard } from "../TrackingCard";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";

function explanationSource(): TrackingReviewSource {
  return {
    item: {
      id: "x1",
      kind: "explanation",
      title: '"actually" — falso amigo',
      description: "Line one of the explanation.\nLine two with an example.",
      fromCoach: true,
    },
    trackedItem: {
      id: "x1",
      userId: "u1",
      kind: "explanation",
      ref: '"actually" — falso amigo',
      title: '"actually" — falso amigo',
      payload: { body: "Line one of the explanation.\nLine two with an example.", source: "ai_coach" },
      createdAt: "2026-09-06T00:00:00.000Z",
      updatedAt: "2026-09-06T00:00:00.000Z",
    },
  } as TrackingReviewSource;
}

describe("TrackingCard — explanation", () => {
  it("shows the title, the Explicación badge and the coach badge", () => {
    render(
      <TrackingCard
        source={explanationSource()}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={vi.fn()}
      />,
    );
    expect(screen.getByText('"actually" — falso amigo')).toBeInTheDocument();
    expect(screen.getByText("Explicación")).toBeInTheDocument();
    expect(screen.getByText(/coach/i)).toBeInTheDocument();
  });

  it("renders the body text and a Ver más toggle", async () => {
    render(
      <TrackingCard
        source={explanationSource()}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={vi.fn()}
      />,
    );
    expect(screen.getByText(/Line one of the explanation/)).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /ver más/i });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: /ver menos/i })).toBeInTheDocument();
  });

  it("calls onDeleteExplanation when the delete button is tapped", async () => {
    const onDeleteExplanation = vi.fn();
    const source = explanationSource();
    render(
      <TrackingCard
        source={source}
        onEditWord={vi.fn()}
        onDeleteWord={vi.fn()}
        onDeleteExplanation={onDeleteExplanation}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDeleteExplanation).toHaveBeenCalledWith(source);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test components/tracking/__tests__/TrackingCard.test.tsx`
Expected: FAIL — `onDeleteExplanation` is not a prop; no explanation branch.

- [ ] **Step 4: Implement the explanation branch**

In `components/tracking/TrackingCard.tsx`:

Add `Lightbulb` to the icon import:

```ts
import { Bookmark, BookOpen, FileText, Lightbulb, Pencil, Trash2 } from "@/components/icons";
```

Add to the `registry`:

```ts
const registry: Record<TrackedKind, { label: string; icon: typeof Bookmark }> = {
  word: { label: "Palabra", icon: Bookmark },
  phrase: { label: "Frase", icon: FileText },
  lesson: { label: "Lección", icon: BookOpen },
  explanation: { label: "Explicación", icon: Lightbulb },
};
```

Add the prop:

```ts
interface TrackingCardProps {
  source: TrackingReviewSource;
  onEditWord: (word: WordBankEntry) => void;
  onDeleteWord: (word: WordBankEntry) => void;
  onDeleteExplanation: (source: TrackingReviewSource) => void;
}
```

Add `onDeleteExplanation` to the destructured params.

Add a local state hook at the top of the component body:

```tsx
import { useState } from "react";
// …
  const [expanded, setExpanded] = useState(false);
```

Add an early-return branch for explanations, **before** the existing `content` const (an explanation has no `word`, no href, no IPA, no mission launch — a separate compact layout is cleaner than threading conditionals through the shared markup):

```tsx
  if (item.kind === "explanation") {
    return (
      <div className="tracking-item">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-sunken text-fg-muted">
          <Lightbulb size={16} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body-sm font-semibold text-fg">{item.title}</span>
            <Badge label="Explicación" variant="neutral" size="sm" />
            {item.fromCoach && <Badge label="✦ coach" variant="info" size="sm" />}
          </span>
          {item.description ? (
            <>
              <span
                className={cn(
                  "mt-1.5 block text-body-sm text-fg-muted whitespace-pre-line",
                  !expanded && "line-clamp-3",
                )}
              >
                {item.description}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="focus-ring mt-1 text-caption font-semibold text-primary underline-offset-2 hover:underline"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            </>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDeleteExplanation(source)}
            aria-label={`Eliminar ${item.title}`}
            title="Eliminar explicación"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-error-soft hover:text-error active:scale-95"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </span>
      </div>
    );
  }
```

Add the `cn` import if not present: `import { cn } from "@/lib/cn";` (check the top of the file first).

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test components/tracking/__tests__/TrackingCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Check the file length**

Run: `wc -l components/tracking/TrackingCard.tsx`
Expected: under 250. If over, extract the explanation branch into `components/tracking/ExplanationCardBody.tsx` (a component taking `{ item, source, onDelete }`) and render `<ExplanationCardBody … />` from the branch.

- [ ] **Step 7: Lint + type-check**

Run: `pnpm lint && pnpm type-check`
Expected: FAIL on type-check — `TrackingClient.tsx` renders `<TrackingCard>` without the new required `onDeleteExplanation` prop. Fixed in Task 16.

- [ ] **Step 8: Commit**

```bash
git add components/tracking/TrackingCard.tsx components/tracking/__tests__/TrackingCard.test.tsx
git commit -m "feat(tracking): render the explanation card with Ver más + delete"
```

---

## Task 16: Delete dialog + `TrackingClient` wiring

**Files:**
- Create: `components/tracking/DeleteExplanationDialog.tsx`
- Modify: `components/tracking/TrackingClient.tsx`

- [ ] **Step 1: Create the dialog**

Create `components/tracking/DeleteExplanationDialog.tsx` (parallels `DeleteWordDialog.tsx`):

```tsx
"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";

interface Props {
  source: TrackingReviewSource | null;
  onClose: () => void;
  onConfirm: (source: TrackingReviewSource) => Promise<void>;
}

export function DeleteExplanationDialog({ source, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    setDeleting(false);
    setError(null);
  }, [source]);

  if (!source) return null;

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(source);
      onClose();
    } catch {
      setError("No pudimos eliminar la explicación. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay-medium)" }}
      onClick={() => !deleting && onClose()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-explanation-title"
        aria-describedby="delete-explanation-description"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised shadow-xl"
      >
        <div className="layout-card-pad">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-error-soft text-error">
            <Trash2 size={18} aria-hidden />
          </span>
          <h2 id="delete-explanation-title" className="mt-4 text-h3 text-fg">
            Eliminar “{source.item.title}”
          </h2>
          <p id="delete-explanation-description" className="mt-2 text-body-sm text-fg-muted">
            Se eliminará esta explicación guardada. Esta acción no se puede deshacer.
          </p>
          {error ? <p role="alert" className="mt-3 text-body-sm text-error">{error}</p> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="danger" onClick={() => void remove()} disabled={deleting} isLoading={deleting} icon={<Trash2 size={15} aria-hidden />}>
            Eliminar
          </Button>
        </footer>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `TrackingClient.tsx`**

Add imports:

```tsx
import { saveTrackedItem, removeTrackedItem } from "@/lib/tracking/queries";
import { DeleteExplanationDialog } from "./DeleteExplanationDialog";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
```

(The `saveTrackedItem` import already exists — extend it to add `removeTrackedItem`.)

Add state near the other `useState` calls:

```tsx
  const [deletingExplanation, setDeletingExplanation] = useState<TrackingReviewSource | null>(null);
```

Pass the new prop to `<TrackingCard>`:

```tsx
                {paginatedSources.map((source) => (
                  <TrackingCard
                    key={`${source.item.kind}:${source.item.id}`}
                    source={source}
                    onEditWord={setEditingWord}
                    onDeleteWord={setDeletingWord}
                    onDeleteExplanation={setDeletingExplanation}
                  />
                ))}
```

Add a handler and render the dialog next to the other modals at the end of `content`:

```tsx
  async function deleteExplanation(source: TrackingReviewSource) {
    if (!userId || !("trackedItem" in source)) return;
    await removeTrackedItem(userId, "explanation", source.trackedItem.ref);
    setDeletingExplanation(null);
  }
```

```tsx
      <DeleteExplanationDialog
        source={deletingExplanation}
        onClose={() => setDeletingExplanation(null)}
        onConfirm={deleteExplanation}
      />
```

> `filteredSources` already handles the `explanation` filter: `filter === "explanation"` is neither `"all"` nor `"ai_coach"`, so it falls to `reviewSources.filter((s) => s.item.kind === filter)`. `hasCategoryItems` uses the same expression. No change needed there.

- [ ] **Step 3: Lint + type-check**

Run: `pnpm lint && pnpm type-check`
Expected: PASS (the whole chain compiles now).

- [ ] **Step 4: Run the tracking tests**

Run: `pnpm test components/tracking/`
Expected: PASS. If `TrackingClient.test.tsx` renders `<TrackingCard>` indirectly and a test breaks on the new required prop, the fix is already in place (the client passes it); if a test mounts `TrackingCard` directly it was updated in Task 15.

- [ ] **Step 5: Commit**

```bash
git add components/tracking/DeleteExplanationDialog.tsx components/tracking/TrackingClient.tsx
git commit -m "feat(tracking): delete a saved explanation from Mi inglés"
```

---

## Task 17: Empty state for the Explicaciones filter

**Files:**
- Modify: `components/tracking/TrackingEmptyState.tsx`

- [ ] **Step 1: Add the branch**

In `components/tracking/TrackingEmptyState.tsx`, before the final `return`, add:

```tsx
  if (filter === "explanation") {
    return (
      <EmptyState
        illustration={<Illustration />}
        title="Aún no guardaste explicaciones"
        description="Cuando el coach te explique un concepto, guárdalo desde el chat para volver a leerlo."
      />
    );
  }
```

- [ ] **Step 2: Type-check + tests**

Run: `pnpm type-check && pnpm test components/tracking/`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/tracking/TrackingEmptyState.tsx
git commit -m "feat(tracking): empty state for the Explicaciones filter"
```

---

## Task 18: End-to-end integration test in TrackingClient

**Files:**
- Modify: `components/tracking/__tests__/TrackingClient.test.tsx`

- [ ] **Step 1: Read the existing test file to learn its fixture setup**

Run: `cat components/tracking/__tests__/TrackingClient.test.tsx`
Note how it mocks `useTracking` (or Dexie) and how it provides `reviewSources`. Follow that exact pattern.

- [ ] **Step 2: Add tests**

Add a `describe("TrackingClient — explanations", ...)` block that provides one `explanation` review source and one `word` source, then asserts:

```tsx
  it("shows explanation items only under the Explicaciones filter", async () => {
    // render with the mocked sources
    // click the "Explicaciones" filter chip
    await userEvent.click(screen.getByRole("button", { name: "Explicaciones" }));
    expect(screen.getByText('"actually" — falso amigo')).toBeInTheDocument();
    expect(screen.queryByText("creepy")).not.toBeInTheDocument();
  });

  it("also shows explanation items under Del coach", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Del coach" }));
    expect(screen.getByText('"actually" — falso amigo')).toBeInTheDocument();
  });

  it("does not count explanations toward Repasar", async () => {
    // with only an explanation source present, the Repasar button is absent
    // (canReview === false) — mirror how other tests assert on the button
    expect(screen.queryByRole("button", { name: /repasar/i })).not.toBeInTheDocument();
  });
```

Fill in the render/mocount boilerplate to match the file's existing tests exactly (fixture shape, provider wrappers, mock of `useTracking`).

- [ ] **Step 3: Run the test**

Run: `pnpm test components/tracking/__tests__/TrackingClient.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/tracking/__tests__/TrackingClient.test.tsx
git commit -m "test(tracking): explanations filter, Del coach, and review-count behavior"
```

---

## Task 19: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: PASS. If it times out (the suite is large), run the touched areas:
`pnpm test lib/ai-practice/ lib/ai-coach/ lib/tracking/ hooks/ components/ai-coach/ components/tracking/`

- [ ] **Step 2: Type-check + lint**

Run: `pnpm type-check && pnpm lint`
Expected: PASS. No file over 300 lines (ESLint warns): `pnpm lint 2>&1 | grep -i "max-lines" || echo "no max-lines warnings"`.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `pnpm dev`, then:
1. Open the AI Coach, start a chat, ask it to "explain a common false friend for Spanish speakers".
2. When it explains a concept, confirm a **Guardar explicación** chip appears under the message (may take a turn — the model must choose to pass `concept.title`).
3. Tap it → chip shows **Guardada**.
4. Go to **Mi inglés** → **Explicaciones** tab → the card is there with the full text and a **Ver más** toggle.
5. Check **Del coach** → the card also appears there.
6. Confirm the **Repasar (N)** count did not increase.
7. Delete it via the trash button → confirm dialog → it disappears.
8. DevTools → Application → IndexedDB → `trackedItems` → the row has `kind: "explanation"`, `payload.source: "ai_coach"`; `syncOutbox` has a pending `tracked_items` upsert.

- [ ] **Step 5: Apply the migration to the remote Supabase project**

The migration must be applied before the outbox sync can push explanation rows (the CHECK constraint would reject them). Apply it via the team's normal migration path (Supabase CLI `supabase db push`, or the MCP `apply_migration`), then confirm:
`select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'tracked_items_kind_check';`
Expected: the def includes `'explanation'`.

- [ ] **Step 6: Final commit if anything was touched during verification**

```bash
git add -A
git commit -m "chore(ai-coach): verification fixes for save-explanation feature"
```

---

## Self-Review notes (for the executor's awareness)

- **Spec coverage:** every spec section maps to a task — migration (T1), types (T2), tool contract (T3-T5), prompt (T11), persistence (T6), chip (T7-T8), prop chain (T9-T10), Guardadas UI (T12, T14-T17), review exclusion (T13), tests (woven in + T18), verification (T19).
- **Known mid-chain red checkpoints:** type-check fails at the end of Task 9 (until Task 10) and end of Task 15 Step 7 (until Task 16). Both are called out in the steps. Commit anyway to keep tasks small; the next task closes the gap.
- **`onSaveConcept` is optional** on `ChatView`/`MessageBubble`/`AIBubble` so `MissionWorkspace` compiles unchanged and mission turns simply never show the chip.
- **Existing exact-match test assertions** in `registry.test.ts` (`toEqual({ correction: …, saveables: … })`) MUST gain `concept: undefined` — Task 3 Step 1 does this. Do not skip it.
- **`TrackingFilter`** needs no type edit — `"all" | TrackedKind | "ai_coach"` already includes `"explanation"` once `TrackedKind` has it (Task 2).
