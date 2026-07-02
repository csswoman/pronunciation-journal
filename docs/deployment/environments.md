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

## Variables Operativas

- `ADMIN_BOOTSTRAP_EMAIL`: temporal para bootstrap admin; retirar después de uso si no es permanente.
- `GEMINI_ENABLE_PREVIEW_MODELS`: solo para pruebas controladas de fallback.
- `SUPABASE_SERVICE_ROLE_KEY`: requerido para rate limit distribuido, workers server-side y operaciones administrativas. Nunca exponer al cliente.

## Reglas de Despliegue

- Ejecutar `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm check:migrations` y `pnpm audit:rls`.
- Revisar manualmente cualquier SQL que cree tablas, policies, funciones security definer o jobs.
- No aplicar migraciones destructivas en preview/staging sin datos descartables o backup.
- Confirmar que el worker/schedule de `processWordEnrichmentJobs()` existe antes de depender de enriquecimiento async.
- El worker de enriquecimiento debe ejecutarse con `SUPABASE_SERVICE_ROLE_KEY`, llamar `processWordEnrichmentJobs(workerId)` en intervalos cortos y emitir logs/metricas de jobs procesados, fallidos y reencolados.
- Las rutas Gemini deben degradar con mensajes publicos. Si Gemini no esta disponible, validar que UI muestre estados de retry/error sin revelar detalles del proveedor.
- Confirmar que `syncOutbox` se drena en flujos principales: sesiones de practica, reader, daily checklist, phoneme/AI progress y Essential Words activity.
- Confirmar backups y restore practicable antes de cambios de schema en producción.
