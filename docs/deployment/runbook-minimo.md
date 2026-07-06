# Runbook Minimo de Produccion

Este documento cubre el flujo minimo para operar despliegues sin bloquear la app al publico.

## Antes de desplegar

1. Verificar que `pnpm lint`, `pnpm type-check` y `pnpm test` pasan.
2. Revisar cualquier migracion SQL manualmente antes de aplicarla.
3. Confirmar que `SUPABASE_SERVICE_ROLE_KEY` y secretos de produccion no estan en el cliente.
4. Confirmar backups recientes y un punto de restauracion valido.

## Despliegue

1. Desplegar cambios de codigo primero.
2. Aplicar migraciones solo si el cambio las requiere y el SQL fue revisado.
3. Validar login, lectura de perfil y una ruta API critica.

## Observabilidad minima

En Vercel Free no hay Log Drains. La observabilidad minima aceptable para ese
plan es combinar health checks programados con revision manual de logs en el
dashboard de Vercel durante incidentes.

### Baseline en plan Free

1. En GitHub, abrir Settings -> Secrets and variables -> Actions -> Variables.
2. Crear la variable `PRODUCTION_HEALTH_URL` con el valor
   `https://TU_DOMINIO/api/health?ready=1`.
3. Ejecutar manualmente el workflow `Production Health Check`.
4. Confirmar que el workflow pasa.
5. En GitHub, configurar notificaciones para workflows fallidos.
6. Durante incidentes, revisar Vercel -> Project -> Logs filtrando por el rango
   horario del fallo.

El workflow programado corre cada 30 minutos en
`.github/workflows/production-health.yml`.

### Mejora en plan Pro

Si el proyecto sube a Vercel Pro, configurar un Log Drain en el dashboard hacia
un proveedor con retencion minima de 7 dias.

1. En Vercel, abrir Project Settings -> Log Drains.
2. Crear un drain para el entorno Production hacia Axiom, Datadog, Logtail u otro
   destino operativo del equipo.
3. Confirmar que el proveedor recibe logs de runtime, build y edge/serverless.
4. Ejecutar una ruta saludable (`/api/health?ready=1`) y verificar que aparece en
   el destino de logs.
5. Generar un error controlado en preview o staging, nunca en produccion con
   usuarios activos, y confirmar que `redactError()` evita PII o secretos.
6. Definir al menos una alerta para errores 5xx sostenidos o picos de errores de
   provider externo.

Estado actual: baseline Free cubierto por GitHub Actions; Log Drain queda como
mejora opcional de plan Pro.

## Bootstrap de admin

1. Definir `ADMIN_BOOTSTRAP_EMAIL` solo para el despliegue o mantenimiento.
2. Ejecutar `bootstrapAdminRole()` desde un contexto server-only o una tarea operativa interna.
3. Verificar que la cuenta objetivo existe en Auth.
4. Confirmar que `user_profiles.role` quedó en `admin`.
5. Eliminar `ADMIN_BOOTSTRAP_EMAIL` si el bootstrap era temporal.
6. No escribir correos personales ni IDs de cuentas en migraciones o documentación pública.

## Rollback

1. Revertir el deploy.
2. Si hubo migracion, aplicar el rollback SQL correspondiente.
3. Restablecer backups si hubo perdida o corrupcion de datos.
4. Validar auth, perfiles y acceso publico.

La estrategia detallada de backups, restore y retencion esta en
`docs/deployment/backups.md`.

## Incidentes

1. Si hay borrado o corrupcion activa, pausar cambios nuevos.
2. Identificar alcance: Auth, perfiles, RLS, cache o jobs.
3. Documentar timestamp, commit, migracion y usuarios afectados.
4. Resolver la causa raiz antes de reabrir despliegues normales.
