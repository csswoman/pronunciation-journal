# Plan 045: Recuperar respuestas rechazadas y fallos transitorios de sincronización

## Estado y base
- Estado: DONE (sin commit, 2026-09-26) — código/local verificado; migración remota aplicada y verificada; persistencia real de Essential Words (6 filas) y Connected Speech (1 fila UUID) comprobada en navegador.
- Prioridad: P0. Esfuerzo: M. Riesgo: medio.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 044 para validar elegibilidad; 046 fase A antes de reemitir efectos SRS.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
runtime-engine.ts:309 emite `context: "essential-words"`. sync-manager.ts:213 clasifica como permanente `retryCount >= MAX_RETRIES`. sounds/queries.ts:199 construye `cs_${input.phraseId}_${Date.now()}` y answerRow incluye `score`. La restricción remota, el error 23514 y las 11 sesiones provienen del informe aportado; no se consultó Supabase en esta preparación.

Resultado esperado: Fixtures se sincronizan una vez y las permanentes ajenas permanecen aisladas. Código/local verificados y remoto pendiente son estados separados; cierre remoto requiere evidencia de una respuesta real persistida.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- lib/essential-words/runtime-engine.ts lib/sync/sync-manager.ts lib/sounds/queries.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `lib/essential-words/runtime-engine.ts`
- `lib/sync/sync-manager.ts`
- `lib/sounds/queries.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Contrastar los tipos de answer_history y la última migración efectiva, incluyendo tipo de id y CHECK. Guardar fixtures sintéticos que reproduzcan los rechazos en una base local desechable. No usar las filas reales como fixture.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Crear una migración nueva que preserve todos los contextos admitidos y añada essential-words. No editar migraciones históricas. Registrar nombre exacto en el alcance; preparar consulta de inspección del CHECK y verificación posterior.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Corregir Connected Speech con UUID estable por intento, conservado durante retries. Retirar score como columna si el esquema confirma que no existe; mantener datos evaluativos válidos en su contrato/payload. No regenerar el UUID al reenviar.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Implementar recuperación selectiva del outbox: solo answer_history del usuario activo con el contexto y causa reparados. Un 23514 de otra restricción no se debe reencolar. Conservar id, timestamp y payload; una respuesta recuperada no debe volver a aplicar el SRS propio de Essential Words.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Separar agotamiento temporal de intentos y error permanente. Tras reconexión permitir recuperación acotada, backoff y exclusión por usuario/entidad; no bucle infinito ni reintento de RLS, autenticación o payload inválido. Añadir diagnóstico visible mediante la superficie de sync existente, identificando su ruta antes de editar.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Preparar runbook de aplicación y recuperación. Aplicar remoto solo con autorización explícita posterior. Verificar migración local y remota por separado, luego una sesión nueva y una recuperación real del navegador. Datos ausentes del outbox no se reconstruyen desde activity_sessions.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: 23514 de contexto reparado y otro 23514; 3 errores transitorios y reconexión; usuario cambia de cuenta; doble flush; UUID conservado; Connected Speech sin columna inválida; ninguna duplicación de SRS al recuperar histórico.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/sync/__tests__/answer-recovery.test.ts lib/sounds/__tests__/connected-speech-persistence.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [x] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [x] Fixtures se sincronizan una vez y las permanentes ajenas permanecen aisladas (local). Remoto: 6 respuestas reales persistidas; las 3 `focus_sprints:PGRST204` ajenas siguieron aisladas.
- [x] Pruebas focalizadas, types y lint verificados con salida real.
- [x] Comprobación runtime navegador: tras aplicar la migración, 6 respuestas `essential-words` persistidas en remoto (2026-09-27 03:46–03:47 UTC). Diagnóstico del navegador (localhost): `repairableAnswers: 0`, sin `answer_history` fallidas → las respuestas rechazadas de la auditoría ya no están en este outbox: irrecuperables desde aquí, no se reconstruyen. Connected Speech: fila `244d46f7-…` (`sound_lab`, `exercise_payload.score = 50`, `phraseId = pick-it-up`) persistida tras recargar; sin columna `score` ni id `cs_…`.
- [ ] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. → Remoto aplicado por la usuaria y verificado con `pg_get_constraintdef`: incluye los 7 contextos previos + `essential-words`. Local no aplicado (sin stack desechable). Recuperación de datos pendiente. Baseline remota antes de recuperar: 0 filas `essential-words`, 0 `core-1000`, 1 fila Connected Speech (type 23, `daily`, 2026-08-11).
- [x] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [x] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## Evidencia de ejecución (2026-09-26, base `d2294315`, sin drift en los 3 archivos)

Caracterización contra el código previo (fixture sintético `lib/sync/__tests__/fixtures/answer-history-remote.ts`
que replica columnas, uuid y CHECK de `answer_history`):
- Essential Words: `{"status":"failed","errorCode":"23514","retryCount":1,"errorMessage":"new row for relation \"answer_history\" violates check constraint \"answer_history_context_check\""}`.
- Connected Speech: 4/4 rojos por causa real — `expected 'cs_p-1_1790479819934' to match /^[0-9a-f]{8}-…/i`; flush `{ synced: 0, failed: 1 }`.

Entregas:
- 2: `supabase/migrations/20260926230000_answer_history_essential_words_context.sql` (conserva los 7 contextos + `essential-words`; consulta de inspección en cabecera).
- 3: `lib/sounds/queries.ts` — UUID por intento (`attemptId` opcional), `score` → `exercise_payload.score`.
- 4: `lib/sync/answer-recovery.ts`.
- 5: `failureKind` (`permanent`/`exhausted`) + `recoveryCount` en `types.ts`; `sync-manager.ts` clasifica y añade `22P02`/`23502` como permanentes; `lib/sync/exhausted-recovery.ts`; helpers comunes en `recovery.ts`; wiring en `init-sync-listeners.ts`; diagnóstico `lib/sync/sync-diagnostics.ts` expuesto en `window.__syncRecovery` (superficie existente de `schema-failure-recovery.ts`).
- 6: runbook y contrato en `docs/architecture/answer-sync-recovery.md`.

Verificación:
- `pnpm exec vitest run lib/sync/__tests__/answer-recovery.test.ts lib/sync/__tests__/exhausted-recovery.test.ts lib/sounds/__tests__/connected-speech-persistence.test.ts --maxWorkers=1` → 3 files, 15 tests, exit 0.
- Regresión: `lib/sync/__tests__` + `lib/sounds/__tests__/queries.test.ts` → 13 files / 99 tests; AuthProvider.signout + `components/practice/essential-words` → 23 files / 138 tests.
- `pnpm type-check`, `pnpm lint`, `git diff --check`, `pnpm check:migrations`, `pnpm audit:hard-rules` → exit 0.

Límites conocidos:
- Filas antiguas `cs_…` quedan aisladas como permanentes (no se reescribe su id).
- Fuera de alcance, detectado: `savePracticeAnswer` no envía `answered_at`, así que cualquier sync tardío (no solo la recuperación) fecha la respuesta al momento del sync. La recuperación lo corrige solo para las filas que reencola.

## STOP
Si las funciones desplegadas o CHECK difieren de la auditoría, actualizar el diagnóstico antes de escribir SQL. Si el navegador perdió los payloads, reportar irrecuperabilidad; no inventar respuestas. No ejecutar db push en la fase de planificación.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.

