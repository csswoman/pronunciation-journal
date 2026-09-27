# Plan 048: Separar EMA y presentación de maestría de sonidos sin perder actualizaciones

## Estado y base
- Estado: IN PROGRESS; correcciones locales verificadas con suite focalizada, type-check y lint; esquema remoto verificado en solo lectura y contrato SQL transaccional verde en local (2026-09-27); historial remoto reparado; solo falta la verificación browser/outbox.
- Prioridad: P1. Esfuerzo: L. Riesgo: alto.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 046 fase A para identidad de eventos.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales y fake-indexeddb. Según confirmación del usuario, la migración fue aplicada en Supabase; la firma RPC, RLS, concurrencia y replay remotos siguen sin verificarse en esta sesión.

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

La identidad estable de sesión requiere además `lib/practice/types.ts`, `lib/practice/session-result.ts` y `components/practice/session/useSessionCompletion.ts`; son parte del alcance directo, no cambios ajenos.

Los lectores server-side que alimentan rankings también forman parte del alcance: `lib/home/queries.ts`, `lib/progress/queries.ts` y `lib/sounds/queries.ts` ahora solicitan la EMA cruda, su reloj y el contador explícito.

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
pnpm exec vitest run lib/phoneme-practice/__tests__/mastery-pct.test.ts lib/phoneme-practice/__tests__/mastery-read.test.ts lib/phoneme-practice/__tests__/contrast-progress-concurrency.test.ts lib/phoneme-practice/__tests__/contrast-progress-persistence.test.ts lib/phoneme-practice/__tests__/finish-session.test.ts lib/phoneme-practice/__tests__/queries-offline.test.ts lib/practice/__tests__/session-result.test.ts lib/sounds/__tests__/queries.test.ts lib/progress/__tests__/queries-truncation.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables, `pnpm type-check` y lint verdes. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

Evidencia local: `pnpm audit:hard-rules` pasó prompts y auditoría estática RLS, pero se detuvo en `lint:design-tokens` por 101 violaciones preexistentes en superficies ajenas (Immersion, juegos, Word Search y Connected Speech); no se alteraron esas superficies para cerrar este plan.

## Puertas de cierre
- [x] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica (s1=25% caía a s2=13% en sesiones consecutivas al 80%).
- [x] Pruebas separan algoritmo puro (computeNextRawEma), proyección (projectMasteryPct) y persistencia; ninguna caída causada por reaplicar repScale; la proyección Dexie y replay local cubren deltas/idempotencia sin afirmar que sustituyen la prueba SQL.
- [x] Pruebas focalizadas (61 tests del dominio), `pnpm type-check` y lint (`eslint .`) verificados con salida real.
- [ ] Comprobación runtime navegador/offline y sincronización outbox contra un backend real; fake-indexeddb cubre rollback/cache local, no sustituye esta puerta.
  - Intento 2026-09-27 (dev :3100 contra Supabase local, Playwright con `bypassCSP` porque `proxy.ts` fija `connect-src` a `*.supabase.co`): el login con contraseña deja una cookie válida (`is_anonymous: false`), pero el cliente nunca monta al usuario: sin Dexie, sin `window.__syncRecovery`, error de hidratación y 404 en `_next/static/chunks/components_0fy-u_q._.js` (persiste tras borrar `.next/dev`). Había WIP ajeno del plan 050 modificándose en el árbol. No se llegó a la sesión offline; queda como verificación manual.
  - Segundo intento 2026-09-27: el servidor activo del checkout en `:3000` usa webpack y su `/_next/mcp` no expone `get_compilation_issues`. Para no detener ese proceso ni interferir con el WIP del plan 050, se levantó una copia temporal e ignorada del estado local con Next 16.3.5 + Turbopack en `:3100`; el MCP sí expuso `get_compilation_issues` y `compile_route`, pero tanto el grafo global como `/practice/sounds/sound/[soundId]` agotaron 120 s, y la ruta siguió compilando más de tres minutos. Se aplicó STOP tras dos timeouts; no se abrió el navegador ni se afirmó sincronización runtime. El servidor y ambas copias temporales se retiraron, sin tocar `:3000`.
- [x] Si hay SQL: nueva migración 20260927020000_contrast_raw_mastery_and_events.sql con RLS habilitada y verificada estáticamente con check-migrations y audit-rls.
- [x] Integración local/remota de RLS, firma RPC, concurrencia SQL y replay (el sub-ítem abierto de immersion es ajeno a este plan). Avance 2026-09-27:
  - [x] Caso de integración escrito: `scripts/rls-integration-contrast.mjs` (enlazado desde `rls-integration-cases.mjs`): replay idempotente, 3 sesiones concurrentes + replay concurrente (40 intentos / 4 sesiones), proyección 25.3 → 50.6 al 80% constante, evento offline antiguo sin retroceso SRS, entradas inválidas rechazadas, aislamiento cross-user. `audit:rls` ya no lista `contrast_session_events`.
  - [x] Remoto (`enpxrijfnkcgvkyrjxod`, solo lectura): firma de 13 args única y `SECURITY INVOKER`; EXECUTE solo `authenticated`; RLS activa en ambas tablas; columnas y UNIQUE presentes; cuerpo de ambas RPC idéntico al archivo (md5 con CRLF: `71e50fec…`, `7bb76f97…`).
  - [x] Local (`http://127.0.0.1:54321`, 2026-09-27): la migración no estaba aplicada en local; se aplicó con `supabase migration up --local`. Los casos de `rls-integration-contrast.mjs` pasan (`Contrast RLS/RPC cases passed.`, exit 0) con RPC concurrentes reales vía PostgREST; usuarios temporales limpiados (0 restantes).
  - [ ] La suite completa `pnpm test:rls:integration` en local se detiene después de los casos de contraste en un hueco preexistente ajeno: `missing seeded immersion lesson for RLS progress coverage` (local sin seed de `immersion_lessons`).
  - [x] Historial remoto reparado por el usuario (`supabase migration repair`); verificado 2026-09-27: `20260927020000 contrast_raw_mastery_and_events` figura en `supabase_migrations.schema_migrations`.
- [x] `git diff --name-only` contiene solo archivos previstos, descontando el WIP ajeno de AI Coach, Tracking y Vocabulary.
- [x] Contrato y notas de mantenimiento actualizados en docs/architecture/phoneme-mastery-state.md y enlazados en docs/README.md.

## STOP
No renombrar silenciosamente mastery_pct a EMA cruda sin actualizar todos los consumidores. Si no hay procedencia para reparar el histórico, entregar estrategia de compatibilidad antes de migrar.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.
