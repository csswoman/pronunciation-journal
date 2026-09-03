# Plan 083: Normalizar la ruta de generación de oraciones bajo `/api/gemini/generate-sentences`

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- app/api/sentences/generate lib/exercises/generators/reorder-ai.ts scripts/audit-ai-prompts.mjs`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security, tech-debt, architecture
- **Planned at**: commit `a63525d0`, 2026-09-02

## Why this matters

`CLAUDE.md:L21` establece como regla dura:
> `- All Gemini calls → /api/gemini/* only. Fallback chain: flash-lite → flash → latest`

Sin embargo, `app/api/sentences/generate/route.ts` invoca a Gemini directamente desde una ruta fuera de `/api/gemini/*`. Esto obligó a agregar una excepción explícita con un `TODO` en `scripts/audit-ai-prompts.mjs:34-38`. Además, la ruta usa un rate limit aislado en lugar del mecanismo multicapa estándar `checkLayeredRateLimit`. Este plan mueve la ruta al espacio de nombres `/api/gemini/generate-sentences`, actualiza el consumidor (`reorder-ai.ts`), alinea su rate limiting y elimina la excepción de auditoría de CI.

## Current state

- `app/api/sentences/generate/route.ts`: Endpoint que llama a Gemini mediante `callWithFallback` para generar oraciones de ejercicios de reordenación.
- `scripts/audit-ai-prompts.mjs:34-38`:
  ```javascript
  // TODO: move under app/api/gemini/* per CLAUDE.md ("All Gemini calls →
  // /api/gemini/* only"). Otherwise compliant: prompt lives in
  // lib/ai-prompts.ts, call goes through lib/gemini/client.ts.
  "app/api/sentences/generate/route.ts",
  ```
- `lib/exercises/generators/reorder-ai.ts:23`:
  ```typescript
  const res = await fetch('/api/sentences/generate', { ... });
  ```
- `app/api/sentences/generate/__tests__/route.test.ts`: Pruebas del endpoint.

## Commands you will need

| Purpose   | Command                                         | Expected on success |
|-----------|-------------------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                               | exit 0, no errors   |
| Tests     | `pnpm test -- generate-sentences`               | all pass            |
| Tests     | `pnpm test -- reorder-ai`                       | all pass            |
| Audit     | `pnpm audit:ai-prompts`                         | exit 0              |
| Audit     | `pnpm audit:hard-rules`                         | exit 0              |
| Lint      | `pnpm lint`                                     | exit 0              |

## Scope

**In scope**:
- Mover/crear `app/api/gemini/generate-sentences/route.ts`
- Mover `app/api/sentences/generate/__tests__/route.test.ts` a `app/api/gemini/generate-sentences/__tests__/route.test.ts`
- Mantener en `app/api/sentences/generate/route.ts` un reenvío/delegación temporal para evitar romper clientes desactualizados si aplica, o retirarlo si solo tiene consumidores internos verificados.
- `lib/exercises/generators/reorder-ai.ts`
- `scripts/audit-ai-prompts.mjs`

**Out of scope**:
- No alterar los prompts definidos en `lib/ai-prompts.ts` (`SENTENCE_REORDER_SYSTEM_PROMPT`, `buildSentenceReorderUserPrompt`).
- No cambiar la estructura de la tabla `text_fragments`.

## Steps

### Step 1: Mover el handler a `app/api/gemini/generate-sentences/route.ts`
- Trasladar el código de `app/api/sentences/generate/route.ts` a `app/api/gemini/generate-sentences/route.ts`.
- Reemplazar el rate limit simple con `checkLayeredRateLimit` para coherencia con las demás rutas `/api/gemini/*`:
  ```typescript
  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request: req,
    user,
    endpoint: "/api/gemini/generate-sentences",
    maxPermanent: 15,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError;
  ```

### Step 2: Actualizar `lib/exercises/generators/reorder-ai.ts`
- Cambiar la URL de la llamada fetch:
  ```typescript
  const res = await fetch('/api/gemini/generate-sentences', { ... });
  ```

### Step 3: Limpiar o delegar en la ruta anterior
- En `app/api/sentences/generate/route.ts`, si se requiere compatibilidad, delegar la petición al nuevo handler o eliminar el archivo y su directorio si `reorder-ai.ts` es el único consumidor.

### Step 4: Eliminar la excepción en `scripts/audit-ai-prompts.mjs`
- Quitar `"app/api/sentences/generate/route.ts"` del array `GENAI_ALLOWLIST_PREFIXES`.

### Step 5: Actualizar y mover tests
- Mover `app/api/sentences/generate/__tests__/route.test.ts` a `app/api/gemini/generate-sentences/__tests__/route.test.ts`.
- Actualizar los paths de las URLs testeadas a `http://localhost/api/gemini/generate-sentences`.

### Step 6: Verificación
- Correr `pnpm audit:ai-prompts`. Debe salir exit 0 sin excepciones pendientes.
- Correr `pnpm test -- generate-sentences`.
- Correr `pnpm audit:hard-rules` y `pnpm type-check`.

## STOP conditions
- Si se detecta algún cliente externo o webhook que invoque estrictamente `/api/sentences/generate`, dejar un proxy con deprecation warning en lugar de borrar la ruta anterior.
