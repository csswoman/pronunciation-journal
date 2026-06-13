# Plan 011: Move COURSE_PATH_CURRICULUM out of the client bundle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- components/courses/CoursePathPage.tsx lib/courses/curriculum.ts`
> If either file changed significantly, compare the current import against the
> excerpt below before proceeding.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: performance
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`components/courses/CoursePathPage.tsx` is a `"use client"` component that
statically imports `COURSE_PATH_CURRICULUM` from `lib/courses/curriculum.ts`
(487 lines of static data). This serializes the entire curriculum JSON into
every client bundle, even though the data never changes at runtime and could be
passed as a prop from a Server Component. Moving the fetch to the server
eliminates the payload from the client bundle entirely.

## Current state

### `components/courses/CoursePathPage.tsx` line 5

```ts
"use client";
// ...
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
```

`COURSE_PATH_CURRICULUM` is used to render the course path UI — it is the
single data source for the entire component tree.

### `lib/courses/curriculum.ts`

487 lines of static exported data (`COURSE_PATH_CURRICULUM`). No server-only
imports. Can be imported anywhere safely.

### `components/courses/CoursePathElectiveTrack.tsx` and `CoursePathLevelPanel.tsx`

Both import `countPriorityLessons` from `@/lib/courses/buildCurriculum` — a
pure function, not data. This is fine as-is; no change needed for those imports.

### `components/courses/CoursePathLessonRow.tsx` and `CoursePathLevelPanel.tsx`

Import `studyLessonPath` from `@/lib/courses/curriculumIndex` — a pure utility
function, not data. Also fine.

### The calling page

Find the page that renders `<CoursePathPage>` by running:
```bash
grep -r "CoursePathPage" app/ --include="*.tsx" -l
```
Read that page to understand how to pass the curriculum as a prop.

## Scope

**In scope**:
- The page file that renders `<CoursePathPage>` (Server Component — add data fetch)
- `components/courses/CoursePathPage.tsx` (add prop, remove import)
- Add a `CourseCurriculumData` type or use the existing exported type from `lib/courses/types.ts`

**Out of scope**:
- `lib/courses/curriculum.ts` — do not modify the data file
- `CoursePathElectiveTrack.tsx`, `CoursePathLevelPanel.tsx`, `CoursePathLessonRow.tsx` — these import pure functions, not data; leave them as-is
- Any Supabase query changes

## Git workflow

- Branch: `advisor/011-curriculum-server-only`
- Commit: `perf(courses): pass curriculum from server to client via prop`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Find and read the calling page

Run: `grep -r "CoursePathPage" app/ --include="*.tsx" -l`

Read the page file. Confirm it is a Server Component (no `"use client"` at top).

### Step 2: Update `CoursePathPage` to accept curriculum as a prop

In `components/courses/CoursePathPage.tsx`:

1. Remove: `import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";`
2. Add the curriculum as a prop. Use the type of `COURSE_PATH_CURRICULUM`
   (check `lib/courses/types.ts` for an appropriate exported type, or use
   `typeof COURSE_PATH_CURRICULUM` imported as a type-only import).
3. Replace all references to the module-level `COURSE_PATH_CURRICULUM` with
   the prop value.

**Verify**: `pnpm type-check` → exit 0

### Step 3: Update the calling page to import and pass the curriculum

In the Server Component page that renders `<CoursePathPage>`:

```ts
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
// ...
<CoursePathPage curriculum={COURSE_PATH_CURRICULUM} ... />
```

**Verify**: `pnpm type-check` → exit 0

### Step 4: Full verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
```

## Test plan

No new tests required. `pnpm type-check` verifies the prop contract is correct.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep "COURSE_PATH_CURRICULUM" components/courses/CoursePathPage.tsx` returns 0 matches
- [ ] The import appears in the server-side page file instead
- [ ] Only the calling page and `CoursePathPage.tsx` are modified

## STOP conditions

- `CoursePathPage` uses `COURSE_PATH_CURRICULUM` in more than one place that
  can't be covered by a single prop — note all usages and ensure the prop
  covers them all before proceeding.
- The calling page is itself a `"use client"` component — STOP and report:
  the fix requires finding a higher-level Server Component to own the data.
- `pnpm type-check` fails because the prop type is complex to express — STOP
  rather than using `any`.

## Maintenance notes

- If additional `"use client"` components in the courses domain import
  `COURSE_PATH_CURRICULUM` directly in the future, apply the same prop-passing
  pattern — the data belongs in the server layer.
- `countPriorityLessons` and `studyLessonPath` are pure functions, not data,
  and are acceptable to import in client components.
