# Learning Focus — Design Spec

**Date:** 2026-08-12  
**Status:** Approved for planning  
**Register:** product  
**Sub-project:** A of connected-content focus (A → B catalog lens → C content suggestions)

## Problem

The evidence loop already connects **exercises** to Daily, Review, and Progress. Content surfaces (decks, mini-lessons, course path, Sound Lab, Essential Words) still feel disconnected: there is no shared “what I’m working on,” catalog indexes ignore progress, and self-reported “I already know this” for **theory topics** is not a durable, synced checklist that feeds review the way word familiarity does.

Level signals are fragmented today (`user_profiles.cefr_level`, `learningState.level`, course `?level=`, local catalog filters). Suggestions for **content** (not exercise steps) do not exist yet on those routes.

## Goal

Ship a **canonical learning focus** plus **theory topic claims**, so the app can later prioritize and suggest without hiding content.

**Success criteria**

- Home shows one coherent focus (level + optional thread).
- User can pin / unpin; when unpinned, the app’s suggestion drives the effective focus.
- User can mark theory topics as “already know”; they enter delayed verification / review, not instant mastery.
- Mastery remains evidence-based (practice grades / SM-2), never self-report alone.
- Other surfaces can read `getEffectiveFocus` without inventing their own level source.
- Offline: pin and claims work via Dexie + outbox.

## Non-goals (v1)

- Catalog lens / sections (“Hoy”, “Dominados”) on `/practice/decks` — sub-project B
- Content suggestion engines on decks, mini-lessons, ruta, Sound Lab — sub-project C
- Essential Words as a focus thread
- Hiding content outside the focus level
- Replacing Daily plan orchestration
- Writing self-report claims directly into `topic_srs` as `mastered`
- Shell / sidebar focus editor
- Auto-completing or bulk-marking lessons/topics when profile or focus level changes
- Syncing Home focus level edits back into `user_profiles.cefr_level` (profile remains the place to change “Tu nivel”)

## Decisions (from brainstorming)

| Topic | Choice |
|---|---|
| Scope slice | Canonical focus identity first |
| Focus shape | CEFR level + optional thread |
| Thread kinds (v1) | `theory` \| `sound` |
| Control model | Hybrid: app suggests; user pins / releases |
| Control UI | Home only |
| Architecture | New `learning-focus` domain (not stuffing into `cefr_level` alone) |
| Topic claims | Pattern like words: claim → verification another day → mastery via evidence |
| Claim storage (v1) | `learningState.theory.concepts` (Daily `study_deck` already reads this) |

## Data model

### Effective focus

```ts
type FocusThread =
  | { kind: 'theory'; topicId: string } // canonical theory topic id, e.g. theory:{deckSlug} or course concept id — pick one mapping in implementation plan
  | { kind: 'sound'; key: string }      // contrast or phoneme key used by Sound Lab weak-sound signals

type LearningFocus = {
  level: 'a1' | 'a2' | 'b1' | 'b2' | 'c1'
  thread: FocusThread | null
  pinned: boolean
  suggested: {
    level: LearningFocus['level']
    thread: FocusThread | null
    source: FocusSource
  }
  source: FocusSource // source of the pinned/manual override when pinned; else mirrors suggested
  updatedAt: string
}

type FocusSource =
  | 'assessment'
  | 'manual'
  | 'route'
  | 'recent_practice'
  | 'sound_weak'
  | 'profile'
```

**Effective focus**

- If `pinned` → `{ level, thread }` from the top-level fields (last manual / pinned override).
- Else → `{ level, thread }` from `suggested` only (ignore top-level `level`/`thread` for consumers).
- Top-level `level`/`thread` may still retain the last manual values while unpinned so re-pin can restore them; they are not the effective focus until `pinned` is true again.

### Persistence

- **Dexie:** local row keyed by `userId` (new table or namespaced key in existing user meta — prefer dedicated table `learningFocus` for clarity).
- **Supabase:** user-scoped table `learning_focus` (1 row per user) with RLS (`auth.uid() = user_id`). Sync via outbox like other user data.
- **Inputs, not replacements:** `user_profiles.cefr_level` and `learningState.level` remain. Focus **reads** them when deriving suggestions. Focus is the canonical “working on” for product UX.

### Theory topic claims

Reuse the assessment / concept-signal vocabulary already used by Daily:

- Claim “ya sé” → concept signal status **`review`** (or equivalent) with a **deferred due** (same spirit as word `verification_due_at`, e.g. +1 day), never `mastered` from self-report alone.
- Persist via existing `learningState.theory.concepts` + outbox path used by `persistAssessmentConceptProfile` (extend rather than fork).
- Rehydrate checklist from existing assessment concept ratings when present.
- Copy must state: review will check it later; mastery is earned by practice.

**Explicit deferral:** bridge from claims → `topic_srs` rating events is **out of v1** (avoids dual-write ambiguity until evidence owners are unified).

## Suggestion algorithm (unpinned only)

When deriving `suggested`, first match wins:

1. Latest assessment / profile CEFR (if available)
2. Next incomplete lesson level on Course Path (route progress)
3. Most recent theory or sound practice session
4. Current weak sound signal (Sound Lab)
5. Fallback: `a1`, no thread

Pinning freezes effective level/thread until the user releases. Releasing recalculates suggested immediately.

## Level vs progress vs exploration

Three distinct concepts — do not collapse them:

| Concept | Meaning | Who sets it | Effect of changing it |
|---|---|---|---|
| **Profile level** | “Tu nivel” (placement / self-declared CEFR in profile or assessment) | Profile settings, assessment | Updates recommendations / default focus inputs. **Never** bulk-completes lessons, never wipes SRS, never marks lower-level content as done. |
| **Focus** | “En qué estoy trabajando” (level + optional thread) | Home focus card (pin/suggest) | Soft lens for Daily bias and later catalog suggestions. Exploring other levels’ content does **not** require changing profile level or focus. |
| **Progress** | Completions, claims, SRS, verification queues | Practice, claims, review | Independent evidence. Only grows from real activity or explicit topic claims — not from a level dropdown. |

**Copy policy when changing level**

- **Do not** use an aggressive warning like “si cambias de nivel se marcará el contenido como completado” — that behavior must not exist.
- **Profile level change:** quiet helper text only, e.g. “Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido.”
- **Focus level change (Home):** even quieter — it pins focus for prioritization; no progress rewrite, no completion cascade.
- Free exploration of mazos / ruta / mini-lecciones at any level remains allowed without touching profile level.

Changing focus level does **not** auto-claim or auto-complete topics below the new level. If the user wants lower topics treated as known, they use **Temas que ya sé** explicitly.

## UX — Home “Tu foco”

Compact block near the daily plan (not a dashboard metric strip):

- Status line: level + optional thread label
- Quiet badge: `Sugerido` | `Fijado`
- Actions:
  - Change **focus** level → sets override level, `pinned = true`, `source = manual` (does **not** rewrite profile CEFR in v1)
  - Choose / clear thread (theory topics for focus level, or recent/weak sounds) → pin
  - Pin / Release
  - “Temas que ya sé” → inline sheet with checkboxes for theory topics in the focus level
- No mandatory modal; one primary action per zone
- Does not filter or hide other routes
- Optional quiet hint when focus level ≠ profile level, with link to profile (“Tu nivel”) — non-blocking

**Profile settings (existing CEFR control)**

- Keep manual level change in profile.
- Add quiet helper (not a blocking confirm): progress is preserved; changing level only adjusts recommendations / suggestion inputs.
- No completion cascade UI, because there is no completion cascade behavior.

## Module boundaries

```
lib/learning-focus/
  types.ts
  derive-suggested-focus.ts   // pure
  effective-focus.ts          // pure
  claims.ts                   // claim → learningState.theory (no mastered)
  queries.ts                  // Dexie read/write + sync hooks
  apply.ts                    // pure apply for remote payloads if needed

components/home/
  LearningFocusCard.tsx
  LearningFocusTopicsSheet.tsx
```

**Read API for later sub-projects**

- `getEffectiveFocus(userId)`
- `listClaimedTheoryTopics(userId)`

Daily may optionally bias `study_deck` toward effective level/thread if a trivial hook exists; **no** Daily composer rewrite in v1.

## Error / edge cases

| Case | Behavior |
|---|---|
| Offline pin/claim | Optimistic UI + outbox |
| No assessment | Suggest from profile CEFR or `a1` |
| Orphan thread (deleted topic/sound) | Clear thread; keep level |
| Release with empty suggested | Re-run derive immediately |
| Claim already mastered by evidence | Keep evidence mastery; claim is no-op or shows as already strong |
| Profile CEFR changed manually | Re-derive suggested focus if unpinned; **never** mutate completions / SRS / claims |
| User browses other CEFR content | Allowed; does not change profile level or focus unless they pin |

## Testing

- Unit: pinned vs suggested effective focus; derive priority order; claim never sets `mastered`
- Component: Home card pin/unpin; topics sheet claim updates state
- No required E2E in v1

## Rollout / follow-ons

| Phase | Work |
|---|---|
| **A (this spec)** | Focus identity + Home control + theory claims → review path |
| **B** | Catalog lens: reorder/sections without hiding (decks, mini-lessons, …) |
| **C** | Content suggestions per route consuming effective focus |
| Later | Essential Words thread; optional claims → `topic_srs` bridge |

## Open implementation details (resolve in plan, not product ambiguity)

1. Exact `topicId` string form for theory threads (deck slug vs course concept id) — must match `theory-targets` / concept profile keys.
2. Dexie schema version bump vs reuse of an existing meta store.
3. Supabase migration name and RLS policies.
4. Precise deferred-due duration for topic claims (default proposal: 1 day, aligned with lexicon “known”).
