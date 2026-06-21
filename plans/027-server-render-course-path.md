# Plan 027: Stop serializing the complete curriculum through a Client Component

> **Executor instructions**: Follow all steps and STOP conditions. Update the
> plan index when complete.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- app/courses/page.tsx components/courses lib/courses/curriculum.ts lib/courses/curriculumIndex.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21

## Why this matters

The earlier plan 011 moved the curriculum import to a Server Component but
still passes the complete object into `CoursePathPage`, which is a Client
Component. React therefore serializes the full curriculum across the RSC
boundary. The generated `/courses.rsc` is 38.9 KB and `/courses.html` is
49.1 KB. The page should server-render curriculum content and reserve client
JavaScript for level selection and IndexedDB progress only.

## Current state

- `app/courses/page.tsx:1-5` imports `COURSE_PATH_CURRICULUM` and passes the
  whole object to `<CoursePathPage curriculum={...} />`.
- `components/courses/CoursePathPage.tsx:1` is `"use client"`.
- `CoursePathPage.tsx:20-48` owns level state and reads every completed lesson
  from Dexie.
- `CoursePathPage.tsx:50-139` renders both static curriculum content and
  interactive controls.
- `lib/courses/curriculum.ts` is a 21 KB static data module.
- Follow the repo rule: pages compose; domain rendering belongs in components.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test -- components/courses lib/courses` | all pass |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope**:

- `app/courses/page.tsx`
- `components/courses/CoursePathPage.tsx`
- New server/client components under `components/courses/`
- Course component tests
- `docs/architecture/performance.md`

**Out of scope**:

- Curriculum content changes
- Lesson route changes
- Migrating Dexie completion state to Supabase
- Visual redesign

## Git workflow

- Branch: `codex/027-server-render-course-path`
- Commit: `perf(courses): server-render curriculum path`

## Steps

### Step 1: Lock down behavior

Add tests for:

- default A1 level;
- selecting another CEFR level;
- deepest level with local progress becoming active after hydration;
- completion badges updating from Dexie;
- elective tracks, rationale section, and legend remaining visible.

**Verify**: focused course tests pass before structural changes.

### Step 2: Make the static page tree a Server Component

Remove `"use client"` from the component responsible for the complete course
page. It should import `COURSE_PATH_CURRICULUM` directly on the server and
render static hero, selected level content, rationale, and legend.

Use a URL search parameter such as `?level=b1` as the server-readable source of
truth for selected level. Validate it with the existing CEFR types and fall
back to A1. Render level navigation with links so selection does not require
shipping the curriculum object to the browser.

If product requirements demand instant client switching without navigation,
use a small client navigator that receives only level IDs/labels and server
rendered children—not the curriculum object.

**Verify**: no Client Component accepts `CoursePathCurriculum` as a prop.

### Step 3: Isolate Dexie progress

Move completed-lesson reads into a focused Client Component or hook that
receives only the lesson keys visible on the selected level. Do not call
`db.completedLessons.toArray()` if an indexed `anyOf`/key lookup can retrieve
the visible subset.

The active-level auto-selection based on progress may redirect/replace the URL
once after hydration only when no explicit `level` parameter exists. Prevent
navigation loops.

**Verify**: tests cover explicit URL precedence and progress-derived fallback.

### Step 4: Measure output

Run production build and compare `/courses.rsc`, `/courses.html`, and route
client gzip against:

- RSC: 38.9 KB
- HTML: 49.1 KB
- client chunks: 207.6 KB gzip

At minimum, the client manifest must no longer include the complete curriculum
module and RSC output must decrease.

### Step 5: Full gate

Run all standard verification commands. Record measurements in
`docs/architecture/performance.md`.

## Test plan

- URL validation and fallback.
- Client progress island with no rows and with completed rows.
- Explicit level query wins over local progress.
- Server-rendered curriculum content remains accessible without JavaScript.

## Done criteria

- [ ] No complete curriculum object crosses a client boundary.
- [ ] Static course content is server-rendered.
- [ ] Dexie progress is isolated to a small client island.
- [ ] `/courses.rsc` is below 38.9 KB.
- [ ] Course route client gzip is below 207.6 KB.
- [ ] Full verification suite passes.

## STOP conditions

- URL-based level selection violates a confirmed product requirement.
- Server-rendered children still serialize the same data volume through a
  client boundary.
- Progress state cannot be queried by visible lesson keys with the current
  Dexie schema; report the missing index before changing schema.

## Maintenance notes

Static datasets should stay on the server side of RSC boundaries. Type-only
imports and small navigation metadata are acceptable client inputs.
