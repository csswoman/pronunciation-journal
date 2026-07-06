# Backups, Restore y Retencion

Fecha: 2026-07-02

## Objetivo

Poder recuperar datos de usuarios ante migracion fallida, borrado accidental,
corrupcion logica o incidente de seguridad sin depender de memoria operativa.

## Alcance

- Supabase Postgres: tablas publicas, RLS, funciones, triggers y policies.
- Supabase Auth: usuarios y metadatos segun capacidades del plan/proveedor.
- Storage: audio (`audio/{user_id}/*.ogg`), imagenes y otros objetos de usuario.
- Jobs: `word_enrichment_jobs` y caches que afecten UX o costes.

## Politica

| Entorno | Frecuencia | Retencion | Restore esperado |
|---|---:|---:|---:|
| Production | Diario como minimo | 30 dias | Restore probado trimestralmente |
| Staging | Antes de migraciones grandes | 7-14 dias | Restore bajo demanda |
| Preview/local | No garantizado | N/A | Datos descartables |

## Metodos de Backup por Capa

### Postgres (base de datos)

Supabase Pro y superiores ofrecen Point-in-Time Recovery (PITR) con retencion
configurable. En el plan Free, los backups son diarios con 7 dias de retencion.

Para exportar el schema actual (sin datos):

```bash
# Requiere Supabase CLI instalado y proyecto vinculado
supabase db dump --schema public > backups/schema-$(date +%Y%m%d).sql
```

Para exportar datos criticos antes de una migracion destructiva:

```bash
# Volcar tablas criticas de usuarios (requiere acceso directo a la DB)
pg_dump "$DATABASE_URL" \
  --table=user_profiles \
  --table=word_bank \
  --table=answer_history \
  --table=activity_sessions \
  --table=topic_srs \
  --table=decks \
  --table=deck_words \
  --data-only \
  --no-owner \
  > backups/data-$(date +%Y%m%d-%H%M%S).sql
```

### Storage (audio y otros objetos)

El storage de Supabase no tiene PITR nativo. Estrategia recomendada:

- Configurar replicacion a un bucket S3/GCS externo con regla de ciclo de vida
  de 30 dias via Supabase Storage Webhooks o un job periodico.
- Los objetos de audio siguen el patron `audio/{user_id}/{uuid}.ogg` y son
  inmutables una vez escritos (no se sobreescriben, se crean nuevos).
- TTS no se guarda (regla de arquitectura), por lo que no es necesario backupear.

### Verificacion de Backup

Ejecutar trimestralmente en staging:

```bash
# 1. Restaurar snapshot reciente en staging
supabase db reset --linked  # aplica todas las migraciones sobre staging

# 2. Importar dump de datos de produccion anonimizado
psql "$STAGING_DATABASE_URL" < backups/data-YYYYMMDD.sql

# 3. Ejecutar checks de integridad
pnpm type-check
pnpm test
pnpm audit:rls
```

## Antes de Migraciones

1. Confirmar backup reciente y punto de restauracion disponible en PITR.
2. Exportar schema relevante si la migracion toca RLS, funciones o triggers.
3. Ejecutar `pnpm check:migrations` y `pnpm audit:rls` — deben pasar.
4. Revisar manualmente SQL destructivo o irreversible antes de aplicar.
5. Definir rollback SQL explicito cuando la migracion cambie datos existentes.
6. Nunca ejecutar migraciones con `DELETE FROM auth.users` en produccion sin
   respaldo verificado y aprobacion explicita.

## Restore

1. Declarar incidente y pausar despliegues nuevos.
2. Identificar timestamp sano, commit y migracion sospechosa.
3. Restaurar en staging primero si el incidente no exige recuperacion inmediata.
4. Validar auth, perfiles, word bank, progreso, storage y jobs en staging.
5. Restaurar production usando PITR al punto anterior al incidente, o aplicar
   reparacion puntual validada si el volumen de cambio es acotado.
6. Registrar en el runbook: impacto estimado, tiempo de recuperacion y acciones
   preventivas para evitar repeticion.

## Validacion Post-Restore

- [ ] Login y recovery funcionan con usuarios de prueba.
- [ ] `user_profiles`, `word_bank`, `answer_history`, `activity_sessions` y
      `topic_srs` tienen conteos dentro del rango esperado (documentar baseline).
- [ ] RLS bloquea acceso cross-user (ejecutar `pnpm audit:rls`).
- [ ] Storage devuelve objetos de audio esperados para usuarios de prueba.
- [ ] Jobs pendientes en `word_enrichment_jobs` pueden reintentarse o cancelarse
      sin duplicar efectos.
- [ ] `pnpm test` pasa en verde.

## Tablas Criticas por Prioridad de Restore

| Prioridad | Tabla | Motivo |
|---|---|---|
| 1 | `auth.users` (gestionada por Supabase) | Sin ella no hay acceso |
| 1 | `user_profiles` | Configuracion de usuario |
| 2 | `word_bank` | Vocabulario acumulado del usuario |
| 2 | `decks` + `deck_words` | Mazos de practica |
| 2 | `answer_history` | Historial de SRS |
| 3 | `activity_sessions` | Metricas y streaks |
| 3 | `topic_srs` | Progreso por topico |
| 4 | `stt_transcription_cache` | Cache reconstruible |
| 4 | `rate_limits` | Reconstruible automaticamente |
| 4 | `word_enrichment_jobs` | Reintentables si se pierden |
