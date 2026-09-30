# Plan 047: Calcular métricas completas y distinguir actividad, precisión y evidencia

## Estado y base
- Estado: IN PROGRESS; Fase A implementada y Fase B instrumentada localmente como candidata el 2026-09-27. Pendientes: aprobación/calibración de la fórmula, comprobación runtime en navegador y commit.
- Prioridad: P1. Esfuerzo: L. Riesgo: alto.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 044; 045 para cobertura real de Essential Words; 046 para replay.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
fluency-scores.ts:88 suma Object.values(wordsByStatus); :118 mezcla `0.6 * accuracy + 0.3 * frequency + 0.1 * retention`. queries.ts:445 lee answer_history sin paginar y mapRows no filtra status/grade.

Resultado esperado: Fase A elimina sesgos verificables y truncamiento. Fase B requiere fórmula y fixtures aprobados, con evidencia insuficiente distinta de 0. Registrar la fórmula final en documentación de arquitectura.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- lib/progress/fluency-scores.ts lib/progress/queries.ts lib/practice/session-result.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `lib/progress/fluency-scores.ts`
- `lib/progress/queries.ts`
- `lib/practice/session-result.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Fase A: testear denominador con estados mutuamente excluyentes. Verificar si legacyMastered solapa mastered antes de sumarlo; saved/verified son ejes independientes. No copiar automáticamente el esperado 35 del informe: depende de una fórmula distinta y debe derivarse del contrato.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Centralizar elegibilidad para precisión: answered evaluable, grade numérico incluido 0; excluir skipped/unscored/evaluator_failed. Tratar legado sin metadatos según contrato documentado; no confundir null con cero. Reutilizar en totales, resumen parcial al salir y agregados.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Revisar todas las consultas de progreso y comprobar .error. Propagar disponibilidad por sección en dataErrors; vacío real=0, fallo=indisponible. Probar una consulta que falle con las demás correctas.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Paginar establemente por answered_at e id, o adoptar RPC agregada solo si hay necesidad medida. Empezar con paginación para no añadir SQL innecesario. Probar >1000 filas, timestamps iguales, límites inclusivos y ventana temporal fija.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Fase B de diseño: retirar volumen como evidencia de habilidad. Entregar contrato de accuracy, evidenceCount, uniqueContentCount, ventana y estado insufficient-evidence. Propuesta inicial: porcentaje visible solo desde 5 contenidos canónicos distintos; comprobar calibración antes de aprobar. El 40% de la auditoría no es un criterio pedagógico validado.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Definir ponderación, dificultad y repetición sin perder historial: limitar aportación repetida a una misma tarea por ventana, conservar fallos, no elegir solo el mejor acierto. Diferenciar rendimiento reciente de dominio persistente; un dato >30 días no equivale a habilidad cero.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 7. Entrega 7
Comparaciones semanales usan ventanas equivalentes y datos de cada ventana. Normalizar precisión de sesión completa/parcial con buildSessionResult; documentar exercises_total frente a evaluatedTotal. Cambios a XP por skip y a retención deben aprobarse como producto, no mezclarse con el bug aritmético.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: 0, 1 y 5 evidencias; 20 fallos no elevan habilidad; grade=0 sí cuenta; 50 repeticiones no simulan amplitud; sin evidencia vs fallo de consulta; 1205 filas con mismo timestamp; denominador no duplica estados; parcial coincide con completa.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/progress/__tests__/fluency-scores.test.ts lib/progress/__tests__/progress-invariants.test.ts lib/progress/__tests__/queries-pagination.test.ts lib/practice/__tests__/session-result.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [x] Caracterización demuestra el fallo: 6 casos rojos por denominador, grade 0, paginación, disponibilidad y resumen evaluado; luego verdes con el arreglo.
- [x] Fase A elimina sesgos verificables y truncamiento.
- [ ] Fase B aprobada: la implementación local candidata usa `0.75 × accuracy + 0.25 × retention`, ventana 30 días, máx. 3 intentos más recientes por `content_id`, umbral 5 contenidos distintos y `score = null` (no 0) bajo el umbral. Falta aprobación/calibración de producto antes de activarla globalmente.
- [x] Pruebas focalizadas (8 archivos, 61 tests), types y lint verificados con salida real. Lint: 0 errores y 3 warnings fuera del alcance (un import no usado en WordSearch y dos `max-lines` de scripts de integración).
- [ ] Comprobación runtime navegador/offline cuando aplique; si falta, fase pendiente.
- [ ] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. Preparar todo lo revisable antes de solicitar autorización de despliegue.
- [ ] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [x] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites de Fases A y B.

### Evidencia local 2026-09-27

- Fase A y candidata local de Fase B: contrato central de elegibilidad, `grade = 0`, buckets SRS
  exclusivos, `evaluatedTotal`, errores por sección, paginación estable por
  `answered_at + id`, ventana temporal cerrada, deduplicación de los 3 intentos
  más recientes y umbral de 5 contenidos distintos.
- Sin migración ni cambio remoto. La fórmula candidata (`0.75 × accuracy +
  0.25 × retention`) queda documentada solo para verificación local; no se
  presenta como contrato de producto, no se transforma en CEFR ni se añaden
  pesos de dificultad.
- Runtime navegador/offline, validación remota y commit siguen pendientes; esta
  evidencia local no se presenta como cierre global.

### Evidencia local Fase B 2026-09-27

- `SkillScore` candidato (`score | null`, `accuracy`, `evidenceCount`, `uniqueContentCount`,
  `insufficientEvidence`) sustituye al número plano; `frequency` retirado.
- `queries.ts` pasa `content_id` al lector; radar y balance muestran «—» y excluyen
  skills sin evidencia de mejor/peor y del promedio semanal.
- Corrección: la deduplicación conservaba los 3 intentos más antiguos; ahora los
  3 más recientes (test rojo con el código previo).
- Casos añadidos: 1 evidencia → null, grade 0 cuenta como fallo, recientes ganan.
- Verificación local: 8 archivos / 61 tests focalizados verdes; `pnpm type-check` exit 0
  y ESLint exit 0 con 3 warnings fuera del alcance.
- UI dividida para respetar 250 líneas: `FluencyDimensionList.tsx`,
  `SkillsBalanceHighlights.tsx`.

## STOP
No cambiar pesos ni transformar el score en CEFR sin un contrato aprobado. Si faltan content_id/attemptId en el lector, añadirlos desde la persistencia real; no generar identidad por texto similar.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.
