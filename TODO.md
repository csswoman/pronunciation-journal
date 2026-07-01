# TODO de Producción

Auditoría crítica realizada contra el commit `11dee70` el 2026-06-30. Supuesto de evaluación: el proyecto debe soportar miles de usuarios, no solo uso personal.

Convenciones:

- Prioridad: `P0` bloquea producción, `P1` alto riesgo, `P2` importante, `P3` mejora.
- Dificultad: `S` horas, `M` 1-2 días, `L` varios días.
- Tiempo estimado: rango realista incluyendo pruebas y revisión.

## Estado General

La base técnica es prometedora: Next.js 16, TypeScript estricto, RLS en Supabase, Vitest amplio, reglas ESLint arquitectónicas y documentación interna. Aun así, hoy no está lista para miles de usuarios. Las señales bloqueantes son una suite no verde, una violación arquitectónica que rompe `pnpm lint`, un rate limiter en memoria, rutas POST con protección CSRF inconsistente, trabajo crítico en `void` dentro de rutas serverless y una migración reciente con borrado masivo de usuarios no aceptable para producción.

Verificación ejecutada:

- `pnpm type-check`: pasa.
- `pnpm lint`: falla en `components/auth/AuthPanel.tsx:22` por import directo de `@/lib/supabase/client`.
- `pnpm test`: falla 3/878 tests (`lib/home/__tests__/sounds-due-semantics.test.ts:24`, `app/api/gemini/transcribe/__tests__/route.test.ts:56`, `app/api/gemini/transcribe/__tests__/route.test.ts:69`).
- `pnpm audit --prod`: sin vulnerabilidades conocidas.
- `pnpm outdated --format table`: desfases menores; `eslint` tiene major disponible pero no es prioridad inmediata.

## Backend

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Estandarizar todos los endpoints POST con `requireSameOrigin(request)` cuando acepten cookies de sesión; mantener exención solo para Bearer token. | P1 | M | 1 día | `lib/api/guards.ts:116`, aplicado en `app/api/gemini/transcribe/route.ts:198`, omitido en `app/api/gemini/deck-suggest/route.ts:127`, `app/api/gemini/interview/route.ts:53`, `app/api/gemini/phrases/route.ts:34`, `app/api/gemini/transcribe-sentence/route.ts:100`, `app/api/gemini/generate-reader/route.ts:88`. |
| Sustituir el rate limiter en memoria por Redis/Upstash/Supabase RPC atomico con límites por usuario, endpoint e IP. | P1 | M | 1-2 días | `lib/api/guards.ts:160`, `lib/api/guards.ts:185` dice explícitamente que no sirve para multi-instancia. |
| Dejar de devolver `err.message` del proveedor/DB al cliente; mapear errores a códigos públicos y loguear detalles solo en servidor. | P1 | S | 4-6 h | `app/api/gemini/transcribe/route.ts:247`, `app/api/gemini/generate-reader/route.ts:109`, `app/api/gemini/deck-suggest/route.ts:196`, `app/api/words/route.ts:61`, `app/api/words/route.ts:85`. |
| Sacar enriquecimiento y cache writes de `void` en rutas serverless; usar cola durable o tabla de jobs con retry/idempotencia. | P1 | L | 2-4 días | `app/api/words/route.ts:66`, `app/api/words/route.ts:104`, `app/api/words/[id]/enrich/route.ts:65`, `app/api/gemini/transcribe/route.ts:242`, `lib/word-bank/enrich.ts:42`. |
| Unificar infraestructura Gemini: fallback, timeout, parseo JSON, errores y límites en un helper común. | P2 | M | 1-2 días | Lógica repetida en `app/api/gemini/deck-suggest/route.ts`, `app/api/gemini/generate-reader/route.ts`, `app/api/gemini/interview/route.ts`, `app/api/gemini/phrases/route.ts`, `app/api/gemini/transcribe-sentence/route.ts`. |
| Definir timeouts explícitos para todas las llamadas Gemini, no solo streaming/audio parcial. | P2 | M | 1 día | `app/api/gemini/route.ts:305` usa timeout; rutas como `app/api/gemini/deck-suggest/route.ts:104` y `app/api/gemini/interview/route.ts:38` no muestran abort/timeout. |
| Revisar endpoints Bearer-only y consolidarlos con `requireUser`/`createUserScopedClient` para evitar auth ad hoc. | P2 | S | 4-8 h | `app/api/words/[id]/enrich/route.ts:14` reimplementa auth con `createClient` en vez de usar `lib/api/guards.ts`. |

## Frontend

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Corregir `AuthPanel`: mover `updateUser({ password })` al query/auth layer o reutilizar `lib/users/queries.ts:updatePassword`. | P0 | S | 2-4 h | `components/auth/AuthPanel.tsx:22`, `components/auth/AuthPanel.tsx:81`; `pnpm lint` falla. |
| Dividir componentes/hooks grandes y quitar excepciones de tamaño que ya son deuda activa. | P2 | L | 3-5 días | `hooks/useWords.ts` 511 líneas, `components/auth/AuthPanel.tsx` 275, `components/exercises/MatchPairsExercise.tsx` 275, `lib/phoneme-practice/exercises.ts` 570; regla en `CLAUDE.md` limita componentes a 250. |
| Reducir estado persistente en `localStorage/sessionStorage` para flujos críticos; mover progreso a Dexie/Supabase/outbox donde aplique. | P1 | M | 1-3 días | Regla en `CLAUDE.md`: persistente -> Dexie o Supabase. Usos en `lib/daily/plan-storage.ts:24`, `components/daily/DailyChecklist.tsx:26`, `lib/ai-coach/pronunciation.ts:34`, `lib/ai-practice/load-state.ts:14`. |
| Eliminar estilos inline no runtime o documentar excepciones reales; reforzar lint si se quiere cumplir la regla. | P3 | M | 1 día | `components/auth/AuthPanel.tsx:168`, `components/auth/AuthPanel.tsx:184`, `components/auth/AuthPanel.tsx:188`; regla en `CLAUDE.md` prohíbe inline style salvo runtime. |
| Añadir pruebas de interacción y a11y para auth/recovery/reset, porque son flujos de entrada críticos. | P1 | M | 1-2 días | Cambios no confirmados en `components/auth/RecoveryForm.tsx`, `components/auth/ResetPasswordForm.tsx`, `components/auth/AuthPanel.tsx`; suite actual falla. |

## Base de Datos

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Revertir o reemplazar la migración destructiva que borra usuarios no asociados a un correo personal; nunca debe existir en un pipeline de producción. | P0 | S | 2-4 h | `supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql:11`, `:13-18`, `:20-25`. |
| Eliminar email personal hardcodeado y crear mecanismo seguro para bootstrap de admin por variable/seed controlado/manual. | P0 | S | 2-4 h | `supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql:11`, `:17`. |
| Regenerar tipos Supabase y eliminar casts `as any` causados por tablas faltantes en tipos. | P1 | M | 1 día | `lib/practice/topic-srs-queries.ts:18`, `lib/review/server-queries.ts:89`, `lib/review/srs-history-queries.ts:178`; tabla existe en `supabase/migrations/20260618120000_topic_srs.sql:1`. |
| Revisar grants heredados a `anon` y default privileges; RLS ayuda, pero los privilegios amplios aumentan blast radius si una policy futura se equivoca. | P2 | M | 1-2 días | `supabase/migrations/20260329230234_remote_schema.sql:1121`, `:1166`, `:1172`, `:1313`. |
| Añadir pruebas o checks de migraciones para RLS: cada tabla nueva debe tener RLS, policies esperadas e índices para queries críticas. | P1 | M | 1-2 días | Muchas migraciones manuales; regla en `CLAUDE.md` exige RLS antes de merge, pero no hay gate dedicado visible. |
| Consolidar o documentar migraciones históricas que introducen policy insegura y luego la corrigen, para evitar despliegues parciales peligrosos. | P2 | M | 1 día | `supabase/migrations/20260611120000_fix_stt_cache_rls.sql:15-43` abre cache STT global; `supabase/migrations/20260621140000_stt_cache_scope_per_user.sql:1-61` corrige privacidad. |

## Infraestructura

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Definir arquitectura de producción para multi-instancia: rate limiting distribuido, jobs durables, observabilidad y variables por entorno. | P0 | L | 3-5 días | `lib/api/guards.ts:185`, `void enrichWord` en rutas, README solo cubre quick start. |
| Añadir health checks reales para Supabase/Gemini opcionales y readiness separado de liveness. | P2 | M | 1 día | Existe `app/api/health/route.ts`, pero la auditoría de rutas muestra dependencias externas críticas en Gemini/Supabase. |
| Crear estrategia de backups/restore y retención para Supabase antes de permitir usuarios reales. | P0 | M | 1-2 días | Migración destructiva actual demuestra riesgo operacional: `supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql:13-25`. |
| Revisar PWA/service worker con flujos auth/API para evitar cache accidental de datos privados. | P2 | M | 1-2 días | `next.config.mjs` configura Serwist y excluye algunas rutas, pero no todas las superficies autenticadas están explicitamente documentadas. |
| Documentar matriz de entornos: local, preview, staging, production, secrets requeridos y migraciones permitidas. | P1 | S | 4-6 h | README tiene variables, pero no política de despliegue o staging. |

## Seguridad

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Bloquear producción hasta eliminar migración destructiva y hardcoded admin personal. | P0 | S | 2-4 h | `supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql:7-25`. |
| Aplicar CSRF/same-origin de forma consistente en POST autenticados por cookie. | P1 | M | 1 día | `lib/api/guards.ts:120`; omisiones listadas en Backend. |
| Sustituir mensajes de error internos por respuestas públicas genéricas. | P1 | S | 4-6 h | `app/api/gemini/transcribe/route.ts:247-249`, `app/api/words/route.ts:83-86`. |
| Añadir escaneo de secretos más amplio y local-precommit; el grep de CI solo cubre `components/ app/ lib/`. | P2 | S | 4 h | `.github/workflows/ci.yml` security-audit busca secretos solo en tres carpetas. |
| Verificar headers globales y CSP. `SECURE_HEADERS` existe para APIs, pero no hay evidencia de CSP para páginas. | P2 | M | 1 día | `lib/api/guards.ts:12`; `next.config.mjs` no define headers globales. |
| Revisar PII/audio/transcripts en logs y caches; la app procesa voz y texto sensible. | P1 | M | 1-2 días | `app/api/gemini/transcribe/route.ts:248`, `supabase/migrations/20260621140000_stt_cache_scope_per_user.sql:1-5`. |

## Testing

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Restaurar suite verde: corregir mocks colgantes en home/transcribe y el segundo `requireUser` indefinido. | P0 | S | 2-6 h | Fallos en `lib/home/__tests__/sounds-due-semantics.test.ts:24`, `app/api/gemini/transcribe/__tests__/route.test.ts:56`, `:69`; salida de `pnpm test`. |
| Añadir tests de guard obligatorio para cada POST sensible: auth, same-origin, rate limit y validación. | P1 | M | 1-2 días | Rutas inconsistentes en `app/api/gemini/*/route.ts`. |
| Añadir cobertura de migraciones/RLS con Supabase local o tests SQL mínimos. | P1 | L | 2-4 días | RLS depende de disciplina manual; migración destructiva pasó al árbol. |
| Separar tests unitarios, integración y smoke e2e; el config excluye integration por defecto pero no hay comando CI visible para integration. | P2 | M | 1 día | `vitest.config.ts` excluye `**/*.integration.test.*`; `package.json` no tiene script integration. |
| Medir cobertura y fijar umbrales por rutas críticas, no por porcentaje global. | P2 | M | 1-2 días | `@vitest/coverage-v8` instalado, pero `package.json` no define `test:coverage`. |

## CI/CD

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Mantener CI bloqueante y resolver el rojo actual antes de mergear cualquier feature. | P0 | S | 2-6 h | `.github/workflows/ci.yml` ejecuta `pnpm lint`, `pnpm type-check`, `pnpm test`; localmente lint/test fallan. |
| Añadir `pnpm build` local/CI con variables mock seguras y smoke post-build. | P1 | M | 1 día | `package.json` tiene `build`; CI lo ejecuta con Supabase secrets pero no con `GEMINI_API_KEY`. |
| Añadir job de `pnpm lint:design-tokens`, `validate:core1000`, `validate:core1000-generators` como checks nombrados y obligatorios. | P2 | S | 4 h | Scripts existen en `package.json`; CI solo ejecuta design tokens en lint-and-test. |
| Añadir checks para migraciones peligrosas: `DELETE FROM auth/users`, emails hardcodeados, `DROP POLICY` sin reemplazo, grants amplios nuevos. | P1 | M | 1 día | Migración `20260623000000...` incluye deletes masivos y correo personal. |
| Publicar artefactos de test/coverage y reportar fallos con trazas completas. | P3 | S | 4 h | CI actual no sube resultados de Vitest/cobertura. |

## UX

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Endurecer auth/reset/recovery: estados de expiración, sesión inválida, password policy visible y mensajes no filtradores. | P1 | M | 1-2 días | `components/auth/AuthPanel.tsx:72-94`, `components/auth/AuthFeedback.tsx:18-29`. |
| Diseñar degradación clara cuando Gemini/Supabase no estén disponibles. | P1 | M | 1-2 días | README admite que sin credenciales algunos flujos no funcionan; rutas devuelven 503 genérico. |
| Revisar persistencia offline real vs. promesa de producto; flujos en `localStorage` y online-only deben comunicarse y sincronizarse. | P1 | L | 2-4 días | README promete PWA/offline; `CLAUDE.md` marca `/practice/sounds` como online-only temporal. |
| Añadir estados de retry/cola para enriquecimiento de palabras y transcripción en vez de depender de procesos background invisibles. | P1 | M | 1-2 días | `void enrichWord` y `void setL2Cache` pueden fallar después de responder OK. |
| Auditar accesibilidad real con Playwright/axe en flujos críticos, no solo grep de ARIA. | P2 | M | 1-2 días | `.github/workflows/ci.yml` hace grep en `components/ui`, no prueba páginas. |

## Documentación

| Tarea | Prioridad | Dificultad | Tiempo | Evidencia |
|---|---:|---:|---:|---|
| Actualizar README con prerequisitos reales, comandos de verificación, variables por entorno, limitaciones offline y estado de producción. | P1 | S | 4-6 h | README es bueno para quick start, no para operar miles de usuarios. |
| Crear runbook de producción: deploy, rollback, migraciones, backups, rotación de claves, incidentes y costos Gemini. | P0 | M | 1-2 días | No hay runbook operacional; migración destructiva demuestra necesidad. |
| Documentar threat model: auth, CSRF, RLS, audio/transcripts, service role, cache STT, logs. | P1 | M | 1 día | Hay reglas dispersas en `CLAUDE.md`, pero no modelo de amenazas. |
| Documentar arquitectura offline/sync: qué vive en Dexie, Supabase, Zustand, localStorage y qué se reconcilia. | P1 | M | 1 día | Reglas en `CLAUDE.md`, implementaciones dispersas en `lib/db`, `lib/sync`, `lib/daily/plan-storage.ts`. |
| Mantener `plans/README.md` reconciliado con este TODO o convertir planes pendientes en issues. | P2 | S | 4 h | `plans/README.md` contiene tareas TODO/IN PROGRESS históricas, algunas solapadas. |

## Puntuación

| Área | Nota | Justificación | Qué falta para 10/10 |
|---|---:|---|---|
| Arquitectura | 6/10 | Hay separación por dominios, query layer, App Router, RLS y documentos de estándares. Pero las reglas se rompen en auth, hay módulos grandes, jobs en rutas HTTP y rate limit no distribuido. | Boundaries enforced sin excepciones accidentales, colas durables, rate limiting distribuido, módulos menores, arquitectura offline documentada y probada. |
| Calidad del código | 6/10 | TypeScript estricto pasa y hay guardrails, pero `lint` falla, hay `any` por tipos Supabase desactualizados y componentes/hooks demasiado grandes. | Lint verde, cero `any` no justificado por tipos generados, tamaño controlado, helpers compartidos para Gemini/API y deuda histórica cerrada. |
| Seguridad | 5/10 | RLS existe y audit no reporta CVEs, pero hay migración destructiva, CSRF inconsistente, errores internos expuestos y rate limiting in-memory. | Migraciones seguras, same-origin/CSRF universal, CSP/headers globales, secrets scanning completo, logging sin PII, pruebas RLS y rate limit distribuido. |
| Rendimiento | 6/10 | Hay esfuerzos previos de caching/proyecciones y tests de datos, pero varios endpoints AI no tienen timeout uniforme, background work no es durable y hay queries secuenciales en server components. | Métricas reales, budgets, caching por capa, jobs async, timeouts uniformes, bundle analysis CI y optimización basada en trazas. |
| Escalabilidad | 4/10 | El comentario del propio rate limiter dice que no sirve multi-instancia. `void` en serverless y dependencia directa de Gemini por request no aguantan picos ni retries. | Redis/cola durable, idempotencia, backpressure, límites por plan, retries controlados, observabilidad y pruebas de carga. |
| Testing | 6/10 | 136 archivos de test y 875 pruebas pasan, buena señal. Pero la suite está roja y faltan gates de migraciones/RLS/e2e críticos. | Suite 100% verde, coverage en rutas críticas, integration tests en CI, tests de RLS, e2e smoke auth/practice/offline. |
| Documentación | 7/10 | README, CLAUDE, ENGINEERING_STANDARDS y plans son mejores que la media. Falta documentación operacional y threat model. | Runbooks, arquitectura offline/sync, threat model, matriz de entornos, política de migraciones y troubleshooting. |
| Preparación para producción | 3/10 | No puede ir a producción con lint/test fallando, migración destructiva, rate limiter in-memory y jobs no durables. | CI verde bloqueante, migraciones saneadas, backups, staging, observabilidad, colas, rate limiting distribuido, seguridad validada y runbooks. |

## Orden Recomendado

1. P0: quitar la migración destructiva/hardcoded admin y restaurar CI verde (`lint` + `test`).
2. P1: cerrar CSRF/same-origin, errores públicos, rate limit distribuido y jobs durables.
3. P1: añadir pruebas de API/RLS/migraciones para impedir regresiones.
4. P1/P2: ordenar frontend persistente/offline y módulos grandes.
5. P2/P3: performance, documentación extendida, a11y real y mantenimiento de dependencias.
