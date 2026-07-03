# Migration Risk Register

Fecha: 2026-07-03

Este registro documenta migraciones historicas que tuvieron ventanas de seguridad
o privacidad inseguras, aunque el estado actual ya este corregido. Sirve para
auditorias, revisiones de incidentes y decisiones de restore.

## Ventanas Historicas

| Ventana | Migracion | Riesgo | Estado actual | Accion si hubo despliegue en produccion |
|---|---|---|---|---|
| 2026-06-11 a 2026-06-21 | `20260611120000_fix_stt_cache_rls.sql` | `stt_transcription_cache` permitia que cualquier usuario autenticado leyera, insertara, actualizara y borrara cualquier entrada del cache STT. El cache era compartido por hash de audio, por lo que transcript/audio-derived data podia cruzar cuentas. | Corregido por `20260621140000_stt_cache_scope_per_user.sql`: agrega `user_id`, borra entradas sin owner, cambia la PK a `(user_id, cache_key)` y restringe RLS a `auth.uid() = user_id`. | Confirmar que la migracion correctiva corrio, purgar caches derivados de STT anteriores al 2026-06-21 si existen backups/restores parciales, y revisar logs de acceso si el entorno guardaba queries o payloads. |

## Reglas Para Nuevas Migraciones

- No crear policies `using (true)` para tablas con datos de usuario salvo que la tabla sea publica por diseno y este documentado.
- No introducir caches compartidos de audio, transcripts, prompts o respuestas generadas sin una evaluacion explicita de privacidad.
- Toda migracion que relaje RLS debe incluir en el mismo PR la migracion que la vuelve a restringir, o una justificacion fechada en este registro.
- `pnpm audit:rls` y `pnpm check:migrations` deben pasar antes de mergear cambios de schema.
