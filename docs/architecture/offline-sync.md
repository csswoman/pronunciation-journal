# Offline y Sync

Fecha: 2026-07-01

## Fuentes de Estado

| Estado | Persistencia | Fuente de verdad |
|---|---|---|
| Sesión auth | Supabase cookies/session | Supabase Auth |
| Word bank y SRS | Supabase + caches cliente + Dexie SRS local | Supabase para datos de usuario; Dexie para review local pendiente |
| Outbox de cambios | Dexie `syncOutbox` | Supabase al confirmar flush |
| Preferencias UI | Zustand/local storage según feature | Cliente |
| Perfil y preferencias de usuario | Supabase + estado React local | Supabase |
| Course lesson completion | Dexie `completedLessons` + `syncOutbox` (`answer_history`, `activity_sessions`) | Supabase al confirmar flush |
| Daily plan generado | local storage/cache cliente | Temporal |
| Daily plan completado | local storage + Dexie `syncOutbox` (`activity_sessions`) | Supabase al confirmar flush |
| Practice sessions | Dexie `practiceSessions` + `syncOutbox` (`answer_history`, `activity_sessions`) | Supabase al confirmar flush |
| Reader progress | Dexie reader/exposure cache + `syncOutbox` | Supabase al confirmar flush |
| Essential Words lapses | `sessionStorage` temporal + Dexie SRS flush al cierre | Dexie local; outbox para actividad |
| Jobs de enriquecimiento | `word_enrichment_jobs` | Supabase |

## Reglas

- Los cambios críticos de progreso o vocabulario deben llegar a Supabase o entrar al outbox con retry.
- `localStorage` y `sessionStorage` solo pueden guardar estado recreable o temporal.
- Dexie puede retener cambios pendientes, pero la UI debe tratar esos cambios como no confirmados hasta flush exitoso.
- Las superficies que completan practica deben mostrar estado pendiente/error cuando la sincronizacion puede tardar o fallar. Esto aplica a sesiones genericas, reader y daily checklist.
- Las superficies de vocabulario/word bank/decks deben mostrar errores publicos de datos y conservar acciones de retry; no deben mostrar mensajes crudos de Supabase.
- `word_enrichment_jobs` evita promesas fire-and-forget en rutas HTTP; un worker confiable debe drenar la cola.
- Si Supabase no está disponible, no se debe prometer sincronización remota inmediata.
- Los errores de Gemini/transcripcion se normalizan antes de mostrarse en UI; no se deben exponer detalles de proveedor, stack ni API keys.
- Los flujos de entrevista/recording deben mantener mensajes publicos incluso si falla scoring local posterior a transcripcion.
- Los errores de perfil/preferencias deben usar mensajes publicos de auth o datos; no deben mostrar mensajes crudos de Supabase.
- La finalizacion de lecciones de curso debe degradar con mensaje publico de datos; el estado local Dexie no implica confirmacion remota hasta flush.

## Reconciliación

1. Aplicar cambios locales optimistas solo cuando la pantalla pueda mostrar pendiente/error.
2. Encolar operación con `enqueue()` si la escritura remota puede fallar por conectividad.
3. Al reconectar, `sync-manager` procesa en lotes y marca errores permanentes.
4. Después de flush, refrescar datos desde Supabase para evitar divergencias.
5. Si hay conflicto, gana Supabase salvo que exista una regla explícita de merge.

## Limitaciones Actuales

- No existe sincronización CRDT ni resolución multi-dispositivo avanzada.
- No todos los flujos usan outbox; algunos dependen de escritura Supabase directa. El checklist manual del daily plan, reader y sesiones de practica encolan progreso critico para reconciliacion.
- `core1000:pending-lapses` sigue usando `sessionStorage` como buffer corto para lapses dentro de una sesion; el hook intenta flush al cierre de sesion/pagehide. No debe tratarse como almacenamiento multi-tab durable.
- El runner de `word_enrichment_jobs` debe desplegarse como worker/scheduled job externo al request HTTP.
