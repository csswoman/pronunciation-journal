# Offline y Sync

Fecha: 2026-07-01

## Fuentes de Estado

| Estado | Persistencia | Fuente de verdad |
|---|---|---|
| Sesión auth | Supabase cookies/session | Supabase Auth |
| Word bank y SRS | Supabase + caches cliente | Supabase |
| Outbox de cambios | Dexie `syncOutbox` | Supabase al confirmar flush |
| Preferencias UI | Zustand/local storage según feature | Cliente |
| Daily plan generado | local storage/cache cliente | Temporal |
| Daily plan completado | local storage + Dexie `syncOutbox` (`activity_sessions`) | Supabase al confirmar flush |
| Jobs de enriquecimiento | `word_enrichment_jobs` | Supabase |

## Reglas

- Los cambios críticos de progreso o vocabulario deben llegar a Supabase o entrar al outbox con retry.
- `localStorage` y `sessionStorage` solo pueden guardar estado recreable o temporal.
- Dexie puede retener cambios pendientes, pero la UI debe tratar esos cambios como no confirmados hasta flush exitoso.
- `word_enrichment_jobs` evita promesas fire-and-forget en rutas HTTP; un worker confiable debe drenar la cola.
- Si Supabase no está disponible, no se debe prometer sincronización remota inmediata.

## Reconciliación

1. Aplicar cambios locales optimistas solo cuando la pantalla pueda mostrar pendiente/error.
2. Encolar operación con `enqueue()` si la escritura remota puede fallar por conectividad.
3. Al reconectar, `sync-manager` procesa en lotes y marca errores permanentes.
4. Después de flush, refrescar datos desde Supabase para evitar divergencias.
5. Si hay conflicto, gana Supabase salvo que exista una regla explícita de merge.

## Limitaciones Actuales

- No existe sincronización CRDT ni resolución multi-dispositivo avanzada.
- No todos los flujos usan outbox; algunos dependen de escritura Supabase directa. El checklist manual del daily plan si encola `activity_sessions` para reconciliacion.
- El runner de `word_enrichment_jobs` debe desplegarse como worker/scheduled job externo al request HTTP.
