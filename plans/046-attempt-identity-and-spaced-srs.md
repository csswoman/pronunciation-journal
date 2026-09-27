# Plan 046: Hacer idempotentes los intentos y evitar avances SRS por repetición inmediata

## Estado y base
- Estado: IN PROGRESS. Fase A implementada por instrucción del usuario; aceptación en navegador/offline pendiente. Fase B no ejecutada.
- Prioridad: P0. Esfuerzo: L. Riesgo: alto.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 044; coordinar queries.ts con 045 y 050.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: tests locales con Dexie real/fake-indexeddb, hooks/widgets en jsdom y compilación Next. Sin validación remota.

## Problema y evidencia
useSessionState.ts:116 deriva attemptId de sesión/índice/ejercicio; :153 añade cada resultado a results y la rama hints retorna antes de guardar progreso. Ambos builders SRS usan `const idempotencyKey = crypto.randomUUID()`. coach-progress.ts:36 usa `timeMs: result.latencyMs ?? 0`. Las migraciones 20260720080000_srs_rating_events.sql y 20260721194346_tracking_verified_review.sql llaman _sm2_schedule_next.

Resultado esperado: Fase A: replays no duplican ningún efecto incluido. Fase B: ninguna ráfaga de aciertos infla el espaciado; tests SQL reales pasan localmente. Despliegue remoto se valida aparte.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- components/practice/session/useSessionState.ts lib/practice/queries.ts lib/word-bank/srs-queries.ts lib/practice/topic-srs-queries.ts lib/ai-practice/coach-progress.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `components/practice/session/useSessionState.ts`
- `lib/practice/queries.ts`
- `lib/word-bank/srs-queries.ts`
- `lib/practice/topic-srs-queries.ts`
- `lib/ai-practice/coach-progress.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Fase A: definir identidad de interacción, envío y entidad. Un retry de transporte conserva la misma key; un intento nuevo recibe otra identidad. No deduplicar globalmente por contenido: dos prácticas legítimas son dos observaciones. Para dos pestañas sobre una misma sesión restaurada, preservar la identidad persistida.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Derivar keys UUID válidas y deterministas de versión+usuario+attemptId+tipo de entidad+id canónico+tipo de efecto. Evitar colisión entre word_bank y topic. Conservar una identidad válida para answer_history según su esquema. No imponer que answer_history.id sea igual a todas las keys de efectos.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Persistir recibos/identidad independientemente de que la entrada desaparezca del outbox. Probar savePracticeAnswer dos veces antes y después del flush. Revisar también los efectos de chunks/fragments, recordChunkEvidence y error recurrence: no proclamar idempotencia integral si siguen duplicándose. Identificar sus archivos exactos antes de ampliar el alcance.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Fonemas: persistir el estado de pistas/restauración; mantener una sola posición del ejercicio en el resumen. Definir subintentos si se conserva el historial de fallos, pero no generar múltiples avances ni borrar el fallo anterior. Coach: identidad estable por widget, latencia real, firstTryFailed y ayuda por Mostrar opciones; latencia desconocida no equivale a respuesta instantánea.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Fase B, política propuesta: bajo lock servidor, evento evaluado grade>=3 y tarjeta aún no vencida se registra sin incrementar repetitions/intervalo ni evidencia espaciada de dominio. Tarjeta nueva admite su primer avance; fallos reales conservan su efecto. Comprobar también las proyecciones optimistas locales.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Crear migración nueva para las definiciones efectivas de ambas RPCs, preservando idempotencia, RLS y FOR UPDATE. Diseñar explícitamente tiempo del evento offline vs tiempo servidor, eventos fuera de orden y reloj cliente adelantado. No usar fecha de llegada de un lote para fingir repasos separados.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 7. Entrega 7
Probar concurrencia en base local: duplicado exacto, dos eventos distintos a la misma tarjeta vencida, ráfaga de cinco preguntas del mismo tema, lapse y siguiente repaso vencido. Preparar rollout y política histórica; no resetear maestría de usuarios sin evidencia.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: Un intento → una respuesta/efecto; nueva sesión → nueva observación; 50 repeticiones inmediatas no dan dominio; mismo intento en dos pestañas; retries tras flush; resumption desde hints; tipos de entidad sin colisiones; fallos y eventos offline fuera de orden.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/practice/__tests__/attempt-idempotency.test.ts components/practice/session/__tests__/retry-identity.test.ts lib/ai-practice/__tests__/coach-progress.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [ ] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [ ] Fase A: replays no duplican ningún efecto incluido. Fase B: ninguna ráfaga de aciertos infla el espaciado; tests SQL reales pasan localmente. Despliegue remoto se valida aparte.
- [ ] Pruebas focalizadas, types y lint verificados con salida real.
- [ ] Comprobación runtime navegador/offline cuando aplique; si falta, fase pendiente.
- [ ] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. Preparar todo lo revisable antes de solicitar autorización de despliegue.
- [ ] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [ ] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## STOP
Detener la fase B hasta aceptar la política temporal, incluidas evidencias objective de word_bank. Un simple sufijo de retry no resuelve la semántica. Si FSRS requiere un rediseño, separar esa fase y no prometer protección completa.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.
