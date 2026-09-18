# Plan 008: Todas las pantallas leen el nivel por `resolveLearnerLevel` y distinguen "desconocido" de "A1"

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/learner-level lib/users/queries.ts hooks/useUserPreferences.ts components/ui/ProfileSettings.tsx components/tracking/TrackingClient.tsx components/ai-coach/widgets/MultipleChoiceWidget.tsx components/ai-coach/widgets/FillBlankWidget.tsx components/courses/CoursePathAutoLevelSync.tsx components/auth/AuthProvider.tsx lib/progress/queries.ts components/progress/SkillProfileCard.tsx app/assessment/page.tsx "app/(authenticated)/courses/study/[n]/page.tsx" eslint.config.mjs`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (toca hidratación en `AuthProvider` y varias pantallas)
- **Depends on**: none (recomendado después de 007)
- **Category**: correctness / tech-debt
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

El commit `c869029c` creó `lib/learner-level/core.ts:resolveLearnerLevel`
como único punto de verdad del nivel, pero solo la mitad de las pantallas lo
usan. Las demás leen `user_profiles.cefr_level` crudo, `learningState.level.cefrEstimate`
de Dexie o `localStorage`, con `?? "A1"` por defecto. Consecuencia visible:
un alumno colocado en B2 ve B2 en Home y A1 en la página de estudio del
curso; el widget del coach lo puntúa con un `cefrEstimate` obsoleto; y la
tarjeta de Progreso imprime literalmente "Estimado por coach (B1), perfil
(A2)". Además, el lector canónico convierte cualquier error de red en
"A1 sin colocar", indistinguible de un usuario nuevo, lo que dispara el CTA de
placement a usuarios ya evaluados.

## Current state

### Lector canónico

`lib/learner-level/core.ts` — `resolveLearnerLevel(input)` devuelve
`{ level, source, confidence, isPlaced, updatedAt }`; `source` ∈
`placement | checkpoint | manual | practice_estimate | starter_default`.

`lib/learner-level/client-queries.ts:28-40`:
```ts
export async function getEffectiveLearnerLevel(userId: string) {
  await ensureDbReady().catch(() => undefined)
  const [profile, local] = await Promise.all([
    loadProfileLevel(userId).catch(() => null),
    db.learningState.get(userId).catch(() => undefined),
  ])
  return resolveLearnerLevel({ profileLevel: profile?.cefr_level, profileSource: profile?.cefr_level_source, ... })
}
```
`loadProfileLevel` (líneas 11-25) reintenta con `select('cefr_level')` si la
select con procedencia falla ("legacy"), devolviendo una fila sin `source`
que el resolver trata como `starter_default`. `server-queries.ts` es el espejo
con `createSupabaseServerClient`.

Test existente: `lib/learner-level/__tests__/core.test.ts`.

### Lectores que NO usan el resolver

1. `app/(authenticated)/courses/study/[n]/page.tsx:41-49`:
   ```ts
   const { data: profile } = user ? await supabase.from("user_profiles").select("cefr_level").eq("id", user.id).maybeSingle() : { data: null };
   const profileLevel = profile?.cefr_level as CefrLevel | null | undefined;
   const cefrLevel: CefrLevel = profileLevel ?? ((CEFR_TRACKS as readonly string[]).includes(trackId) ? (trackId.toUpperCase() as CefrLevel) : "A1");
   ```
2. `app/assessment/page.tsx:46-59`: `select("cefr_level")` para `initialLevel` (solo placement).
3. `components/auth/AuthProvider.tsx:116-122`:
   ```ts
   const { data } = await getSupabaseBrowserClient().from("user_profiles" as never).select("cefr_level").eq("id", userId).maybeSingle();
   const profile = data as { cefr_level?: string } | null;
   ```
   y líneas 145-164 escriben `cefrEstimate` en Dexie desde ese valor.
4. `lib/progress/queries.ts:398-425` (`getCoachInsights`): lee `user_learning_state.state.level.cefrEstimate` (cast `as any`) y `user_profiles.cefr_level` y devuelve ambos; `components/progress/SkillProfileCard.tsx:155-159`:
   ```tsx
   const level = coach.cefrEstimate ?? coach.profileLevel
   const levelSub = coach.cefrEstimate && coach.profileLevel && coach.cefrEstimate !== coach.profileLevel
     ? `Estimado por coach (${coach.cefrEstimate}), perfil (${coach.profileLevel})` : ...
   ```
   Mientras tanto `lib/progress/queries.ts:661` ya obtiene `getEffectiveLearnerLevelServer(userId)` y lo expone como `data.learnerLevel` en la misma página (`app/(authenticated)/progress/page.tsx:107`).
5. `components/ai-coach/widgets/MultipleChoiceWidget.tsx:33-41` y `FillBlankWidget.tsx:48-56`:
   ```ts
   const row = await db.learningState.get(userId);
   if (row?.state?.level?.cefrEstimate) { setUserLevel(row.state.level.cefrEstimate); return; }
   const state = await getUserLearningState(userId); setUserLevel(state.level.cefrEstimate);
   ```
6. `components/courses/CoursePathAutoLevelSync.tsx:71-83`: Dexie `cefrEstimate`, luego `readGuestStudyLevel()` (localStorage), luego compara con `"a1"`.
7. `lib/users/queries.ts:27-40` (`getUserPreferences`) selecciona `cefr_level` sin procedencia; consumido por `hooks/useUserPreferences.ts:37` → `components/ui/ProfileSettings.tsx:89` (`preferences?.cefr_level ?? "A1"`) y `components/tracking/TrackingClient.tsx:47`.

### Invitados

`lib/preferences/guest-study-level.ts` expone `readGuestStudyLevel()` /
`saveGuestStudyLevel()` (localStorage, default `"A1"`). Varios componentes
hacen `user ? getEffectiveLearnerLevel(user.id) : readGuestStudyLevel()`
(`components/home/HomeWordOfDayCard.tsx:79`, `components/practice/hub/PracticeHubClient.tsx:110`,
`hooks/useCoachStarters.ts:47`, `hooks/useEssentialWordsSession.ts:426`).

### ESLint

`eslint.config.mjs` ya contiene reglas de guardarraíl (regla D: Supabase solo
en `lib/**/*queries*.ts`). Se puede añadir una regla `no-restricted-syntax`
similar; mira cómo están escritas las existentes antes de añadir la nueva.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/learner-level lib/users lib/progress components/progress components/ai-coach components/courses components/ui components/tracking hooks` | all pass |

## Scope

**In scope**:
- `lib/learner-level/core.ts`, `client-queries.ts`, `server-queries.ts`, `__tests__/core.test.ts`, nuevo `__tests__/client-queries.test.ts`
- `lib/users/queries.ts` (solo `getUserPreferences`), `hooks/useUserPreferences.ts`
- `components/ui/ProfileSettings.tsx`, `components/tracking/TrackingClient.tsx`
- `components/ai-coach/widgets/MultipleChoiceWidget.tsx`, `FillBlankWidget.tsx`
- `components/courses/CoursePathAutoLevelSync.tsx`
- `components/auth/AuthProvider.tsx` (solo el bloque `hydrateCEFR`)
- `lib/progress/queries.ts` (`getCoachInsights` y tipo `CoachInsights`), `components/progress/SkillProfileCard.tsx`, `app/(authenticated)/progress/page.tsx` (pasar `learnerLevel`)
- `app/assessment/page.tsx`, `app/(authenticated)/courses/study/[n]/page.tsx`
- `eslint.config.mjs` (una regla nueva)
- `lib/home/placement-state.ts` y `lib/home/primary-action.ts` (solo para tratar `source: 'unknown'`)

**Out of scope**:
- Escritura del nivel (plan 007).
- `lib/ai-practice/load-state.ts` y el estimador (plan 009).
- `lib/learning-focus/*` — mantiene su `FocusLevel` derivado; no consolidar aquí.
- `lib/preferences/guest-study-level.ts` — se sigue usando para invitados.

## Git workflow

- Rama: `advisor/008-single-level-reader` desde `dev`.
- Commits convencionales por paso, ej. `refactor(cefr): route X through resolveLearnerLevel`.
- No push ni PR sin instrucción.

## Steps

### Step 1: El resolver distingue "no pude leerlo"

1. En `core.ts` añade `'unknown'` a un nuevo tipo
   `export type LearnerLevelReadState = LearnerLevelSource | 'unknown'` y
   cambia `LearnerLevelResolution.source` a ese tipo. Añade a
   `LearnerLevelInput` el campo opcional `readFailed?: boolean`. Si
   `readFailed` es true y no hay `profileSource` conocido, devuelve
   `{ level: normalizeCEFR(profileLevel ?? 'A1'), source: 'unknown', confidence: null, isPlaced: false, updatedAt: null }`.
2. En `client-queries.ts` y `server-queries.ts`:
   - Elimina el fallback "legacy" que reselecciona solo `cefr_level`
     (las columnas existen desde la migración `20260918090000`).
   - Si la select de perfil falla (`error` no nulo o excepción), pasa
     `readFailed: true` al resolver en lugar de `null`.
   - Añade a `client-queries.ts` un parámetro opcional `guestLevel?: string`
     y exporta `getEffectiveLearnerLevelForViewer(userId: string | null)` que,
     con `userId === null`, devuelve `{ level: normalizeCEFR(readGuestStudyLevel()), source: 'manual', isPlaced: false, ... }`.
     Así los componentes dejan de ramificar entre invitado y usuario.
3. En `core.test.ts` añade: `readFailed: true` sin fuente → `source: 'unknown'`;
   `readFailed: true` con `profileSource: 'placement'` (lectura parcial) → sigue `placement`.
4. Crea `lib/learner-level/__tests__/client-queries.test.ts` mockeando
   `@/lib/supabase/client` y `@/lib/db` (patrón: `lib/courses/__tests__/assessment-queries.test.ts`
   para el mock de Supabase): una select que devuelve `error` produce `source: 'unknown'`.
5. En `lib/home/primary-action.ts` / `placement-state.ts`: `hasPlacement`
   se calcula hoy contando `assessment_results`, no por nivel, así que no
   cambia. Pero en `app/(authenticated)/page.tsx` busca cualquier uso de
   `levelResolution.isPlaced` o `source` para decidir el CTA de placement;
   si existe, trata `'unknown'` como "no mostrar el CTA" (no invitar a
   colocarse a alguien cuyo nivel no pudimos leer).

**Verify**: `pnpm vitest run lib/learner-level` → all pass.

### Step 2: `AuthProvider` hidrata desde el resolver

En `AuthProvider.tsx:116-122` sustituye la select cruda (y el `as never`) por
`const resolution = await getEffectiveLearnerLevel(userId)` (import dinámico
de `@/lib/learner-level/client-queries`, siguiendo el estilo de los demás
imports dinámicos del bloque). Usa `resolution.level` como `nextLevel` y
salta la escritura en Dexie si `resolution.source === 'unknown'` (no
sobrescribir un estimado local con un fallo de red).

**Verify**: `pnpm vitest run components/auth` → all pass. `pnpm type-check` → exit 0.

### Step 3: Progreso muestra un solo nivel

1. En `lib/progress/queries.ts`, elimina de `getCoachInsights` la select de
   `user_profiles` y los campos `cefrEstimate`/`profileLevel` del tipo
   `CoachInsights` (mantén `weakTopics` y `avgAccuracy`).
2. `SkillProfileCard` recibe una prop nueva `learnerLevel: LearnerLevelResolution`
   (ya disponible en `data.learnerLevel`; pásala desde `progress/page.tsx:99`).
   Renderiza `learnerLevel.level` y como subtítulo un mapa de `source`:
   `placement`/`checkpoint` → "Según tu evaluación", `manual` → "Elegido por ti",
   `starter_default` → "Nivel inicial; haz la prueba para ajustarlo",
   `unknown` → "No pudimos leer tu nivel ahora", `practice_estimate` → "Estimado por tu práctica".
3. Ajusta tests de `components/progress` y `lib/progress/__tests__/queries.test.ts`.

**Verify**: `pnpm vitest run lib/progress components/progress` → all pass.
**Verify**: `grep -n "Estimado por coach" components/progress` → 0.

### Step 4: Widgets del coach, AutoLevelSync, Tracking, Settings

1. `MultipleChoiceWidget.tsx` y `FillBlankWidget.tsx`: sustituye el bloque
   Dexie/`getUserLearningState` por
   `getEffectiveLearnerLevelForViewer(user?.id ?? null).then(r => setUserLevel(r.level))`.
2. `CoursePathAutoLevelSync.tsx:71-83`: reemplaza la lectura de Dexie y de
   `readGuestStudyLevel` por `getEffectiveLearnerLevelForViewer(userId)`;
   conserva la lógica previa de "nivel más alto con lecciones completadas".
3. `lib/users/queries.ts`: elimina `cefr_level` de la select y del tipo
   `UserPreferences`. En `hooks/useUserPreferences.ts` añade
   `learnerLevel: LearnerLevelResolution | null` obtenido con
   `getEffectiveLearnerLevelForViewer(user?.id ?? null)`; `updateCefrLevel`
   tras escribir vuelve a resolver. `ProfileSettings.tsx:89` usa
   `learnerLevel?.level ?? "A1"` solo como valor del selector y muestra la
   procedencia con el mismo mapa del paso 3 (extrae el mapa a
   `lib/learner-level/labels.ts` para reutilizarlo).
   `TrackingClient.tsx:47` usa `learnerLevel?.level`.
4. Los cuatro sitios que hacen `user ? getEffectiveLearnerLevel(user.id) : readGuestStudyLevel()`
   (`HomeWordOfDayCard.tsx:79`, `PracticeHubClient.tsx:110`, `useCoachStarters.ts:47`,
   `useEssentialWordsSession.ts:426`) pasan a `getEffectiveLearnerLevelForViewer`.

**Verify**: `pnpm vitest run components/ai-coach components/courses components/ui components/tracking hooks components/home components/practice` → all pass.

### Step 5: Páginas servidor

1. `app/(authenticated)/courses/study/[n]/page.tsx:41-49`: sustituye la
   select por `getEffectiveLearnerLevelServer(user.id)` cuando hay usuario;
   para invitado conserva el fallback por `trackId`/"A1".
2. `app/assessment/page.tsx:46-59`: igual, `initialLevel = parseCefrLevelId(resolution.level.toLowerCase())`.

**Verify**: `pnpm type-check` → exit 0.

### Step 6: Guardarraíl ESLint

Añade en `eslint.config.mjs` una regla `no-restricted-syntax` que prohíba
`select("cefr_level")`/`select('cefr_level')`/`select("cefr_level,` fuera de
`lib/learner-level/**`, `lib/courses/assessment-queries.ts` y
`app/api/**`, con mensaje "Lee el nivel con getEffectiveLearnerLevel(Server)".
Sigue el formato de la regla D existente en el mismo archivo.

**Verify**: `pnpm lint` → exit 0.
**Verify**: `grep -rn "select(\"cefr_level\|select('cefr_level" app components hooks lib | grep -v "lib/learner-level\|assessment-queries\|app/api"` → 0.

## Test plan

- `core.test.ts`: `unknown`.
- `client-queries.test.ts` (nuevo): fallo de red → `unknown`; invitado → nivel de localStorage.
- Tests de componentes existentes ajustados a la nueva prop/hook.

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint` exit 0
- [ ] Tests listados pasan
- [ ] `grep -rn "cefrEstimate" components hooks` → solo aparece en `lib/` (0 resultados en `components/` y `hooks/`)
- [ ] `grep -rn "as never" components/auth/AuthProvider.tsx` → 0
- [ ] `grep -n "Estimado por coach" components/progress` → 0
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- `getEffectiveLearnerLevel` no puede importarse en un componente cliente sin
  arrastrar el cliente Supabase al bundle inicial de una ruta que hoy no lo
  carga (comprueba `bundle-budget.json` con `pnpm analyze:bundle:check` si
  existe el script); en ese caso reporta antes de continuar.
- Un test de `AuthProvider` depende del orden exacto de imports dinámicos y
  no puede ajustarse sin reescribirlo.

## Maintenance notes

- Toda lectura del nivel nueva debe pasar por `getEffectiveLearnerLevel(Server)`
  o `getEffectiveLearnerLevelForViewer`; el lint lo recuerda.
- `source: 'unknown'` es un estado transitorio; ninguna pantalla debe
  persistirlo ni usarlo para invitar a placement.
- Follow-up: unificar la escritura (`setLearnerLevel`) queda para después de
  007 y 009; hoy hay 4 stores del nivel (perfil, Dexie, localStorage de
  invitado, localStorage de assessment).
