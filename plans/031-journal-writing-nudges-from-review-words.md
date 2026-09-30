# Plan 031: Writing Nudges: Palabras de repaso como sugerencia activa en el Diario

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 87636eca..HEAD -- app/(authenticated)/journal/write/page.tsx lib/journal/scaffold-resolver.ts components/journal/JournalSupportRail.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 028, 029
- **Category**: direction / pedagogy
- **Planned at**: commit `87636eca`, 2026-09-22

## Why this matters

El Diario personal puede ayudar al alumno a usar palabras pendientes de repaso en un texto propio. Es una hipótesis de producto que debe medirse, no una mejora de retención garantizada. `selectGrammarNote` ya prioriza temas gramaticales vencidos; `resolveSeedVocabulary` parte de una lista asociada al prompt. El plan propone sugerencias opcionales, sin convertir su aparición o uso en evidencia de dominio. Se ejecuta después de cerrar las fallas de reparación y persistencia de los planes 028 y 029.

## Current state

- En `app/(authenticated)/journal/write/page.tsx:25-28`:
  ```ts
  const [resolvedVocabulary, grammarNote] = await Promise.all([
    resolveSeedVocabulary(scaffold.seed_vocabulary, userId),
    selectGrammarNote(scaffold.relevant_topics, scaffold.grammar_notes, userId),
  ])
  ```
  `resolveSeedVocabulary` solo mapea las palabras predefinidas del scaffold temático.
- En `lib/journal/scaffold-resolver.ts:16-34`:
  Solo busca coincidencias con `scaffold.seed_vocabulary`. Si el usuario tiene palabras en estado `learning` o con SRS vencido (`srs_status: 'learning' | 'review'`), no se le sugieren proactivamente para redactar su entrada.
- El riel lateral `JournalSupportRail.tsx` ya tiene soporte para mostrar chips de vocabulario y marcar cuáles fueron usadas en el texto mediante `vocabWords={resolvedVocabulary.map((w) => w.text)}` en `JournalWorkspace.tsx`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm vitest run lib/journal/__tests__/` | all pass |
| Lint      | `pnpm lint`              | exit 0              |

## Scope

**In scope**:
- `lib/journal/scaffold-resolver.ts`
- `lib/journal/server-queries.ts` o consulta canónica server-side de `lib/word-bank/` (separada del `queries.ts` de Dexie del navegador)
- `app/(authenticated)/journal/write/page.tsx`
- `components/journal/JournalSupportRail.tsx`
- `lib/journal/__tests__/scaffold-resolver.test.ts`

**Out of scope**:
- Modificar el prompt de corrección de Gemini.
- Forzar al usuario a usar las palabras (debe ser una sugerencia no bloqueante).

## Steps

### Step 1: Consultar palabras activas/vencidas mediante el query layer

Define la consulta de `word_bank` en un query module **server-side** del Diario o reutiliza una consulta canónica server-side de `lib/word-bank/`. No importes `lib/journal/queries.ts` desde código `server-only`: ese módulo usa Dexie. El resolver solo debe ordenar, limitar y combinar candidatos. Confirma en el esquema real qué columnas indican vencimiento y qué fuentes de vocabulario se incluyen; `word_bank` no equivale por sí solo a todas las Palabras Esenciales. La consulta debe estar limitada por `user_id`, excluir palabras sin repaso debido y distinguir error de lectura de una lista vacía. No uses `if (error || !data) return []`.

Expón un resultado con los campos que consume `ResolvedSeedWord` y una procedencia explícita `dueReview`. Define el nombre y tipos definitivos contra el query layer real; evita copiar una firma que oculte errores o presuponga columnas no verificadas.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Unificar vocabulario del scaffold con palabras en repaso en `page.tsx`

En `app/(authenticated)/journal/write/page.tsx`:
1. Invoca `fetchDueWordsForScaffold(userId, 3)` en paralelo a `resolveSeedVocabulary` y `selectGrammarNote`.
2. Combina los arrays evitando duplicados por lema normalizado e ID canónico cuando exista; conserva la procedencia de repaso.
3. Pasa el resultado combinado como `resolvedVocabulary` a `JournalPageClient`.
4. Si falla la consulta de repaso, no muestres el distintivo "En tu repaso" ni conviertas el fallo en cero palabras vencidas; permite continuar con el scaffold y registra el error.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Etiquetar en el riel lateral las palabras que provienen de repaso

En `components/journal/JournalSupportRail.tsx`, muestra *"En tu repaso"* solo cuando la consulta canónica confirmó que esa palabra está vencida. `inWordBank` o `srsStatus === 'learning'` por sí solos no prueban vencimiento. Conserva esa procedencia al combinarla con palabras del scaffold.

**Verify**: `pnpm lint` y `pnpm type-check` → exit 0.

### Step 4: Tests unitarios

Añade tests a `lib/journal/__tests__/scaffold-resolver.test.ts` verificando:
1. La consulta filtra por usuario y vencimiento real.
2. El resolver conserva procedencia y deduplica sin atribuir repaso a una palabra del scaffold que no está vencida.
3. Un error de consulta se diferencia de un usuario sin palabras vencidas.

**Verify**: `pnpm vitest run lib/journal/__tests__/scaffold-resolver.test.ts` → all pass.

## Test plan

- Test 1: Comprobar recuperación de palabras vencidas desde `word_bank`.
- Test 2: Comprobar deduplicación si el scaffold del prompt y el word_bank contienen la misma palabra.
- Test 3: Comprobar que ver/usar la sugerencia no escribe mastery, completion ni SRS sin evaluación objetiva.

## Done criteria

- [x] `pnpm type-check` exits 0
- [x] `pnpm vitest run lib/journal/__tests__/` exits 0
- [x] `pnpm lint` exits 0
- [x] `plans/README.md` status row 031 updated
- [x] La sugerencia es opcional y su efecto se evalúa por uso y respuesta real, no por exposición al chip.

## STOP conditions

- Error en consultas de Supabase por columnas no existentes en `word_bank` (validar schema en `types/supabase.ts`).

## Maintenance notes

- Si el usuario no tiene palabras en su banco personal, el sistema degrada limpiamente a las palabras sugeridas por el scaffold del prompt.
