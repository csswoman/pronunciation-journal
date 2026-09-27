# Plan 050: Separar evidencia de conceptos, finalización y actividad diaria

## Estado y base
- Estado: IN PROGRESS (2026-09-27, corrección local comprometida; aceptación PWA offline y decisiones de producto pendientes). Contrato: docs/architecture/concepts-attribution-and-activity.md.
- Prioridad: P1. Esfuerzo: L. Riesgo: alto.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: 044 y 046; coordinar métricas con 047.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: implementación y SQL local; aceptación runtime local intentada, sin migraciones ni escrituras remotas. El incidente de entorno del primer intento está registrado abajo.

## Problema y evidencia
activity-hub.ts:227 marca mastered por ratio>=0.8 sin mínimo. queries.ts:240 construye multiple_choice de cursos sin taskSkill en el payload leído. useDailyPlan.ts:158 llama recordDailyStepCompletion. plans/README.md descarta expresamente que completar un mazo al llegar a su última tarjeta sea por sí mismo un bug.

Resultado esperado: Productores reales conservan atribución exacta, sesiones no se inflan y los estados de concepto/completion siguen un contrato explícito. Política histórica y cambios de producto separados del cableado.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- lib/progress/activity-hub.ts lib/practice/queries.ts hooks/useDailyPlan.ts`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `lib/progress/activity-hub.ts`
- `lib/practice/queries.ts`
- `hooks/useDailyPlan.ts`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Reconciliar con planes 006, 020, 021, 022, 026 y 027: no deshacer distinción actividad/completion/dominio ni atribución canónica. Caracterizar productor→persistencia→lector de quiz de curso, drill grammar-deck y checklist diario.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Añadir taskSkill y topic solo desde la tarea/concepto canónico. No inferir grammar porque el formato sea multiple_choice. Drill sin atribución objetiva mantiene actividad y no SRS; el objetivo es conectar evidencia válida, no forzar todos los resultados al SRS.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Definir acumulación por intentos únicos, contenido y tiempo para ConceptSignal. Propuesta n>=5 y 80% es un mínimo inicial, no prueba automática de dominio: no activar nueva etiqueta mastered sin decisión de producto. Reusar la fusión atómica existente si aplica, evitando sobrescribir JSON completo entre pestañas.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Mantener completion de mazos como recorrido si ese contrato sigue vigente. Si se adopta vista/aprobada, añadir estados explícitos sin convertir el historial recorrido en aprobaciones. Revisar consumidores de desbloqueo antes de cambiar semántica.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Distinguir checklist manual de sesión real. Evitar la fila vacía redundante únicamente cuando una sesión con identidad/procedencia equivalente ya registra ese paso. No borrar toda actividad daily_plan ni suprimir acciones manuales sin otra evidencia. Verificar reconstrucción tras reload y offline.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Inventariar rachas y denominadores en Home/curso/progreso: umbral de actividad 1 frente a objetivo 5 deben llevar nombres diferentes; adoptar America/Lima donde corresponda al contrato actual, sin mezclar UTC en límites diarios. Resolver core/opcional por propósito de cada porcentaje.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 7. Entrega 7
Revisar P3 restante: interval desactualizado de fragments y flushOutbox sin userId; comprobar rutas activas antes de corregir. XP por skip, unificación global de dominio y política de ruta opcional quedan decisiones explícitas, no correcciones automáticas.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: 1/1 no se convierte automáticamente en dominio; retry no duplica concepto; conceptos distintos no se mezclan; payload prevalece sobre metadata; MC de escucha no se atribuye a gramática; daily manual vs sesión; medianoche Lima y UTC; recarga offline.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run lib/progress/__tests__/activity-hub.test.ts lib/progress/__tests__/concept-evidence.test.ts lib/practice/__tests__/course-task-attribution.test.ts --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [ ] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [ ] Productores reales conservan atribución exacta, sesiones no se inflan y los estados de concepto/completion siguen un contrato explícito. Política histórica y cambios de producto separados del cableado.
- [ ] Pruebas focalizadas, types y lint verificados con salida real.
- [ ] Comprobación runtime navegador/offline cuando aplique; si falta, fase pendiente.
- [ ] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. Preparar todo lo revisable antes de solicitar autorización de despliegue.
- [ ] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [ ] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## STOP
Si un hallazgo ya está resuelto por planes anteriores, documentarlo como resuelto; no reabrir por el texto de la auditoría. Si cambiar completion afecta desbloqueos, detener esa fase para decisión explícita.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.


## Registro de ejecución (2026-09-27, base `791e5be2`)
Drift: `activity-hub.ts` usa `isEvaluatedPracticeAnswer`; `savePracticeAnswer` movido a `answer-queries.ts`. Diagnóstico vigente.

Caracterización roja (antes de corregir, 6 fallos / 3 pasan, por aserción): 1/1 → `mastered`; sesiones no acumulan (2 ≠ 5); misma pregunta ×5 cuenta 5; `taskSkill` no persiste; drill sin `topic`; drill registrado como concepto `grammar-deck:a1-verbo-to-be`. `fragment-srs`: `interval` quedaba en 1.
Hallazgos adicionales: ítems `grammar_focus` creaban conceptos `<slug>:rule:<n>`; sesión Daily con `reconciled_step_ids: []` + fila manual vacía por paso; Home inmersión con umbral 5; `get_activity_totals` en UTC y contando filas `daily_plan`.

Puertas:
- [x] Caracterización demuestra el fallo.
- [x] Atribución/acumulación/checklist con contrato explícito (docs/architecture/concepts-attribution-and-activity.md). Entrega 4 sin cambios (completion = recorrido; vista/aprobada afecta desbloqueos → decisión).
- [x] Focalizada 23/23; vecinos 179/179 (35 archivos); `pnpm type-check` y `pnpm lint` exit 0; `git diff --check` limpio; `pnpm check:migrations` OK.
- [ ] Runtime navegador/offline: aceptación completa sigue pendiente. Auth local, Daily, práctica e hidratación ya verifican en navegador; falta aceptación offline con service worker activo. Primer intento: `next-dev-loop` no pudo abrir una instancia Turbopack porque `next dev --webpack` ya estaba activo en `:3000` (PID 31252); no se cerró el proceso del usuario ni se degradó la aceptación a HTTP 200.
- Incidente del primer intento alojado: además de las dos respuestas 200 de `word-of-the-day` y timeouts de rate-limit descritos arriba, no se aplicaron migraciones ni escrituras de datos en Supabase remoto; el servidor se detuvo y no se volvió a usar.
- Continuación runtime local (2026-09-27): Next 16.3/Turbopack arrancó con URL local de Supabase; `get_compilation_issues` devolvió `issues=[]`. Chrome abrió `/daily` y mostró el shell invitado, pero quedó en «Preparando tu plan…». Login y sesión invitada fallaron con `TypeError: Failed to fetch` al endpoint Auth. Desde Chrome fallaron `/auth/v1/health` en `127.0.0.1:54321` y `localhost:54321`, mientras `localhost:3000/api/health` respondió 200 y Supabase local respondió 200 desde PowerShell. `get_errors` en `/daily` quedó vacío; por falta de conectividad del navegador no se acepta el flujo autenticado ni la recarga offline. La cuenta QA temporal se eliminó tras verificar el usuario exacto en Supabase local. En la sesión previa se habían observado hydration mismatches en `QuickSettingsControls.tsx:124` y en la pestaña anterior `/practice/sounds/sound/1` (`WordCarousel.tsx:64`), fuera de los archivos de Plan 050.
- Resolución del bloqueo local de navegador (2026-09-27): con Supabase local configurado, el navegador ahora envía Auth y Data API por el rewrite same-origin `/__supabase-local/*`; el destino solo se habilita en desarrollo para URLs loopback. Chrome verificó `POST /__supabase-local/auth/v1/signup` y lecturas `/rest/v1/*` con HTTP 200, y navegó a `/` al pulsar «Probar una sesión». Se eliminó la cuenta QA anónima temporal de Supabase local.
- Cierre parcial de runtime (2026-09-27): sesión invitada local recién creada recorrió `/practice/sounds/sound/1` y `/daily`; el plan se preparó y mostró actividades, sin errores de navegador. Se corrigió la causa del mismatch: `useLoadingWords` elegía su lista inicial con `Math.random()` durante SSR/hidratación; ahora el primer render usa fallback estable y la mezcla ocurre en `useEffect`. `WordCarousel` consulta `prefers-reduced-motion` después del montaje, y QuickSettings espera el montaje antes de exponer preferencias persistidas. El login/práctica y QuickSettings desplegado no reportaron hydration errors en la sesión limpia. Prueba focalizada `hooks/__tests__/useLoadingWords.test.ts`: 5/5.
- Caché offline parcial: al abortar únicamente llamadas del navegador a Supabase local, `/daily` conservó el plan cacheado y sus actividades; la reconciliación remota falló como se espera sin conexión. No se acepta aún la recarga offline total: Chrome offline devuelve `ERR_INTERNET_DISCONNECTED` en `next dev`, donde `withSerwist` deshabilita explícitamente el service worker (`disable: NODE_ENV !== 'production'`). Requiere validar una build PWA/producción; no se alteró el contrato de desarrollo para forzar esa prueba.
- [x] SQL `20260927030000_activity_totals_lima_days.sql`: aplicado en Supabase local con `supabase migration up --local`. Prueba PostgreSQL transaccional con rollback: 3 filas → `sessions=2`, `exercises=5`, `duration_ms=300000`, `active_days=2`; excluyó el checklist `daily_plan` vacío y separó correctamente 04:30Z/05:30Z en dos fechas de Lima. Remoto pendiente y bloqueado: `supabase migration list --linked` muestra migraciones locales sin aplicar desde `20260923120000` y cinco versiones remotas sin archivo local (`20260926063939`, `20260926064115`, `20260926144614`, `20260926144617`, `20260926144619`). Reconciliar el historial antes de cualquier `db push`; requiere autorización y alcance propio.
- Fallos preexistentes (idénticos con los archivos en HEAD): `PracticeSession.test.tsx` (mock sin `getOrCreateSession`), `GenericExerciseView.status.test.tsx` y `producer-roundtrip.integration` misiones (ids de respuesta hash desde 046). `pnpm audit:hard-rules`: 101 violaciones preexistentes, ninguna en archivos tocados.

Decisiones de producto pendientes: umbral `mastered` 5 contenidos/80 %, espaciado temporal mínimo, `mastered` del diagnóstico con 1/1, vista/aprobada, `taskSkill` autoral por mazo, XP por saltar, dominio global.
