# TODO de Producción

Auditoría crítica original: commit `11dee70`, 2026-06-30.
**Última actualización:** 2026-07-18 — stream de producto/pedagogía 046–057 implementado; RLS aislado sigue pendiente porque no hay entorno no productivo ejecutable.

Convenciones:

- Prioridad: `P0` bloquea producción, `P1` alto riesgo, `P2` importante, `P3` mejora.
- Dificultad: `S` horas, `M` 1-2 días, `L` varios días.
- Estado: `HECHO` | `PARCIAL` | `ABIERTO` | `CONDICIONAL`
- Tiempo estimado: rango realista incluyendo pruebas y revisión.

## Estado General

La base técnica es sólida y el sprint de producción cerró la mayoría de P0/P1 de seguridad, datos y escalabilidad operativa. Las únicas validaciones activas son cerrar el QA manual de Reader y ejecutar el runner RLS en una base local o staging aislada. En Vercel Free, la observabilidad mínima queda cubierta con health check programado desde GitHub Actions; el resto de mejoras operativas se activará solo cuando haya evidencia de necesidad.

Última verificación completa registrada (2026-07-17):

- `pnpm type-check`: pasa.
- `pnpm test`: 1078 tests pasan (192 archivos).
- `pnpm test:coverage`: pasa (umbrales 50% lines / 45% functions).
- `pnpm audit --prod`: sin vulnerabilidades conocidas (última auditoría).
- Migración `20260623000000_remove_premium_set_admin_and_a1.sql` verificada como no destructiva y sin email hardcodeado; ya no está exenta en `scripts/check-migrations.mjs`.

## Resumen de Progreso

### HECHO (roadmap 031)

| # | Área |
|---|---|
| 9-12 | CSRF/same-origin, errores públicos, rate limit RPC, tests de guards |
| 14 | CSP/headers globales en `next.config.mjs` |
| 15-17 | Checks migraciones, RLS, tipos Supabase |
| 20 | Jobs durables (`word_enrichment_jobs` + worker programado en GitHub Actions) |
| 22-25 | Timeouts Gemini, helper unificado, health liveness/readiness, backups |
| 26-30 | Auth robusto, tests auth, degradación, inventario offline, estados de cola |
| 34-37 | Scripts test, coverage, artefactos CI, reconciliación plans |
| 38-41 | README, threat model, offline/sync, matriz entornos |
| 42-43 | `redactError` en logs, CI build con mock + smoke |

### PARCIAL

| # | Área | Qué falta |
|---|---|---|
| RLS-INT / T56 | RLS integration real | **HECHO (2026-07-18):** `pnpm test:rls:integration` pasó contra Supabase local. En el proceso se corrigieron migraciones que impedían reconstruir desde cero (referencias a `user_sound_progress` eliminada; `deck_suggestions_cache` inexistente) y una recursión infinita de RLS en `text_fragments` (nueva migración `20260718120000_fix_text_fragments_rls_recursion.sql`). Detalle en `docs/database/rls-integration.md`. No ejecutar contra producción. |

### HECHO (planes 046–057, 2026-07-18)

| Plan | Área | Evidencia |
|---|---|---|
| T50 | QA manual de Reader | Confirmado manualmente como pass; cobertura automatizada del Reader verde. |
| 046–052 | Fonemas, scores, topic review, intereses, ejercicios y storage Journal | Migraciones de producción verificadas y commits `5a842720` a `32b604df`. |
| 055 | Guardar palabras desde Reader | `4873690c`; tokenización accesible, deduplicación y fallback offline. |
| 056–057 | Transformaciones y traducción ES→EN | Migraciones 20/22 verificadas; generación, caché y topic-review opcional en `7c164327` a `c9c09ded`. |

### HECHO (Journal, planes 053–054)

| Plan | Evidencia |
|---|---|
| 053 | Cliente `lib/journal/correct-client.ts`, esquema compartido `lib/journal/correction.ts` y `applyJournalFeedback` con programación SM-2 grade-2 idempotente (no solo contadores). Tests de auth/same-origin, draft/ajena/corrected (404/409), idempotencia, degradación de red y scheduling SRS. |
| 054 | `useJournalEntry` orquesta autosave→enviar→corregir (offline-first, corrección online-only con reintento al reconectar). Componentes `JournalWorkspace`/`JournalEditor`/`JournalFeedbackView`/`SuggestedWords` (opt-in por palabra) y `JournalHistoryList` (Dexie reactivo). Paso concept opcional `journal_entry` (href `/journal`, cadencia documentada, sin auto-completar) añadido tras el corte del plan diario. Tests de autosave, reconexión, opt-in de palabras y cadencia. |

### HECHO (roadmap 032 Fase 1-2)

| # | Área |
|---|---|
| T44-T49 | Prompts centralizados, STT cache RLS, bundle CI, fonemas scoped, coverage per-file |
| T51 | Hilo entre pasos (plan 09) |

### CONDICIONAL (no bloquea el estado actual)

| # | Área | Activar cuando |
|---|---|---|
| T55 | Backpressure global de Gemini | Existan 429, saturación de cuota o concurrencia medible. La solución deberá ser distribuida; no sirve un semáforo en memoria por instancia serverless. |
| T57 | Sound Lab offline | El uso offline se convierta en promesa de producto o necesidad observada. La limitación actual está documentada. |
| T58 | Observabilidad adicional | Haya tráfico público significativo o incidentes que el health check y los logs manuales no permitan diagnosticar. Considerar Sentry; Log Drain solo si se adopta Vercel Pro. |
| T59 / plan 043 | Weekly retention loop en Home | La retención semanal sea una prioridad de producto respaldada por uso real. `/progress` ya cubre el resumen; la mejora pendiente es recomendar una siguiente acción útil. |

### HECHO (hardening backend 2026-07-04/05)

| Área | Evidencia |
|---|---|
| Cobertura API backend | Tests añadidos para rutas Gemini, assessment, enrichment, word-of-day, transcribe-sentence y rutas dinámicas. |
| Gemini JSON helpers | `lib/gemini/json-route.ts` centraliza API key, fallback, parsing JSON y errores públicos. |
| Gemini chat streaming | `lib/gemini/chat-route.ts` extraído y cubierto con tests de deltas, tool calls, truncado, fallback y abort. |
| Logging sanitizado | `lib/api/logging.ts`; rutas `app/api/**/route.ts` sin `console.error`/`console.warn` directos. |
| Cache transcripción persistente | `stt_transcription_cache` y `sentence_transcription_cache` con L1/L2 por usuario. |
| Cache común transcripción | `lib/gemini/transcription-cache.ts` compartido por `transcribe` y `transcribe-sentence`. |
| Service-role clients | `lib/supabase/service-role.ts` y `lib/supabase/admin.ts`; rutas/worker usan helper central. |
| Sentences generate | Usa `callWithFallback`, schema Zod de respuesta Gemini y errores públicos. |

---

## Backend

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Estandarizar todos los endpoints POST con `requireSameOrigin(request)` cuando acepten cookies de sesión. | P1 | M | 1 día | Roadmap #9. Inventario de rutas mutantes cubierto. |
| HECHO | Sustituir el rate limiter en memoria por Supabase RPC atómico. | P1 | M | 1-2 días | Roadmap #11. `consume_rate_limit` en `lib/api/guards.ts`. |
| HECHO | Dejar de devolver `err.message` del proveedor/DB al cliente. | P1 | S | 4-6 h | Roadmap #10. `publicErrorResponse` en rutas API. |
| HECHO | Sacar enriquecimiento de `void` en rutas HTTP; usar cola durable. | P1 | L | 2-4 días | Roadmap #20. `word_enrichment_jobs` + cron drain. |
| HECHO | Unificar infraestructura Gemini en helper común. | P2 | M | 1-2 días | Roadmap #23. `lib/gemini/client.ts` → `callWithFallback`. |
| HECHO | Definir timeouts explícitos para todas las llamadas Gemini. | P2 | M | 1 día | Roadmap #22. `withGeminiTimeout` (30s/45s audio). |
| HECHO | Revisar endpoints Bearer-only y consolidarlos con `requireUser`/`createUserScopedClient`. | P2 | S | 4-8 h | Roadmap #9/#12. Rutas mutantes autenticadas cubiertas por guards y tests. |
| HECHO | Centralizar clientes service-role de runtime backend. | P2 | S | 2-4 h | `lib/supabase/service-role.ts`; rutas y workers usan `getSupabaseAdminClient`; rate-limit usa `tryGetSupabaseAdminClient` con fallback memoria. |
| HECHO | Unificar rutas Gemini JSON y logging de errores. | P2 | M | 1 día | `lib/gemini/json-route.ts`, `lib/api/logging.ts`; rutas API sin logs directos no sanitizados. |
| HECHO | Extraer cache común de transcripción. | P2 | M | 1 día | `lib/gemini/transcription-cache.ts`; L1/L2 compartido por word/sentence transcription. |

## Frontend

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Corregir `AuthPanel`: quitar import directo de `@/lib/supabase/client`. | P0 | S | 2-4 h | Roadmap Fase 0 #1. Flujo vía `lib/supabase/auth-actions.ts`. |
| HECHO | Dividir componentes/hooks grandes y quitar excepciones de tamaño. | P2 | L | 3-5 días | Roadmap #32. `useWords.ts` queda en 139 líneas con helpers `hooks/word-bank/*`; `AuthPanel.tsx` queda en 121 líneas con `useAuthPanelController`. |
| HECHO | Reducir estado persistente en `localStorage` para flujos críticos. | P1 | M | 1-3 días | Roadmap #29. `pronunciation_mastered`, `pronunciation_queue` y `pronunciation_seen` migran a Dexie con fallback legacy. |
| HECHO | Eliminar estilos inline no runtime o documentar excepciones. | P3 | M | 1 día | Roadmap #33. `AuthPanel.tsx` conserva solo variables CSS runtime; excepciones en `docs/design/inline-style-exceptions.md`. |
| HECHO | Añadir pruebas de interacción y a11y para auth/recovery/reset. | P1 | M | 1-2 días | Roadmap #27. |

## Base de Datos

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Revertir o reemplazar la migración destructiva que borra usuarios. | P0 | S | 2-4 h | `20260623000000_...` no contiene borrados masivos ni `DROP TABLE`; `pnpm check:migrations` cubre el archivo. |
| HECHO | Regenerar tipos Supabase y eliminar casts `as any` por tablas faltantes. | P1 | M | 1 día | Roadmap #17. |
| HECHO | Revisar grants heredados a `anon` y default privileges. | P2 | M | 1-2 días | Roadmap #18. `20260703000000_harden_anon_grants.sql` revoca grants amplios; revisión en `docs/database/anon-grants-review.md`. |
| HECHO | Añadir pruebas o checks de migraciones para RLS. | P1 | M | 1-2 días | Roadmap #15-16. `pnpm check:migrations`, `pnpm audit:rls`. |
| HECHO | Documentar migraciones históricas con policy insegura temporal. | P2 | M | 1 día | Roadmap #19. `docs/database/migration-risk-register.md` documenta STT cache 2026-06-11 → 2026-06-21. |
| HECHO | Ejecutar pruebas RLS contra una base local/staging aplicada. | P2 | M | 1-2 días | 2026-07-18: `pnpm exec supabase start` + `pnpm test:rls:integration` PASÓ en local. Se arreglaron 3 migraciones para reconstruir desde cero y la recursión RLS de `text_fragments`. Ver `docs/database/rls-integration.md`. No usar producción (el runner crea/borra usuarios). |

## Infraestructura

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Arquitectura multi-instancia: rate limit, jobs, observabilidad. | P0/P1 | L | 3-5 días | Roadmap #21. `docs/architecture/multi-instance.md`; baseline Free con `.github/workflows/production-health.yml`; Log Drain queda opcional en Vercel Pro. |
| HECHO | Health checks reales con readiness/liveness separados. | P2 | M | 1 día | Roadmap #24. `GET /api/health` y `?ready=1`. |
| HECHO | Estrategia de backups/restore y retención Supabase. | P0/P1 | M | 1-2 días | Roadmap #25. `docs/deployment/backups.md`. |
| HECHO | Revisar PWA/service worker con flujos auth/API. | P2 | M | 1-2 días | `next.config.mjs` mantiene auth/API fuera de runtime cache; CSP/headers verificados. |
| HECHO | Documentar matriz de entornos. | P1 | S | 4-6 h | Roadmap #41. `docs/deployment/environments.md`. |

## Seguridad

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Bloquear producción hasta eliminar migración destructiva y hardcoded admin. | P0 | S | 2-4 h | SQL histórico neutralizado y ya no exento del check de migraciones. |
| HECHO | Aplicar CSRF/same-origin de forma consistente en POST autenticados. | P1 | M | 1 día | Roadmap #9. |
| HECHO | Sustituir mensajes de error internos por respuestas públicas genéricas. | P1 | S | 4-6 h | Roadmap #10. |
| HECHO | Ampliar escaneo de secretos en CI y precommit local. | P2 | S | 4 h | Roadmap #13. `pnpm scan:secrets` corre en CI; `.githooks/pre-commit` lo ejecuta localmente al activar `core.hooksPath`. |
| HECHO | Verificar headers globales y CSP. | P2 | M | 1 día | Roadmap #14. `next.config.mjs`. |
| HECHO | Revisar PII/audio/transcripts en logs y caches. | P1 | M | 1-2 días | Roadmap #42. `logServerError`, `redactError`, caches STT/sentence por usuario y rutas API sin `console.error` directo. |

## Testing

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Restaurar suite verde. | P0 | S | 2-6 h | 1078 tests en 192 archivos pasan (2026-07-17). |
| HECHO | Añadir tests de guard para cada POST sensible. | P1 | M | 1-2 días | Roadmap #12. |
| HECHO | Añadir cobertura de migraciones/RLS. | P1 | L | 2-4 días | Roadmap #15-16. |
| HECHO | Separar tests unitarios, integración y smoke/e2e. | P2 | M | 1 día | Roadmap #34. `pnpm test:integration`. |
| HECHO | Medir cobertura y fijar umbrales por rutas críticas. | P2 | M | 1-2 días | Roadmap #35. `docs/architecture/testing-strategy.md`. |

## CI/CD

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Mantener CI bloqueante y resolver el rojo actual. | P0 | S | 2-6 h | lint, type-check, test:coverage, build en CI. |
| HECHO | Añadir `pnpm build` en CI con variables mock y smoke post-build. | P1 | M | 1 día | Roadmap #43. |
| HECHO | Añadir `validate:core1000` y `validate:core1000-generators` como checks obligatorios. | P2 | S | 4 h | CI ejecuta ambos checks después de `lint:design-tokens`. |
| HECHO | Checks para migraciones peligrosas. | P1 | M | 1 día | Roadmap #15. `pnpm check:migrations`. |
| HECHO | Publicar artefactos de test/coverage en CI. | P3 | S | 4 h | Roadmap #36. Artefacto `coverage/` 14 días. |

## UX

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Endurecer auth/reset/recovery. | P1 | M | 1-2 días | Roadmap #26. |
| HECHO | Diseñar degradación clara para Supabase/Gemini no disponibles. | P1 | M | 1-2 días | Roadmap #28. |
| HECHO | Revisar persistencia offline real vs. promesa de producto. | P1 | L | 2-4 días | Roadmap #29. `docs/architecture/offline-sync.md`; pronunciation migra queue/mastered/seen a Dexie con fallback legacy. |
| HECHO | Añadir estados de retry/cola visibles para enriquecimiento. | P1 | M | 1-2 días | Roadmap #30. |
| HECHO | Auditar accesibilidad real con Playwright/axe. | P2 | M | 1-2 días | Roadmap #31. `pnpm test:a11y` ejecuta Playwright + axe sobre `/login`; CI reemplaza grep ARIA por auditoría real. |

## Documentación

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Actualizar README con prerequisitos, verificación y estado de producción. | P1 | S | 4-6 h | Roadmap #38. |
| HECHO | Crear runbook de producción. | P0 | M | 1-2 días | Roadmap Fase 0 #5. `docs/deployment/runbook-minimo.md`. |
| HECHO | Documentar threat model. | P1 | M | 1 día | Roadmap #39. |
| HECHO | Documentar arquitectura offline/sync. | P1 | M | 1 día | Roadmap #40. `docs/architecture/offline-sync.md`. |
| HECHO | Mantener `plans/README.md` reconciliado con este TODO. | P2 | S | 4 h | Roadmap #37. Reconciliado el 2026-07-17; T50 continúa abierto y la fase opcional permanece diferida. |

## Puntuación (actualizada 2026-07-05)

| Área | Nota | Justificación | Qué falta para 10/10 |
|---|---:|---|---|
| Arquitectura | 9/10 | Query layer, RLS, jobs durables, rate limit distribuido, Gemini unificado, pronunciation offline en Dexie y health check programado. | Alertas operativas más ricas si se adopta Sentry o Vercel Pro. |
| Calidad del código | 9/10 | Type-check verde, 1078 tests, helpers backend compartidos y coverage per-file en CI. | RLS integration real y métricas operativas. |
| Seguridad | 9/10 | CSRF universal, CSP, logging sanitizado, rate limit RPC con fallback, secret scan, grants anon endurecidos y SQL P0 neutralizado. | Validar políticas/grants contra una base staging aplicada. |
| Rendimiento | 8/10 | Bundle analysis en CI con budgets; fonemas scoped; timeouts Gemini. | Métricas per-route en analyze-bundle. |
| Escalabilidad | 8/10 | Rate limit multi-instancia, cola durable, worker cron y observabilidad básica compatible con Free. No hay evidencia actual que justifique backpressure adicional. | Añadir backpressure distribuido y pruebas de carga solo si aparecen 429 o saturación; Log Drain si se usa Vercel Pro. |
| Testing | 9/10 | Suite verde, coverage global + per-file crítico en CI, streaming/backend routes cubiertos. | Añadir RLS integration opcional. |
| Documentación | 10/10 | Runbook, threat model, offline/sync, entornos, backups, multi-instance, testing strategy y registro de migraciones históricas. | Mantener docs sincronizadas con cambios operativos. |
| Preparación para producción | 9/10 | CI verde, seguridad API cerrada, backups documentados, SQL P0 neutralizado, grants anon endurecidos, a11y real y health check programado compatible con Vercel Free. | Configurar alertas más ricas cuando el plan/stack lo permita. |

## Orden Recomendado

Fuente detallada: `plans/032-post-production-improvement-roadmap.md`.

1. **Cerrar T50:** completar y documentar el QA manual de Reader.
2. ~~**Cerrar RLS-INT/T56:** levantar Supabase local/staging aislado, aplicar migraciones y validar permisos reales por rol.~~ **HECHO (2026-07-18):** pasó contra local; ver `docs/database/rls-integration.md`.
3. **CI opcional:** automatizar RLS integration solo cuando exista un servicio de test aislado y estable.
4. **Revisar remoto:** confirmar en el proyecto remoto si `handle_new_user` aún inserta en `user_sound_progress` (alta de usuarios rota) y si `text_fragments` tiene la política recursiva; aplicar allí las migraciones nuevas.
5. **Deuda condicional:** no iniciar T55, T57, T58 o T59 hasta que se cumpla el disparador documentado en su fila.
