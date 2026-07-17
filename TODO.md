# TODO de Producción

Auditoría crítica original: commit `11dee70`, 2026-06-30.
**Última actualización:** 2026-07-05 — hardening backend post-producción completado; RLS integration ya tiene runner y detectó drift de migraciones en la base remota enlazada.

Convenciones:

- Prioridad: `P0` bloquea producción, `P1` alto riesgo, `P2` importante, `P3` mejora.
- Dificultad: `S` horas, `M` 1-2 días, `L` varios días.
- Estado: `HECHO` | `PARCIAL` | `ABIERTO`
- Tiempo estimado: rango realista incluyendo pruebas y revisión.

## Estado General

La base técnica es sólida y el sprint de producción cerró la mayoría de P0/P1 de seguridad, datos y escalabilidad operativa. En Vercel Free, la observabilidad mínima queda cubierta con health check programado desde GitHub Actions; Log Drain queda como mejora opcional al subir a Vercel Pro.

Verificación actual (2026-07-05):

- `pnpm type-check`: pasa.
- `pnpm test`: 978 tests pasan.
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
| 20 | Jobs durables (`word_enrichment_jobs` + worker Vercel Cron) |
| 22-25 | Timeouts Gemini, helper unificado, health liveness/readiness, backups |
| 26-30 | Auth robusto, tests auth, degradación, inventario offline, estados de cola |
| 34-37 | Scripts test, coverage, artefactos CI, reconciliación plans |
| 38-41 | README, threat model, offline/sync, matriz entornos |
| 42-43 | `redactError` en logs, CI build con mock + smoke |

### PARCIAL

| # | Área | Qué falta |
|---|---|---|
| RLS-INT | RLS integration real | `pnpm test:rls:integration` existe y limpia usuarios temporales, pero falló contra la base remota enlazada porque faltan migraciones desde `20260610120000` en adelante; validar primero en staging/local aplicado. |

### HECHO (roadmap 032 Fase 1-2)

| # | Área |
|---|---|
| T44-T49 | Prompts centralizados, STT cache RLS, bundle CI, fonemas scoped, coverage per-file |
| T50-T51 | Reader en daily plan + checklist QA; hilo entre pasos (plan 09) |

### ABIERTO (roadmap 032)

| # | Área | Prioridad |
|---|---|---|
| T55-T58 | Escala opcional: semáforo Gemini, staging grants, sounds offline, observabilidad | P2/P3 |
| T59 | Weekly retention loop: resumen semanal + siguiente acción en Home | P1 producto |

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
| HECHO | Eliminar email personal hardcodeado; bootstrap seguro de admin. | P0 | S | 2-4 h | `ADMIN_BOOTSTRAP_EMAIL` en `lib/users/admin.ts`; SQL histórico verificado sin email hardcodeado. |
| HECHO | Regenerar tipos Supabase y eliminar casts `as any` por tablas faltantes. | P1 | M | 1 día | Roadmap #17. |
| HECHO | Revisar grants heredados a `anon` y default privileges. | P2 | M | 1-2 días | Roadmap #18. `20260703000000_harden_anon_grants.sql` revoca grants amplios; revisión en `docs/database/anon-grants-review.md`. |
| HECHO | Añadir pruebas o checks de migraciones para RLS. | P1 | M | 1-2 días | Roadmap #15-16. `pnpm check:migrations`, `pnpm audit:rls`. |
| HECHO | Documentar migraciones históricas con policy insegura temporal. | P2 | M | 1 día | Roadmap #19. `docs/database/migration-risk-register.md` documenta STT cache 2026-06-11 → 2026-06-21. |
| ABIERTO | Ejecutar pruebas RLS contra una base local/staging aplicada. | P2 | M | 1-2 días | Requiere Supabase local o credenciales de test aisladas; complementa `audit:rls` estático. |

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
| HECHO | Restaurar suite verde. | P0 | S | 2-6 h | 978 tests pasan (2026-07-05). |
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
| HECHO | Mantener `plans/README.md` reconciliado con este TODO. | P2 | S | 4 h | Roadmap #37. Actualizado 2026-07-05. |

## Puntuación (actualizada 2026-07-05)

| Área | Nota | Justificación | Qué falta para 10/10 |
|---|---:|---|---|
| Arquitectura | 9/10 | Query layer, RLS, jobs durables, rate limit distribuido, Gemini unificado, pronunciation offline en Dexie y health check programado. | Alertas operativas más ricas si se adopta Sentry o Vercel Pro. |
| Calidad del código | 9/10 | Type-check verde, 978 tests, helpers backend compartidos y coverage per-file en CI. | RLS integration real y métricas operativas. |
| Seguridad | 9/10 | CSRF universal, CSP, logging sanitizado, rate limit RPC con fallback, secret scan, grants anon endurecidos y SQL P0 neutralizado. | Validar políticas/grants contra una base staging aplicada. |
| Rendimiento | 8/10 | Bundle analysis en CI con budgets; fonemas scoped; timeouts Gemini. | Métricas per-route en analyze-bundle. |
| Escalabilidad | 8/10 | Rate limit multi-instancia, cola durable, worker cron y observabilidad básica compatible con Free. Falta backpressure Gemini global. | Semáforo Gemini, pruebas de carga y Log Drain si se usa Vercel Pro. |
| Testing | 9/10 | Suite verde, coverage global + per-file crítico en CI, streaming/backend routes cubiertos. | Añadir RLS integration opcional. |
| Documentación | 10/10 | Runbook, threat model, offline/sync, entornos, backups, multi-instance, testing strategy y registro de migraciones históricas. | Mantener docs sincronizadas con cambios operativos. |
| Preparación para producción | 9/10 | CI verde, seguridad API cerrada, backups documentados, SQL P0 neutralizado, grants anon endurecidos, a11y real y health check programado compatible con Vercel Free. | Configurar alertas más ricas cuando el plan/stack lo permita. |

## Orden Recomendado

Fuente detallada: `plans/032-post-production-improvement-roadmap.md`.

1. **RLS integration opcional:** levantar Supabase local/staging y validar permisos reales por rol.
2. **CI opcional:** ejecutar RLS integration solo cuando existan variables/servicio de test.
3. **Operativo opcional:** T58 Log Drain (Vercel Pro) o Sentry free tier.
