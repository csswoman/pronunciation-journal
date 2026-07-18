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
| Lexicon practice session | `sessionStorage` temporal por categoria | Temporal, recreable desde API |
| Word of Day | `sessionStorage` cache diario | Temporal, recreable desde API/Gemini |
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
- Lexicon practice y Word of Day pueden usar `sessionStorage` como cache temporal, pero sus errores visibles deben ser publicos y no filtrar payloads del API.

## Reconciliación

1. Aplicar cambios locales optimistas solo cuando la pantalla pueda mostrar pendiente/error.
2. Encolar operación con `enqueue()` si la escritura remota puede fallar por conectividad.
3. Al reconectar, `sync-manager` procesa en lotes y marca errores permanentes.
4. Después de flush, refrescar datos desde Supabase para evitar divergencias.
5. Si hay conflicto, gana Supabase salvo que exista una regla explícita de merge.

## Inventario Completo de localStorage/sessionStorage

| Clave | Archivo | Tipo | Veredicto |
|---|---|---|---|
| `daily-plan:{uid}:{fecha}` | `lib/daily/plan-storage.ts` | Cache diario | Aceptable — caduca con la fecha, recreable desde API |
| `daily-done:{uid}:{fecha}` | `lib/daily/plan-storage.ts` | IDs completados hoy | Aceptable — temporal de sesion; progreso va a outbox |
| `daily-resolved:{uid}:{fecha}` | `lib/daily/plan-storage.ts` | Paso resueltos | Aceptable — temporal de sesion |
| `pronunciation_queue` | `lib/ai-coach/pronunciation.ts` | Cola de frases activas | Resuelto en Dexie `pronunciationCoachState`; localStorage queda solo para migracion/fallback |
| `pronunciation_mastered` | `lib/ai-coach/pronunciation.ts` | Frases dominadas | Resuelto en Dexie `pronunciationMastery`; localStorage queda solo para migracion/fallback |
| `pronunciation_seen` | `lib/ai-coach/pronunciation.ts` | Frases vistas | Resuelto en Dexie `pronunciationCoachState`; localStorage queda solo para migracion/fallback |
| `ai_practice_device_id` | `lib/ai-practice/load-state.ts` | UUID de dispositivo | Aceptable — identifica sesion, no es progreso critico |
| `core1000:pending-lapses` | hooks core1000 | Buffer de lapses in-session | Aceptable — flush a Dexie al pagehide |
| Lexicon/Word of Day | varios | Cache de sesion | Aceptable — temporal, recreable desde API/Gemini |

### Estado de Migracion del AI Coach de Pronunciacion

`pronunciation_queue`, `pronunciation_mastered` y `pronunciation_seen` ya no son
la fuente primaria. Desde 2026-07-03 el estado del coach se guarda en Dexie:
`pronunciationMastery` para frases dominadas y `pronunciationCoachState` para
cola/frases vistas. Al primer load se migran los datos legacy de localStorage y
luego se eliminan esas claves si Dexie esta disponible. Si Dexie falla,
localStorage sigue como fallback degradado.

**Pendiente**:
1. Agregar sync remoto opcional si el coach debe seguir al usuario entre dispositivos.

Esto se rastrea como deuda tecnica activa; no debe bloquearse nuevas features del coach
hasta que este resuelto.

## Limitaciones Actuales

- No existe sincronización CRDT ni resolución multi-dispositivo avanzada.
- No todos los flujos usan outbox; algunos dependen de escritura Supabase directa. El checklist manual del daily plan, reader y sesiones de practica encolan progreso critico para reconciliacion.
- `core1000:pending-lapses` sigue usando `sessionStorage` como buffer corto para lapses dentro de una sesion; el hook intenta flush al cierre de sesion/pagehide. No debe tratarse como almacenamiento multi-tab durable.
- El runner de `word_enrichment_jobs` debe desplegarse como worker/scheduled job externo al request HTTP.
- El AI Coach de pronunciacion guarda mastery, queue y seen en Dexie con migracion desde localStorage. El progreso local no sincroniza entre dispositivos.
- El outbox no coalesce operaciones del mismo registro y el lote se procesa en paralelo; mutaciones dependientes pueden llegar fuera de orden.
- Realtime de `word_bank` puede sobrescribir una actualizacion SRS local aun no enviada; `tracked_items` evita este caso al hidratar, pero `word_bank` no todavia.
- El SRS de `word_bank` requiere una lectura Supabase antes de encolar, por lo que no es plenamente offline.
- La eliminacion de respuestas de cursos usa la clave no unica `(user_id, context, content_id)`; una correccion por `id` requiere conservar ese id desde la UI.
- Los triggers `updated_at` no son uniformes entre tablas, asi que el ultimo escritor puede depender de la tabla.
