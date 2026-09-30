# Plan 044: Conservar el estado y la calidad real de cada respuesta

## Estado y base
- Estado: DONE (alcance local); ejecución y ampliación autorizadas por el usuario el 2026-09-26. Prueba online en navegador completada; comprobación offline adicional dispensada por el usuario.
- Prioridad: P0. Esfuerzo: M. Riesgo: medio.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: —.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
GenericExerciseView.tsx:57 usa `status: extras?.status ?? 'answered'`; handleContinue fija `status: 'answered'`. grade.ts devuelve `accuracyToQuality(answer.score)` antes de comprobar firstTryFailed. queries.ts conserva status y firstTryFailed, pero no hintsUsed.

Resultado esperado: Todos los estados no evaluados producen grade=null y cero efectos SRS; el fallo previo no se pierde; la política de pistas queda implementada solo si fue aceptada, o explícitamente pendiente.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- components/practice/session/GenericExerciseView.tsx lib/practice/grade.ts lib/practice/types.ts lib/practice/queries.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `components/practice/session/GenericExerciseView.tsx`
- `lib/practice/grade.ts`
- `lib/practice/types.ts`
- `lib/practice/queries.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### Alcance confirmado durante el preflight
- Checkout `dev`; sin drift en los cuatro archivos principales respecto de `70d98322`.
- WIP previo: `plans/README.md` y los documentos sin seguimiento de la serie 6; conservarlos.
- Constructor localizado: `components/practice/session/session-state-helpers.ts`, llamado por `useSessionState.ts`.
- Callback real: `GenericRenderExtras.resultStatus` en `lib/practice/exercise-renderer/generic-registry.tsx`; `PracticeSubmitExtras` solo acepta `status`. Normalización en nuevo helper `lib/practice/submit-evidence.ts`; ampliar el contrato del registry dentro del dominio Practice.
- Tests adicionales previstos: `components/practice/session/__tests__/GenericExerciseView.producers.test.tsx` para productores reales y `lib/practice/__tests__/submit-evidence.test.ts` para precedencia.
- Documentación: `docs/architecture/practice-evaluation-evidence.md`, `docs/README.md` y fila 044 de `plans/README.md`.
- Penalización nueva por pistas: pendiente de aprobación de producto; solo transportar evidencia. Se conserva la política existente de fallo previo, aplicando mínimo también a scores.
- Ampliación autorizada explícitamente por el usuario: `components/exercises/WrittenProductionExercise.tsx` y `components/exercises/SpokenProductionExercise.tsx`, para transportar el fallo académico en reintentos internos. Sin cambios de UI ni instrumentación nueva de ejemplos/pistas implícitas.

### 1. Caracterizar y confirmar
Caracterizar la ruta del callback al payload persistido: producción y genéricos, answered/unscored/evaluator_failed/skipped. Añadir components/practice/session/__tests__/GenericExerciseView.status.test.tsx y ampliar lib/practice/__tests__/grade.test.ts.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Normalizar resultStatus/status en un único límite tipado; preservar estado, score, firstTryFailed del hijo y del contenedor y pistas durante handleContinue. Si ambos estados discrepan, no convertir silenciosamente un resultado no evaluado en answered; documentar y probar la precedencia.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Transportar hintsUsed hasta buildExerciseResult y savePracticeAnswer. Encontrar el constructor con git grep y añadir su ruta exacta al alcance antes de editar. Un fallo de evaluación nunca implica firstTryFailed académico ni calidad 1.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Aplicar precedencia: no evaluado → null; después política de score existente con límite por ayuda/reintento. Propuesta de la auditoría para aprobación de producto: una pista limita a 3; dos o más y un fallo previo limitan a 1. Usar mínimo, nunca subir una nota baja. Separar transporte de evidencia (corrección) de activación de penalizaciones (decisión).

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Probar desde el componente hasta Dexie que unscored/evaluator_failed guardan grade=null y no emiten eventos SRS. Confirmar que la actividad puede existir sin convertirse en evidencia de dominio.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: Autoevaluación offline; micrófono denegado; score=100 con fallo previo; score bajo con pista; dos pistas; error técnico seguido de evaluación válida; skip; metadatos conservados al pulsar Continuar.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run components/practice/session/__tests__/GenericExerciseView.status.test.tsx lib/practice/__tests__/grade.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [x] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [x] Todos los estados no evaluados producen grade=null y cero efectos SRS en los recorridos verificados; el fallo previo no se pierde; penalización de pistas explícitamente pendiente.
- [x] Pruebas focalizadas, types y lint verificados con salida real.
- [x] Comprobación runtime online en navegador: sesión invitada, omisión y conservación de dos pistas al continuar, con inspección del estado React. La comprobación offline adicional queda dispensada por instrucción del usuario del 2026-09-26.
- [x] SQL: no aplica; no hay migraciones ni operaciones remotas en este plan.
- [x] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [x] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## STOP
Si PracticeSubmitExtras no admite resultStatus, seguir el callback real antes de ampliar tipos. No asumir que todos los productores usan el mismo contrato. No cambiar los umbrales de score, el nivel CEFR ni Essential Words.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.

## Evidencia de ejecución — 2026-09-26
- Baseline: `grade.test.ts`, **28 passed**, exit 0.
- Caracterización corregido el harness (no consultar `table` como índice de Dexie): **10 failed | 31 passed**, exit 1, 9.32 s. Fallos de assertions, no de imports/mocks: score=100+firstTryFailed esperaba 1 y recibió 5; estados no evaluados llegaron como answered; hintsUsed y metadatos desaparecieron; retry técnico recibió grade 1.
- Primera corrección: **41 passed**, exit 0, 9.18 s.
- Suite ampliada (status, producers, submit-evidence, grade, useSessionState.roundtrip, queries.transaction): **69 passed**, exit 0, 47.69 s. Se verifica Dexie real mediante fake-indexeddb; no se sustituye el escritor por un mock.
- Ajuste final: conservar pistas reportadas por el hijo entre reintentos, comprobar score crudo en el JSON e instrumentar firstTryFailed en ambos productores tras autorización explícita.
- Suite final: **8 files passed; 80 tests passed**, exit 0, 50.68 s. Añade las suites existentes WrittenProductionExercise y SpokenProductionExercise. Emiten tres avisos de jsdom sobre HTMLCanvasElement.getContext; ningún test falla. El harness nuevo necesitó completar el mock de AuthProvider con useAuthOptional; se corrigió el harness, no producción para satisfacer un mock.
- `pnpm type-check`: `$ tsc --noEmit`, exit 0. `pnpm lint`: `$ eslint .`, exit 0. `git diff --check`: exit 0 (avisos informativos LF/CRLF). No se ejecutó la suite completa.
- Componentes modificados: SpokenProductionExercise 247 líneas, WrittenProductionExercise 233, GenericExerciseView 157. Nuevos archivos y tests <250 líneas; cambios puntuales en tipos/queries preexistentes grandes, sin refactor general.
- Compilación: Next 16.3.5; se detuvo el servidor webpack y se inició temporalmente `pnpm exec next dev --turbopack --port 3000`, sin editar scripts. `/_next/mcp` ofreció get_compilation_issues y respondió `{"issues":[]}`; get_routes también respondió.
- Navegador/offline: **pendiente**. agent-browser 0.38.1, sesión propia con restore y react-devtools; dos intentos fallaron al configurar el navegador: `Could not configure browser: Failed to read ... (os error 10060)`. Se detiene esa verificación conforme al STOP; no equivale a aceptación de UI/offline ni micrófono real.
- Reintentos internos de WrittenProductionExercise/SpokenProductionExercise: ampliación autorizada y completada. Solo una evaluación válida incorrecta activa firstTryFailed; resultado nulo técnico no lo activa. Pruebas de ambos productores confirman fallo → retry → score 100 → grade 1; error técnico → evaluación válida en escritura → grade 5.
- Sin SQL, sincronización remota, backfill, commit, push ni despliegue.
- Ajuste de aceptación solicitado por el usuario: offline no es requisito adicional de cierre; se conservan las pruebas automatizadas existentes de autoevaluación, sin eliminar soporte offline.
- Resolución posterior del bloqueo de navegador: `agent-browser doctor --offline` reprodujo el timeout al lanzar un navegador vacío dentro de `CodexSandboxOffline`. El mismo `open`, con la misma sesión aislada, funcionó al ejecutarlo fuera del sandbox mediante escalación autorizada. No fue necesario reinstalar Brave/Chrome ni cambiar la aplicación.
- Runtime online: `/practice` → `/practice/chunks` → Empezar práctica → Omitir → dos pistas en fill_blank → responder → Continuar. Inspección del estado React de PracticeSession: `{slug:'match_pairs',status:'skipped',firstTryFailed:false,hintsUsed:0}` y `{slug:'fill_blank',status:'answered',firstTryFailed:false,hintsUsed:2,isCorrect:true}`. `/_next/mcp get_errors` devolvió `configErrors:[], sessionErrors:[]` después del recorrido. Navegador de prueba cerrado guardando su sesión; servidor Turbopack permanece disponible.
- Límite de esa comprobación manual: sesión invitada, sin persistencia autenticada ni sync remoto; la ruta componente→Dexie y los reintentos de producción están cubiertos por las 80 pruebas automatizadas registradas arriba. No se atribuye al smoke test una prueba de micrófono físico o corrección remota.
- Contrato: [practice-evaluation-evidence.md](../docs/architecture/practice-evaluation-evidence.md).
