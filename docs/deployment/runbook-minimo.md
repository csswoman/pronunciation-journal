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

## Bootstrap de admin

1. Definir `ADMIN_BOOTSTRAP_EMAIL` solo para el despliegue o mantenimiento.
2. Ejecutar `bootstrapAdminRole()` desde un contexto server-only o una tarea operativa interna.
3. Verificar que el usuario objetivo ya existe en Auth.
4. Confirmar que `user_profiles.role` quedó en `admin`.
5. Eliminar `ADMIN_BOOTSTRAP_EMAIL` si el bootstrap era temporal.

## Rollback

1. Revertir el deploy.
2. Si hubo migracion, aplicar el rollback SQL correspondiente.
3. Restablecer backups si hubo perdida o corrupcion de datos.
4. Validar auth, perfiles y acceso publico.

## Incidentes

1. Si hay borrado o corrupcion activa, pausar cambios nuevos.
2. Identificar alcance: Auth, perfiles, RLS, cache o jobs.
3. Documentar timestamp, commit, migracion y usuarios afectados.
4. Resolver la causa raiz antes de reabrir despliegues normales.
