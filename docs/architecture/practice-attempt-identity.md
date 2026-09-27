# Identidad de intentos de Practice — Plan 046, fase A

Una interacción evaluada tiene una identidad distinta de la entidad estudiada.
El mismo contenido en otra sesión constituye otra observación. Un retry de
transporte conserva `attemptId`; no debe crear otra respuesta ni otro efecto.

## Identidad y transacción

- Practice usa `sessionId:posición:exerciseId`. `sessionId` se guarda en
  `practiceSessions`; la creación/restauración está serializada por Dexie.
  Reiniciar crea un UUID nuevo. Las sesiones antiguas reciben un UUID persistido
  al restaurarlas dentro de esa misma transacción.
- Coach usa `coach:toolCall.id`. El banco asigna UUIDs; `stream-processor.ts`
  asigna UUIDs a cada inicio de widget y remapea los IDs de transporte, que
  pueden repetirse. El historial conserva esos UUIDs. El contenido no es la key.
- `practiceEffectId` genera UUIDv8 a partir de SHA-256 del array JSON
  `[practice-v1, usuario, attemptId, tipoEntidad, idCanónico, tipoEfecto]`.
  Respuesta, rating word_bank y rating topic_srs tienen keys diferentes.
  Los hashes se calculan antes de abrir la transacción IndexedDB.
- `answer_history.id` siempre recibe un UUID, incluso cuando el productor usa
  una identidad compuesta. El recibo conserva el `attemptId` original.
- `savePracticeAnswer`, reexportado desde `queries.ts`, vive en
  `lib/practice/answer-queries.ts`. La transacción incluye respuesta/outbox,
  eventos word/topic, proyecciones de chunks/fragments, evidencia de chunks,
  recurrencia de errores y recibo. Cualquier fallo revierte el conjunto.
- Dexie v48 añade `practiceAttemptReceipts`. La consulta del recibo se hace
  dentro de la transacción de escritura; dos pestañas no pueden aplicar el
  mismo intento dos veces. Los recibos sobreviven al flush, cierre y reapertura.
  No eliminarlos con la limpieza del outbox ni aplicarles un TTL de sesión.

## Reintentos y evidencia

Fonemas conservan la primera evaluación por posición, incluido el fallo. La
fase `hints`, índice y resultados se persisten antes de mostrar las pistas.
Corregir después de verlas sirve como práctica guiada: no añade otra posición
al resumen ni otro avance. Continuar desde pistas persiste el siguiente índice.

Coach conserva la primera evaluación del widget en el historial y las métricas
de sesión. Una corrección guiada reutiliza esa identidad; el escritor conserva
el primer resultado. El productor transporta `firstTryFailed`, `hintsUsed` y la
latencia desde que se mostró el widget. «Mostrar opciones» cuenta como ayuda.
La ausencia de latencia se almacena como `responseTimeKnown: false`; el cero
compatible de `timeMs` no concede la nota rápida. La política de pistas de
044 sigue vigente: el contador no introduce una penalización nueva.

## Límites y mantenimiento

Este contrato cubre los efectos de `savePracticeAnswer` y los productores
Practice/Coach descritos. Los callers sin `attemptId` siguen creando una nueva
observación por llamada; deben adoptar una identidad estable antes de prometer
replay seguro. Los writers SRS independientes conservan su API y pueden recibir
una key derivada explícita; no se deduplican globalmente por contenido.

Los recibos son locales al perfil IndexedDB: borrar esa base elimina la
protección local. Las RPC reciben keys estables, pero su ejecución remota no se
verificó aquí. No se reconstruyen recibos históricos ni se reemiten colas viejas.
Las sesiones de actividad y sus efectos conceptuales pertenecen al plan 050;
no se declara idempotencia de todos los escritores de la aplicación.

La fase A impide repetir **el mismo intento**. No impide que cincuenta intentos
distintos e inmediatos avancen SRS; esa política temporal y las pruebas SQL son
la fase B. No cambia FSRS, migraciones remotas, maestría histórica ni CEFR.

## Verificación

`attempt-idempotency.test.ts` usa Dexie/fake-indexeddb reales: concurrencia,
flush real con transporte simulado, reapertura, keys separadas, 50 replays,
chunks/fragments, recurrencia y rollback conjunto. `retry-identity.test.ts`
monta el hook real para restauración desde hints y dos consumidores simultáneos.
`ToolWidget.evidence.test.tsx` verifica interacción, ayuda y latencia del widget.
Son pruebas locales; no sustituyen navegador autenticado ni sincronización remota.
