# Plan D — Entrada de un solo botón

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que abrir la app no exija ninguna decisión: un solo destino primario visible al cargar, y todo lo demás recogido bajo "Explorar".

**Architecture:** El home ya tiene lógica de prioridad (`activePlanSession` "posee el fold"), pero es *reactiva*: la página monta un esqueleto, el plan resuelve en cliente y las tarjetas se reordenan. El resultado es que en el primer segundo se ven varias opciones compitiendo. Este plan calcula el destino primario en **servidor**, lo pinta inmediato y colapsa el resto en un `<details>` cerrado por defecto.

**Tech Stack:** Next.js App Router (Server Components), TypeScript, Vitest, Tailwind v4.

**Cubre el problema #6 de la auditoría.** Independiente de los planes A–C.

---

## Corrección al diagnóstico de la auditoría

La auditoría decía "23 componentes compitiendo por la pantalla". Al leer `HomeCommandGrid.tsx` la realidad es más matizada y conviene dejarla escrita:

- Ya existe gating real (`showPlanExtras`, `activePlanSession`, `showSetupPair`).
- Lo que **sí** se renderiza casi siempre: `HomeDailyCard`, `HomeChunkOfDayCard`, y el aside completo (`WeakSoundCard`, `HomeWordOfDayCard`, `EssentialWordsProgressCard`), más los banners condicionales.
- El problema real es **el orden temporal**: `HomeDailyCard` es `dynamic()` y su estado llega por `onPlanStatusChange`, así que hasta que el plan resuelve, `planSettled` es `false` y el usuario ve un esqueleto rodeado de tarjetas secundarias ya pintadas. La jerarquía existe en el código pero no en el primer render.

Este plan ataca eso, no un supuesto caos de 23 tarjetas.

---

## File Structure

| Archivo | Responsabilidad |
| - | - |
| `lib/home/primary-action.ts` (nuevo) | Función pura: estado del usuario → única acción primaria (etiqueta, href, minutos). |
| `components/home/HomePrimaryAction.tsx` (nuevo) | El botón grande. Server Component, sin estado. |
| `components/home/HomeExploreDrawer.tsx` (nuevo) | `<details>` que envuelve todo lo secundario. |
| `components/home/HomeCommandGrid.tsx` (modificar) | Mover el aside y las tarjetas secundarias dentro del drawer. |
| `components/home/HomeLayout.tsx` (modificar) | Renderizar la acción primaria antes del grid. |
| `app/(authenticated)/page.tsx` (modificar) | Calcular la acción primaria en servidor y pasarla. |

---

## Task 1: Decidir la acción primaria (función pura)

**Files:**
- Create: `lib/home/primary-action.ts`
- Test: `lib/home/__tests__/primary-action.test.ts`

- [x] **Step 1: Write the failing test**

Create `lib/home/__tests__/primary-action.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolvePrimaryAction } from '@/lib/home/primary-action'

const base = {
  hasPlacement: true,
  planDoneToday: false,
  dueCount: 0,
  estimatedMinutes: 12,
}

describe('resolvePrimaryAction', () => {
  it('sends a brand-new learner to the placement test', () => {
    const action = resolvePrimaryAction({ ...base, hasPlacement: false })
    expect(action.href).toBe('/assessment')
    expect(action.label).toContain('Empezar')
  })

  it('sends everyone else to the daily plan', () => {
    const action = resolvePrimaryAction(base)
    expect(action.href).toBe('/daily')
  })

  it('states the time commitment in the label', () => {
    expect(resolvePrimaryAction({ ...base, estimatedMinutes: 12 }).label)
      .toContain('12 min')
  })

  it('mentions pending reviews when there are some', () => {
    const action = resolvePrimaryAction({ ...base, dueCount: 7 })
    expect(action.sublabel).toContain('7')
  })

  it('omits the review sublabel when nothing is due', () => {
    expect(resolvePrimaryAction(base).sublabel).toBeUndefined()
  })

  it('switches to a calmer label once the plan is done', () => {
    const action = resolvePrimaryAction({ ...base, planDoneToday: true })
    expect(action.variant).toBe('secondary')
    expect(action.label).not.toContain('Empezar')
  })

  it('still points somewhere useful when the plan is done', () => {
    expect(resolvePrimaryAction({ ...base, planDoneToday: true }).href).toBeTruthy()
  })

  it('prioritises placement over a finished plan', () => {
    const action = resolvePrimaryAction({
      ...base,
      hasPlacement: false,
      planDoneToday: true,
    })
    expect(action.href).toBe('/assessment')
  })
})
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/home/__tests__/primary-action.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Write the implementation**

Create `lib/home/primary-action.ts`:

```ts
/**
 * The single thing the learner should do on opening the app.
 *
 * Computed server-side and rendered immediately, because the cost of a busy
 * home is not visual clutter but the decision it forces at the exact moment
 * motivation is lowest. One destination, no menu.
 */

export interface PrimaryActionInput {
  /** Has the learner completed the placement test? */
  hasPlacement: boolean
  /** Has today's plan already been finished? */
  planDoneToday: boolean
  /** SRS items waiting (words + sounds). */
  dueCount: number
  /** Estimated minutes for today's session. */
  estimatedMinutes: number
}

export interface PrimaryAction {
  label: string
  sublabel?: string
  href: string
  /** `primary` is the big call to action; `secondary` is the calm post-session state. */
  variant: 'primary' | 'secondary'
}

export function resolvePrimaryAction(input: PrimaryActionInput): PrimaryAction {
  // A learner with no placement has no meaningful plan to run yet.
  if (!input.hasPlacement) {
    return {
      label: 'Empezar por tu nivel (5 min)',
      sublabel: 'Una prueba corta para ajustar todo lo demás',
      href: '/assessment',
      variant: 'primary',
    }
  }

  if (input.planDoneToday) {
    return {
      label: 'Práctica libre',
      sublabel: 'Ya completaste la sesión de hoy',
      href: '/practice',
      variant: 'secondary',
    }
  }

  return {
    label: `Empezar (${input.estimatedMinutes} min)`,
    sublabel: input.dueCount > 0 ? `${input.dueCount} en repaso` : undefined,
    href: '/daily',
    variant: 'primary',
  }
}
```

- [x] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/home/__tests__/primary-action.test.ts`
Expected: PASS — 8 tests.

- [x] **Step 5: Commit**

```bash
git add lib/home/primary-action.ts lib/home/__tests__/primary-action.test.ts
git commit -m "feat(home): resolve a single primary action for the home screen"
```

---

## Task 2: El botón

**Files:**
- Create: `components/home/HomePrimaryAction.tsx`

- [x] **Step 1: Check the Button/Anchor conventions**

This project has a `Button` with 8 token-driven variants and an `Anchor` for `<a>` links (see memory: "Anchor Component"). Since this navigates, it must be a link, not a button.

Run: `sed -n '1,40p' components/ui/Anchor.tsx`

Note the exact variant names it accepts — use one of those below rather than inventing classes.

- [x] **Step 2: Write the component**

Create `components/home/HomePrimaryAction.tsx`:

```tsx
// Planned structure:
// <HomePrimaryAction>
//   <ActionLink />   — label + optional sublabel
// </HomePrimaryAction>

import { Anchor } from "@/components/ui/Anchor";
import { cn } from "@/lib/cn";
import type { PrimaryAction } from "@/lib/home/primary-action";

interface Props {
  action: PrimaryAction;
}

/**
 * The one destination on the home screen. Server-rendered so it is painted
 * on first frame — the previous layout resolved its hierarchy client-side,
 * which meant the learner saw competing cards before the plan settled.
 */
export default function HomePrimaryAction({ action }: Props) {
  const isPrimary = action.variant === "primary";

  return (
    <section aria-label="Acción principal" className="flex flex-col gap-2">
      <Anchor
        href={action.href}
        variant={isPrimary ? "primary" : "secondary"}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-xl px-6 text-center",
          isPrimary ? "min-h-24" : "min-h-16",
        )}
      >
        <span className={cn("font-semibold", isPrimary ? "text-title-md" : "text-body-md")}>
          {action.label}
        </span>
        {action.sublabel && (
          <span className="text-body-sm opacity-80">{action.sublabel}</span>
        )}
      </Anchor>
    </section>
  );
}
```

Before committing, confirm `variant="primary"` / `variant="secondary"` and the type classes exist:

Run: `grep -n "variant" components/ui/Anchor.tsx | head -20 && grep -rn "text-title-md\|text-body-md" components/home/ | head -3`

Substitute the project's real names where they differ. Do not hardcode colors — tokens only.

- [x] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [x] **Step 4: Commit**

```bash
git add components/home/HomePrimaryAction.tsx
git commit -m "feat(home): add the single primary action button"
```

---

## Task 3: El cajón "Explorar"

**Files:**
- Create: `components/home/HomeExploreDrawer.tsx`
- Test: `components/home/__tests__/home-explore-drawer.test.tsx`

- [x] **Step 1: Write the failing test**

Create `components/home/__tests__/home-explore-drawer.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomeExploreDrawer from '@/components/home/HomeExploreDrawer'

describe('HomeExploreDrawer', () => {
  it('renders its summary label', () => {
    render(<HomeExploreDrawer><p>contenido</p></HomeExploreDrawer>)
    expect(screen.getByText(/explorar/i)).toBeInTheDocument()
  })

  it('is collapsed by default', () => {
    const { container } = render(
      <HomeExploreDrawer><p>contenido</p></HomeExploreDrawer>,
    )
    const details = container.querySelector('details')
    expect(details).not.toBeNull()
    expect(details!.open).toBe(false)
  })

  it('keeps its children in the DOM for accessibility and prefetch', () => {
    render(<HomeExploreDrawer><p>contenido oculto</p></HomeExploreDrawer>)
    expect(screen.getByText('contenido oculto')).toBeInTheDocument()
  })
})
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run components/home/__tests__/home-explore-drawer.test.tsx`
Expected: FAIL — module not found.

- [x] **Step 3: Write the component**

Create `components/home/HomeExploreDrawer.tsx`:

```tsx
// Planned structure:
// <HomeExploreDrawer>
//   <summary>  — the disclosure trigger
//   {children} — every secondary home surface
// </HomeExploreDrawer>

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Collapses every non-primary home surface behind one disclosure.
 *
 * A native <details> on purpose: no client JS, keyboard-accessible for free,
 * and the content stays in the DOM so links still prefetch.
 */
export default function HomeExploreDrawer({ children }: Props) {
  return (
    <details className="group mt-6 border-t border-border-subtle pt-4">
      <summary className="focus-ring cursor-pointer list-none text-body-sm font-medium text-fg-muted marker:content-none hover:text-fg">
        Explorar
        <span aria-hidden="true" className="ml-1 inline-block transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>

      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </details>
  );
}
```

Verify the token classes exist:

Run: `grep -rn "border-border-subtle\|text-fg-muted\|focus-ring" components/home/ | head -3`

- [x] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run components/home/__tests__/home-explore-drawer.test.tsx`
Expected: PASS — 3 tests.

- [x] **Step 5: Commit**

```bash
git add components/home/HomeExploreDrawer.tsx components/home/__tests__/home-explore-drawer.test.tsx
git commit -m "feat(home): add collapsible explore drawer"
```

---

## Task 4: Recoger lo secundario dentro del cajón

**Files:**
- Modify: `components/home/HomeCommandGrid.tsx:180-190` (the `<aside>` block)

- [x] **Step 1: Move the aside inside the drawer**

In `components/home/HomeCommandGrid.tsx`, add the import:

```tsx
import HomeExploreDrawer from "@/components/home/HomeExploreDrawer";
```

Replace the final `<aside>` block:

```tsx
      <aside className="home-command-aside flex flex-col gap-4" aria-label="Práctica sugerida">
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        <HomeWordOfDayCard profileLevel={profileLevel} />
        <EssentialWordsProgressCard profileLevel={profileLevel} />
      </aside>
```

with:

```tsx
      <HomeExploreDrawer>
        <div className="flex flex-col gap-4" aria-label="Práctica sugerida">
          <WeakSoundCard weakestPhoneme={weakestPhoneme} />
          <HomeWordOfDayCard profileLevel={profileLevel} />
          <EssentialWordsProgressCard profileLevel={profileLevel} />
        </div>
      </HomeExploreDrawer>
```

- [x] **Step 2: Move the phrase-of-the-day card too**

Still in `HomeCommandGrid.tsx`, inside `home-command-below-plan`, remove this line:

```tsx
          <HomeChunkOfDayCard />
```

and add `<HomeChunkOfDayCard />` as the first child inside the `HomeExploreDrawer` you just created, above the suggested-practice group.

- [x] **Step 3: Check the grid CSS still holds**

`home-command-aside` was a grid area. Removing it may leave an empty column.

Run: `grep -n "home-command-aside\|home-command-grid" app/globals.css app/styles/*.css`

If `home-command-grid` declares `grid-template-areas` or `grid-template-columns` with an aside column, update it to a single column — the aside no longer exists as a grid child. Keep the change token-driven and inside the stylesheet, not inline.

- [x] **Step 4: Verify**

Run: `npx tsc --noEmit && npx next lint --dir components/home && npx vitest run components/home/__tests__/`
Expected: exit 0 and PASS. Existing home tests asserting the aside's presence should be updated to look for it inside the drawer, not deleted.

- [x] **Step 5: Commit**

```bash
git add components/home/HomeCommandGrid.tsx app/globals.css
git commit -m "refactor(home): collapse secondary cards into the explore drawer"
```

---

## Task 5: Pintar la acción primaria en servidor

**Files:**
- Modify: `app/(authenticated)/page.tsx`
- Modify: `components/home/HomeLayout.tsx`

- [x] **Step 1: Compute the action in the page**

In `app/(authenticated)/page.tsx`, inside `HomePageContent` after the `Promise.all` destructuring, add:

```tsx
  const dueCount =
    (queue.sources.find((s) => s.id === "vocabulary")?.count ?? 0) +
    (queue.sources.find((s) => s.id === "sounds")?.count ?? 0);

  const primaryAction = resolvePrimaryAction({
    hasPlacement: placementState.hasPlacement,
    // The server does not know whether today's plan is finished; the daily
    // goal's completion flag is the closest authoritative signal available
    // without pulling the whole plan into the server render.
    planDoneToday: goal?.completed ?? false,
    dueCount,
    estimatedMinutes: 12,
  });
```

with the import:

```tsx
import { resolvePrimaryAction } from "@/lib/home/primary-action";
```

Verify the completion field name first:

Run: `grep -n "completed\|DailyGoalProgress" lib/home/constants.ts`

If `DailyGoalProgress` has no `completed`, use whatever boolean it exposes (e.g. `minutesToday >= goalMinutes`) and keep the comment explaining the substitution.

Then pass it down:

```tsx
      primaryAction={primaryAction}
```

- [x] **Step 2: Render it first in the layout**

In `components/home/HomeLayout.tsx`, add to `HomeLayoutProps`:

```tsx
  primaryAction: PrimaryAction;
```

with the imports:

```tsx
import HomePrimaryAction from "@/components/home/HomePrimaryAction";
import type { PrimaryAction } from "@/lib/home/primary-action";
```

Destructure `primaryAction` in the component signature, and render it immediately after `<HomePageHeader />` and before `<HomeCommandGrid />`:

```tsx
        <HomePrimaryAction action={primaryAction} />
```

- [x] **Step 3: Verify**

Run: `npx tsc --noEmit && npx next lint`
Expected: exit 0.

- [x] **Step 4: Commit**

```bash
git add "app/(authenticated)/page.tsx" components/home/HomeLayout.tsx
git commit -m "feat(home): render the primary action server-side above the grid"
```

---

## Task 6: Verificación completa

- [x] **Step 1: Full suite**

Run: `npx vitest run && npx tsc --noEmit && npx next lint`
Expected: all green, exit 0.

- [x] **Step 2: Manual check, including the slow-network case**

Run `pnpm dev`, open `/`, and confirm:
- A single large button is visible **on first paint**, before the daily card resolves.
- Only that button, the header, and the plan card are above the fold.
- "Explorar" is collapsed; opening it reveals phrase of the day, weak sound, word of the day and essential words.
- In DevTools throttled to Slow 3G, the primary action still paints immediately — this is the specific failure the plan exists to fix.
- On mobile width, nothing overflows horizontally.

- [x] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "test(home): update expectations for the single-action layout"
```

---

## Notas de riesgo

- **`planDoneToday` es aproximado en servidor.** El plan diario se compone en cliente, así que el servidor no sabe con certeza si la sesión está completa. Usamos la señal del objetivo diario. Si el botón queda desincronizado (dice "Empezar" con el plan ya hecho), la solución correcta no es mover el cálculo a cliente — eso reintroduce el problema — sino persistir un flag de completitud diaria en servidor. Eso es trabajo aparte.
- **Los 12 minutos están fijos.** `estimatedMinutes: 12` es un literal. Cuando el Plan A suba el volumen de habla, la duración real cambiará: conéctalo a la suma de `estMinutes` de los pasos cuando exista una fuente en servidor.
- **Nada se borra.** Ninguna ruta ni tarjeta desaparece; solo dejan de competir por el primer segundo de atención. Esto es deliberado — la auditoría recomendaba consolidar rutas (`/vocabulary`, `/words`, `/saved`, `/lexicon`, `/dictionary`) pero eso quedó explícitamente en "nice to have".
