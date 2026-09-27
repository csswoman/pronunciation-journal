# Plan 048: Separar EMA y presentación de maestría de sonidos sin perder actualizaciones

## Estado y base
- Estado: TODO; planificación, no implementación autorizada.
- Prioridad: P1. Esfuerzo: L. Riesgo: alto.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 046 fase A para identidad de eventos.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
mastery-pct.ts:64 devuelve `ema * repScale`, reutilizando oldMastery ya escalado. contrast-queries.ts:145 lee current y calcula totales absolutos `current.total_attempts + sessionTotal`. La existencia y contrato del segundo escritor RPC se deben revalidar antes de intervenir.

Resultado esperado: Pruebas separan algoritmo puro, proyección y persistencia; ninguna caída causada por reaplicar repScale; prueba transaccional de concurrencia si se cambia el escritor.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- lib/phoneme-practice/mastery-pct.ts lib/phoneme-practice/contrast-queries.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `lib/phoneme-practice/mastery-pct.ts`
- `lib/phoneme-practice/contrast-queries.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Reproducir dos sesiones al 80% con reloj fijo y la pérdida de escala acumulada. Especificar por separado EMA almacenada, decaimiento temporal y repScale de presentación. No exigir monotonía universal: una pausa larga o rendimiento menor puede bajar una estimación válida.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Inventariar escritores/lectores de mastery_pct y cachedContrastProgress con git grep. Incluir ruta de Essential Words y su RPC efectiva si existe; listar archivos exactos en el alcance antes de editar.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Diseñar campo/versionado para estado crudo y compatibilidad de clientes anteriores. Los valores históricos escalados y redondeados no permiten recuperar exactamente una EMA; no aplicar una división y presentarla como reconstrucción exacta. Preparar estrategia conservadora y reversible.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Calcular y persistir EMA cruda; aplicar escala una sola vez al mostrar y evitar doble decaimiento. Mantener [0,100], manejo de fechas inválidas y reloj determinista. Aclarar que la constante llamada half-life no coincide con exp(-days/14); cualquier cambio de curva es una decisión separada.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Fase concurrencia: si se confirma segundo escritor incompatible, usar eventos/deltas idempotentes y acumulación transaccional en servidor, preservando proyección Dexie offline. No reemplazar conflictos por latest-write-wins sobre totales.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Probar lector legado/nuevo, dos dispositivos offline, eventos repetidos y reconexión. Preparar migración nueva y rollout compatible si el formato cambia; no desplegar remoto sin autorización.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: Dos sesiones 80%; pausa larga; sesiones al mismo instante; fecha inválida; NaN/Infinity; límites; nueva/legada; concurrencia + replay suman cada evento una vez.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/phoneme-practice/__tests__/mastery-pct.test.ts lib/phoneme-practice/__tests__/contrast-progress-concurrency.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [ ] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [ ] Pruebas separan algoritmo puro, proyección y persistencia; ninguna caída causada por reaplicar repScale; prueba transaccional de concurrencia si se cambia el escritor.
- [ ] Pruebas focalizadas, types y lint verificados con salida real.
- [ ] Comprobación runtime navegador/offline cuando aplique; si falta, fase pendiente.
- [ ] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. Preparar todo lo revisable antes de solicitar autorización de despliegue.
- [ ] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [ ] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## STOP
No renombrar silenciosamente mastery_pct a EMA cruda sin actualizar todos los consumidores. Si no hay procedencia para reparar el histórico, entregar estrategia de compatibilidad antes de migrar.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.

