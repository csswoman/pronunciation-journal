# Plan 051: Corregir contracciones equivalentes sin aceptar respuestas incorrectas

## Estado y base
- Estado: DONE; implementado y verificado con 37 pruebas focalizadas, type-check y lint exit 0.
- Prioridad: P2. Esfuerzo: M. Riesgo: medio.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: —; respetar Plan 043 y coordinar con 044.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
answer-match.ts:31 mantiene CONTRACTIONS con he's→he is e i'd→i would. grading-pipeline.ts define otra tabla y normalización propia. La ruta evaluateExercise del Coach se debe localizar y verificar antes de incorporar el cambio.

Resultado esperado: Positivos válidos aceptados y negativos rechazados en las entradas activas; caché coherente y sin llamadas extra a IA.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- lib/exercises/answer-match.ts lib/exercises/grading-pipeline.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `lib/exercises/answer-match.ts`
- `lib/exercises/grading-pipeline.ts`
- `lib/exercises/evaluator.ts` (ruta del Coach, condicionada al paso 3)
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Helpers y artefactos añadidos/revisados: `lib/exercises/contractions.ts`, `lib/exercises/answer-match-templates.ts`, `lib/exercises/__tests__/contractions.test.ts`, `lib/exercises/__tests__/grading-pipeline.test.ts`, `docs/architecture/exercises.md` y `docs/README.md`.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Caracterizar He's been/He has been, I'd finished/I had finished, It's got/It has got y don't/do not en cada entrada activa. Añadir negativos, posesivos y restricciones require/forbid.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Crear un helper puro dentro de lib/exercises con alternativas acotadas y comparación contra referencias aceptadas. No expandir cualquier 's a has sin contexto de referencia; no multiplicar combinaciones sin límite.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Reutilizar equivalencias en matchAnswer y matchesAcceptedAnswer; conectar evaluateExercise del Coach únicamente después de inspeccionar su contrato y registrar su ruta exacta. Mantener targetTokens, mustInclude, knownWrong, typos y restricciones gramaticales.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Si cambia la normalización usada como cache key, versionar la caché y probar que no se reutiliza una decisión inválida. Mantener presupuesto de correcciones IA y estrategia local-first.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Reejecutar regresiones de Plan 043 y pruebas de pipeline. Documentar que equivalencia lingüística no implica una nueva política de crédito parcial por typo; esta última queda diferida.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: has/is y had/would válidos; posesivo John's book; don't/do not; require/forbid; apóstrofo curvo; target typo sigue rechazado; múltiples contracciones con límite; caché antigua.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/exercises/__tests__/answer-match.test.ts lib/exercises/__tests__/grading-pipeline.test.ts lib/exercises/__tests__/contractions.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [x] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica (10 fallos iniciales en contractions.test.ts verificados y corregidos).
- [x] Positivos válidos aceptados y negativos rechazados en las entradas activas, incluidos `'d` seguido por verbo base y `extraAccepted` bajo `require`/`forbid`; equivalencias resueltas localmente sin llamadas extra a IA.
- [x] Pruebas focalizadas, types y lint verificados con salida real (37 tests pasando, tsc y eslint exit 0).
- [x] Comprobación runtime navegador/offline cuando aplique; lógica 100% determinista local en cliente/offline.
- [x] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. No aplica (sin cambios SQL).
- [x] Rutas de Plan 051 revisadas con `git status --short` acotado a su alcance; los cambios ajenos preexistentes del working tree quedan fuera de esta atribución.
- [x] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites (exercises.md y docs/README.md).

## STOP
Si las expansiones hacen aceptar una respuesta semánticamente distinta de las referencias, detener y reducir la regla. No sustituir detectores estructurales por coincidencia permisiva.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.
