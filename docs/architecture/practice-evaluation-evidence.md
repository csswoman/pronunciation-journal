# Evidencia de evaluación en Practice

Contrato del Plan 044. La actividad y la evidencia evaluada tienen salidas
distintas; completar una autoevaluación no acredita dominio ni dispara SRS.

## Del productor al historial

`GenericExerciseView` recibe `GenericRenderExtras` del registry. El helper
`lib/practice/submit-evidence.ts` transforma `resultStatus` y `status` en un único
`PracticeSubmitExtras.status`; elimina el alias antes de entregar a la sesión.

Cuando ambos estados discrepan, se aplica la precedencia conservadora:
`skipped` → `evaluator_failed` → `unscored` → `answered`. El texto legacy `skip`
también fuerza `skipped`. Sin señales de estado se mantiene `answered` por
compatibilidad con los productores evaluados existentes. Un estado no evaluado
nunca se promociona a `answered` por el otro campo.

El contenedor retiene el resultado completo hasta “Continuar”: score, feedback,
estado, identidad de intento, tiempos, fallo previo y pistas. Los metadatos de
un resultado técnico no se reutilizan como estado del siguiente resultado válido.
Un reintento solo conserva fallos académicos observados en resultados evaluados
o declarados explícitamente por el hijo; pulsar “Intentar de nuevo” no crea uno.
WrittenProductionExercise y SpokenProductionExercise conservan en una ref el
fallo de una evaluación válida durante sus reintentos internos, y lo entregan al
continuar. Un resultado nulo por error técnico no cambia esa ref; cambiar de
ejercicio sí la reinicia. Una autoevaluación puede conservar el fallo previo real
sin dejar de ser no evaluada y mantener grade null.

`firstTryFailed` combina por OR el historial del contenedor y la señal del hijo.
La primera latencia observada conserva prioridad; si el hijo informa su latencia
se utiliza antes del tiempo total del callback. El hook de sesión sigue siendo
dueño del tiempo total de interacción y de la identidad del intento cuando los
proporciona explícitamente.

`hintsUsed` es el contador acumulado de pistas de ese ejercicio. Se toma el máximo
entre hijo y contenedor porque el hijo puede estar informando las mismas pistas
recibidas mediante `hintCount`. No se suman dos observaciones de la misma ayuda.
El máximo se conserva al reintentar y al omitir. Un productor con ayudas propias
debe informar un total acumulado compatible; no asumir contadores independientes.

`buildExerciseResult` transporta `hintsUsed` en el resultado canónico.
`savePracticeAnswer` guarda hints y score en `exercise_payload`, junto a status,
firstTryFailed y tiempos. Se usa el JSON existente: no requiere migración ni
backfill, y no se reconstruyen pistas históricas ausentes.

## Calificación y efectos

1. `skipped`, `unscored`, `evaluator_failed` o el sentinel `skip`: `grade = null`.
2. En slugs con score se conservan los umbrales de `accuracyToQuality`.
3. Un fallo previo limita esa calidad con `Math.min(grade, 1)`: 100 pasa a 1;
   una calidad 0 sigue siendo 0. Las reglas existentes sin score se mantienen.
4. Pistas: **solo transporte**. Los límites propuestos 3/1 siguen pendientes de
   aprobación de producto; ni una ni dos pistas activan por sí solas una penalización.

La guarda existente de `savePracticeAnswer` impide eventos y proyecciones SRS
para resultados no evaluados. El outbox puede contener `answer_history` con
grade null y una fila `activity_sessions` sin etiquetas de habilidad ni resolución
de objetivos. Esto no modifica las fórmulas globales de XP/precisión ni convierte
los contadores de actividad en una afirmación de dominio (planes 047/050).

## Verificación y límites

- `GenericExerciseView.status.test.tsx`: callback controlado, shell real,
  constructor, escritores y Dexie con fake-indexeddb. Comprueba metadatos al
  continuar, reintentos, skip, actividad y ausencia de eventos/proyecciones SRS.
- `GenericExerciseView.producers.test.tsx`: productores y registry reales,
  `useSessionState` real y Dexie. Solo sustituye auth, capacidades de red/micrófono,
  evaluador, cues y flush remoto. Cubre autoevaluación offline, micrófono no
  disponible, permiso denegado seguido de omisión, reintentos internos de ambos
  productores y error técnico seguido de evaluación válida en escritura.
- `submit-evidence.test.ts`: las 16 combinaciones de ambos estados, alias y legacy.
- `grade.test.ts`: precedencia, score con fallo previo, nota baja y pistas sin
  penalización nueva. Las pruebas de transacciones y del hook ya existentes
  comprueban que sigue funcionando la escritura de evidencia evaluada.

Estas pruebas no acreditan un micrófono físico, un navegador offline ni sync remoto.
El preflight inicial de `next-dev-loop` encontró webpack en `pnpm dev`. Al iniciar
temporalmente `pnpm exec next dev --turbopack --port 3000` sin modificar scripts,
`get_compilation_issues` devolvió `issues: []`.

El timeout de agent-browser se reprodujo incluso al lanzar un navegador vacío
dentro del sandbox de Windows. El mismo comando funcionó fuera del sandbox con
escalación autorizada, sin reinstalación ni cambios de la aplicación. La sesión
invitada en `/practice/chunks` permitió verificar omisión, uso de dos pistas,
respuesta y Continuar; el estado React conservó `status: skipped` para la omisión
y `status: answered, hintsUsed: 2` para la respuesta. Next.js reportó
`configErrors: [], sessionErrors: []`. Ese smoke test no acredita persistencia
autenticada ni sincronización remota. El usuario dispensó la comprobación offline
adicional como requisito de cierre; se conserva el soporte y las pruebas existentes.

Los ejemplos visibles por defecto no constituyen un contador de
pistas instrumentado; este contrato preserva las pistas observadas y reportadas.
