# Roadmap Post-Producción — Mejoras Priorizadas

Fecha: 2026-07-03  
Última actualización: 2026-07-03  
Base auditada: commit `51515e0`  
Fuente: auditoría de mejoras post-sprint (roadmap 031 cerrado)

Este documento ordena el trabajo que queda después de cerrar el sprint de producción.
El objetivo es cerrar deuda técnica verificada, mejorar rendimiento medible, completar
el arco pedagógico y preparar la app para escalar sin sorpresas.

## Estado Actual

Completado en roadmap 031 (referencia):

- CI verde: lint, type-check, test:coverage, build con smoke.
- Seguridad API: CSRF, rate limit RPC, errores públicos, CSP, `redactError`.
- Jobs durables, health checks, backups documentados, a11y Playwright/axe.
- SRS de vocabulario vía outbox (`enqueueWordBankSRSUpdate` en `lib/practice/queries.ts:132-135`).

Deuda verificada al escribir este plan:

| ID | Hallazgo | Evidencia | Plan origen |
|---|---|---|---|
| T44 | Prompts de usuario aún inline en rutas API | `app/api/gemini/phrases/route.ts:40`, `app/api/sentences/generate/route.ts:36`, `app/api/gemini/deck-suggest/route.ts:87` | 008 (parcial) |
| T45 | Caché STT L2 falla silenciosamente por RLS sin policies | `stt_transcription_cache` — ver `plans/007-fix-stt-cache-rls.md` | 007 |
| T46 | Admin seed muta DB desde browser sin gate server-side | `lib/admin/seed/services.ts` usa `getSupabaseBrowserClient()`; `AdminGuard.tsx` es solo client | 004 |
| T47 | Sin bundle analysis ni presupuestos en CI | `.github/workflows/ci.yml` no analiza chunks; baseline en `docs/architecture/performance.md` desactualizado (735 tests vs 915 actuales) | nuevo |
| T48 | Sesiones de fonemas cargan catálogo completo | `plans/028-scope-phoneme-session-data.md` | 028 |
| T49 | Coverage solo con umbrales globales (50%/45%) | `docs/architecture/testing-strategy.md` — targets per-file sin enforcement en CI | 035 residual |
| T50 | QA manual del reader sin ejecutar | `docs/pedagogy-plans/README.md` backlog #4 | pedagogy |
| T51 | Sin hilo visual entre pasos de sesión (`word_intro` → `word_review` → `context_practice`) | Diferido del plan 08; no existe `docs/pedagogy-plans/09-*.md` | pedagogy 09 |
| T52 | Sync-manager sin tests de lógica pura | `plans/009-sync-manager-tests.md` — TODO | 009 |
| T53 | Rutas API críticas sin tests unitarios dedicados | `plans/013-api-route-tests.md` — TODO | 013 |
| T54 | Índice `plans/README.md` desactualizado vs código | 006 DONE en código pero TODO en índice; 014/015 probablemente obsoletos; 016 marcado IN PROGRESS pero plan dice COMPLETE | reconciliación |
| T55 | Sin backpressure global Gemini | Timeouts por llamada en `lib/gemini/client.ts`; sin semáforo/cola global | nuevo |
| T56 | Grants anon revisados estáticamente, no probados en staging | `docs/database/anon-grants-review.md` | 031 residual |
| T57 | `/practice/sounds` online-only sin Dexie | Excepción documentada en `CLAUDE.md` | diferido |
| T58 | Observabilidad rica opcional | Solo health check GitHub Actions; Log Drain requiere Vercel Pro | operativo |

## Reglas de Ejecución

- No mezclar fixes de seguridad (Fase 1) con features pedagógicas (Fase 3) en el mismo PR.
- Cada tarea termina con verificación local; Fase 1 y 2 requieren CI verde antes de merge.
- Migraciones SQL: revisar manualmente antes de aplicar en entornos compartidos.
- Prompts nuevos o movidos → solo `lib/ai-prompts.ts` (hard rule de `CLAUDE.md`).
- Mutaciones Supabase desde UI → solo vía `lib/*/queries.ts` o rutas API con guards.

## Fase 1 — Seguridad y Hard Rules (P1)

Objetivo: cerrar brechas reales y alinear el código con las reglas del proyecto.

| Orden | ID | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---|:---:|:---:|---:|---|---|
| 1 | T44 | Completar centralización de prompts: mover prompts de usuario inline a `lib/ai-prompts.ts` como `build*Prompt()` | P1 | S | 3-4 h | — | `grep` no encuentra template strings de prompt en rutas `app/api/gemini/*` ni `app/api/sentences/*` |
| 2 | T45 | Arreglar RLS del caché STT (`stt_transcription_cache`) | P1 | S | 4-6 h | — | Lecturas/escrituras L2 exitosas; menos llamadas Gemini redundantes |
| 3 | T46 | Gate admin server-side: API routes para seed mutations + verificación `role === 'admin'` | P1 | M | 1-2 días | — | `lib/admin/seed/services.ts` deja de usar browser client para inserts; mutaciones pasan por `/api/admin/*` con `requireUser` + role check |

### T44 — Detalle de implementación

**Archivos in scope:**

- `lib/ai-prompts.ts` — añadir exports:
  - `buildPhrasesUserPrompt(exclude?: string[])`
  - `buildSentenceGeneratePrompt(count, topic, level)` (si no existe ya)
  - `buildDeckSuggestUserPrompt(description: string | undefined, ...)`
- `app/api/gemini/phrases/route.ts` — importar builder, eliminar template inline línea 40
- `app/api/sentences/generate/route.ts` — importar builder, eliminar template inline línea 36
- `app/api/gemini/deck-suggest/route.ts` — importar builder, eliminar template inline línea 87
- Tests: añadir en `lib/__tests__/ai-prompts.test.ts` o archivo existente de prompts

**Patrón a seguir:** ver `buildInterviewPrompt` y `buildTranscriptionPrompt` en `lib/ai-prompts.ts`.

**Verificación:**

```bash
pnpm type-check
pnpm lint
pnpm test
# Sin prompts inline en rutas:
rg "const prompt = \`" app/api/gemini app/api/sentences --glob "*.ts"
# Debe devolver 0 coincidencias (o solo comentarios)
```

### T45 — Detalle de implementación

Seguir `plans/007-fix-stt-cache-rls.md` paso a paso. Resumen:

- Crear migración con policies RLS para `stt_transcription_cache` (lectura/escritura autenticada o service-role según diseño del plan).
- Verificar que `app/api/gemini/transcribe/route.ts` deja de tragar errores de caché en silencio.
- Añadir test o check que confirme policy presente (`pnpm audit:rls` o test de integración).

### T46 — Detalle de implementación

Seguir `plans/004-admin-route-server-gate.md` adaptado a rutas actuales:

- Ruta admin actual: `app/(authenticated)/admin/` con `AdminGuard.tsx` (client-only).
- Crear rutas API: `app/api/admin/seed/[entity]/route.ts` (o una ruta unificada) con:
  - `requireSameOrigin`, `requireUser`, verificación `user_profiles.role === 'admin'`
  - Mutaciones vía `createSupabaseServerClient()` o service-role server-only según RLS
- Refactorizar `lib/admin/seed/services.ts` para llamar fetch a las rutas API en lugar de `getSupabaseBrowserClient()`.
- Mantener `AdminGuard` como UX; la seguridad real vive en el servidor.

**Verificación:**

```bash
pnpm type-check
pnpm test
rg "getSupabaseBrowserClient" lib/admin/seed/ 
# Debe devolver 0 coincidencias tras el refactor
```

**Comandos de salida Fase 1:**

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm check:migrations   # si T45 añade migración
```

---

## Fase 2 — Rendimiento y Calidad Medible (P2)

Objetivo: saber si el bundle crece y reducir trabajo innecesario en sesiones de fonemas.

| Orden | ID | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---|:---:|:---:|---:|---|---|
| 4 | T47 | Bundle analysis en CI + actualizar baseline | P2 | S | 4-6 h | Fase 1 | CI publica reporte de chunks; `docs/architecture/performance.md` actualizado |
| 5 | T48 | Cargar solo datos de fonemas necesarios por sesión | P2 | M | 1-2 días | — | Sesión de un sonido no carga `getAllSounds` + `getAllWords` completos |
| 6 | T49 | Subir umbrales de coverage en archivos críticos | P2 | M | 1 día | — | `vitest.config.ts` con thresholds per-file para `lib/api/guards.ts`, `lib/practice/queries.ts`, `lib/sync/sync-manager.ts` |

### T47 — Detalle de implementación

1. Añadir script `pnpm analyze:bundle` usando `@next/bundle-analyzer` o salida de `next build` con flag de análisis.
2. En CI (post-build): generar artefacto JSON/HTML de tamaños de chunks; fallar si un chunk supera presupuesto acordado (ej. +10% vs baseline commit `51515e0`).
3. Actualizar `docs/architecture/performance.md`:
   - Fecha de medición
   - Conteo actual de tests (915)
   - Tabla de chunks principales con tamaños gzip

**Presupuestos iniciales sugeridos** (ajustar tras primera medición):

| Ruta / chunk | Límite gzip (orientativo) |
|---|---|
| `/practice` shell | medir baseline + 10% |
| `/words` lazy tabs | medir baseline + 10% |
| Global First Load JS | medir baseline + 5% |

### T48 — Detalle de implementación

Seguir `plans/028-scope-phoneme-session-data.md`:

- Nuevas funciones en `lib/phoneme-practice/queries.ts`: `getSoundSessionData(soundId)` que devuelve solo target + distractors acotados.
- Actualizar `app/(authenticated)/practice/sounds/sound/[soundId]/page.tsx` y `lib/practice/daily-plan/composer.ts`.
- Tests en `lib/phoneme-practice/__tests__/` que mockean queries y verifican que no se pide catálogo completo.

### T49 — Detalle de implementación

En `vitest.config.ts`, añadir sección `coverage.thresholds` per-file siguiendo targets ya documentados en `docs/architecture/testing-strategy.md`. Empezar conservador (+5% sobre cobertura actual medida) para no bloquear CI de golpe.

**Comandos de salida Fase 2:**

```bash
pnpm type-check
pnpm test:coverage
pnpm build
pnpm analyze:bundle   # nuevo script
```

---

## Fase 3 — Producto Pedagógico (P1 producto / P2 técnico)

Objetivo: cerrar el arco de aprendizaje que el motor ya soporta pero la UI no narra.

| Orden | ID | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---|:---:|:---:|---:|---|---|
| 7 | T50 | QA manual del reader + checklist documentado | P1 | S | 2-4 h | — | ✅ Checklist en `docs/pedagogy-plans/reader-qa-checklist.md`; reader cableado en composer |
| 8 | T51 | Hilo entre pasos de sesión diaria (plan pedagógico 09) | P1 | M | 1-2 días | T50 | ✅ `StepThreadHints` + `docs/pedagogy-plans/09-session-step-thread.md` |

### T50 — Checklist QA reader

Ejecutar manualmente y documentar resultado:

1. Usuario con ≥3 palabras `due` en word_bank.
2. Completar daily plan → verificar que aparece paso `reader`.
3. Confirmar exposure tracking en `answer_history` / actividad.
4. Desconectar red → reabrir reader → verificar lectura desde Dexie cache.
5. Registrar resultado en `docs/pedagogy-plans/README.md` (fecha, commit, pass/fail por ítem).

### T51 — Hilo entre pasos (plan 09)

**Crear:** `docs/pedagogy-plans/09-session-step-thread.md` con spec breve.

**Implementación sugerida:**

- En `lib/practice/daily-plan/step-builders.ts` (o componente de sesión), propagar `contentId` / `lemma` entre pasos consecutivos del mismo ítem.
- Nuevo componente UI pequeño (`StepThreadBadge` o similar) en `components/practice/`:
  - Muestra "Esta palabra vuelve" / "Segunda vez con *ship*" cuando `contentId` coincide con paso anterior.
- Sin lógica de negocio en `/app` pages; máximo 250 líneas por componente.

**Aceptación:**

- Sesión con `word_intro` seguido de `word_review` para la misma palabra muestra indicador visual.
- Tests de `step-builders` o componente con Testing Library.

**Comandos de salida Fase 3:**

```bash
pnpm type-check
pnpm test
pnpm test:a11y   # si el nuevo badge afecta flujo de práctica
```

---

## Fase 4 — Tests y Reconciliación de Deuda (P2)

Objetivo: blindar rutas críticas y limpiar el índice de planes obsoleto.

| Orden | ID | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---|:---:|:---:|---:|---|---|
| 9 | T54 | Reconciliar `plans/README.md`: marcar 006/014/015/016 según código actual | P2 | S | 1-2 h | — | Índice refleja estado real |
| 10 | T52 | Tests de lógica pura del sync-manager outbox | P2 | M | 1 día | — | `lib/sync/__tests__/sync-manager.test.ts` cubre enqueue, retry, conflict |
| 11 | T53 | Tests unitarios para 3 rutas API de mayor riesgo | P2 | M | 1-2 días | Fase 1 | Tests de guards + happy path para transcribe, grade-production, drain-enrichment |

### T54 — Reconciliación verificada

| Plan | Acción |
|---|---|
| 006 | Marcar **DONE** — `savePracticeAnswer` ya usa `enqueueWordBankSRSUpdate` |
| 014 | Marcar **REJECTED/obsoleto** — solo `AuthProvider` importa client (exento) |
| 015 | Marcar **REJECTED/obsoleto** — `PracticeSession` ≤250 líneas |
| 016 | Marcar **DONE** — plan interno dice COMPLETE; alinear índice |
| 008 | Marcar **PARCIAL** hasta completar T44 |

### T52 — Seguir `plans/009-sync-manager-tests.md`

### T53 — Seguir `plans/013-api-route-tests.md`

Priorizar rutas con costo Gemini o mutación de datos.

---

## Fase 5 — Escala y Operaciones (P2/P3, opcional)

Objetivo: preparar crecimiento sin bloquear features. Ejecutar cuando haya tráfico real o plan Vercel Pro.

| Orden | ID | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---|:---:|:---:|---:|---|---|
| 12 | T55 | Semáforo/backpressure global Gemini | P2 | M | 1-2 días | Fase 1 | Cola o contador global evita saturar cuota concurrente |
| 13 | T56 | Validar grants/policies en Supabase staging | P2 | M | 1 día | — | Script o test de integración contra DB staging aplicada |
| 14 | T57 | Dexie sync para `/practice/sounds` | P2 | L | 3-5 días | T48 estable | Flujo sounds funciona offline con reconciliación |
| 15 | T58 | Observabilidad rica (Sentry free tier o Log Drain Vercel Pro) | P3 | S-M | 4 h - 1 día | — | Alertas automáticas en errores 5xx y health check fallido |
| 16 | — | Regenerar tipos Supabase post-migración cron | P2 | S | 2-4 h | T45 si añade tabla | `pnpm type-check` sin casts por tablas nuevas |

### T55 — Sketch de semáforo Gemini

- Nuevo módulo `lib/gemini/semaphore.ts` con límite configurable (`GEMINI_MAX_CONCURRENT`, default 5).
- `callWithFallback` adquiere slot antes de fetch; libera en `finally`.
- Test: N llamadas concurrentes → máximo N activas.
- Documentar en `docs/architecture/multi-instance.md`.

---

## Camino Crítico

Orden mínimo recomendado (no paralelizar sin cuidado):

1. **T44** — hard rule, bajo esfuerzo.
2. **T45** — ahorro de costos API inmediato.
3. **T46** — brecha de seguridad admin.
4. **T47** — visibilidad antes de más features.
5. **T50 + T51** — valor pedagógico visible al usuario.
6. **T52 + T53** — regresiones blindadas.
7. Resto según tráfico y plan de hosting.

## Paralelización Recomendada

Después de Fase 1:

- **Línea A (seguridad/costo):** T45, T46 — secuencial si comparten archivos de guards.
- **Línea B (perf):** T47, T48 — independientes.
- **Línea C (producto):** T50, T51 — independiente de A/B.
- **Línea D (tests):** T52, T53, T54 — después de Fase 1.

## Hitos

| Hito | Condición | Estado esperado |
|---|---|---|
| H6 — Hard rules cerradas | Fase 1 completa | Prompts centralizados, STT cache operativo, admin server-gated |
| H7 — Rendimiento medible | Fase 2 completa | CI con bundle budgets; fonemas scoped |
| H8 — Arco pedagógico | Fase 3 completa | Reader QA pasado; hilo entre pasos en UI |
| H9 — Deuda limpia | Fase 4 completa | Índice reconciliado; sync-manager y API routes testeados |
| H10 — Escala | Fase 5 completa | Semáforo Gemini; staging validado; sounds offline (opcional) |

## No Hacer Todavía

- No iniciar T57 (Dexie sounds) hasta que T48 estabilice las queries de fonemas.
- No subir umbrales de coverage agresivamente sin medir baseline post-T49.
- No añadir features nuevas de ejercicio hasta cerrar T51 (el hilo narrativo).
- No configurar Log Drain sin Vercel Pro — usar health check + Sentry free como alternativa.

## Referencia Rápida de Planes Individuales

Para ejecutores que prefieren planes atómicos, este roadmap compone y prioriza:

| Tarea | Plan detallado existente |
|---|---|
| T44 | Extiende `plans/008-centralize-ai-prompts.md` |
| T45 | `plans/007-fix-stt-cache-rls.md` |
| T46 | `plans/004-admin-route-server-gate.md` |
| T48 | `plans/028-scope-phoneme-session-data.md` |
| T52 | `plans/009-sync-manager-tests.md` |
| T53 | `plans/013-api-route-tests.md` |

## Verificación Global de Cierre

Cuando todas las fases solicitadas estén HECHAS:

```bash
pnpm lint
pnpm type-check
pnpm test:coverage
pnpm test:integration
pnpm test:a11y
pnpm build
pnpm analyze:bundle
pnpm check:migrations
pnpm audit:rls
pnpm audit --prod
```

Actualizar `TODO.md` y `plans/README.md` con estado reconciliado.
