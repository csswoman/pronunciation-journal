# Plan 018: Mazos personales, juegos, word-rain y word-search registran actividad y están en el manifest

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- "app/(authenticated)/practice" components/vocabulary components/games lib/exercises/word-rain lib/learning-loop scripts/audit-learning-loop.mjs lib/practice/types.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED
- **Depends on**: 012 (introduce el patrón de superficie nueva en el manifest)
- **Category**: architecture / correctness
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

Cuatro rutas de práctica publicadas (`/practice/decks` con mazos personales,
`/practice/games`, `/practice/word-rain`, `/practice/word-search`) no
escriben ni `answer_history` ni `activity_sessions`: el tiempo del usuario no
aparece en Progreso, la racha no lo cuenta, y el SRS de `word_bank` no se
entera de que estudió sus mazos. Ninguna es una `LearningSurface`, así que
el audit de `prepush` no las ve. El contrato pide responder por cada
superficie "¿exposición, completion, intención o evidencia?"; hoy la
respuesta es "nada".

## Current state

- Rutas: `app/(authenticated)/practice/{decks,games,word-rain,word-search}/page.tsx`.
- `grep -rln "savePracticeAnswer\|recordActivitySession" components/vocabulary components/games lib/exercises/word-rain components/practice/decks` → sin resultados.
- `lib/learning-loop/types.ts:3-12` `LearningSurface` no las incluye; `scripts/audit-learning-loop.mjs` solo audita entradas existentes.
- `lib/practice/types.ts:87-94` `PracticeContext = 'sound_lab' | 'courses' | 'ai_coach' | 'practice' | 'daily' | 'essential-words' | 'review'`.
- Contrato de registro: `docs/architecture/progress.md` "Adding a practice surface": construir un `SessionResult` y llamar `recordActivitySession` una vez al terminar; solo respuestas evaluables crean `PracticeAnswer`.
- Patrón de sesión con evidencia real: `lib/immersion/external-log.ts` (actividad sin ejercicios, `allowEmptySession: true`) y cualquier superficie que llame `savePracticeAnswer` (busca en `hooks/` un `useSessionRecorder` o similar; si existe, es el patrón a reutilizar).
- Mazos personales: `components/vocabulary/decks/UserDecksRuntime.tsx` y `app/(authenticated)/practice/decks/[slug]/`; averigua si las cartas son filas de `word_bank` (UUID) — si lo son, cada calificación puede ir por `enqueueWordBankSRSUpdate` (`lib/practice/queries.ts:175`).

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm vitest run lib/learning-loop components/vocabulary components/games lib/exercises/word-rain lib/progress` | all pass |
| Loop audit | `pnpm audit:learning-loop` | `0 issues` |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |

## Scope

**In scope**: las cuatro superficies (componentes y hooks propios), `lib/learning-loop/types.ts` + `content-manifest.ts` (+ tests), `scripts/audit-learning-loop.mjs` (enumerar rutas), `lib/practice/types.ts` solo si hace falta un `PracticeContext` nuevo.

**Out of scope**: `activity-hub.ts`, `resolve-attribution.ts`, cuotas de SRS, diseño visual.

## Git workflow

- Rama: `advisor/018-orphan-surfaces` desde `dev`. Un commit por superficie + uno para el audit.

## Steps

### Step 0: Clasificar (decisión, con default)

Default si el propietario no indica otra cosa:
- Mazos personales → **evidencia** (`objective_evidence`, modalidad `meaning_recall`) si las cartas son `word_bank` UUID; si no, actividad.
- Juegos, word-rain, word-search → **actividad** (`allowEmptySession: true`, sin `PracticeAnswer`): son exposición lúdica, no evaluación.

### Step 1: Actividad en juegos, word-rain y word-search

Al terminar una partida, llama `recordActivitySession(userId, { practiceContext: 'practice', source: <'games'|'word_rain'|'word_search'>, allowEmptySession: true, explicitSkillTags: ['vocabulary'], sessionResult: { results: [], accuracy: 0, totalTimeMs, bySlug: {} }, metadata: { … solo ids } })`.
Comprueba si `source` admite esos literales (tipo en `lib/progress/activity-types.ts`); si no, añádelos y su `sourceLabel`. Test por superficie mockeando `recordActivitySession` (patrón: `lib/immersion/__tests__/external-log.test.ts`).

**Verify**: `pnpm vitest run components/games lib/exercises/word-rain` → all pass.

### Step 2: Evidencia en mazos personales

Si las cartas son `word_bank` UUID: por cada calificación llama a
`savePracticeAnswer` con `sourceRef: { source: 'word_bank', id }` y el grade;
al cerrar la sesión, `recordActivitySession` con los resultados. Si no son
`word_bank`, aplica el Step 1 y anótalo (STOP si el origen de las cartas no
está claro).

**Verify**: `pnpm vitest run components/vocabulary` → all pass.

### Step 3: Manifest y audit por rutas

1. Añade `'user_decks' | 'games'` a `LearningSurface` con entradas de tipo
   actividad (una por superficie; sin targets) usando la allowlist de
   exposición no evaluable del manifest (ver plan 012, Step 3).
2. En `scripts/audit-learning-loop.mjs` enumera los directorios de
   `app/(authenticated)/practice/*` y falla si alguno no está mapeado a una
   `LearningSurface` ni a una allowlist explícita `PRACTICE_ROUTES_WITHOUT_SURFACE`
   (crea esa lista en `lib/learning-loop/content-manifest.ts` con `reader`,
   `journal`, `connected-speech`, `intonation`, `ed-drills`, `core-1000`
   y un comentario por cada una explicando por qué).

**Verify**: `pnpm audit:learning-loop` → `0 issues` y lista todas las rutas.

### Step 4: Cierre

**Verify**: `pnpm type-check && pnpm lint` → exit 0.

## Done criteria

- [ ] `grep -rln "recordActivitySession" components/games lib/exercises/word-rain components/vocabulary` → ≥3 archivos
- [ ] `pnpm audit:learning-loop` → `0 issues` con enumeración de rutas
- [ ] Tests listados pasan
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- El origen de las cartas de mazos personales no es identificable como `word_bank`.
- Añadir un `source` nuevo rompe una migración/CHECK de `activity_sessions.source` (revisa `supabase/migrations/*activity_sessions*`): reporta antes de crear migración.

## Maintenance notes

- Con el Step 3, cualquier ruta nueva bajo `/practice` rompe `prepush` hasta declararse. Es intencional.
