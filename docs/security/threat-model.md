# Threat Model

Fecha: 2026-07-01

## Activos Principales

- Cuentas Supabase Auth, sesiones y recovery links.
- `user_profiles`, progreso SRS, historial de respuestas, palabras guardadas y transcripciones.
- `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` y credenciales de despliegue.
- Audio de usuario, transcripciones, prompts y respuestas Gemini.
- Jobs durables como `word_enrichment_jobs` y caches de STT/deck suggestions.

## Controles Actuales

- Auth: rutas mutantes usan `requireUser()` o verificación Bearer equivalente.
- CSRF: POST/DELETE cookie-authenticated usan `requireSameOrigin()`; Bearer está exento porque no usa auth ambiental.
- Rate limit: rutas costosas usan `rateLimit()` con RPC Supabase atómico en producción.
- Errores públicos: rutas API devuelven mensajes normalizados con `publicErrorResponse()`.
- RLS: migraciones nuevas se bloquean con `pnpm audit:rls`; SQL peligroso se bloquea con `pnpm check:migrations`.
- Grants: `anon` no conserva grants heredados amplios sobre tablas, secuencias o funciones del schema `public`.
- Secretos: `pnpm scan:secrets` corre en CI y puede ejecutarse localmente antes de commit.
- Service role: uso server-only para admin bootstrap, rate limit RPC y trabajos de backend.
- Headers/CSP: definidos globalmente en `next.config.mjs`.

## Riesgos y Owners

| Riesgo | Control | Owner |
|---|---|---|
| CSRF en rutas con cookie | `requireSameOrigin()` y test `post-guards` | API |
| Abuso de Gemini/STT | `rateLimit()` distribuido, límites por endpoint | API/Infra |
| Fuga de errores internos | `publicErrorResponse()` y logs server-side | API |
| Lectura/escritura cross-user | RLS y clientes scoped por usuario | Data |
| Secretos en cliente o repo | `.env.example`, revisión y CI/precommit de secretos | Infra |
| Jobs perdidos en serverless | `word_enrichment_jobs` y runner server-side | Infra |
| Audio/transcripts sensibles en logs | No loggear payloads, solo IDs/errores resumidos | API |

## Reglas de Cambio

- Ninguna ruta mutante nueva se mergea sin auth, same-origin si usa cookies, rate limit si es costosa y validación de entrada.
- Ninguna tabla nueva se mergea sin RLS, policy explícita o deny-all justificado.
- Ningún uso nuevo de service role puede importarse en componentes cliente.
- Los incidentes se manejan con `docs/deployment/runbook-minimo.md`.
