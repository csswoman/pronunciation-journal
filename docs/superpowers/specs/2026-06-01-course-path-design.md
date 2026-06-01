# Course path (A2–C1) — design spec

**Date:** 2026-06-01  
**Reference:** `english-journal-course-path.html` (L1–221)

## Goal

Reintroduce **Courses** as a CEFR learning path (Curso → Unidad → Lección), matching the HTML prototype layout while using app design tokens (`--primary`, `--surface-*`, `--font-editorial`, `--success`).

## Architecture

| Layer | Responsibility |
|--------|----------------|
| `lib/courses/curriculum.ts` | Static A2–C1 units and lessons (from prototype DATA) |
| `lib/courses/progress.ts` | Derive unit/lesson states from completion set |
| `hooks/useCoursePathProgress.ts` | IndexedDB `completedLessons` keyed by `levelId` + `lessonId` |
| `app/styles/course-path.css` | Scoped BEM layout (same pattern as `sound-lab.css`) |
| `components/courses/CoursePathPage.tsx` | Client UI: spine, units, lessons, why block |
| `app/courses/page.tsx` | Route shell |
| `app/courses/lesson/[slug]/page.tsx` | Theory lesson reader when `theory_lessons.slug` exists |

## Data

- **Path structure:** static JSON/TS (no new migration).
- **Lesson content:** optional `slug` on path lessons → `theory_lessons` via existing table.
- **Progress:** local Dexie (`markLessonComplete(levelId, lessonId)`).

## UI mapping (prototype → tokens)

- Background radial glow → `color-mix(primary)` + `surface-base`
- Spine active pill → `primary` / `on-primary`
- Unit ring progress → `conic-gradient(primary)`; done → `success`
- Surfaces → `surface-raised` / `surface-sunken`
- Headings → `font-editorial` (Fraunces)
- Body → `font-sans` (DM Sans)

## Routes

- `/courses` — path home
- `/courses/lesson/[slug]?level=&lesson=` — content + mark complete
- `/mini-lessons` — unchanged (separate product surface)
- Redirects: legacy `/courses/mini-lessons/*` → `/mini-lessons`

## Out of scope (v1)

- New DB tables for units/courses
- Server-synced progress
- Seeding all path lessons into `theory_lessons` (add `slug` incrementally)

## Success criteria

- Visual parity with prototype (spine, collapsible units, lesson rows, why block)
- Theme hue/accent follows user settings
- First incomplete lesson = current; completion unlocks next lesson/unit
- Nav includes Courses → `/courses`
