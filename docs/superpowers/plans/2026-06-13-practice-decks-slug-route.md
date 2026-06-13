# Practice Decks Slug Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `/practice/decks/[slug]` route that renders a grammar deck by slug and fix the broken link in `DeckCard`.

**Architecture:** Add a new Next.js App Router page at `app/practice/decks/[slug]/page.tsx` that calls `getDeckBySlug(slug)`, calls `notFound()` if missing, and renders `GrammarStudyDeck` with a back link to `/practice/decks`. Then update `DeckCard` href to point to this new route.

**Tech Stack:** Next.js 15 App Router (Server Component), `getDeckBySlug` from `lib/courses/grammar-deck/decks.ts`, `GrammarStudyDeck` component.

---

### Task 1: Create the `/practice/decks/[slug]` page

**Files:**
- Create: `app/practice/decks/[slug]/page.tsx`
- Modify: `components/practice/decks/DecksIndexClient.tsx` (fix DeckCard href)

- [ ] **Step 1: Create the page file**

```tsx
// app/practice/decks/[slug]/page.tsx
import { notFound } from 'next/navigation'
import GrammarStudyDeck from '@/components/courses/grammar-deck/GrammarStudyDeck'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PracticeDeckPage({ params }: PageProps) {
  const { slug } = await params
  const deck = getDeckBySlug(slug)

  if (!deck) notFound()

  return (
    <GrammarStudyDeck
      deck={deck}
      backHref="/practice/decks"
      backLabel="Todos los decks"
    />
  )
}
```

- [ ] **Step 2: Fix the DeckCard link in `DecksIndexClient.tsx`**

In `components/practice/decks/DecksIndexClient.tsx`, find `DeckCard` (line ~156) and change the `href`:

```tsx
// Before:
href={`/courses/lesson/${deck.slug}`}

// After:
href={`/practice/decks/${deck.slug}`}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Verify manually**

Start the dev server (`pnpm dev`) and navigate to `http://localhost:3000/practice/decks`. Click any deck card — it should open the deck study view with a "Todos los decks" back button. Clicking a non-existent slug (e.g. `/practice/decks/fake-slug`) should show Next.js 404.

- [ ] **Step 5: Commit**

```bash
git add app/practice/decks/[slug]/page.tsx components/practice/decks/DecksIndexClient.tsx
git commit -m "feat(decks): add /practice/decks/[slug] route and fix DeckCard link"
```
