# Matriz de Entornos

Fecha: 2026-07-01

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

## Variables Operativas

- `ADMIN_BOOTSTRAP_EMAIL`: temporal para bootstrap admin; retirar después de uso si no es permanente.
- `GEMINI_ENABLE_PREVIEW_MODELS`: solo para pruebas controladas de fallback.
- `SUPABASE_SERVICE_ROLE_KEY`: requerido para rate limit distribuido, workers server-side y operaciones administrativas. Nunca exponer al cliente.
- `CRON_SECRET`: secreto compartido para autenticar llamadas desde Vercel Cron al endpoint `/api/jobs/drain-enrichment`. Vercel lo inyecta automáticamente como `Authorization: Bearer <secret>`. Requerido en producción; omitir en local permite ejecutar el endpoint libremente.

## Reglas de Despliegue

- Ejecutar `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm check:migrations` y `pnpm audit:rls`.
- Revisar manualmente cualquier SQL que cree tablas, policies, funciones security definer o jobs.
- No aplicar migraciones destructivas en preview/staging sin datos descartables o backup.
- Confirmar que el Vercel Cron (`vercel.json`) apunta a `/api/jobs/drain-enrichment` y que `CRON_SECRET` está configurado en el proyecto antes de depender de enriquecimiento async.
- En Vercel Free, configurar `PRODUCTION_HEALTH_URL` en GitHub Actions y activar notificaciones de workflow fallido. En Vercel Pro, agregar Log Drain si se requiere retencion centralizada de logs.
- El worker de enriquecimiento usa `claim_enrichment_jobs` RPC con SELECT FOR UPDATE SKIP LOCKED; emite logs de jobs procesados, fallidos y reencolados. Backoff exponencial: 2 min → 8 min → 30 min → 2 h.
- Las rutas Gemini deben degradar con mensajes publicos. Si Gemini no esta disponible, validar que UI muestre estados de retry/error sin revelar detalles del proveedor.
- Confirmar que `syncOutbox` se drena en flujos principales: sesiones de practica, reader, daily checklist, phoneme/AI progress y Essential Words activity.
- Confirmar backups y restore practicable antes de cambios de schema en producción.
