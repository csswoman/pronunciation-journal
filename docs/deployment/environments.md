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

## Reglas de Despliegue

- Ejecutar `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, `pnpm check:migrations` y `pnpm audit:rls`.
- Revisar manualmente cualquier SQL que cree tablas, policies, funciones security definer o jobs.
- No aplicar migraciones destructivas en preview/staging sin datos descartables o backup.
- Confirmar que el worker/schedule de `processWordEnrichmentJobs()` existe antes de depender de enriquecimiento async.
- Confirmar backups y restore practicable antes de cambios de schema en producción.
