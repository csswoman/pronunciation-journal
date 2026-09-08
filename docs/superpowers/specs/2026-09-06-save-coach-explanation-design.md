# Save the coach's full explanation as an "Explicación" in Guardadas

**Date:** 2026-09-06
**Status:** Approved — ready for implementation plan
**Branch:** dev

## Problem

When the AI Coach teaches a concept — e.g. the "actually" false-friend explanation (what it means, what it does *not* mean, two example sentences, a comprehension question) — the learner can only save the bare word via the existing `+ actually` chip. The concept itself, which is the valuable part, is lost. The learner asked to be able to save "the whole concept the AI gave me" and have it show up under **Del coach** like saved words do.

## Solution overview

The coach flags a concept-worthy turn by adding a `concept` object to its existing `annotate_turn` tool call. That makes a **"+ Guardar explicación"** chip appear under the message, next to the word/phrase chips. Tapping it saves the **rendered prose of that coach message** as a new `explanation` tracked item, tagged `source: "ai_coach"`.

Saved explanations appear in **Mi inglés** under a new **Explicaciones** filter tab and under **Del coach**, as a card with a title, a **✦ coach** badge, and the full text collapsed to ~3 lines with a **Ver más** toggle. They are **reference-only** — never entered into the "Repasar" queue. They are fully independent of the word/phrase chips: saving one does not save the other.

### Decisions locked during brainstorming

| Question | Decision |
| - | - |
| What does "the concept" contain? | The coach message's full explanation prose, saved roughly as shown. |
| How is it triggered? | A separate "Guardar explicación" chip, shown only when the coach flags the turn. |
| Where does it live in Guardadas? | A new `explanation` kind with its own filter tab (like Palabras / Frases / Lecciones). |
| Storage? | `tracked_items` table, new `kind = "explanation"`. Reuses existing outbox sync + RLS. No new table. |
| Card title? | The coach supplies a short Spanish title in the tool call. Chip only appears when the title is present. |
| Word coupling? | Fully independent — explanation chip and word chip are separate actions. |
| Reviewable? | Reference-only. Excluded from the "Repasar (N)" queue. |

## Data model & storage

### Migration

`supabase/migrations/<timestamp>_tracked_items_allow_explanation.sql`:

```sql
alter table public.tracked_items drop constraint tracked_items_kind_check;
alter table public.tracked_items add constraint tracked_items_kind_check
  check (kind in ('phrase', 'lesson', 'explanation'));
```

The original constraint is named `tracked_items_kind_check` (Postgres default naming from
`kind text not null check (kind in ('phrase', 'lesson'))` in
`20260718211317_create_tracked_items.sql`). No new table, no new RLS policy — the existing
"Manage own tracked items" policy already scopes every row by `user_id`.

### Types — `lib/tracking/types.ts`

- `TrackedKind`: add `"explanation"` → `"word" | "phrase" | "lesson" | "explanation"`.
- `PersistedTrackedKind` stays `Exclude<TrackedKind, "word">`; it now includes `explanation` automatically.
- `TrackingFilter`: add `"explanation"` → `"all" | TrackedKind | "ai_coach"` already expands to include it via `TrackedKind`; confirm the union still reads correctly and update the doc-comment to mention the fourth kind filter.

### Stored row

Written through the existing `saveTrackedItem` (`lib/tracking/queries.ts`), no signature change:

```ts
saveTrackedItem({
  userId,
  kind: "explanation",
  ref: slug(concept.title),          // dedupe key: [userId + kind + ref]
  title: concept.title,              // e.g. '"actually" — falso amigo'
  payload: { body: fullMessageProse, source: "ai_coach" },
});
```

- `slug(title)`: lowercase, trim, collapse internal whitespace to single spaces. Small local
  helper in `persist.ts`. Deliberately simple — its only job is a stable idempotency key.
- Re-saving the same concept upserts on `user_id,kind,ref` (existing behavior of
  `saveTrackedItem`): `updatedAt` bumps, no duplicate row.
- Offline: writes to Dexie + enqueues the upsert in the outbox, exactly like a saved phrase.

### `isFromCoach` — `lib/ai-coach/saveables/source.ts`

Already checks `row.payload?.source === AI_COACH_SOURCE`. No change needed — an explanation row
carries `payload.source: "ai_coach"` and will match.

## Coach tool contract & prompt

### Declaration — `lib/ai-practice/tools/declarations.ts`

Add a `concept` property to `annotate_turn`'s `parameters.properties`, alongside `correction`
and `saveables`:

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

### Registry — `lib/ai-practice/tools/registry.ts`

- New type: `export type TurnConcept = { title: string };`
- `AnnotateTurnArgs`: add `concept?: TurnConcept;`
- New parser, following the lenient pattern of `parseTurnCorrection` (a malformed annotation
  must never throw — the turn's prose is still valid):

  ```ts
  function parseTurnConcept(val: unknown): TurnConcept | undefined {
    if (!val || typeof val !== "object") return undefined;
    const o = val as Record<string, unknown>;
    if (typeof o.title !== "string" || !o.title.trim()) return undefined;
    return { title: o.title.trim() };
  }
  ```
- Wire into `parseToolArgs`'s `annotate_turn` case:

  ```ts
  case "annotate_turn":
    return {
      correction: parseTurnCorrection(obj.correction),
      saveables: parseTurnSaveables(obj.saveables),
      concept: parseTurnConcept(obj.concept),
    } satisfies AnnotateTurnArgs;
  ```

### Extractor — `lib/ai-practice/correction.ts`

Add, mirroring `extractTurnCorrection`:

```ts
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

Import `TurnConcept` alongside the existing `AnnotateTurnArgs` / `TurnCorrection` / `TurnSaveable`.

### Prompt — `lib/ai-prompts.ts`

Add one line to the coach system prompt's guidance about `annotate_turn` (near the existing
line 252 mention of "offer them via annotate_turn saveables"):

> When a turn explains a concept the learner should be able to revisit — a false friend, a
> grammar point, a usage contrast — also pass `concept.title` (a short Spanish label) so they
> can save the whole explanation, not just the word.

The saved `body` is always the **rendered prose of the coach message**, computed in `AIBubble`
(`proseBody || fullText`). The coach controls only *whether* the chip appears and its *title*;
it does not author the body separately.

## UI: the chip

### New component — `components/ai-coach/SaveConceptChip.tsx` (~50 lines)

Same visual language and state machine as `SaveChips` (`idle → saving → saved → error`, retry
on error). Renders one pill:

- Idle: `+ Guardar explicación` with a `BookMarked` (or `Lightbulb`) icon from `@/components/icons`.
- Saving: disabled, same label.
- Saved: `Guardada` with a `Check` icon, `border-success bg-success-soft text-success`, disabled.
- Error: `Guardar explicación · reintentar` with a `RotateCcw` icon, `border-warning …`, tap retries.

Tokens only (`cn()`, `focus-ring`, `min-h-9`, etc.) — copy the class lists from `SaveChips`.

Props:

```ts
interface SaveConceptChipProps {
  onSave: () => Promise<void>;
}
```

Kept as its own file rather than a branch inside `SaveChips` because its input is "the message",
not a `TurnSaveable` — a different responsibility.

### `components/ai-coach/chat/AIBubble.tsx`

- Import `extractTurnConcept` from `@/lib/ai-practice/correction` and `SaveConceptChip`.
- After the existing `const saveables = extractTurnSaveables(message.toolCalls);`:
  `const concept = extractTurnConcept(message.toolCalls);`
- New prop on `AIBubbleProps`:
  `onSaveConcept: (title: string, body: string) => Promise<void>;`
- Render below the existing `SaveChips` line:

  ```tsx
  {concept && (
    <SaveConceptChip
      onSave={() => onSaveConcept(concept.title, proseBody || fullText)}
    />
  )}
  ```
- Update the "Planned structure" comment block to list `<SaveConceptChip />` after `<SaveChips />`.

### Prop threading (same path `saveSaveable` already travels)

1. `hooks/useSavedWords.ts` — add:

   ```ts
   const saveConcept = useCallback(
     async (title: string, body: string) => {
       if (!userId) throw new Error("Not authenticated");
       await persistConcept(userId, title, body);
     },
     [userId],
   );
   ```
   Add `saveConcept` to the returned `useMemo` object and its dependency array.

2. `hooks/useAIPractice.ts` — re-export `saveConcept: words.saveConcept` in its return object
   (line ~213, next to `saveSaveable`), and add it to the hook's public type (line ~38).

3. `components/ai-coach/AICoachPanel.tsx` — pull `saveConcept` out of the hook (line ~57) and
   pass it into both view prop bags (lines ~189 / ~199 area) and their `useCallback` dep arrays.

4. `components/ai-coach/AICoachPanelViews.tsx` — add `saveConcept: (title: string, body: string) => Promise<void>;`
   to **both** view prop types (the one near line 34 and the one near line 118), and pass
   `onSaveConcept={p.saveConcept}` where `onSaveSaveable={p.saveSaveable}` is passed (lines ~53, ~151).

5. `components/ai-coach/ChatView.tsx` — add `onSaveConcept` to props (near line 23), destructure
   it (near line 38), forward it to `MessageBubble` (near line 125).

6. `components/ai-coach/MessageBubble.tsx` — add `onSaveConcept` to props (near line 19),
   destructure (near line 32), forward to `AIBubble` (near line 65).

`usePronunciationCoach` does not render concept chips (its bubbles never carry an
`annotate_turn.concept`), so it is left untouched.

## UI: Guardadas ("Mi inglés")

### `lib/ai-coach/saveables/persist.ts` — new `persistConcept`

```ts
import { saveTrackedItem } from "@/lib/tracking/queries";
import { AI_COACH_SOURCE } from "./source";

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Saves a coach explanation as a reference note in Guardadas. The body is the
 * coach message's rendered prose; the title is what the coach labelled it.
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

### `components/tracking/TrackingToolbar.tsx`

Add to `FILTERS`, after `{ id: "lesson", label: "Lecciones" }`:

```ts
{ id: "explanation", label: "Explicaciones" },
```

### `hooks/useTracking.ts`

In the `saved` map (the `trackedItems.map(...)` block), the item is built generically already.
Adjust so `explanation` renders its body and carries no "Guardada" progress badge:

```ts
const isExplanation = trackedItem.kind === "explanation";
const item: TrackingItem = {
  id: trackedItem.id,
  kind: trackedItem.kind,
  title: canonicalTitle,                       // for explanation: title ?? ref
  description: isExplanation
    ? (typeof trackedItem.payload.body === "string" ? trackedItem.payload.body : null)
    : (typeof trackedItem.payload.context === "string" ? trackedItem.payload.context : null),
  href: trackedItem.kind === "lesson" ? resolveLessonHref(trackedItem.ref, trackedItem.payload) : undefined,
  progressState: isExplanation ? undefined : "saved",
  progressLabel: isExplanation ? undefined : WORD_PROGRESS_LABELS.saved,
  fromCoach: isFromCoach(trackedItem),
};
```

`canonicalTitle` already falls back to `trackedItem.title ?? trackedItem.ref` for non-lesson kinds.

### `components/tracking/TrackingCard.tsx`

- `registry`: add `explanation: { label: "Explicación", icon: Lightbulb }` (import `Lightbulb`
  from `@/components/icons`; if unavailable use `BookMarked`).
- New render branch for `item.kind === "explanation"`:
  - Icon tile + title + `Badge label="Explicación"` + `✦ coach` badge (the `fromCoach` badge
    already renders for any kind).
  - Body: `item.description` rendered with `whitespace-pre-line`, `line-clamp-3` when collapsed;
    a **Ver más / Ver menos** text button toggling a local `useState(false)`.
  - No IPA, no pencil/edit.
  - **Delete** button (reuses the same `Trash2` affordance styling as the word delete), calling
    a new `onDeleteExplanation(source)` prop.
- If this branch pushes the file toward 250 lines, extract `ExplanationCardBody` into
  `components/tracking/ExplanationCardBody.tsx` (title + clamped body + toggle).

`TrackingCardProps` gains:

```ts
onDeleteExplanation: (source: TrackingReviewSource) => void;
```

### `components/tracking/TrackingClient.tsx`

- New state: `const [deletingExplanation, setDeletingExplanation] = useState<TrackingReviewSource | null>(null);`
- Pass `onDeleteExplanation={setDeletingExplanation}` to `TrackingCard`.
- Render a small confirm dialog (styled like `DeleteWordDialog` — reuse it if it accepts a
  generic label, otherwise a minimal parallel `DeleteExplanationDialog`) that on confirm calls:

  ```ts
  await removeTrackedItem(userId, "explanation", source.trackedItem.ref);
  setDeletingExplanation(null);
  ```
  Import `removeTrackedItem` from `@/lib/tracking/queries` (alongside the existing
  `saveTrackedItem` import).
- `filteredSources` / `hasCategoryItems`: the existing `filter === filter` kind check already
  covers `"explanation"` (it is not `"all"` and not `"ai_coach"`), so
  `reviewSources.filter((s) => s.item.kind === filter)` works with no change.

### `components/tracking/TrackingEmptyState.tsx`

Add before the final `return`:

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

## Review queue exclusion — `lib/tracking/review-queue.ts`

`buildTrackingReviewQueue` currently treats anything that is not `word`/`phrase` as a lesson
(the fall-through after the `phrase` block). Add an explicit guard **before** that fall-through:

```ts
if (source.item.kind === "explanation") continue; // reference-only, never reviewable
```

Effect: explanations never enter `items` or `exercises`, produce no `skipped` entry, and
`Repasar (N)` ignores them. `TrackingClient`'s `canReview` / `availableReviewCount` derive from
`reviewQueue.exercises`, so no further change there.

## Error handling

| Case | Behavior |
| - | - |
| Chip save fails (real write error / quota) | `SaveConceptChip` → `error` state, `Guardar explicación · reintentar`, tap retries. `persistConcept` throws on real failure. |
| Offline | Dexie write succeeds and the upsert is queued in the outbox. Not an error path; chip shows `Guardada`. |
| Malformed `concept` from the model (missing/blank title) | `parseTurnConcept` → `undefined`; no chip; message prose still renders. Never throws. |
| Duplicate save of the same concept | `saveTrackedItem` upserts on `user_id,kind,ref`; `updatedAt` bumps, no dup row; chip shows `Guardada`. |
| Delete of an explanation mid-sync | `removeTrackedItem` enqueues a delete op; `unresolvedTrackedItemIds` protects it from a stale server snapshot during `hydrateTrackedItems`. |

## Testing

- `lib/ai-practice/tools/__tests__/registry.test.ts` — `parseTurnConcept`: valid title trims and
  returns `{ title }`; missing / blank / non-string title → `undefined`; `annotate_turn` still
  parses when `concept` is absent.
- `lib/ai-practice/__tests__/correction.test.ts` — `extractTurnConcept` returns the concept, or
  `null` when the tool call is absent / errored.
- `lib/ai-coach/saveables/__tests__/persist.test.ts` — `persistConcept` writes a
  `kind: "explanation"` row with `payload.body` and `payload.source === "ai_coach"`; a second
  call with the same title upserts (asserts single row, `ref` stable).
- `components/ai-coach/__tests__/SaveConceptChip.test.tsx` — `idle → saving → saved`; error path
  shows retry and re-invokes `onSave`.
- Bubble test (`components/ai-coach/__tests__/` — extend the existing AIBubble/ChatView suite) —
  concept chip renders only when a turn carries `annotate_turn.concept`; `onSaveConcept` is
  called with `(title, proseBody)`.
- `components/tracking/__tests__/TrackingClient.test.tsx` — the "Explicaciones" filter shows only
  `explanation` items; those items also appear under the "Del coach" filter; they do not change
  the "Repasar" count.
- `lib/tracking/__tests__/review-queue.test.ts` — an `explanation` source yields no exercise and
  no `skipped` entry.
- `components/tracking/__tests__/TrackingCard.test.tsx` — explanation card renders title +
  clamped body + "Ver más" toggle; the delete button invokes `onDeleteExplanation`.

## Files

### New

- `supabase/migrations/<timestamp>_tracked_items_allow_explanation.sql`
- `components/ai-coach/SaveConceptChip.tsx`
- `components/ai-coach/__tests__/SaveConceptChip.test.tsx`
- (conditional) `components/tracking/ExplanationCardBody.tsx` — only if `TrackingCard` approaches 250 lines
- (conditional) `components/tracking/DeleteExplanationDialog.tsx` — only if `DeleteWordDialog` cannot be reused generically

### Modified

- `lib/tracking/types.ts`
- `lib/tracking/review-queue.ts`
- `lib/tracking/queries.ts` — no signature change; touched only if an import needs re-exporting (likely none)
- `lib/ai-practice/tools/declarations.ts`
- `lib/ai-practice/tools/registry.ts`
- `lib/ai-practice/correction.ts`
- `lib/ai-prompts.ts`
- `lib/ai-coach/saveables/persist.ts`
- `hooks/useSavedWords.ts`
- `hooks/useAIPractice.ts`
- `hooks/useTracking.ts`
- `components/ai-coach/AICoachPanel.tsx`
- `components/ai-coach/AICoachPanelViews.tsx`
- `components/ai-coach/ChatView.tsx`
- `components/ai-coach/MessageBubble.tsx`
- `components/ai-coach/chat/AIBubble.tsx`
- `components/tracking/TrackingToolbar.tsx`
- `components/tracking/TrackingCard.tsx`
- `components/tracking/TrackingClient.tsx`
- `components/tracking/TrackingEmptyState.tsx`

## Out of scope

- Editing a saved explanation's text.
- Reviewing explanations in an SRS format.
- Auto-saving explanations without a tap.
- Backfilling explanations from past coach conversations.
- Giving saved phrases a delete button (noted as a nearby gap; not part of this change).
