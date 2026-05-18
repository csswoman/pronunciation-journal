# Engineering Standards

## File organization

### `lib/` layout

`lib/` separates **shared primitives** (root) from **domain code** (feature folders).

```
lib/
  cn.ts                  ← shared primitive
  format-relative-time.ts
  group-by-date.ts
  types.ts               ← global shared types
  ai-prompts.ts          ← canonical (see exception below)
  db/                    ← feature folder
  srs/
  pronunciation/
  word-bank/
  ai-practice/
  ...
```

### The rule

A file goes in **`lib/` root** only if it is a **shared primitive**:

- Pure function or type definition.
- No domain knowledge (doesn't know about decks, lessons, phonemes, conversations…).
- No I/O — no Supabase, no Dexie, no `fetch`, no Gemini.
- Reusable from any feature without dragging in unrelated concepts.

Everything else goes in a **feature folder** `lib/<feature>/`:

- Anything touching a domain concept → its feature folder.
- Anything doing I/O → its feature folder.
- A feature folder may have subfolders (`modes/`, `tools/`, `__tests__/`).
- A file that becomes a folder keeps its public path via `index.ts`
  (e.g. `lib/srs.ts` → `lib/srs/index.ts`, still imported as `@/lib/srs`).

### Decision checklist for a new file

1. Pure, no domain, no I/O? → `lib/<name>.ts` (root).
2. Otherwise → `lib/<feature>/<name>.ts`. Reuse an existing feature folder;
   create a new one only for a genuinely new domain.
3. Never put domain or I/O code in `lib/` root.

### Exception

- `lib/ai-prompts.ts` stays in root by mandate of `CLAUDE.md`
  ("All Gemini prompts → `lib/ai-prompts.ts`"). It is the single canonical
  prompt module and is treated as a fixed path, not a primitive.

### Current feature folders

`admin`, `ai-coach`, `ai-practice`, `api`, `content`, `db`, `decks`,
`exercises`, `lexicon`, `notion`, `phoneme-practice`, `pronunciation`,
`srs`, `stores`, `supabase`, `sync`, `theory-lessons`, `word-bank`.
