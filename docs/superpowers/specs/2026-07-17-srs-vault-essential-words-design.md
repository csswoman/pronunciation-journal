# SRS Vault + Essential Words — Design Spec

**Date:** 2026-07-17  
**Status:** Approved (brainstorm)  
**Register:** product  
**Surfaces:** Essential Words hub, Review hub, study/speak cards (sentence IPA)

**Supersedes:** the “archive forever / un-archive” semantics in
`2026-06-18-essential-words-anki-srs-design.md`. That flow becomes snooze (90d)
+ mastered. Same-session relapse HUD from that doc is unchanged.

## Problem

1. **Baúl distractor:** `ArchivedWordsPanel` lista pastillas a pantalla completa. Con muchas palabras «Ya la sé» ocupa scroll y compite con la tarjeta de práctica.
2. **Archivo desconectado del SRS:** `archived: true` saca la palabra de la cola para siempre hasta «Restaurar». La app promete repetición espaciada; el baúl no programa vuelta ni se integra con Review.
3. **`sentence_ipa` incompleto:** ~2672 / 2800 entradas tienen `example_sentence` pero no `sentence_ipa` (p. ej. *be*). La UI ya sabe mostrarla cuando existe.
4. **Naming:** el producto es «Palabras esenciales» / Essential Words (dataset > 1000), pero código y copy residuales siguen diciendo Core 1000.

## Goals

- Baúl compacto (trigger + modal) en Essential Words y Review, con buscador y fechas.
- «Ya la sé» = snooze SRS (default 90 días), no archivo muerto.
- Al vencer: vuelve a la cola de repaso y sale del baúl.
- En ese repaso: elegir seguir en 90 días o «No me la recuerdes más» (`mastered`).
- Baúl unificado: todas las filas SRS en `snoozed` | `mastered` (cualquier dominio/`wordId` prefix).
- Generar `sentence_ipa` faltante con el convertidor ARPAbet→IPA (estrés léxico + weak forms).
- Rename UI/componentes a Essential Words; mantener `lib/core-1000/` data layer y prefijo Dexie `c1k:` en v1.

## Non-goals

- Acento oracional (focus) en IPA.
- Renombrar carpetas `public/core-1000/` o `lib/core-1000/` en este pase.
- Migrar prefijo SRS `c1k:` → `ew:` (rompe offline sin migración dedicada).
- Cambiar el algoritmo SM-2 de grading más allá de estados snooze/mastered y `nextReview`.
- Glassmorphism decorativo fuera del backdrop del modal (el blur del overlay es funcional).

## Decisions (from brainstorm)

| Tema | Decisión |
|------|----------|
| Enfoque | Snooze SRS puro (no archivo + calendario paralelo) |
| Default «Ya la sé» | +90 días (`snoozed`), ajustable en baúl (7 / 30 / 90 / 180) |
| Al vencer snooze | Auto → `active`, entra Review / cola Essential Words, sale del baúl |
| En ese repaso | «Seguir 90 días» o «No me la recuerdes más» (`mastered`) |
| UI baúl | Trigger colapsado + modal (`<dialog>`) + backdrop blur |
| Dónde | Essential Words hub + Review hub |
| Contenido baúl | Todo SRS `snoozed` \| `mastered` |
| Scope | Baúl + SRS + `sentence_ipa` + rename UI/hooks/components |

---

## 1. Data model

### SRS status

Extend `SRSData` (`lib/types.ts`):

```ts
type SrsStatus = 'active' | 'snoozed' | 'mastered'

interface SRSData {
  // …existing SM-2 fields…
  status?: SrsStatus  // undefined/missing ≡ 'active'
  snoozedAt?: string  // ISO, when entered snoozed
  masteredAt?: string // ISO
  // Deprecated after migration (read-only for migrate-once):
  archived?: boolean
  archivedAt?: string
}
```

| Status | In due queue | In vault |
|--------|--------------|----------|
| `active` | yes if `nextReview <= now` | no |
| `snoozed` | no until `nextReview <= now` (then auto-activate) | yes while still snoozed |
| `mastered` | never | yes |

**Queue rule (Essential Words + any shared SRS consumer):**

1. On load / build queue: any `snoozed` with `nextReview <= now` → set `status: 'active'`, clear `snoozedAt` (idempotent write).
2. Due set = `status !== 'mastered' && status !== 'snoozed' && nextReview <= now` (after step 1, expired snoozes are already active).
3. `mastered` never enters due or new introduction.

**«Ya la sé» / snooze helper:**

- `status: 'snoozed'`
- `snoozedAt: now`
- `nextReview: now + N days` (default N = 90)
- Preserve ease/interval/repetitions (snooze is a schedule pause, not a grade).

**Master:**

- `status: 'mastered'`
- `masteredAt: now`
- Do not schedule `nextReview` for queue purposes (may keep last value for display).

**Practicar ahora (desde baúl):**

- `status: 'active'`
- `nextReview: now` (due immediately)

### Migration

On Dexie open / one-shot migrate (same pattern as other schema bumps if needed):

- If `archived === true` and no `status`:
  - `status = 'snoozed'`
  - `snoozedAt = archivedAt ?? now`
  - `nextReview = snoozedAt + 90d` (if current `nextReview` is missing or in the past relative to snooze intent, prefer snoozedAt+90d)
- Leave `archived` fields until a later cleanup; writers stop setting them.

### Vault query

```ts
srsData.filter(e => e.status === 'snoozed' || e.status === 'mastered'
  || (e.archived && !e.status)) // pre-migrate safety
```

Sort: snoozed by `nextReview` ascending; mastered by `masteredAt` descending. Search filters `word` (and optional source label).

**Source label:** derive from `wordId` prefix (`c1k:` → «Palabras esenciales»; unknown → «SRS»).

---

## 2. UI / layout

### Trigger (page chrome)

Replace the always-open pill cloud with a single quiet line:

> Baúl · {n} {palabra\|palabras}

- Render only if `n > 0`.
- Opens `SrsVaultModal`.
- Place below primary practice content on Essential Words; on Review hub as a secondary action near hub actions (same component).
- No nested cards: trigger is text/button on the open canvas or a single flat control — not a large card full of chips.

### Modal

- Native `<dialog>` (or existing dialog primitive if one matches a11y patterns).
- Backdrop: dim + `backdrop-filter: blur` (functional focus; not a glass card).
- Header: «Baúl»
- Search input (Spanish placeholder: «Buscar palabra…»)
- Filters: Todas | En pausa | Dominadas
- List rows (dense, not pills):
  - Word (learning content, English)
  - Source caption
  - Meta: «Vuelve el {date}» | «Dominada»
  - Actions: interval chips (7/30/90/180) if snoozed · «Practicar ahora» · «Dominada»
- Empty: «Nada en el baúl.» / «Ninguna coincidencia.»
- Motion: 150–200 ms open/close; honor `prefers-reduced-motion`.
- One primary emphasis per row max; prefer ghost/soft for secondary actions (`PillButton` / `Button` variants).

### Speak / study when snooze returns

When a formerly snoozed word appears in speak/review: offer two outcomes after or beside the normal grade path (exact placement in SpeakReviewCard / session footer — implement as non-blocking secondary choices, not a blocking modal mid-recording):

- «Seguir en 90 días» → snooze again
- «No me la recuerdes más» → master

Normal SM-2 grades still apply when the learner practices; these two are explicit vault outcomes for the “I already know this” track. If both grade and vault action are available, vault actions are explicit buttons; grading remains the default session path.

### Copy

- UI chrome: Spanish.
- Learning content (headwords, example sentences): English.
- No Spanglish in one phrase.

---

## 3. sentence_ipa backfill

- Extend `scripts/core-1000/apply-lexical-stress.mjs` (or sibling `backfill-sentence-ipa.mjs`) to **create** `sentence_ipa` when `example_sentence` exists and `sentence_ipa` is missing, using shared `arpabetStringToIpa` + weak-form override for the entry’s lemma when `ipa_weak` is set.
- Do not overwrite hand-authored `sentence_ipa` that already contain stress marks (keep prior rule).
- Rebuild `words-all.json`.
- Gate: `pnpm validate:core1000` still green; prefer asserting high coverage of `sentence_ipa` in dataset tests (e.g. every entry with `example_sentence` has `sentence_ipa`, allowing documented exceptions only if needed).

UI: no change required beyond data — `StudyCard` / `SpeakReviewCard` already render `sentenceIpa` / `sentence_ipa` when present.

---

## 4. Rename: Essential Words

| Layer | Action |
|-------|--------|
| User-facing copy | «Palabras esenciales» / Essential Words; remove residual «Core 1000» in UI |
| Components / hooks under `components/practice/` | `Core1000*` → `EssentialWords*` where user-facing; folder `core-1000` → `essential-words` for UI |
| `hooks/useEssentialWordsSession.ts` | Already named; align imports |
| `lib/core-1000/` | **Keep** (data, queue, grade, schema) |
| `public/core-1000/` | **Keep** |
| Dexie `wordId` prefix `c1k:` | **Keep** |
| Activity types | Already `essential_words` — keep |

Update tests and imports accordingly. Prefer mechanical renames with green tests over drive-by refactors.

---

## 5. Component map

```
components/practice/srs-vault/
  SrsVaultTrigger.tsx
  SrsVaultModal.tsx
  SrsVaultSearch.tsx      // or inline if < ~40 lines
  SrsVaultFilters.tsx
  SrsVaultRow.tsx

lib/srs/vault.ts          // queries, snooze/master/activate helpers (or lib/db helpers)
lib/srs/migrate-archived.ts
```

Rules: ≤250 lines/file; ≤8 props; no Supabase from UI; Dexie via `lib/db` / domain helpers.

Replace `ArchivedWordsPanel` with trigger + modal.

---

## 6. Error handling & offline

- All vault mutations write Dexie first; offline-safe.
- Failed mutation: keep row visible; show inline/toast error; clear loading state.
- LiveQuery keeps Review + Essential Words triggers in sync.

---

## 7. Testing

- Unit: migration `archived` → `snoozed`; queue excludes snoozed/mastered; expired snooze activates.
- Component: trigger count; modal search/filter; row actions call helpers.
- Dataset: `sentence_ipa` coverage after backfill.
- Rename: update `Core1000Session` / `ArchivedWordsPanel` tests to Essential Words / SrsVault names.

---

## 8. Implementation order (for plan)

1. Data model + migration + queue rules + tests  
2. Vault helpers + SrsVault UI (trigger + modal) on Essential Words  
3. Wire Review hub  
4. Speak/review «90 días / no más» affordances  
5. `sentence_ipa` backfill + validate  
6. Rename UI modules Core1000 → EssentialWords  

---

## Open points resolved in brainstorm

- Default interval: **90 days** (adjustable in vault).  
- Permanent dismiss: **`mastered`**, searchable in vault only.  
- Modal with blur: **yes**, hubs only (not mid-session recording).  
- Prefix `c1k:`: **unchanged**.
