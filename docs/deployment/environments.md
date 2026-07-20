# Matriz de Entornos

Fecha: 2026-07-17

| Entorno | Uso | Datos | Migraciones | Secretos |
|---|---|---|---|---|
| Local | Desarrollo | Proyecto Supabase local o sandbox | Permitidas si se revisa SQL | `.env.local`, nunca commit |
| Preview | Validación por rama/PR | Datos efímeros o staging aislado | Solo migraciones no destructivas revisadas | Variables del proveedor de deploy |
| Staging | Ensayo de release | Copia reducida/sanitizada | Mismo orden que producción | Secretos staging separados |
| Production | Usuarios reales | Supabase production | Manuales, revisadas y con rollback | Secretos production restringidos |

## Variables Requeridas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- GitHub repository variable `PRODUCTION_HEALTH_URL` for scheduled production
  readiness checks, usually `https://TU_DOMINIO/api/health?ready=1`.
- GitHub repository variable `ENRICHMENT_DRAIN_URL`, usually
  `https://TU_DOMINIO/api/jobs/drain-enrichment`.

## Variables Operativas

- `GEMINI_ENABLE_PREVIEW_MODELS`: solo para pruebas controladas de fallback.
- `SUPABASE_SERVICE_ROLE_KEY`: requerido para rate limit distribuido, workers server-side y operaciones administrativas. Nunca exponer al cliente.
- `CRON_SECRET`: secreto compartido para autenticar llamadas de GitHub Actions al endpoint `/api/jobs/drain-enrichment`. Debe tener el mismo valor en Vercel y en GitHub Actions Secrets. Requerido en producción; omitir en local permite ejecutar el endpoint libremente.

## Reglas de Despliegue

- Ejecutar `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm check:migrations` y `pnpm audit:rls`.
- Revisar manualmente cualquier SQL que cree tablas, policies, funciones security definer o jobs.
- No aplicar migraciones destructivas en preview/staging sin datos descartables o backup.
- Confirmar que el workflow `drain-enrichment.yml` tiene `ENRICHMENT_DRAIN_URL` y `CRON_SECRET` configurados antes de depender de enriquecimiento async.
- En Vercel Free, configurar `PRODUCTION_HEALTH_URL` en GitHub Actions y activar notificaciones de workflow fallido. En Vercel Pro, agregar Log Drain si se requiere retencion centralizada de logs.
- El worker de enriquecimiento usa `claim_enrichment_jobs` RPC con SELECT FOR UPDATE SKIP LOCKED; emite logs de jobs procesados, fallidos y reencolados. Backoff exponencial: 2 min → 8 min → 30 min → 2 h.
- Las rutas Gemini deben degradar con mensajes publicos. Si Gemini no esta disponible, validar que UI muestre estados de retry/error sin revelar detalles del proveedor.
- Confirmar que `syncOutbox` se drena en flujos principales: sesiones de practica, reader, daily checklist, phoneme/AI progress y Essential Words activity.
- Confirmar backups y restore practicable antes de cambios de schema en producción.

## Estado operativo verificado (2026-07-17)

- `ENRICHMENT_DRAIN_URL` está configurada como variable del repositorio en GitHub.
- `CRON_SECRET` sigue pendiente: este equipo no tiene una sesión/token de Vercel ni un proyecto `.vercel` enlazado. Debe configurarse primero en Vercel y luego copiarse, con el mismo valor, a GitHub Actions Secrets.
- El workflow de drenaje está en la rama local `dev`; podrá ejecutarse manualmente en GitHub cuando esos commits se publiquen.
- Supabase local no está disponible porque Docker Desktop/el daemon no está activo. No sustituirlo por el proyecto de producción para ejecutar `test:rls:integration`.
