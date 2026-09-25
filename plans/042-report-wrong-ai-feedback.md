# Plan 042: Botón "Esta corrección está mal" y casos de evaluación reales

> **Executor instructions**: Sigue el plan paso a paso y ejecuta cada verificación antes de avanzar.
> Si ocurre algo de "STOP conditions", detente y reporta. Los reportes son datos privados de cada
> persona: RLS obligatorio y nada de texto del Diario fuera de su cuenta. Respeta `CLAUDE.md`
> (Supabase solo desde `lib/*/queries.ts`, offline con Dexie + outbox, componentes ≤250 líneas y ≤8 props).
> Al terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- components/ai-coach/CorrectionCard.tsx components/ai-coach/chat/AIBubble.tsx components/exercises/ProductionFeedback.tsx components/journal/JournalFeedbackView.tsx lib/practice/error-recurrence.ts lib/practice/error-recurrence-sync.ts lib/sync scripts/prompt-eval`
> Compara los extractos con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P2
- **Effort**: S–M (~1–1,5 días)
- **Risk**: LOW
- **Depends on**: `plans/036-structured-output-and-level-aware-prompts.md` (crea `scripts/prompt-eval/`) y
  `plans/040-coach-corrections-feed-error-recurrence.md` (patrón de error en correcciones del Coach). Si 036 no está
  DONE, haz los pasos 1–4 y deja el paso 5 para después.
- **Category**: IA / calidad pedagógica
- **Planned at**: commit `866979df`, 2026-09-23

## Por qué importa

La IA a veces corrige algo que estaba bien o explica mal una regla. Hoy no hay forma de decirlo: la
corrección equivocada cuenta como error en la cola de repaso (y vuelve a aparecer en la práctica) y nadie
se entera para mejorar el prompt. Con un botón discreto, la persona marca la corrección como equivocada:
(1) el error deja de programarse en su repaso, (2) el caso queda guardado para convertirlo en un caso del
set de evaluación de prompts (Plan 036), que así crece con fallos reales y no solo con casos inventados.

## Estado actual

- `components/ai-coach/CorrectionCard.tsx` (36 líneas) — tarjeta de corrección del Coach; props
  `{ correction: CorrectionCardData }` con `original`, `corrected`, `rule?`, `kind?` (y `errorPattern?` tras el Plan 040).
  Se pinta desde `components/ai-coach/chat/AIBubble.tsx`.
- `components/exercises/ProductionFeedback.tsx` (239 líneas, cerca del límite de 250) — feedback de los ejercicios
  corregidos por `/api/gemini/grade-production`.
- `components/journal/JournalFeedbackView.tsx` (142 líneas) — lista `feedback.errors` de la corrección del Diario
  (l. ~62).
- `lib/practice/error-recurrence.ts` — cola: `recordErrorPattern`, `markPatternRehearsed`, `mergeErrorRecurrenceQueues`
  con `removedAtByPattern` (tombstones). **No existe** operación para retirar un fallo registrado por error.
- `lib/practice/error-recurrence-sync.ts` — `recordPracticeErrorRecurrence` actualiza Dexie (`db.learningState`) y
  encola el upsert (`enqueue(userId, 'user_learning_state', 'upsert', …)` de `lib/sync/sync-manager`). Patrón a copiar.
- Tabla de usuario con RLS de ejemplo: `supabase/migrations/20260909004301_immersion_lesson_progress.sql:16-30`
  (políticas `select`/`insert`/`update` con `(select auth.uid()) = user_id`).
- Los errores del Diario se registran en el servidor con una RPC transaccional (Plan 029). Retirarlos queda **fuera** de
  este plan: para el Diario solo se guarda el reporte.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/practice lib/ai-feedback components/ai-coach components/exercises components/journal` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint`, `npm run lint:design`, `pnpm audit:hard-rules` | exit 0 |

## Alcance

**Dentro**: migración nueva, `lib/ai-feedback/` (crear: `types.ts`, `queries.ts`, `report.ts`),
`lib/practice/error-recurrence.ts` (solo añadir `retractErrorPattern`), `lib/practice/error-recurrence-sync.ts`
(añadir la función de retirada), `lib/sync/types.ts` y `lib/sync/sync-manager.ts` (solo registrar la tabla nueva),
`components/ai-feedback/ReportWrongFeedbackButton.tsx` (crear),
`components/ai-coach/CorrectionCard.tsx`, `components/exercises/ProductionFeedback.tsx` (o un subcomponente extraído si
pasa de 250 líneas), `components/journal/JournalFeedbackView.tsx`, `scripts/prompt-eval/import-reports.ts` (crear), tests.
Además, los documentos listados en el paso de documentación.

**Fuera**: reescribir respuestas o puntuaciones históricas, retirar errores del Diario del lado del servidor, panel de
administración, compartir reportes entre usuarios.

## Pasos

### Paso 1: Tabla `ai_feedback_reports`
Migración: `id uuid pk`, `user_id uuid references auth.users not null`, `feature text check (feature in ('coach_correction','production_grade','journal_correction'))`,
`prompt_version text`, `input_snapshot jsonb` (lo que vio la IA, recortado a 2.000 caracteres), `output_snapshot jsonb`
(la corrección mostrada), `error_pattern text null`, `comment text null` (≤300 caracteres), `created_at timestamptz default now()`.
RLS habilitado; `select` e `insert` solo propios (`(select auth.uid()) = user_id`); sin `update`/`delete` públicos.
**Verify**: como usuario A, `insert` propio funciona y `select` de filas de B devuelve 0.

### Paso 2: Retirar un fallo de la cola
En `lib/practice/error-recurrence.ts` añade `retractErrorPattern(queue, patternId, now)`: si la entrada existe, resta 1 a
`failCount`; si queda en 0, elimina la entrada y escribe un tombstone en `removedAtByPattern[patternId] = now` (mismo
mecanismo que usan las retiradas actuales, para que otro dispositivo no la resucite). En `error-recurrence-sync.ts` añade
`retractPracticeErrorRecurrence(userId, patternId)` siguiendo exactamente el patrón de `recordPracticeErrorRecurrence`.
**Verify**: tests: `failCount` 2 → 1 y la entrada sigue; `failCount` 1 → se elimina con tombstone; `mergeErrorRecurrenceQueues`
con una copia remota anterior no la resucita.

### Paso 3: Guardar el reporte (offline primero)
`lib/ai-feedback/report.ts`: `reportWrongFeedback({ userId, feature, promptVersion, input, output, errorPattern?, comment? })`
guarda en Dexie y encola el `insert` con el outbox (`enqueue(userId, 'ai_feedback_reports', 'insert', …)`); si la
corrección tenía `errorPattern` y la función es `coach_correction` o `production_grade`, llama a
`retractPracticeErrorRecurrence`. El outbox solo acepta las tablas de la unión `SyncTable` en `lib/sync/types.ts:5-25`:
añade `'ai_feedback_reports'` ahí y revisa si `lib/sync/sync-manager.ts` necesita una entrada para esa tabla (busca
cómo se maneja `immersion_lesson_progress`, añadida recientemente, y replica).
**Verify**: test con Dexie falsa: se guarda el reporte, se encola y se retira el patrón; `journal_correction` no retira nada.

### Paso 4: Botón en las 3 superficies
`components/ai-feedback/ReportWrongFeedbackButton.tsx` (≤80 líneas): botón de texto pequeño "¿Corrección equivocada?"
que abre un campo opcional de comentario y confirma con "Gracias, no lo contaremos como error" (para el Diario:
"Gracias, lo revisaremos"). Tras enviarlo, el botón queda deshabilitado. Úsalo en `CorrectionCard`, en
`ProductionFeedback` (si pasa de 250 líneas, extrae primero la sección de feedback a un subcomponente) y en cada error
de `JournalFeedbackView`. Tokens de diseño solamente; accesible por teclado.
**Verify**: tests de componente: clic → llama a `reportWrongFeedback` con la `feature` correcta; segundo clic deshabilitado.

### Paso 5: Convertir reportes en casos de evaluación
`scripts/prompt-eval/import-reports.ts`: lee **tus** reportes (sesión autenticada del propio usuario vía
`lib/ai-feedback/queries.ts`; nunca `service_role`) y escribe un caso por reporte en
`scripts/prompt-eval/cases/reported/` con `expect: "no_error_flagged"` (o la regla que indique el comentario). Por
defecto excluye `journal_correction` salvo con la flag `--include-journal`, y avisa de que esos casos contienen texto
personal y no deben commitearse (añade `scripts/prompt-eval/cases/reported/` a `.gitignore`).
**Verify**: `pnpm tsx scripts/prompt-eval/import-reports.ts --dry-run` → lista cuántos casos crearía, sin escribir archivos.

### Paso 6: Documentación

| Archivo | Qué escribir |
|---|---|
| `docs/ai/prompt-eval.md` (del Plan 036) | Sección "Casos reportados": cómo importarlos, por qué no se commitean |
| `docs/architecture/integrated-learning-loop.md` | Un reporte retira el fallo de la cola de repaso (Coach y ejercicios); en el Diario solo se registra |
| `docs/security/threat-model.md` | Tabla `ai_feedback_reports`: datos personales, RLS por usuario, sin acceso de otros usuarios |

**Verify**: `grep -n "ai_feedback_reports" docs/security/threat-model.md` → 1 resultado.

## Test plan

- `lib/practice/__tests__/` (junto a los tests existentes de la cola): `retractErrorPattern` (3 casos del paso 2).
- `lib/ai-feedback/__tests__/report.test.ts`: casos del paso 3.
- Tests de componente del botón y de las 3 integraciones.

## Criterios de aceptación

- [ ] Reportar una corrección del Coach o de un ejercicio retira ese fallo de la cola de repaso.
- [ ] El reporte funciona sin conexión y se sincroniza después.
- [ ] Nadie puede leer reportes de otra persona (RLS verificada).
- [ ] Los casos importados con texto personal no quedan en git.
- [ ] `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design`, `pnpm audit:hard-rules` en exit 0.
- [ ] Documentación del paso 6 actualizada.

## STOP conditions

- El outbox no puede manejar una tabla nueva sin cambiar su contrato (reporta el cambio necesario).
- `ProductionFeedback.tsx` no se puede partir sin cambiar su API pública.
- Retirar un patrón exige tocar la RPC del Diario (Plan 029).

## Notas de mantenimiento

- Si el Plan 041 está DONE, un reporte sobre un ejercicio servido desde el banco debe incrementar su `quality_flags`
  (añádelo como tarea de seguimiento en ese momento; aquí no se toca el banco).
- Revisar en PR que `input_snapshot` se recorte y que no se registre nada en logs del servidor.
