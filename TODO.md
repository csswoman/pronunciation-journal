# TODO de Producción

Auditoría crítica original: commit `11dee70`, 2026-06-30.
**Última actualización:** 2026-07-03 — reconciliado con `plans/031-prioritized-production-roadmap.md`.

Convenciones:

- Prioridad: `P0` bloquea producción, `P1` alto riesgo, `P2` importante, `P3` mejora.
- Dificultad: `S` horas, `M` 1-2 días, `L` varios días.
- Estado: `HECHO` | `PARCIAL` | `ABIERTO`
- Tiempo estimado: rango realista incluyendo pruebas y revisión.

## Estado General

La base técnica es sólida y el sprint de producción cerró la mayoría de P0/P1 de seguridad, datos y escalabilidad operativa. Quedan pendientes refactors de mantenibilidad (P2/P3), observabilidad operativa (Log Drain) y la migración destructiva histórica que sigue en el árbol.

Verificación actual (2026-07-03):

- `pnpm type-check`: pasa.
- `pnpm test`: 915 tests pasan (incluye coverage con umbrales globales).
- `pnpm test:coverage`: pasa (umbrales 50% lines / 45% functions).
- `pnpm audit --prod`: sin vulnerabilidades conocidas (última auditoría).
- Migración destructiva `20260623000000_remove_premium_set_admin_and_a1.sql` **sigue presente** en el árbol — P0 de datos aún abierto.

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
| 21 | Multi-instancia | Log Drain en dashboard Vercel (sin código) |
| 29 | Offline | `pronunciation_mastered` sigue en `localStorage` — migración a Dexie pendiente |

### ABIERTO

| # | Área |
|---|---|
| P0 | Revertir/neutralizar migración destructiva + email hardcodeado en SQL |
| 13 | Ampliar escaneo de secretos en CI |
| 18 | Revisar grants heredados a `anon` |
| 19 | Documentar migraciones históricas con ventanas inseguras |
| 31 | A11y real con Playwright/axe |
| 32 | Dividir componentes/hooks grandes |
| 33 | Eliminar estilos inline no runtime |

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
| ABIERTO | Revisar endpoints Bearer-only y consolidarlos con `requireUser`/`createUserScopedClient`. | P2 | S | 4-8 h | `app/api/words/[id]/enrich/route.ts:14`. |

## Frontend

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Corregir `AuthPanel`: quitar import directo de `@/lib/supabase/client`. | P0 | S | 2-4 h | Roadmap Fase 0 #1. Flujo vía `lib/supabase/auth-actions.ts`. |
| ABIERTO | Dividir componentes/hooks grandes y quitar excepciones de tamaño. | P2 | L | 3-5 días | Roadmap #32. `useWords.ts` 511 líneas, `AuthPanel` 275. |
| PARCIAL | Reducir estado persistente en `localStorage` para flujos críticos. | P1 | M | 1-3 días | Roadmap #29. Inventario en `docs/architecture/offline-sync.md`; gap `pronunciation_mastered`. |
| ABIERTO | Eliminar estilos inline no runtime o documentar excepciones. | P3 | M | 1 día | Roadmap #33. `AuthPanel.tsx` aún tiene inline styles. |
| HECHO | Añadir pruebas de interacción y a11y para auth/recovery/reset. | P1 | M | 1-2 días | Roadmap #27. |

## Base de Datos

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| ABIERTO | Revertir o reemplazar la migración destructiva que borra usuarios. | P0 | S | 2-4 h | Archivo sigue en `supabase/migrations/20260623000000_...`. |
| PARCIAL | Eliminar email personal hardcodeado; bootstrap seguro de admin. | P0 | S | 2-4 h | `ADMIN_BOOTSTRAP_EMAIL` en `lib/users/admin.ts` hecho; SQL histórico sin limpiar. |
| HECHO | Regenerar tipos Supabase y eliminar casts `as any` por tablas faltantes. | P1 | M | 1 día | Roadmap #17. |
| ABIERTO | Revisar grants heredados a `anon` y default privileges. | P2 | M | 1-2 días | Roadmap #18. |
| HECHO | Añadir pruebas o checks de migraciones para RLS. | P1 | M | 1-2 días | Roadmap #15-16. `pnpm check:migrations`, `pnpm audit:rls`. |
| ABIERTO | Documentar migraciones históricas con policy insegura temporal. | P2 | M | 1 día | Roadmap #19. STT cache 20260611 → 20260621. |

## Infraestructura

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| PARCIAL | Arquitectura multi-instancia: rate limit, jobs, observabilidad. | P0/P1 | L | 3-5 días | Roadmap #21. `docs/architecture/multi-instance.md`; falta Log Drain. |
| HECHO | Health checks reales con readiness/liveness separados. | P2 | M | 1 día | Roadmap #24. `GET /api/health` y `?ready=1`. |
| HECHO | Estrategia de backups/restore y retención Supabase. | P0/P1 | M | 1-2 días | Roadmap #25. `docs/deployment/backups.md`. |
| ABIERTO | Revisar PWA/service worker con flujos auth/API. | P2 | M | 1-2 días | Serwist en `next.config.mjs`; superficies auth no documentadas. |
| HECHO | Documentar matriz de entornos. | P1 | S | 4-6 h | Roadmap #41. `docs/deployment/environments.md`. |

## Seguridad

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| ABIERTO | Bloquear producción hasta eliminar migración destructiva y hardcoded admin. | P0 | S | 2-4 h | SQL histórico sigue en repo. |
| HECHO | Aplicar CSRF/same-origin de forma consistente en POST autenticados. | P1 | M | 1 día | Roadmap #9. |
| HECHO | Sustituir mensajes de error internos por respuestas públicas genéricas. | P1 | S | 4-6 h | Roadmap #10. |
| ABIERTO | Ampliar escaneo de secretos en CI y precommit local. | P2 | S | 4 h | Roadmap #13. CI solo cubre 3 carpetas. |
| HECHO | Verificar headers globales y CSP. | P2 | M | 1 día | Roadmap #14. `next.config.mjs`. |
| HECHO | Revisar PII/audio/transcripts en logs y caches. | P1 | M | 1-2 días | Roadmap #42. `redactError()` en `lib/api/guards.ts`. |

## Testing

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Restaurar suite verde. | P0 | S | 2-6 h | 915 tests pasan (2026-07-03). |
| HECHO | Añadir tests de guard para cada POST sensible. | P1 | M | 1-2 días | Roadmap #12. |
| HECHO | Añadir cobertura de migraciones/RLS. | P1 | L | 2-4 días | Roadmap #15-16. |
| HECHO | Separar tests unitarios, integración y smoke/e2e. | P2 | M | 1 día | Roadmap #34. `pnpm test:integration`. |
| HECHO | Medir cobertura y fijar umbrales por rutas críticas. | P2 | M | 1-2 días | Roadmap #35. `docs/architecture/testing-strategy.md`. |

## CI/CD

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Mantener CI bloqueante y resolver el rojo actual. | P0 | S | 2-6 h | lint, type-check, test:coverage, build en CI. |
| HECHO | Añadir `pnpm build` en CI con variables mock y smoke post-build. | P1 | M | 1 día | Roadmap #43. |
| ABIERTO | Añadir `validate:core1000` y `validate:core1000-generators` como checks obligatorios. | P2 | S | 4 h | Scripts existen; CI solo ejecuta design tokens. |
| HECHO | Checks para migraciones peligrosas. | P1 | M | 1 día | Roadmap #15. `pnpm check:migrations`. |
| HECHO | Publicar artefactos de test/coverage en CI. | P3 | S | 4 h | Roadmap #36. Artefacto `coverage/` 14 días. |

## UX

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Endurecer auth/reset/recovery. | P1 | M | 1-2 días | Roadmap #26. |
| HECHO | Diseñar degradación clara para Supabase/Gemini no disponibles. | P1 | M | 1-2 días | Roadmap #28. |
| PARCIAL | Revisar persistencia offline real vs. promesa de producto. | P1 | L | 2-4 días | Roadmap #29. Inventario hecho; gap pronunciation pendiente. |
| HECHO | Añadir estados de retry/cola visibles para enriquecimiento. | P1 | M | 1-2 días | Roadmap #30. |
| ABIERTO | Auditar accesibilidad real con Playwright/axe. | P2 | M | 1-2 días | Roadmap #31. CI solo hace grep ARIA. |

## Documentación

| Estado | Tarea | Prioridad | Dificultad | Tiempo | Evidencia / notas |
|---|---|---:|---:|---:|---|
| HECHO | Actualizar README con prerequisitos, verificación y estado de producción. | P1 | S | 4-6 h | Roadmap #38. |
| HECHO | Crear runbook de producción. | P0 | M | 1-2 días | Roadmap Fase 0 #5. `docs/deployment/runbook-minimo.md`. |
| HECHO | Documentar threat model. | P1 | M | 1 día | Roadmap #39. |
| HECHO | Documentar arquitectura offline/sync. | P1 | M | 1 día | Roadmap #40. `docs/architecture/offline-sync.md`. |
| HECHO | Mantener `plans/README.md` reconciliado con este TODO. | P2 | S | 4 h | Roadmap #37. Actualizado 2026-07-03. |

## Puntuación (actualizada 2026-07-03)

| Área | Nota | Justificación | Qué falta para 10/10 |
|---|---:|---|---|
| Arquitectura | 8/10 | Query layer, RLS, jobs durables, rate limit distribuido y Gemini unificado. Módulos grandes y gap offline pronunciation. | Dividir hooks grandes, migrar pronunciation a Dexie. |
| Calidad del código | 7/10 | Type-check verde, 915 tests, helper Gemini compartido. Componentes >250 líneas y algunos `any` por RPC nuevos. | Lint estable, dividir `useWords`, regenerar tipos post-migración cron. |
| Seguridad | 7/10 | CSRF universal, CSP, `redactError`, rate limit RPC. Migración destructiva histórica en repo y escaneo secretos limitado. | Eliminar SQL destructivo, ampliar secret scan, grants anon. |
| Rendimiento | 7/10 | Timeouts Gemini uniformes, caching por capa, jobs async. Sin métricas reales ni bundle CI. | Métricas, budgets, bundle analysis. |
| Escalabilidad | 7/10 | Rate limit multi-instancia, cola durable, worker cron. Falta Log Drain y backpressure Gemini global. | Observabilidad operativa, semáforo Gemini, pruebas de carga. |
| Testing | 8/10 | Suite verde, coverage con umbrales, guards testeados, integration config. Sin e2e Playwright ni umbrales per-file en CI. | Playwright/axe, subir umbrales per-archivo crítico. |
| Documentación | 9/10 | Runbook, threat model, offline/sync, entornos, backups, multi-instance, testing strategy. | Documentar migraciones históricas STT (#19). |
| Preparación para producción | 6/10 | CI verde, seguridad API cerrada, backups documentados. Migración destructiva en árbol y Log Drain sin configurar. | Neutralizar SQL P0, Log Drain, grants anon, a11y real. |

## Orden Recomendado

1. **P0 restante:** neutralizar migración destructiva `20260623000000` (revertir o reemplazar).
2. **P2 rápidas:** tareas 13, 19, 33 (secretos CI, docs migraciones, estilos inline).
3. **P2 media:** tareas 18, 31 (grants anon, Playwright/axe).
4. **P2 grande:** tarea 32 (dividir `useWords` y componentes grandes).
5. **Operativo:** configurar Log Drain en Vercel (cierra tarea 21).
6. **Deuda offline:** migrar `pronunciation_mastered` de localStorage a Dexie.
