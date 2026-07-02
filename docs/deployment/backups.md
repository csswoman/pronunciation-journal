# Backups, Restore y Retencion

Fecha: 2026-07-01

## Objetivo

Poder recuperar datos de usuarios ante migracion fallida, borrado accidental,
corrupcion logica o incidente de seguridad sin depender de memoria operativa.

## Alcance

- Supabase Postgres: tablas publicas, RLS, funciones, triggers y policies.
- Supabase Auth: usuarios y metadatos segun capacidades del plan/proveedor.
- Storage: audio, imagenes y otros objetos de usuario.
- Jobs: `word_enrichment_jobs` y caches que afecten UX o costes.

## Politica

| Entorno | Frecuencia | Retencion | Restore esperado |
|---|---:|---:|---:|
| Production | Diario como minimo | 30 dias | Restore probado trimestralmente |
| Staging | Antes de migraciones grandes | 7-14 dias | Restore bajo demanda |
| Preview/local | No garantizado | N/A | Datos descartables |

## Antes de Migraciones

1. Confirmar backup reciente y punto de restauracion.
2. Exportar schema relevante si la migracion toca RLS, funciones o triggers.
3. Ejecutar `pnpm check:migrations` y `pnpm audit:rls`.
4. Revisar manualmente SQL destructivo o irreversible.
5. Definir rollback SQL cuando la migracion cambie datos existentes.

## Restore

1. Declarar incidente y pausar despliegues.
2. Identificar timestamp sano, commit y migracion sospechosa.
3. Restaurar en staging primero si el incidente no exige recuperacion inmediata.
4. Validar auth, perfiles, word bank, progreso, storage y jobs.
5. Restaurar production o aplicar reparacion puntual validada.
6. Registrar impacto, tiempos y acciones preventivas.

## Validacion Post-Restore

- Login y recovery funcionan.
- `user_profiles`, `word_bank`, `answer_history`, `activity_sessions` y `topic_srs` tienen conteos esperados.
- RLS bloquea acceso cross-user.
- Storage devuelve objetos esperados.
- Jobs pendientes pueden reintentarse o cancelarse sin duplicar efectos.
