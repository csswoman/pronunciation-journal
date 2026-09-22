# Plan 020: Mostrar solo la participación diaria que el servidor puede demostrar

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md`, `PRODUCT.md` y el contexto obligatorio de UI de `AGENTS.md`. Ejecuta cada verificación. Actualiza solo la fila 020 de `plans/README.md` al terminar.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/progress/queries.ts components/progress/DailyCompletionRate.tsx components/progress/__tests__/DailyCompletionRate.test.tsx lib/progress/__tests__/queries.test.ts` y compara los fragmentos siguientes si hubo cambios.

## Estado

- Prioridad: P1. Esfuerzo: M. Riesgo: MED. Categoría: bug.
- Depende de: ninguno. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

Progreso afirma «Planes completados» cuando existe una sola fila `activity_sessions.source = 'daily_plan'` en ese día. Esa fila puede ser la marca manual de un paso con cero ejercicios. El servidor tampoco guarda el conjunto de pasos requeridos del plan histórico: `lib/daily/plan-storage.ts` conserva el plan en `localStorage` por fecha. La corrección inmediata es presentar lo comprobable, por ejemplo «Días con actividad en el plan», sin atribuir finalización total.

## Estado actual y patrón

- `lib/progress/queries.ts:193-199`: para cada sesión, `if (row.source === 'daily_plan') planCompletedDaysSet.add(day)`.
- `components/progress/DailyCompletionRate.tsx:46,70`: el aria-label y el texto dicen «planes completados».
- `lib/progress/activity-hub.ts:254-275`: `recordDailyStepCompletion` escribe `source: 'daily_plan'`, `exercises_total: 0` y un `reconciled_step_ids`.
- `lib/practice/daily-plan/step-completion.ts`: `requiredPracticeSteps` define qué pasos exige el plan actual; no existe un snapshot remoto de esa lista.
- Sigue el patrón de consultas Supabase en `lib/progress/queries.ts` y los tokens/componentes actuales. El diseño vivo prevalece sobre `DESIGN.md` si discrepan.

## Alcance

Modificar solo `lib/progress/queries.ts`, `components/progress/DailyCompletionRate.tsx`, `components/progress/__tests__/DailyCompletionRate.test.tsx` y tests focalizados de la consulta en `lib/progress/__tests__/` (crear si hace falta); actualizar la fila 020 del índice. Fuera de alcance: cambiar el contrato de `activity_sessions`, introducir una tabla de snapshots, alterar rachas o tratar un paso aislado como plan completo.

## Flujo Git

Si el operador pide rama, usa `codex/020-honest-daily-plan-completion` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Renombra en la proyección los campos `planCompletedDays7/30` a una denominación inequívoca de participación y cuenta días con al menos una sesión `daily_plan` como hace hoy. Conserva el resto de estadísticas. **Verifica**: test de consulta que demuestre una sesión manual de cero ejercicios = un día de actividad del plan, nunca un plan completo.
2. Cambia el texto visible y accesible de `DailyCompletionRate` para que coincida con esa definición. No añadas métricas de dominio. **Verifica**: `node_modules/.bin/vitest.cmd run components/progress/__tests__/DailyCompletionRate.test.tsx` → exit 0 y sin la frase «planes completados» en ese componente.
3. Comprueba los consumidores del tipo con `git grep -n 'planCompletedDays' -- app components lib` → cero referencias de producción al nombre antiguo. Ejecuta `node_modules/.bin/tsc.cmd --noEmit`, `node_modules/.bin/eslint.cmd lib/progress/queries.ts components/progress/DailyCompletionRate.tsx` y `git diff --check` → exit 0.

## Tests y cierre

Usa `DailyCompletionRate.test.tsx` como patrón; prueba cero actividad, una sesión diaria parcial y varias sesiones del mismo día. `pnpm type-check && pnpm lint` es el gate obligatorio del repo; si `pnpm` intenta reinstalar dependencias, detente y usa los binarios locales ya instalados, reportando la sustitución. Hecho cuando toda la UI y el aria-label usan la misma semántica, pasan los tests focalizados y no hay ediciones fuera del alcance.

## STOP y mantenimiento

Detente si el producto exige una cifra histórica de planes completos: hace falta un snapshot persistido de los pasos requeridos y una decisión explícita para días antiguos. Revisa cualquier cambio futuro en `requiredPracticeSteps` antes de volver a llamar «completo» a una estadística remota.
