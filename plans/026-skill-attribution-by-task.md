# Plan 026: Atribuir habilidades según la tarea evaluada

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md` y `PRODUCT.md`. Mantén separados habilidad practicada, volumen de actividad y dominio. Actualiza solo la fila 026 del índice.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/progress/skill-matrix.ts lib/progress/activity-hub.ts lib/progress/fluency-scores.ts lib/progress/activity-types.ts lib/progress/__tests__/skill-matrix.test.ts lib/progress/__tests__/fluency-scores.test.ts lib/progress/queries.ts`.

## Estado

- Prioridad: P2. Esfuerzo: M. Riesgo: MED. Categoría: arquitectura.
- Depende de: 021 y 024; Focus debe entregar resultados con modalidad explícita. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

El mismo slug puede evaluar distintas habilidades según el contenido. Hoy `multiple_choice` siempre se etiqueta `reading` y `written_production` también, aunque el primero puede comprobar gramática y el segundo pide producir texto. Además, `deriveSkillTags` usa el slug mientras `getFluencyProfile` usa `resolveAnswerSkills`, por lo que sesión y perfil pueden discrepar.

## Estado actual y patrón

- `lib/progress/skill-matrix.ts:23-32`: `multiple_choice: ['reading']`, `written_production: ['reading']`.
- `lib/progress/skill-matrix.ts:47-64`: `resolveAnswerSkills` ajusta algunos modos de Essential Words.
- `lib/progress/activity-hub.ts:65-71`: `deriveSkillTags` llama `skillsForSlug(r.slug)` sin payload.
- `lib/progress/fluency-scores.ts:49-58`: la puntuación por habilidad usa `resolveAnswerSkills(slug, exercisePayload)`.
- `lib/progress/queries.ts:447-493`: `getFluencyProfile` lee filas históricas de `answer_history`; las filas antiguas pueden carecer de metadata suficiente. `lib/progress/__tests__/skill-matrix.test.ts` codifica el comportamiento anterior de escritura = lectura.

## Alcance

Modificar `lib/progress/skill-matrix.ts`, `activity-hub.ts`, `fluency-scores.ts`, `activity-types.ts`, `queries.ts` únicamente si la consulta necesita campos ya persistidos, y tests focalizados. Si se agrega `writing`, incluir los consumidores exhaustivos del tipo que detecte `tsc`; documentarlos antes de editar. Fila 026. Fuera de alcance: reinterpretar en masa la historia antigua sin metadata, cambiar CEFR, atribuir una habilidad a sesiones vacías o usar `context` como sustituto del objetivo.

## Flujo Git

Si el operador pide rama, usa `codex/026-skill-attribution-by-task` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Define casos de prueba por modalidad: opción múltiple sobre regla gramatical, lectura real, reconocimiento de vocabulario, producción escrita y dictado. Usa `exercisePayload`, `sourceRef`/atribución persistida y modo, con fallback conservador para filas históricas sin metadata. Una respuesta omitida o fallida técnicamente no es evidencia de precisión. **Verifica**: pruebas nuevas que fallen con el mapeo actual.
2. Usa el mismo resolver para `activity_sessions.skill_tags` y `getFluencyProfile`. Si `writing` entra como nueva habilidad, añade `SkillTag`, `SkillKey`, cubos y UI correspondiente; conserva una proyección legible para filas legacy sin convertirlas artificialmente en lectura. **Verifica**: tests de contrato sesión/perfil con el mismo resultado y tests de casos legacy.
3. Ejecuta tests focalizados, `node_modules/.bin/tsc.cmd --noEmit`, ESLint de archivos tocados y `git diff --check` → exit 0. Ejecuta `pnpm type-check && pnpm lint` si las dependencias ya están estables.

## STOP y mantenimiento

Detente si los payloads actuales no distinguen tareas reales de gramática/lectura: añade una metadata explícita en el productor mediante un plan ampliado, no deduzcas la habilidad del nombre del deck. Revisa cualquier `ExerciseSlug` nuevo en ambos consumidores y no llames «dominio» a una etiqueta de habilidad de sesión.
