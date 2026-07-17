# SRS Vault + Essential Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace forever-archive with SRS snooze/mastered + searchable vault modal (Essential Words + Review), backfill missing `sentence_ipa`, rename UI to Essential Words, and update core app docs (`docs/architecture/srs.md`).

**Architecture:** Pure helpers in `lib/srs/` own status transitions and migration; `lib/core-1000/queue.ts` filters by `status` (not `archived`). Shared `SrsVault*` UI reads Dexie via LiveQuery. Data layer stays in `lib/core-1000/` + `c1k:` prefix. Docs reflect the new model as the product core.

**Tech Stack:** Next.js 16, React 19, Dexie, Vitest, Testing Library, Tailwind v4 tokens

**Spec:** `docs/superpowers/specs/2026-07-17-srs-vault-essential-words-design.md`

---

## File Map

| File | Responsibility |
| --- | --- |
| `lib/types.ts` | Add `SrsStatus`, `status` / `snoozedAt` / `masteredAt` on `SRSData` |
| `lib/srs/status.ts` | Pure: resolve status, due check, snooze/master/activate patches |
| `lib/srs/migrate-archived.ts` | Pure + Dexie: `archived` → `snoozed` |
| `lib/srs/vault.ts` | List vault entries, source label from `wordId` prefix |
| `lib/db/index.ts` | Replace archive helpers with snooze/master/activate; call migrate on open or first vault read |
| `lib/core-1000/queue.ts` | Exclude `snoozed`/`mastered`; treat expired snooze as due after activate pass |
| `components/practice/srs-vault/SrsVaultTrigger.tsx` | Collapsed «Baúl · N» |
| `components/practice/srs-vault/SrsVaultModal.tsx` | `<dialog>` + blur backdrop |
| `components/practice/srs-vault/SrsVaultFilters.tsx` | Todas / En pausa / Dominadas |
| `components/practice/srs-vault/SrsVaultRow.tsx` | Interval chips + actions |
| `components/practice/essential-words/*` | Rename from `core-1000/` UI folder |
| `hooks/useEssentialWordsSession.ts` | Call snooze instead of archive |
| `components/practice/review/ReviewHubClient.tsx` | Mount vault trigger |
| `scripts/core-1000/backfill-sentence-ipa.mjs` | Create missing `sentence_ipa` |
| `docs/architecture/srs.md` | Document vault + status model (core doc update) |
| `README.md` / `docs/README.md` | Point to Essential Words + vault if needed |

**Out of plan:** Renaming `public/core-1000/`, `lib/core-1000/`, or `c1k:` prefixes.

---

### Task 1: SRS status pure helpers (TDD)

**Files:**
- Create: `lib/srs/status.ts`
- Create: `lib/srs/__tests__/status.test.ts`
- Modify: `lib/types.ts`

- [ ] **Step 1: Extend `SRSData` types**

In `lib/types.ts`, add:

```ts
export type SrsStatus = "active" | "snoozed" | "mastered";

export interface SRSData {
  wordId: string;
  word: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
  /** Vault/schedule state. Missing ≡ active. */
  status?: SrsStatus;
  snoozedAt?: string;
  masteredAt?: string;
  /** @deprecated Prefer status=snoozed. Kept for migration. */
  archived?: boolean;
  archivedAt?: string;
  exposure?: { lastAt: number; count: number };
}
```

- [ ] **Step 2: Write failing tests**

```ts
// lib/srs/__tests__/status.test.ts
import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  addDaysIso,
  patchSnooze,
  patchMaster,
  patchActivateNow,
  isDueForQueue,
} from "../status";
import type { SRSData } from "@/lib/types";

const base: SRSData = {
  wordId: "c1k:the",
  word: "the",
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-01-01T00:00:00.000Z",
};

describe("effectiveStatus", () => {
  it("treats missing status as active", () => {
    expect(effectiveStatus(base)).toBe("active");
  });
  it("maps legacy archived to snoozed", () => {
    expect(effectiveStatus({ ...base, archived: true })).toBe("snoozed");
  });
});

describe("patchSnooze", () => {
  it("sets snoozed + nextReview +90d by default", () => {
    const now = new Date("2026-07-17T12:00:00.000Z");
    const next = patchSnooze(base, now, 90);
    expect(next.status).toBe("snoozed");
    expect(next.nextReview).toBe(addDaysIso(now, 90));
    expect(next.snoozedAt).toBe(now.toISOString());
  });
});

describe("isDueForQueue", () => {
  const now = new Date("2026-07-17T12:00:00.000Z");
  it("excludes mastered and future snoozed", () => {
    expect(isDueForQueue({ ...base, status: "mastered" }, now)).toBe(false);
    expect(
      isDueForQueue(
        { ...base, status: "snoozed", nextReview: "2026-10-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });
  it("includes active when nextReview <= now", () => {
    expect(isDueForQueue({ ...base, status: "active", nextReview: "2026-07-01T00:00:00.000Z" }, now)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
pnpm exec vitest run lib/srs/__tests__/status.test.ts
```

- [ ] **Step 4: Implement `lib/srs/status.ts`**

```ts
import type { SRSData, SrsStatus } from "@/lib/types";

export function addDaysIso(from: Date, days: number): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function effectiveStatus(entry: SRSData): SrsStatus {
  if (entry.status) return entry.status;
  if (entry.archived) return "snoozed";
  return "active";
}

export function patchSnooze(entry: SRSData, now: Date, days = 90): SRSData {
  return {
    ...entry,
    status: "snoozed",
    snoozedAt: now.toISOString(),
    nextReview: addDaysIso(now, days),
    archived: undefined,
    archivedAt: undefined,
  };
}

export function patchMaster(entry: SRSData, now: Date): SRSData {
  return {
    ...entry,
    status: "mastered",
    masteredAt: now.toISOString(),
    archived: undefined,
    archivedAt: undefined,
  };
}

export function patchActivateNow(entry: SRSData, now: Date): SRSData {
  return {
    ...entry,
    status: "active",
    nextReview: now.toISOString(),
    snoozedAt: undefined,
    archived: undefined,
    archivedAt: undefined,
  };
}

/** After expired-snooze activation pass, use this for due filtering. */
export function isDueForQueue(entry: SRSData, now: Date): boolean {
  const status = effectiveStatus(entry);
  if (status === "mastered" || status === "snoozed") return false;
  return new Date(entry.nextReview).getTime() <= now.getTime();
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm exec vitest run lib/srs/__tests__/status.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/srs/status.ts lib/srs/__tests__/status.test.ts
git commit -m "feat(srs): add snooze/mastered status helpers"
```

---

### Task 2: Migrate legacy `archived` → `snoozed`

**Files:**
- Create: `lib/srs/migrate-archived.ts`
- Create: `lib/srs/__tests__/migrate-archived.test.ts`
- Modify: `lib/db/index.ts` (call migrate once when opening vault / Essential Words load)

- [ ] **Step 1: Failing test for pure migrate row**

```ts
import { describe, expect, it } from "vitest";
import { migrateArchivedRow } from "../migrate-archived";
import { addDaysIso } from "../status";

it("converts archived to snoozed with +90d from archivedAt", () => {
  const archivedAt = "2026-06-01T00:00:00.000Z";
  const row = migrateArchivedRow({
    wordId: "c1k:the",
    word: "the",
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: archivedAt,
    archived: true,
    archivedAt,
  });
  expect(row.status).toBe("snoozed");
  expect(row.snoozedAt).toBe(archivedAt);
  expect(row.nextReview).toBe(addDaysIso(new Date(archivedAt), 90));
});

it("leaves rows with status untouched", () => {
  const input = {
    wordId: "c1k:be",
    word: "be",
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: "2026-08-01T00:00:00.000Z",
    status: "mastered" as const,
  };
  expect(migrateArchivedRow(input)).toEqual(input);
});
```

- [ ] **Step 2: Implement**

```ts
import type { SRSData } from "@/lib/types";
import { addDaysIso } from "./status";

export function migrateArchivedRow(entry: SRSData): SRSData {
  if (entry.status) return entry;
  if (!entry.archived) return entry;
  const snoozedAt = entry.archivedAt ?? new Date().toISOString();
  return {
    ...entry,
    status: "snoozed",
    snoozedAt,
    nextReview: addDaysIso(new Date(snoozedAt), 90),
  };
}
```

Add `migrateAllArchivedInDb(db)` that reads `srsData`, maps `migrateArchivedRow`, puts changed rows. Call from `getVaultEntries` / Essential Words session boot (idempotent; skip if no archived).

- [ ] **Step 3: Tests pass + commit**

```bash
pnpm exec vitest run lib/srs/__tests__/migrate-archived.test.ts
git add lib/srs/migrate-archived.ts lib/srs/__tests__/migrate-archived.test.ts lib/db/index.ts
git commit -m "feat(srs): migrate archived rows to snoozed"
```

---

### Task 3: Queue uses status; activate expired snoozes

**Files:**
- Modify: `lib/core-1000/queue.ts`
- Modify: `lib/core-1000/__tests__/queue.test.ts`
- Modify: `hooks/useEssentialWordsSession.ts` (before buildQueue: activate expired)

- [ ] **Step 1: Update queue filter**

Replace `!e.archived` with status-aware logic. Comment: callers must run `activateExpiredSnoozes` first so expired snoozes are already `active`.

```ts
import { isDueForQueue, effectiveStatus } from "@/lib/srs/status";

// in buildSessionQueue due filter:
.filter((e) => isDueForQueue(e, now))

// seen set: still include snoozed + mastered so they are never re-introduced as new
```

- [ ] **Step 2: Add `activateExpiredSnoozes(entries, now)` in `lib/srs/status.ts`**

```ts
export function activateExpiredSnoozes(entries: SRSData[], now: Date): SRSData[] {
  return entries.map((e) => {
    if (effectiveStatus(e) !== "snoozed") return e;
    if (new Date(e.nextReview).getTime() > now.getTime()) return e;
    return patchActivateNow(e, now);
  });
}
```

Persist changed rows in the hook before building the queue.

- [ ] **Step 3: Rewrite queue tests** that used `archived: true` to use `status: "snoozed"` / `"mastered"`.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(essential-words): queue respects snooze/mastered"
```

---

### Task 4: Dexie helpers — snooze / master / activate

**Files:**
- Modify: `lib/db/index.ts`
- Modify: `hooks/useEssentialWordsSession.ts`
- Modify tests that mock `archiveCore1000Word`

- [ ] **Step 1: Replace archive API**

```ts
export async function snoozeEssentialWord(word: string, days = 90): Promise<void> {
  // get or create c1k row, put patchSnooze(...)
}

export async function masterEssentialWord(word: string): Promise<void> { /* patchMaster */ }

export async function activateEssentialWordNow(word: string): Promise<void> { /* patchActivateNow */ }

/** @deprecated Use snoozeEssentialWord */
export async function archiveCore1000Word(word: string): Promise<void> {
  return snoozeEssentialWord(word, 90);
}
```

Keep thin deprecated aliases until UI rename finishes, then delete aliases.

- [ ] **Step 2: Wire `archiveWord` in hook → `snoozeEssentialWord`**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(db): snooze/master/activate Essential Words SRS"
```

---

### Task 5: Vault list helpers

**Files:**
- Create: `lib/srs/vault.ts`
- Create: `lib/srs/__tests__/vault.test.ts`

```ts
export type VaultFilter = "all" | "snoozed" | "mastered";

export function sourceLabelFromWordId(wordId: string): string {
  if (wordId.startsWith("c1k:")) return "Palabras esenciales";
  return "SRS";
}

export function filterVaultEntries(
  entries: SRSData[],
  filter: VaultFilter,
  query: string,
): SRSData[] {
  const q = query.trim().toLowerCase();
  return entries
    .filter((e) => {
      const s = effectiveStatus(e);
      if (s !== "snoozed" && s !== "mastered") return false;
      if (filter === "snoozed" && s !== "snoozed") return false;
      if (filter === "mastered" && s !== "mastered") return false;
      if (q && !e.word.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      const sa = effectiveStatus(a);
      const sb = effectiveStatus(b);
      if (sa === "snoozed" && sb === "snoozed") {
        return a.nextReview.localeCompare(b.nextReview);
      }
      if (sa === "mastered" && sb === "mastered") {
        return (b.masteredAt ?? "").localeCompare(a.masteredAt ?? "");
      }
      return sa === "snoozed" ? -1 : 1;
    });
}
```

- [ ] **Step: tests + commit**

```bash
git commit -m "feat(srs): vault filter/sort helpers"
```

---

### Task 6: `SrsVaultTrigger` + `SrsVaultModal` UI

**Files:**
- Create: `components/practice/srs-vault/SrsVaultTrigger.tsx`
- Create: `components/practice/srs-vault/SrsVaultModal.tsx`
- Create: `components/practice/srs-vault/SrsVaultFilters.tsx`
- Create: `components/practice/srs-vault/SrsVaultRow.tsx`
- Create: `components/practice/srs-vault/__tests__/SrsVaultModal.test.tsx`
- Delete or stop using: `components/practice/core-1000/ArchivedWordsPanel.tsx`

**Planned structure (comment block first per CLAUDE.md):**

```tsx
// Planned structure:
// <SrsVaultTrigger count onOpen />
// <SrsVaultModal open onClose>
//   <SrsVaultSearch />
//   <SrsVaultFilters />
//   <SrsVaultRow />*
// </SrsVaultModal>
```

- [ ] **Step 1: Trigger** — only if `count > 0`; Spanish: `Baúl · {n} palabra(s)`; `font-caption` / quiet button; tokens only; no card cloud.

- [ ] **Step 2: Modal** — use native `<dialog ref>` + `showModal()` / `close()`. Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-sm`. Content: `bg-surface-raised rounded-lg border border-border-subtle p-4 max-h-[80vh] overflow-auto`. Title «Baúl». Focus trap: dialog native. Esc closes. `prefers-reduced-motion`: skip opacity transition.

- [ ] **Step 3: Row** — word, sourceLabel, «Vuelve el {formatted date}» or «Dominada»; chips 7/30/90/180 calling `snoozeEssentialWord(word, days)`; «Practicar ahora» → `activateEssentialWordNow`; «Dominada» → `masterEssentialWord`. Loading per-row. Use `Button` / `PillButton` variants. Spanish chrome.

- [ ] **Step 4: LiveQuery** in modal/trigger parent:

```ts
useLiveQuery(async () => {
  await migrateAllArchivedInDb(); // idempotent
  return db.srsData.toArray();
}, [])
```

Filter with `filterVaultEntries`.

- [ ] **Step 5: Component tests** — open modal, type search, click Dominada mocks helper.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(ui): SRS vault trigger + modal"
```

---

### Task 7: Mount vault on Essential Words + Review

**Files:**
- Modify: `app/(authenticated)/practice/core-1000/page.tsx` (or Essential Words page after rename)
- Modify: `components/practice/review/ReviewHubClient.tsx`
- Remove `ArchivedWordsPanel` import

- [ ] Essential Words: below practice card, `<SrsVaultTrigger />` + modal state.
- [ ] Review: next to `ReviewHubActions` or below sections — same trigger (shared count of all vault rows).
- [ ] Commit: `feat(ui): show SRS vault on Essential Words and Review`

---

### Task 8: Speak card — «90 días» / «No me la recuerdes más»

**Files:**
- Modify: `components/practice/essential-words/SpeakReviewCard.tsx` (or current path)
- Modify: session hook if needed

When reviewing a word that was re-activated from snooze (optional flag on queue item `fromSnooze?: boolean`), show secondary actions:

- «Seguir en 90 días» → `snoozeEssentialWord(word, 90)` then advance
- «No me la recuerdes más» → `masterEssentialWord(word)` then advance

Do **not** block recording with a modal. Place under self-grade / after grade as quiet `PillButton`s.

Track `fromSnooze` by setting a field when `activateExpiredSnoozes` flips a row in the same session boot.

- [ ] Tests + commit: `feat(essential-words): post-snooze keep/master actions`

---

### Task 9: Backfill `sentence_ipa`

**Files:**
- Create or extend: `scripts/core-1000/backfill-sentence-ipa.mjs` (reuse `scripts/lib/arpabet-to-ipa.mjs` + weak map from `generate-chunks.mjs` WEAK or `lib/core-1000/weak-forms`)
- Modify: `lib/core-1000/__tests__/dataset.test.ts` — assert every entry with `example_sentence` has `sentence_ipa`

- [ ] **Step 1: Script logic**

```js
// For each entry in each words-NNN.json:
// if (entry.example_sentence && !entry.sentence_ipa) {
//   entry.sentence_ipa = sentenceIpa(entry.example_sentence, entry.word, entry.ipa_weak ?? null)
// }
// Rebuild words-all.json
```

- [ ] **Step 2: Run**

```bash
node scripts/core-1000/backfill-sentence-ipa.mjs
pnpm validate:core1000
```

- [ ] **Step 3: Commit data + script**

```bash
git commit -m "fix(essential-words): backfill missing sentence_ipa"
```

---

### Task 10: Rename UI Core1000 → EssentialWords

**Files (mechanical):**
- Move `components/practice/core-1000/` → `components/practice/essential-words/`
- Rename `Core1000Session` → `EssentialWordsSession` (component), tests accordingly
- Update imports in page, hooks, tests
- User-facing strings: no «Core 1000»
- Keep route `/practice/core-1000` **or** add redirect `/practice/essential-words` → same page (prefer alias redirect + keep old path working)

- [ ] `pnpm type-check` + targeted vitest
- [ ] Commit: `refactor(ui): rename Core1000 components to EssentialWords`

---

### Task 11: Update core app documentation

**Files:**
- Modify: `docs/architecture/srs.md` §3 (replace Archivar section with Vault / snooze / mastered)
- Modify: `README.md` — one bullet under “What the app includes” for Essential Words + SRS vault
- Modify: `docs/README.md` — ensure Sistemas SRS blurb mentions vault (table already links `srs.md`)
- Optional: short note in `PRODUCT.md` Design Principles / purpose if Essential Words is called out (only if a natural place exists; do not invent marketing fluff)

**Required content for `docs/architecture/srs.md` §3:**

Replace the **Archivar** paragraph with:

- `status`: `active` | `snoozed` | `mastered`
- «Ya la sé» → snooze default 90d (`snoozeEssentialWord`)
- Expired snooze → auto `active`, enters queue, leaves vault
- Mastered → never due; searchable in Baúl
- UI: `SrsVaultTrigger` + `SrsVaultModal` on Essential Words + Review hubs
- Migration: legacy `archived` → `snoozed`
- Prefix `c1k:` unchanged
- Helpers: `lib/srs/status.ts`, `lib/srs/vault.ts`, `lib/srs/migrate-archived.ts`

Update the table row label to **Essential Words (NGSL / c1k:)** without implying only 1000 words.

- [ ] Commit: `docs: Essential Words SRS vault is core review model`

---

### Task 12: Final verification

- [ ] `pnpm type-check`
- [ ] `pnpm exec vitest run lib/srs lib/core-1000/__tests__/queue.test.ts components/practice/srs-vault components/practice/essential-words`
- [ ] `pnpm validate:core1000`
- [ ] Manual smoke: archive/snooze a word → appears in Baúl → change interval → Practicar ahora → Dominada; Review hub shows same count; study card shows sentence IPA for `be`

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| status model active/snoozed/mastered | 1–4 |
| migrate archived | 2 |
| queue + auto-activate | 3 |
| vault modal + search + filters + dates | 5–6 |
| Essential Words + Review mounts | 7 |
| 90d / no más on return | 8 |
| sentence_ipa backfill | 9 |
| Essential Words rename | 10 |
| App documentation | 11 |

## Self-review notes

- No `c1k:` / `lib/core-1000` folder rename (explicit non-goal).
- Deprecated `archiveCore1000Word` removed after Task 10.
- Modal uses native `<dialog>` (no new glass card pattern).
- Docs update is mandatory before calling the work done.
