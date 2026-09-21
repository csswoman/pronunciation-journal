# Plan 014: El placement hecho como invitado llega a la cuenta y los fallos se ven

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/courses/guest-assessment.ts lib/courses/__tests__/guest-assessment.test.ts components/auth/AuthProvider.tsx components/courses/assessment-client-helpers.ts lib/preferences/guest-study-level.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 007 (si la ruta exige `answers`, el resultado de invitado debe guardarlas; ver Step 1)
- **Category**: correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

Un invitado que hace el placement y luego se registra puede acabar en
`A1 / starter_default` sin ningún aviso: el claim está envuelto en dos capas
de `catch {}` silenciosas, se memoriza por `userId` durante toda la vida de la
página (un 500 transitorio no se reintenta hasta recargar), borra la clave de
localStorage solo después de la escritura en Dexie (si esa falla, el POST ya
se hizo y un reintento duplica `assessment_results`), y el nivel elegido a
mano por un invitado en Ajustes nunca se traslada a la cuenta.

## Current state

`lib/courses/guest-assessment.ts`:
```ts
const GUEST_PLACEMENT_KEY = "assessment:guest:placement:placement";   // línea 5
const claims = new Map<string, Promise<boolean>>();                    // línea 6
async function claim(userId) {
  const raw = window.localStorage.getItem(GUEST_PLACEMENT_KEY); if (!raw) return false;
  try {
    ... validated = AssessmentPayloadSchema.safeParse(candidate); if (!validated.success) return false;
    const response = await fetch("/api/assessment/results", { method: "POST", ..., body: JSON.stringify({ mode: "placement", evaluatedLevel: ..., result }) });
    if (!response.ok) return false;                                              // línea 36
    await persistAssessmentConceptProfile(userId, result.conceptSignals, result.assignedLevel);
    window.localStorage.setItem(`assessment:${userId}:placement:placement`, ...);
    window.localStorage.removeItem(GUEST_PLACEMENT_KEY);                         // línea 43
    return true;
  } catch { return false; }                                                       // línea 45-47
}
export function claimGuestPlacement(userId) { const existing = claims.get(userId); if (existing) return existing;
  const pending = claim(userId).finally(() => claims.delete(userId)); claims.set(userId, pending); return pending; }
```
Nota: `claims.delete` en `finally` sí libera el memo; pero `AuthProvider`
solo llama a `hydrateCEFR` al cambiar de usuario, así que en la práctica no
hay reintento.

`components/auth/AuthProvider.tsx:106-170`: `hydrateCEFR` llama a
`claimGuestPlacement(userId)` dentro de `try { … } catch { /* hydration is best-effort */ }`.

`components/courses/assessment-client-helpers.ts:37-43`: `saveGuestStudyLevel(nextResult.assignedLevel)` en localStorage.
`lib/preferences/guest-study-level.ts`: `readGuestStudyLevel()` / `saveGuestStudyLevel()`.
`components/ui/ProfileSettings.tsx:96-99`: invitado cambia nivel → solo `saveGuestStudyLevel`.

Test existente: `lib/courses/__tests__/guest-assessment.test.ts`.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm vitest run lib/courses/__tests__/guest-assessment.test.ts components/auth` | all pass |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |

## Scope

**In scope**: `lib/courses/guest-assessment.ts` y su test; `components/auth/AuthProvider.tsx` (solo el bloque de claim); `components/courses/assessment-client-helpers.ts` (guardar `answers` en el resultado de invitado si 007 está hecho); `lib/users/queries.ts` solo para llamar a `applyManualCefrLevel` en el fallback de nivel de invitado.

**Out of scope**: la ruta API (plan 007), `lib/learner-level/*` (plan 008), checkpoints de invitado (no se reclaman hoy; follow-up).

## Git workflow

- Rama: `advisor/014-guest-claim` desde `dev`. Commit: `fix(assessment): make guest placement claim retryable and visible`.

## Steps

### Step 1: Orden de escrituras e idempotencia

1. En `claim()`: mueve `localStorage.removeItem(GUEST_PLACEMENT_KEY)` a
   **después** de que ambas escrituras (POST y Dexie) hayan tenido éxito
   (ya está después de Dexie; lo importante es que el POST no se repita si
   Dexie falla). Para eso, antes del POST escribe una marca
   `assessment:guest:placement:posted = <completedAt>`; si la marca existe al
   reintentar, salta el POST y ve directo a Dexie. Borra la marca junto con la
   clave principal al final.
2. Si el plan 007 ya exige `answers` en el POST: en
   `assessment-client-helpers.ts`/`AssessmentClient.tsx`, cuando no hay
   `userId`, guarda en `GUEST_PLACEMENT_KEY` también `answers`, `selfRatings`
   y `checkpointLevel`, y envíalos en el claim. Si 007 no está hecho, salta
   este punto y anótalo.
3. Sustituye `catch { return false }` por un `catch (error)` que llame a
   `console.error('[guest-assessment] claim failed', error)` y devuelva `false`.
   En `if (!response.ok)` registra también el status.

**Verify**: `pnpm vitest run lib/courses/__tests__/guest-assessment.test.ts` → all pass tras añadir: (a) Dexie falla → la clave sigue en localStorage y el segundo intento **no** repite el POST; (b) POST 500 → clave conservada.

### Step 2: Reintento tras login

En `AuthProvider.tsx`, tras el claim fallido (retorno `false` con la clave
aún presente), programa un único reintento con `setTimeout(…, 15_000)` que
vuelva a llamar `claimGuestPlacement(userId)` si el usuario sigue siendo el
mismo (`currentUserIdRef.current === userId`). Limpia el timeout en el
cleanup del efecto.

**Verify**: `pnpm vitest run components/auth` → all pass (añade un test si la suite de AuthProvider mockea `guest-assessment`; si no, anótalo como no cubierto).

### Step 3: Nivel manual de invitado

En `hydrateCEFR`, si `claimGuestPlacement` devuelve `false` **y** no había
clave de placement, lee `readGuestStudyLevel()`; si es distinto de `"A1"`
y el nivel resuelto del perfil tiene `source === 'starter_default'`, llama a
`applyManualCefrLevel(userId, guestLevel)` y luego limpia el valor de invitado
(`saveGuestStudyLevel("A1")` o una función `clearGuestStudyLevel` nueva en
`guest-study-level.ts`).

**Verify**: `pnpm type-check && pnpm lint` → exit 0.

## Done criteria

- [ ] Tests listados pasan, incluidos los 2 nuevos de `guest-assessment.test.ts`
- [ ] `grep -n "catch {" lib/courses/guest-assessment.ts` → 0
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- El plan 007 está a medias (ruta exige `answers` pero el cliente de invitado no las guarda): reporta; no relajes la ruta.

## Maintenance notes

- Los checkpoints de invitado (`assessment:guest:checkpoint:*`) siguen sin reclamarse; decidir si se permiten checkpoints sin cuenta.
- Revisor: el claim no debe poder insertar dos filas en `assessment_results` por el mismo `completedAt`.
