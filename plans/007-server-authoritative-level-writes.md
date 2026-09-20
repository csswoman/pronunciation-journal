# Plan 007: El nivel CEFR y su procedencia solo los escribe el servidor tras re-puntuar

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- app/api/assessment/results/route.ts lib/courses/assessment-queries.ts lib/courses/assessment-schema.ts lib/courses/assessment.ts components/courses/assessment-client-helpers.ts components/courses/AssessmentClient.tsx lib/users/queries.ts hooks/useUserPreferences.ts supabase/migrations/`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (toca RLS/trigger de `user_profiles` y el flujo de guardado del test)
- **Depends on**: none
- **Category**: security / correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

La migración `20260918090000_add_cefr_level_provenance.sql` añadió
`cefr_level_source` para que "el A1 por defecto no se haga pasar por
placement". Pero la misma migración concede al rol `authenticated` UPDATE
directo sobre esa columna, y la ruta `/api/assessment/results` confía en el
`assignedLevel` que manda el cliente sin volver a puntuar. Cualquier usuario
puede, desde la consola del navegador, ponerse en C2 con procedencia
`placement`, o mandar un POST con `mode: "checkpoint"` y el nivel que quiera.
Todo el contenido (Daily, Ruta, Essential Words, coach) se filtra por ese
nivel, así que la integridad del nivel es la integridad pedagógica de la app.

## Current state

### Escritores del nivel

1. **Servidor** — `lib/courses/assessment-queries.ts:44-57`:
   ```ts
   export async function persistAssessmentOutcome(userId, mode, result: AssessmentResult, evaluatedLevel?) {
     const supabase = await createSupabaseServerClient();
     const profileUpdate = { id: userId, cefr_level: result.assignedLevel, cefr_level_source: mode, cefr_level_updated_at: levelUpdatedAt };
     const [profileResult] = await Promise.all([
       supabase.from("user_profiles").upsert(profileUpdate, { onConflict: "id" }),
       saveAssessmentResult(userId, mode, result, evaluatedLevel),
     ]);
     if (profileResult.error) { const admin = tryGetSupabaseAdminClient(); if (admin) { ...upsert con admin... } ...
   ```
   Llamado desde `app/api/assessment/results/route.ts:29-35`, que valida el
   body con `AssessmentResultSchema` (`lib/courses/assessment-schema.ts`) y
   luego hace `body.result as AssessmentResult` sin recalcular nada.

2. **Cliente (manual)** — `lib/users/queries.ts:109-125`:
   ```ts
   export async function syncCefrLevel(userId, cefrEstimate, source: LearnerLevelSource = "practice_estimate") {
     const supabase = getSupabaseBrowserClient();
     const { error } = await supabase.from("user_profiles").upsert({ id: userId, cefr_level: cefrEstimate, cefr_level_source: source, cefr_level_updated_at: ... }, { onConflict: "id" });
   ```
   Único caller: `applyManualCefrLevel` (línea 136) con `"manual"`.
   `applyManualCefrLevel` además actualiza Dexie `learningState.level.cefrEstimate` (líneas 138-155).
   Lo invoca `hooks/useUserPreferences.ts:117` (`updateCefrLevel`).

### Cómo el cliente construye y envía el resultado

`components/courses/assessment-client-helpers.ts:27-60` (`saveAssessmentLevel`):
guarda en localStorage (`saveGuestStudyLevel`), en Dexie
(`persistAssessmentConceptProfile`) y hace POST a `/api/assessment/results`
con `{ mode, evaluatedLevel, result: nextResult }`. `nextResult` lo calcula
el cliente con `scoreAssessment(questions, answers, mode, checkpointLevel, concepts, selfRatings)`
(`lib/courses/assessment.ts:170-260`). Las preguntas las genera el servidor en
`app/assessment/page.tsx:22-28` con `buildAssessment(mode, level)` +
`getDeckBySlug(slug).quiz` + `buildAssessmentQuestions(mode, quizzes, level)`.
Todo eso es determinista y puro (contenido estático en `public/grammar-decks`),
así que el servidor puede reconstruir el mismo set de preguntas.

`scoreAssessment` recibe `answers: Record<questionId, optionIndex>`; el POST
actual no envía `answers`, solo el resultado.

### Base de datos

`supabase/migrations/20260821090000_secure_user_profiles_and_roles.sql:143-171`
define el trigger `protect_user_profiles_privileged_columns` que, para
escritores no `service_role`, fija `role`, `storage_used_kb` e `id` a sus
valores previos. No toca `cefr_level_source`.

`supabase/migrations/20260918090000_add_cefr_level_provenance.sql:31-34`:
```sql
GRANT UPDATE (display_name, cefr_level, cefr_level_source, cefr_level_updated_at, interests) ON TABLE public.user_profiles TO authenticated;
```

Política RLS (`...secure_user_profiles_and_roles.sql:195-201`): `UPDATE ... USING (id = auth.uid()) WITH CHECK (id = auth.uid())`.

Convención de la ruta API: `requireSameOrigin`, `requireUser`, `rateLimit`,
`validateBody`, `publicErrorResponse`, `logServerError` de `lib/api/guards`
y `lib/api/logging` (ver `app/api/assessment/results/route.ts` completo como
ejemplo). Migraciones: archivos `supabase/migrations/YYYYMMDDHHMMSS_slug.sql`;
`pnpm check:migrations` valida la numeración.

Tests existentes que sirven de patrón: `lib/courses/__tests__/assessment-queries.test.ts`
(mockea `createSupabaseServerClient`), `lib/courses/__tests__/assessment.test.ts`,
`app/api/__tests__/` (rutas).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Migraciones | `pnpm check:migrations` | exit 0 |
| RLS | `pnpm audit:rls` | exit 0 |
| Tests | `pnpm vitest run lib/courses app/api components/courses lib/users` | all pass |

## Scope

**In scope**:
- `supabase/migrations/<nuevo>_protect_cefr_level_source.sql` (crear)
- `app/api/assessment/results/route.ts`
- `lib/courses/assessment-schema.ts`
- `lib/courses/assessment-queries.ts`
- `lib/courses/assessment.ts` (solo si hace falta exportar un helper puro para re-puntuar; no cambiar la lógica de scoring)
- `components/courses/assessment-client-helpers.ts`, `components/courses/AssessmentClient.tsx` (enviar `answers` y `selfRatings`)
- `app/api/profile/level/route.ts` (crear) para el nivel manual
- `lib/users/queries.ts` (`syncCefrLevel` → llamada a la ruta nueva)
- Tests de todo lo anterior

**Out of scope**:
- `lib/learner-level/*` (lectura del nivel; lo cubre el plan 008).
- `lib/courses/guest-assessment.ts` — el claim de invitado usa el mismo POST; funcionará al enviar `answers` si el resultado de invitado las conserva. Si no las conserva, ver STOP.
- Cambiar umbrales de `LEVEL_ASSESSMENT_CONTRACTS`.
- `AuthProvider.tsx`.

## Git workflow

- Rama: `advisor/007-server-authoritative-level` desde `dev`.
- Commits convencionales, ej. `feat(cefr): add CEFR level provenance, ...`.
- No push ni PR sin instrucción. No aplicar la migración a producción desde
  aquí; solo crear el archivo y validarlo con `pnpm check:migrations`.

## Steps

### Step 1: Trigger que protege la procedencia en la base de datos

Crea `supabase/migrations/20260919090000_protect_cefr_level_source.sql` con:

```sql
CREATE OR REPLACE FUNCTION public.protect_user_profiles_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'free';
    NEW.storage_used_kb := 0;
    -- Un cliente solo puede nacer como starter_default o manual.
    IF NEW.cefr_level_source NOT IN ('starter_default', 'manual') THEN
      NEW.cefr_level_source := 'starter_default';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.role := OLD.role;
    NEW.storage_used_kb := OLD.storage_used_kb;
    NEW.id := OLD.id;
    -- Solo el servidor (service_role) puede afirmar placement/checkpoint.
    IF NEW.cefr_level_source IS DISTINCT FROM OLD.cefr_level_source
       AND NEW.cefr_level_source NOT IN ('manual') THEN
      RAISE EXCEPTION 'cefr_level_source % can only be set by the server', NEW.cefr_level_source
        USING ERRCODE = '42501';
    END IF;
    -- Cambiar el nivel desde el cliente siempre degrada la procedencia a manual.
    IF NEW.cefr_level IS DISTINCT FROM OLD.cefr_level AND NEW.cefr_level_source = OLD.cefr_level_source
       AND OLD.cefr_level_source IN ('placement', 'checkpoint') THEN
      NEW.cefr_level_source := 'manual';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_cefr_level_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_cefr_level_check
  CHECK (cefr_level IS NULL OR cefr_level IN ('A1','A2','B1','B2','C1','C2'));
```

Nota: el trigger ya existe (`tr_protect_user_profiles_privileged_columns`);
`CREATE OR REPLACE FUNCTION` basta. Antes de añadir el CHECK sobre
`cefr_level`, comprueba con `grep -rn "cefr_level" supabase/migrations/*.sql | grep -i "default\|insert"`
qué valores por defecto o seeds existen; si hay valores en minúscula
(`'a1'`), añade un `UPDATE ... SET cefr_level = upper(cefr_level)` antes del
CHECK.

**Verify**: `pnpm check:migrations` → exit 0. `pnpm audit:rls` → exit 0.

### Step 2: La ruta re-puntúa en servidor

1. En `lib/courses/assessment-schema.ts` amplía `AssessmentResultSchema` con:
   ```ts
   answers: z.record(z.string().min(1).max(120), z.number().int().min(0).max(10)).optional(),
   selfRatings: z.record(z.string().min(1).max(200), z.enum(["unknown","familiar","confident"])).optional(),
   checkpointLevel: z.enum(["a1","a2","b1","b2","c1","c2"]).nullable().optional(),
   ```
2. Extrae de `app/assessment/page.tsx:22-43` la construcción de
   `questions` y `concepts` a una función pura en `lib/courses/assessment.ts`:
   `export function buildServerAssessment(mode, checkpointLevel?): { questions: AssessmentQuestion[]; concepts: AssessmentConcept[] }`
   (mueve el código tal cual; `getDeckBySlug` y `getLessonBySlug` son lecturas
   de JSON estático, sin I/O de red). Haz que la página la use.
3. En `app/api/assessment/results/route.ts`, tras `validateBody`:
   - Si `body.answers` está presente: reconstruye con `buildServerAssessment`,
     llama a `scoreAssessment(questions, body.answers, body.mode, body.checkpointLevel ?? undefined, concepts, body.selfRatings ?? {})`
     y usa **ese** resultado para `persistAssessmentOutcome`. Si
     `serverResult.assignedLevel !== body.result.assignedLevel`, registra con
     `logServerError("Assessment level mismatch", ...)` y persiste el del servidor.
   - Si `body.answers` no está presente: responde `400` con
     `publicErrorResponse(400, "answers required")`. (El cliente se actualiza
     en el paso 3; el claim de invitado en el STOP.)
   - Para `mode === "checkpoint"`: obtén `getEffectiveLearnerLevelServer(user.id)`
     (`lib/learner-level/server-queries.ts`) y rechaza con 400 si
     `body.checkpointLevel` está más de un nivel por encima del nivel resuelto
     (usa `ASSESSMENT_LEVEL_ORDER.indexOf`).
4. En `persistAssessmentOutcome`: cuando `mode === "checkpoint"` y
   `!result.passed`, **no** actualices `user_profiles` (el nivel no cambia y
   no debe refrescarse `cefr_level_updated_at`); solo guarda `assessment_results`.
5. Elimina el fallback al cliente con cookie: `persistAssessmentOutcome` debe
   usar directamente `tryGetSupabaseAdminClient()` para el upsert de
   `user_profiles` (tras el paso 1, la escritura con cookie de usuario será
   rechazada por el trigger). Si el admin client no está configurado, lanza y
   la ruta responde 500 (comportamiento actual).

**Verify**: `pnpm vitest run lib/courses/__tests__/assessment-queries.test.ts app/api` → all pass tras ajustar mocks.

### Step 3: El cliente envía las respuestas

1. En `assessment-client-helpers.ts` (`saveAssessmentLevel`) añade a `params`
   `answers: Record<string, number>`, `selfRatings`, `checkpointLevel` y
   envíalos en el body del POST. Localiza en `AssessmentClient.tsx` la llamada
   a `saveAssessmentLevel` y pásale el estado de respuestas que ya existe
   (el mismo objeto que se pasa a `scoreAssessment`).
2. Ajusta `components/courses/__tests__/AssessmentClient.test.tsx` para que el
   `fetch` mockeado reciba `answers`.

**Verify**: `pnpm vitest run components/courses` → all pass.

### Step 4: Nivel manual por ruta de servidor

1. Crea `app/api/profile/level/route.ts` (patrón: `app/api/assessment/results/route.ts`):
   `POST { level: "A1".."C2" }` → `requireSameOrigin`, `requireUser`,
   `rateLimit`, `validateBody(z.object({ level: z.enum([...]) }).strict())`,
   luego upsert con admin client `{ id, cefr_level, cefr_level_source: 'manual', cefr_level_updated_at }`.
2. En `lib/users/queries.ts` sustituye el cuerpo de `syncCefrLevel` por un
   `fetch('/api/profile/level', { method: 'POST', ... })` y elimina el
   parámetro `source` (siempre manual). Elimina el default `"practice_estimate"`.
3. Añade test de la ruta en `app/api/__tests__/` (patrón: el test de
   `assessment/results` si existe; si no, el más parecido en esa carpeta).

**Verify**: `pnpm vitest run app/api lib/users` → all pass.
**Verify**: `grep -rn "cefr_level_source" components hooks lib --include=*.ts --include=*.tsx | grep -v "lib/learner-level\|lib/courses/assessment-queries\|app/api\|__tests__\|types.ts"` → 0 resultados (ningún cliente escribe la columna).

### Step 5: Cierre

**Verify**: `pnpm type-check`, `pnpm lint`, `pnpm check:migrations`, `pnpm audit:rls` → exit 0.

## Test plan

- `assessment-queries.test.ts`: checkpoint fallido no toca `user_profiles`; placement usa admin client.
- Test de ruta `assessment/results`: (a) sin `answers` → 400; (b) `answers` que puntúan A2 pero `result.assignedLevel: "C2"` → persiste A2; (c) checkpoint `c1` con nivel resuelto A1 → 400.
- Test de ruta `profile/level`: escribe `manual`.
- Test SQL (opcional, si `scripts/rls-integration.mjs` es ejecutable en el entorno): un `UPDATE user_profiles SET cefr_level_source='placement'` como `authenticated` falla con 42501.

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint`, `pnpm check:migrations`, `pnpm audit:rls` exit 0
- [ ] Tests listados pasan
- [ ] `grep -rn "syncCefrLevel(" lib components hooks | grep -v __tests__` → solo la definición y `applyManualCefrLevel`
- [ ] La ruta responde 400 cuando falta `answers` (test)
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- `lib/courses/guest-assessment.ts` guarda el resultado de invitado sin las
  `answers` y por tanto el claim tras registrarse recibiría 400: **detente y
  reporta**; la solución (guardar `answers` en el resultado de invitado) toca
  un archivo fuera de scope y debe decidirla el propietario.
- `tryGetSupabaseAdminClient()` devuelve null en el entorno de test o dev y
  no hay forma de mockearlo siguiendo el patrón de `assessment-queries.test.ts`.
- Existen filas de `user_profiles.cefr_level` con valores fuera de
  `A1..C2` en mayúsculas que el CHECK rechazaría y no es evidente cómo
  normalizarlas.

## Maintenance notes

- A partir de este plan, cualquier escritura de `cefr_level` desde el
  navegador degrada la procedencia a `manual`. Quien añada una nueva fuente
  (p. ej. una estimación por práctica real) debe hacerlo por ruta de servidor.
- Revisor: confirmar que `scoreAssessment` sigue siendo pura y que el set de
  preguntas del servidor coincide con el que vio el usuario (mismo `mode` y
  `checkpointLevel`); un cambio en `buildAssessment` que use aleatoriedad
  rompería la re-puntuación.
- Follow-up deferido: el plan 008 elimina los lectores directos del nivel;
  el plan 009 retira el estimador `practice_estimate`.
