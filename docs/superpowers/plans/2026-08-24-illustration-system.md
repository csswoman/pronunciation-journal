# Illustration System (Koboyo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app's real empty states hand-drawn Koboyo illustrations through one central, typed registry, replacing the icon/emoji placeholders currently used, and unbreak the build in a maintainable way.

**Architecture:** A single `lib/illustrations/registry.ts` maps semantic `IllustrationKey`s to SVGR-imported React components saved under `components/illustrations/`. Feature components never import a `.svg` directly — they look up `ILLUSTRATIONS[key]` and pass it to the existing `EmptyState` wrapper. Icons are sourced from Koboyo (MCP) at dev time only; production has zero runtime dependency on Koboyo.

**Tech Stack:** Next.js 16 App Router, React 19, SVGR (`@svgr/webpack`), TypeScript, Vitest, Koboyo MCP server (icon search only, dev-time).

---

## Before you start

The Koboyo MCP server must be connected and its tools loaded in your session (config lives in `.claude.json`, added via `claude mcp add`). If a tool named something like `mcp__koboyo__search_icons` (exact name may differ — check your available tools) is not present, **restart your Claude Code session** before starting Task 2 — MCP tools only load at session start, not mid-session.

Every task that searches Koboyo follows the same loop (see spec `docs/superpowers/specs/2026-08-24-illustration-system-design.md`, "Flujo de trabajo por icono"):
1. Search Koboyo by the concept keyword given in the task.
2. Pick the best hand-drawn, "Original"-style match (style consistency across all icons — do not mix Original/Cartoon/Solid).
3. Save the SVG to the exact path given in the task.
4. Add the registry entry.
5. Wire the destination component.

If Koboyo has no reasonable match for a concept, stop and ask before substituting a different concept — don't silently pick something unrelated.

---

## Task 1: Create the registry with the first entry (`emptyVocabulario`)

This task creates `lib/illustrations/registry.ts` for the first time and fixes the `WordsEmptyState.tsx` placeholder (currently `BookOpen` icon, added as a temporary build fix in commit `4a3232dc`) with a real Koboyo illustration.

**Files:**
- Create: `components/illustrations/empty-vocabulario.svg`
- Create: `lib/illustrations/registry.ts`
- Create: `lib/illustrations/__tests__/registry.test.ts`
- Modify: `components/vocabulary/words/WordsEmptyState.tsx`

- [ ] **Step 1: Search Koboyo for "vocabulario vacío"**

Search Koboyo (via the MCP tool) for the concept: **"empty word list"** or **"no words / vocabulary"**. Look for a simple hand-drawn line illustration — an open book, a blank page with a pencil, or similar — in Koboyo's "Original" style.

- [ ] **Step 2: Save the icon**

Save the chosen SVG to `components/illustrations/empty-vocabulario.svg`. Verify it's valid SVG markup (opens correctly, has a `viewBox`) by opening the file.

- [ ] **Step 3: Write the failing test for the registry**

```ts
// lib/illustrations/__tests__/registry.test.ts
import { describe, expect, it } from "vitest";
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";

describe("ILLUSTRATIONS registry", () => {
  it("has a component for every declared key", () => {
    const keys = Object.keys(ILLUSTRATIONS);
    expect(keys).toContain("emptyVocabulario");
    for (const key of keys) {
      expect(ILLUSTRATIONS[key as keyof typeof ILLUSTRATIONS]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm vitest run lib/illustrations/__tests__/registry.test.ts`
Expected: FAIL with a module-not-found error for `@/lib/illustrations/registry` (the file doesn't exist yet).

- [ ] **Step 5: Create the registry**

```ts
// lib/illustrations/registry.ts
import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";

export type IllustrationKey = "emptyVocabulario";

export const ILLUSTRATIONS: Record<IllustrationKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run lib/illustrations/__tests__/registry.test.ts`
Expected: PASS

- [ ] **Step 7: Wire `WordsEmptyState.tsx` to the registry**

Replace the `BookOpen` placeholder with the registry lookup:

```tsx
// components/vocabulary/words/WordsEmptyState.tsx
"use client";

import EmptyState from "@/components/EmptyState";
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";
import Button from "@/components/ui/Button";

const Illustration = ILLUSTRATIONS.emptyVocabulario;

export function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      illustration={<Illustration />}
      title="Tu vocabulario está vacío"
      description="Agrega tu primera palabra y empieza a construir tu lista"
      action={<Button onClick={onAdd}>Agregar palabra</Button>}
    />
  );
}
```

- [ ] **Step 8: Type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no new errors from these files (pre-existing unrelated errors in other files, e.g. `lib/ai-coach/use-webgpu-orb.ts`, are not in scope for this plan).

- [ ] **Step 9: Visual check**

Run `pnpm dev`, navigate to the vocabulary words tab with zero words, confirm the illustration renders inside `EmptyState` without layout breakage (it's capped at `max-w-50` by `EmptyState`, colored via `text-primary`).

- [ ] **Step 10: Commit**

```bash
git add components/illustrations/empty-vocabulario.svg lib/illustrations/registry.ts lib/illustrations/__tests__/registry.test.ts components/vocabulary/words/WordsEmptyState.tsx
git commit -m "feat(illustrations): add registry with emptyVocabulario from Koboyo"
```

---

## Task 2: `emptyTracking` — rewrite `TrackingEmptyState` on `EmptyState`

`TrackingEmptyState.tsx` currently uses bespoke markup (no illustration, custom classes). This task adds the Koboyo icon and migrates it to use the shared `EmptyState` wrapper for the `"word"`/`"phrase"` branch only — the `"lesson"` branch already has a CTA button and distinct copy; keep its structure but add the same illustration for visual consistency.

**Files:**
- Create: `components/illustrations/empty-tracking.svg`
- Modify: `lib/illustrations/registry.ts`
- Modify: `components/tracking/TrackingEmptyState.tsx`

- [ ] **Step 1: Search Koboyo for "lista de seguimiento vacía"**

Search for concept: **"empty checklist"** or **"empty list"**. Pick a hand-drawn line illustration in the same "Original" style as `empty-vocabulario.svg`.

- [ ] **Step 2: Save the icon**

Save to `components/illustrations/empty-tracking.svg`.

- [ ] **Step 3: Add the registry entry**

```ts
// lib/illustrations/registry.ts
import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import EmptyTracking from "@/components/illustrations/empty-tracking.svg";

export type IllustrationKey = "emptyVocabulario" | "emptyTracking";

export const ILLUSTRATIONS: Record<IllustrationKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
  emptyTracking: EmptyTracking,
};
```

- [ ] **Step 4: Run the registry test**

Run: `pnpm vitest run lib/illustrations/__tests__/registry.test.ts`
Expected: PASS (still — this test only checks every declared key resolves; it needs no changes).

- [ ] **Step 5: Rewrite `TrackingEmptyState.tsx`**

```tsx
// components/tracking/TrackingEmptyState.tsx
"use client";

import Link from "next/link";
import { Plus } from "@/components/icons";
import EmptyState from "@/components/EmptyState";
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";

interface Props {
  filter: "all" | "word" | "phrase" | "lesson";
}

const Illustration = ILLUSTRATIONS.emptyTracking;

export function TrackingEmptyState({ filter }: Props) {
  const isWords = filter === "word";
  const isPhrases = filter === "phrase";
  const title = isWords
    ? "Todavía no hay palabras aquí"
    : isPhrases
      ? "Todavía no hay frases aquí"
      : "Empieza con una palabra";

  if (filter === "lesson") {
    return (
      <EmptyState
        illustration={<Illustration />}
        title="Aún no guardaste lecciones"
        description="Explora la Ruta y guarda las lecciones a las que quieras volver."
        action={
          <Link
            href="/courses"
            className="mt-[var(--layout-stack)] inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--cta-bg)] px-5 text-body-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[var(--cta-bg-hover)]"
          >
            <Plus size={16} aria-hidden />
            Explorar Ruta
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      illustration={<Illustration />}
      title={title}
      description="No hace falta organizarla ahora. Vuelve a ella cuando quieras."
    />
  );
}
```

- [ ] **Step 6: Type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no new errors.

- [ ] **Step 7: Visual check**

Find where `TrackingEmptyState` is rendered (search usages), load each `filter` variant with no data, confirm illustration + copy + (for `"lesson"`) the CTA link all render correctly and match the app's existing empty-state spacing (via `EmptyState`'s built-in layout, so custom `.tracking-empty` CSS classes are no longer needed — check if `.tracking-empty` / `.tracking-empty__body` are used elsewhere before deciding whether to remove them from the stylesheet; if used elsewhere, leave them, don't touch unrelated CSS).

- [ ] **Step 8: Commit**

```bash
git add components/illustrations/empty-tracking.svg lib/illustrations/registry.ts components/tracking/TrackingEmptyState.tsx
git commit -m "feat(illustrations): add emptyTracking, migrate TrackingEmptyState to EmptyState"
```

---

## Task 3: `stateCompletado` — replace the 🎉 emoji in `StudyEmptyStates`

**Files:**
- Create: `components/illustrations/state-completado.svg`
- Modify: `lib/illustrations/registry.ts`
- Modify: `components/vocabulary/decks/StudyEmptyStates.tsx`

- [ ] **Step 1: Search Koboyo for "completado / celebración"**

Search for concept: **"trophy"**, **"checkmark celebration"**, or **"confetti"**. Pick one hand-drawn line illustration, "Original" style, consistent line weight with the other two saved icons.

- [ ] **Step 2: Save the icon**

Save to `components/illustrations/state-completado.svg`.

- [ ] **Step 3: Add the registry entry**

```ts
// lib/illustrations/registry.ts
import type { ComponentType, SVGProps } from "react";
import EmptyVocabulario from "@/components/illustrations/empty-vocabulario.svg";
import EmptyTracking from "@/components/illustrations/empty-tracking.svg";
import StateCompletado from "@/components/illustrations/state-completado.svg";

export type IllustrationKey = "emptyVocabulario" | "emptyTracking" | "stateCompletado";

export const ILLUSTRATIONS: Record<IllustrationKey, ComponentType<SVGProps<SVGSVGElement>>> = {
  emptyVocabulario: EmptyVocabulario,
  emptyTracking: EmptyTracking,
  stateCompletado: StateCompletado,
};
```

- [ ] **Step 4: Run the registry test**

Run: `pnpm vitest run lib/illustrations/__tests__/registry.test.ts`
Expected: PASS

- [ ] **Step 5: Replace the emoji in `StudyEmptyStates.tsx`**

```tsx
// components/vocabulary/decks/StudyEmptyStates.tsx
"use client";

import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { ILLUSTRATIONS } from "@/lib/illustrations/registry";

interface StudyEmptyStatesProps {
  phase: "loading" | "studying" | "done";
  deckName: string;
  queueLength: number;
  onClose: () => void;
}

const Illustration = ILLUSTRATIONS.stateCompletado;

const centeredOverlay = (children: React.ReactNode) => (
  <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center p-4">
    {children}
  </div>
);

export function StudyEmptyStates({
  phase,
  deckName,
  queueLength,
  onClose,
}: StudyEmptyStatesProps) {
  const words = useLoadingWords();

  if (phase === "loading") {
    return centeredOverlay(<WordCarousel words={words} />);
  }

  if (phase === "done" || queueLength === 0) {
    return centeredOverlay(
      <div
        className="max-w-sm w-full rounded-2xl border layout-card-pad text-center space-y-5"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
        }}
      >
        <div className="mx-auto w-full max-w-24 text-primary" aria-hidden="true">
          <Illustration />
        </div>
        <H2 className="text-h4">All caught up!</H2>
        <p className="text-body-sm text-fg-muted">
          No cards due in <strong>{deckName}</strong>.
        </p>
        <Button variant="primary" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return null;
}
```

Note: this card isn't built on the generic `EmptyState` wrapper (it has its own bordered card chrome), so the illustration is inlined directly with `max-w-24` sizing rather than going through `EmptyState` — same registry lookup pattern, different container, which is fine per the spec's edge-case guidance (don't force the wrapper where the layout doesn't fit).

- [ ] **Step 6: Type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no new errors.

- [ ] **Step 7: Visual check**

Trigger the `"done"` phase in a study session (queue exhausted), confirm illustration renders in place of the emoji, sized reasonably inside the card.

- [ ] **Step 8: Commit**

```bash
git add components/illustrations/state-completado.svg lib/illustrations/registry.ts components/vocabulary/decks/StudyEmptyStates.tsx
git commit -m "feat(illustrations): add stateCompletado, replace emoji in StudyEmptyStates"
```

---

## Task 4: Investigate remaining mapped surfaces — wire or document as omitted

The spec's mapping table lists five more candidate keys (`emptyJournal`, `emptyLecciones`, `emptyPronunciacion`, `emptyConversacion`, `onboardingBienvenida`). Investigation already done during planning found:

- **Journal**: `components/journal/JournalHistoryTimeline.tsx:17` explicitly returns `null` for ≤1 entries by design ("Una sola página no necesita navegación lateral — evita una tira vacía que apunte solo a sí misma"). The journal route (`app/(authenticated)/journal/page.tsx`) always renders the `JournalNotebookClient` writing surface — there is no "your journal is empty" screen anywhere in this flow. **No natural insertion point exists.**
- **Pronunciation** (`app/(authenticated)/courses/pronunciation/page.tsx`): a pure redirect to `/practice/sounds`, no rendering of its own.
- **Courses** (`app/(authenticated)/courses/page.tsx`): renders `CoursePathPage`, not yet inspected for an empty-state branch.
- **`emptyConversacion`** (`ChatEmptyState.tsx`): the spec already flags this as "use only if it fits without fighting the `LiquidOrb` hero" — this is itself the entire empty state for that surface (there's no secondary sub-state), so adding a second illustration risks visual competition with the orb.
- **`onboardingBienvenida`**: no first-login/onboarding screen was located during planning.

This task is investigation + a decision per surface, not blind implementation.

**Files:**
- Investigate: `components/courses/CoursePathPage.tsx` (and children)
- Investigate: any first-login/onboarding flow (search `app/` for auth callback / onboarding routes)
- Modify (conditionally): `docs/superpowers/specs/2026-08-24-illustration-system-design.md`

- [ ] **Step 1: Inspect `CoursePathPage` for an empty-state branch**

Read `components/courses/CoursePathPage.tsx` and its direct children. Look for a branch that renders when there are zero available lessons/courses for the selected level (e.g. `courses.length === 0`, a loading/error/empty triad).

- [ ] **Step 2: Decide on courses**

- If a genuine "no courses available" branch exists: follow the same loop as Tasks 1–3 (search Koboyo for "book stack" / "learning path", save `components/illustrations/empty-lecciones.svg`, add `emptyLecciones` to the registry, wire it via `EmptyState` or the existing container, type-check, lint, visual check, commit).
- If no such branch exists (e.g. course list is always seeded/non-empty by design): do not fabricate one. Skip to Step 5.

- [ ] **Step 3: Search onboarding/first-login flows**

Search the codebase (`app/`, `components/onboarding/` if it exists) for a first-run welcome screen. Check `app/(authenticated)/layout.tsx` and any `/login` or `/welcome` route for a one-time greeting.

- [ ] **Step 4: Decide on onboarding**

- If a welcome/onboarding screen exists: follow the same loop (search Koboyo for "welcome / greeting", save `components/illustrations/onboarding-bienvenida.svg`, add `onboardingBienvenida` to the registry, wire, verify, commit).
- If none exists: do not create a new onboarding screen just to hang an illustration on — that's out of scope for an illustration system. Skip to Step 5.

- [ ] **Step 5: Update the spec's mapping table with final outcomes**

Edit `docs/superpowers/specs/2026-08-24-illustration-system-design.md`'s mapping table: change "Por buscar y conectar" to either "Conectado" (with the commit reference) or "Omitido — sin punto de inserción natural" for each of `emptyJournal`, `emptyLecciones`, `emptyPronunciacion`, `emptyConversacion`, `onboardingBienvenida`, based on what Steps 1–4 actually found. Journal and pronunciation are already known-omitted per the investigation above — mark those two rows now without further investigation.

- [ ] **Step 6: Commit the spec update (and any new illustration work from Steps 2/4)**

```bash
git add docs/superpowers/specs/2026-08-24-illustration-system-design.md
git commit -m "docs(illustrations): record final outcomes for remaining mapped surfaces"
```

(If Steps 2 or 4 produced new illustrations, commit those in their own preceding commits following the Task 1–3 pattern, before this doc-only commit.)

---

## Task 5: Full verification pass

**Files:** none created/modified — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including `lib/illustrations/__tests__/registry.test.ts` and any pre-existing tests touching `WordsEmptyState`, `TrackingEmptyState`, or `StudyEmptyStates`.

- [ ] **Step 2: Run type-check and lint on the whole project**

Run: `pnpm type-check && pnpm lint`
Expected: no errors introduced by this plan's files. (Pre-existing unrelated errors, e.g. in `lib/ai-coach/use-webgpu-orb.ts`, are out of scope — do not fix them here.)

- [ ] **Step 3: Confirm no direct `.svg` imports outside the registry**

Run: `grep -rn "from \"@/components/illustrations/" --include="*.tsx" --include="*.ts" -- components lib app | grep -v "lib/illustrations/registry.ts"`
Expected: no output. Every consumer of an illustration goes through `ILLUSTRATIONS`, not a direct import — this is the maintainability guarantee the registry exists for.

- [ ] **Step 4: Confirm offline mode is untouched**

Illustrations are static SVGs bundled at build time (no network fetch at runtime) — offline mode is unaffected by construction. Confirm by checking that no component added in this plan makes a `fetch` or Supabase call related to illustrations.

- [ ] **Step 5: Final commit if any cleanup was needed**

If Steps 1–4 required fixes, commit them individually with descriptive messages following the same pattern as prior tasks.
