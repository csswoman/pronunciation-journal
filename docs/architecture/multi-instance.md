# Arquitectura Multi-Instancia

Fecha: 2026-07-02

## Contexto

English Journal corre en Vercel como funcion serverless Next.js. Cada instancia
es efimera y stateless: no comparte memoria con otras instancias. Esto afecta
directamente tres areas: rate limiting, jobs en background y observabilidad.

## Componentes con Dependencias de Estado

### Rate Limiting

**Problema original**: `rateLimitStore` era un `Map` en memoria, lo que
significaba que cada instancia contaba por separado, permitiendo N veces el
limite configurado con N instancias.

**Solucion implementada**: `lib/api/guards.ts` llama al RPC `consume_rate_limit`
en Supabase Postgres, que realiza un upsert atomico con ventana fija. Si las
credenciales no estan disponibles (dev/test local), cae al Map in-memory como
fallback controlado.

**Estado**: resuelto. Ver `supabase/migrations/20260701000000_rate_limits.sql`.

### Jobs en Background (word enrichment y STT cache)

**Problema original**: `void enrichWord(...)` y `void setL2Cache(...)` dentro
de handlers HTTP serverless. Al terminar el handler, el runtime puede apagar la
instancia antes de que el job complete, perdiendo trabajo silenciosamente.

**Solucion implementada**: `word_enrichment_jobs` en Supabase actua como cola
durable. El handler HTTP encola el job y responde; un worker externo drena la
cola con retry e idempotencia.

**Solucion implementada**: GitHub Actions invoca el worker cada dos horas. Se
usa un scheduler externo porque Vercel Hobby solo permite cron una vez al dia.

- Endpoint: `app/api/jobs/drain-enrichment/route.ts`
- RPC atomico: `claim_enrichment_jobs` (SELECT FOR UPDATE SKIP LOCKED, migration 20260702000000)
- Batch de 3 jobs por invocacion; backoff exponencial (2 min → 8 min → 30 min → 2 h)
- Autenticado con `CRON_SECRET` via `Authorization: Bearer`
- Configurado en `.github/workflows/drain-enrichment.yml` con schedule `*/15 * * * *`

**Requerimiento de deploy**: configurar el mismo `CRON_SECRET` en Vercel y como
secret de GitHub Actions, y definir la variable de repositorio
`ENRICHMENT_DRAIN_URL` con la URL completa del endpoint de produccion.

### Observabilidad

**Problema**: sin instrumentacion, no hay visibilidad de errores en produccion
salvo los logs de Vercel.

**Opciones por costo/esfuerzo**:

1. **GitHub Actions health check** (compatible con Vercel Free): ejecuta
   `/api/health?ready=1` cada 30 minutos y falla el workflow si produccion no
   responde correctamente.

2. **Vercel Log Drains** (requiere Vercel Pro): reenviar logs a Axiom, Datadog
   o Logtail. Sin cambio de codigo. Captura `console.error` redactados.

3. **Sentry** (recomendado para errores estructurados): `@sentry/nextjs` captura
   excepciones con contexto de request. Costo: free tier hasta 5k eventos/mes.

4. **OpenTelemetry + Vercel** (futuro): si la app crece, OTEL permite migrar
   a cualquier backend sin cambiar instrumentacion.

**Accion minima aceptable para produccion en Vercel Free**: health check
programado desde GitHub Actions y revision manual de logs en Vercel durante
incidentes. El Log Drain queda como mejora recomendada al subir a Vercel Pro.
El procedimiento operativo esta en `docs/deployment/runbook-minimo.md`.

## Variables de Entorno por Instancia

Todas las variables son identicas entre instancias del mismo entorno. Ver
`docs/deployment/environments.md` para la matriz completa.

Las variables que afectan comportamiento multi-instancia:

| Variable | Efecto |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Requerida para `consume_rate_limit` RPC. Sin ella, rate limit cae a in-memory. |
| `GEMINI_API_KEY` | Requerida para todos los endpoints AI. Misma key en todas las instancias. |
| `CRON_SECRET` | Autentica las invocaciones externas del worker de enriquecimiento. |

## Limites por Plan de Usuario

El rate limiter actual tiene limites fijos por endpoint. No distingue entre
usuarios free y premium. Cuando se implemente planes:

1. Leer el tier del usuario en `user_profiles.tier` antes del rate limit check.
2. Pasar el limite como parametro a `rateLimit(key, { max: tierLimit })`.
3. El RPC `consume_rate_limit` acepta `p_max` dinamico, ya esta preparado.

## Backpressure y Limites de Gemini

Gemini tiene cuotas por proyecto (RPM/TPM). Con multiples usuarios simultaneos
en multiples instancias, es posible alcanzar la cuota del proyecto aunque cada
usuario este bajo su limite individual.

**Mitigaciones actuales**:
- Cache L1 (in-memory) y L2 (Supabase) en transcripcion evitan llamadas duplicadas.
- Fallback de modelos (`flash-lite → flash → latest`) reduce presion en el modelo principal.

**Pendiente**:
- Anadir header `Retry-After` en respuestas 429 de Gemini propagadas al cliente.
- Considerar un semaforo global (Supabase RPC) para limitar concurrencia total
  de llamadas Gemini si se acercan a cuotas.

## Checklist de Preparacion Multi-Instancia

- [x] Rate limiting atomico via Supabase RPC
- [x] Errores de proveedor no expuestos al cliente (`publicErrorResponse`)
- [x] PII sanitizado en logs (`redactError`)
- [x] Jobs encolados en tabla durable (`word_enrichment_jobs`)
- [x] Worker de drenaje: `app/api/jobs/drain-enrichment` + GitHub Actions cada 2 h
- [x] Health check programado compatible con Vercel Free (`production-health.yml`)
- [ ] Log Drain configurado hacia servicio de retencion (opcional, requiere Vercel Pro)
- [ ] Limites de Gemini monitoreados y alertados
- [x] Health check distingue liveness de readiness (Supabase/Gemini degradados)
