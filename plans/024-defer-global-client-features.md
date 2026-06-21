# Plan 024: Defer global client features until the user opens them

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update this plan's status in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- app/layout.tsx components/layout/AppShell.tsx components/ai-coach/AICoachPanel.tsx components/vocabulary/words/QuickAddModal.tsx`
> If these files changed, compare the current code with the facts below before
> proceeding. Stop if the mounting contract is no longer the same.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21
- **Completed**: 2026-06-21, implementation commit `26c3d55`

## Why this matters

The root layout mounts `AppShell` on every non-auth route. `AppShell` statically
imports the complete AI Coach and Quick Add modal, and mounts the AI Coach as
soon as a user session exists even when its panel is closed. The production
build measured 679.0 KB raw / 196.6 KB gzip of root-layout JavaScript, while
route totals ranged from 207.6 KB to 299.5 KB gzip. Deferring optional global
features reduces initial download, parse, hydration, IndexedDB reads, and
effects on every route.

## Current state

- `app/layout.tsx:73-76` wraps the whole application in `AuthProvider`,
  `ThemeProvider`, and `AppShell`.
- `components/layout/AppShell.tsx:7-12` statically imports `QuickAddModal`,
  `AICoachPanel`, and `AICoachTrigger`.
- `components/layout/AppShell.tsx:71-82` mounts those components whenever
  `user` exists, regardless of whether either surface is open.
- `components/ai-coach/AICoachPanel.tsx:62-64` reads the 30 most recent
  conversations on mount and repeats the read when message count or
  conversation id changes.
- The UI must preserve the current global keyboard shortcut, AI Coach launch
  actions, panel state after first open, and mobile/desktop behavior.
- Dynamic client UI should use `next/dynamic`; interactive state remains in
  Zustand/React according to `CLAUDE.md`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Focused tests | `pnpm test -- components/layout` | all pass |
| Full tests | `pnpm test` | 735 or more tests pass |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:

- `components/layout/AppShell.tsx`
- `components/layout/__tests__/AppShell.test.tsx` (create if absent)
- `components/ai-coach/AICoachPanel.tsx`
- A small loading fallback component under `components/ai-coach/` only if
  required by `next/dynamic`

**Out of scope**:

- Auth architecture in `components/auth/AuthProvider.tsx`
- AI Coach business logic, prompts, persistence format, or API routes
- Quick Add behavior or API contracts
- Visual redesign

## Git workflow

- Branch: `codex/024-defer-global-client-features`
- Commit: `perf(shell): defer optional global client features`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add characterization tests for mount behavior

Create `components/layout/__tests__/AppShell.test.tsx`. Mock authentication,
pathname, the AI Coach store, Quick Add, panel, trigger, sidebar, and bottom
navigation. Cover:

1. A signed-in user with both surfaces closed does not mount Quick Add or the
   AI Coach panel.
2. Opening Quick Add mounts its chunk and modal.
3. Opening or launching AI Coach mounts the panel.
4. Closing AI Coach after first mount keeps it mounted so active chat state is
   not discarded.
5. Public auth paths still render only children.

**Verify**: `pnpm test -- components/layout/__tests__/AppShell.test.tsx` → all
new tests pass.

### Step 2: Convert optional surfaces to dynamic imports

In `AppShell.tsx`, replace static imports of `QuickAddModal` and
`AICoachPanel` with `next/dynamic`. Preserve named-export handling for
`QuickAddModal`. Keep `AICoachTrigger` eagerly available because it is the
control that opens the deferred feature.

Render Quick Add only while `open === true`. Add a sticky
`hasMountedCoach` state/ref that becomes true when `isPanelOpen` is true or a
launch request exists. Render `AICoachPanel` only after that condition has
occurred once.

Do not make `AppShell` async and do not move user state into a new store.

**Verify**: `pnpm type-check` and the focused AppShell test both exit 0.

### Step 3: Avoid conversation reads before panel visibility

In `AICoachPanel.tsx`, guard the conversation-history effect so it performs no
IndexedDB read while `isOpen` is false. Keep existing refresh behavior while
the panel is active. Add or update a focused test proving
`getRecentConversations` is not called while closed.

**Verify**: `pnpm test -- components/ai-coach components/layout` → all pass.

### Step 4: Record the bundle delta

Run `pnpm build`. Use the generated
`.next/server/app/page_client-reference-manifest.js` and files under
`.next/static/chunks/` to compare the root route's gzip total with the baseline
in `docs/architecture/performance.md`. Update that document's measurement
history with the new commit and totals.

Expected: optional AI Coach modules are no longer part of the initial route
chunk set, and initial gzip is lower than the 299.5 KB `/page` baseline.

**Verify**: `pnpm build` exits 0 and the documentation contains both before and
after values.

### Step 5: Run the full gate

Run:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
pnpm build
```

All commands must exit 0.

## Test plan

- New AppShell tests listed in Step 1.
- AI Coach effect test proving no IndexedDB work while closed.
- Existing global keyboard shortcut behavior remains covered or receives a
  regression test if none exists.
- No snapshot-only tests; assert mount calls and visible controls.

## Done criteria

- [x] Quick Add and AI Coach panel are dynamically imported.
- [x] Neither optional surface mounts during the default closed state.
- [x] AI Coach state survives closing after first open.
- [x] `getRecentConversations` is not called before the panel opens.
- [x] Production initial-route gzip is below the recorded baseline.
- [x] Full verification suite exits 0.
- [x] No files outside Scope plus `docs/architecture/performance.md` and
      `plans/README.md` are modified.

## STOP conditions

- A launch flow can request AI Coach without updating `isOpen` or `launch`.
- Deferring the panel loses an active conversation after close/reopen.
- The generated build manifest cannot prove the optional chunk was separated.
- Fixing the behavior requires changing AI APIs or persistence schemas.

## Maintenance notes

New globally available tools must follow the same rule: keep the trigger small,
defer the feature implementation, and avoid mounting data subscriptions while
closed. Reviewers should inspect both bundle movement and state preservation.
