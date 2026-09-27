# Plan 049: Mostrar datos reales, estados vacíos y etiquetas fieles

## Estado y base
- Estado: DONE (local); verificado con suite focalizada (30 tests), types, lint y tokens.
- Prioridad: P1. Esfuerzo: M. Riesgo: medio.
- Base inspeccionada: `70d98322`, 2026-09-26, D:/proyectos/english-journal.
- Dependencias: — para fallbacks; 047 para nuevos estados de evidencia.
- Fuente: auditoría aportada «evaluación → progreso → UI», conservada en audit-source.md.
- Alcance de comprobación: lecturas locales, no reproducción runtime ni consultas remotas nuevas.

## Problema y evidencia
ThisWeekCard.tsx:21 reemplaza cero por 53; SessionReady.tsx:71 usa `stats.totalWords || 2800`; SessionReadyHero.tsx:135 imprime un último resultado fijo; SkillsBalanceCard.tsx:185 cae en «Mejorando esta semana»; VocabularyReviewCard.tsx:34 rellena un segmento cuando learned=0; FluencyRadarCard.tsx:50 anuncia seis dimensiones aunque lista writing.

Resultado esperado: Cada número personal visible tiene una fuente real o estado vacío/indisponible. Tests focalizados pasan; aceptación visual reportada por separado.

## Preflight obligatorio
1. Leer AGENTS.md, CLAUDE.md, ENGINEERING_STANDARDS.md y este plan completo.
2. Ejecutar `git status --short` y `git diff 70d98322..HEAD -- components/progress/ThisWeekCard.tsx components/daily/DailyProgressSidebar.tsx components/practice/essential-words/SessionReady.tsx components/practice/essential-words/SessionReadyHero.tsx components/progress/SkillsBalanceCard.tsx components/practice/hub/VocabularyReviewCard.tsx components/progress/FluencyRadarCard.tsx`; comparar también cambios sin commit con `git diff` y `git diff --cached`.
3. Confirmar los extractos anteriores. Si hay drift, revalidar el diagnóstico antes de editar; si ya está corregido, marcar resuelto por evidencia.
4. Trabajar en checkout adecuado de dev. No cambiar rama, limpiar cambios, hacer commit, push ni despliegue sin instrucción. No revertir trabajo ajeno.
5. Inventariar imports/callers con `git grep`; cualquier ruta adicional indicada en los pasos se debe identificar, leer e incorporar al alcance antes de editarla. Si requiere otro dominio no previsto, STOP.
6. Establecer baseline con la suite focalizada existente. Los archivos nuevos citados en los comandos se crean durante la fase de caracterización; no ejecutar un comando de archivo inexistente como prueba del bug.

## Alcance
Archivos principales permitidos:
- `components/progress/ThisWeekCard.tsx`
- `components/daily/DailyProgressSidebar.tsx`
- `components/practice/essential-words/SessionReady.tsx`
- `components/practice/essential-words/SessionReadyHero.tsx`
- `components/progress/SkillsBalanceCard.tsx`
- `components/practice/hub/VocabularyReviewCard.tsx`
- `components/progress/FluencyRadarCard.tsx`
Además: tests focalizados indicados, helpers del mismo dominio necesarios y documentación del contrato. Migraciones nuevas solo donde los pasos lo indican; nunca modificar SQL histórico. Registrar rutas exactas antes de ampliar. Documentar el cambio en docs/architecture/ del dominio y enlazar desde docs/README.md; actualizar README/CLAUDE/ENGINEERING_STANDARDS solo si cambia su contrato.

Fuera de alcance: refactor general, cambio de CEFR, sustitución de Dexie, estilos no necesarios, borrar historial, backfill inventado y despliegue remoto. No forzar archivos existentes grandes a una división general: nuevas piezas pequeñas, máximo 250 líneas según reglas del repo; si no puede cumplirse dentro del alcance, detener y explicar.

## Pasos
### 1. Caracterizar y confirmar
Leer PRODUCT.md, DESIGN.md, THEME_SYSTEM.md, docs/design/visual-language.md y docs/design/primitives.md antes de tocar componentes. Rastrear callers y confirmar que cada fallback observado es alcanzable en producción; los datos decorativos explícitos no son progreso.

Verificación: ejecutar la prueba focalizada nueva y confirmar fallo por la causa descrita, no por mocks/imports; guardar esa salida como evidencia. No dejar una entrega compartida deliberadamente roja.

### 2. Entrega 2
Eliminar 53/8, previsiones fijas 29/23, nuevas=2, total=2800 y último resultado fijo donde no exista evidencia. Cero válido permanece cero; null/loading/error se distinguen. No inventar un nuevo forecast como reemplazo.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 3. Entrega 3
Con learned=0 mostrar cero segmentos llenos. Comparación semanal ausente no afirma mejora. Incorporar writing y derivar cantidad de dimensiones de la colección real, incluyendo aria-label.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 4. Entrega 4
Localizar el caller que etiqueta weakestPhonemes.accuracy y la retención del hub. Corregir nombres/copy para reflejar maestría o precisión de 7 días según la fuente; registrar las rutas encontradas antes de modificar. No cambiar el algoritmo aquí.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 5. Entrega 5
Agregar pruebas útiles de render para usuario nuevo, solo escritura, última sesión real y error de datos; reutilizar SessionReady.test.tsx y VocabularyReviewCard.test.tsx. No escribir snapshots de todo el markup.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

### 6. Entrega 6
Validar navegador con pnpm dev en claro/oscuro y otro hue: usuario nuevo, usuario con datos y lectura fallida. Documentar limitación si el servidor no arranca; no declarar aceptación visual por tests.

Verificación: ejecutar los casos aplicables de la suite focalizada siguiente; salida esperada: exit 0. Si el paso es de diseño o SQL, adjuntar contrato/consulta y resultados locales antes de activar el cambio.

## Pruebas y comandos
Patrón Vitest del repo: `lib/practice/__tests__/grade.test.ts` usa describe/it/expect y factories tipadas. Para UI usar Testing Library y tests vecinos; para Dexie usar el harness fake-indexeddb existente, no solo mocks de escritores.

Casos obligatorios: 0 ejercicios no muestra 53; sin sesión no muestra 0:42; sin pronóstico no predice 23; 0 palabras no sustituye 2800; writing visible; dimensiones accesibles correctas; error no muestra 0%.

Comando focalizado tras crear/actualizar los tests:
```powershell
pnpm exec vitest run components/progress/__tests__/truthful-progress.test.tsx components/practice/essential-words/__tests__/SessionReady.test.tsx components/practice/essential-words/__tests__/SessionReadyHero.test.tsx components/practice/hub/__tests__/VocabularyReviewCard.test.tsx --maxWorkers=1
pnpm type-check
pnpm lint
git diff --check
```
Resultado: tests aplicables verdes y comandos exit 0. Registrar fallos preexistentes por separado; no reparar producción para satisfacer mocks obsoletos. No ejecutar `pnpm test` completo automáticamente: AGENTS.md limita consumo en Windows. Para migraciones ejecutar además `pnpm check:migrations` y `pnpm audit:hard-rules`; estos checks no prueban comportamiento SQL. Ejecutar pruebas transaccionales solo contra entorno local desechable, confirmando primero el destino y sin imprimir secretos.

## Puertas de cierre
- [x] Caracterización demuestra el fallo o documenta que el hallazgo ya no aplica.
- [x] Cada número personal visible tiene una fuente real o estado vacío/indisponible. Tests focalizados pasan; aceptación visual reportada por separado.
- [x] Pruebas focalizadas, types y lint verificados con salida real.
- [ ] Comprobación runtime navegador/offline cuando aplique; si falta, fase pendiente.
- [x] Si hay SQL: aplicación local, validación remota y recuperación de datos tienen estados separados. Preparar todo lo revisable antes de solicitar autorización de despliegue.
- [x] `git diff --name-only` contiene solo archivos previstos, descontando cambios ajenos documentados.
- [x] Contrato y notas de mantenimiento actualizados; fila del índice actualizada con evidencia y límites.

## STOP
Si el valor viene de un caller que no se inspeccionó, rastrearlo antes de eliminarlo. No rediseñar estilos, tokens ni layout fuera del mínimo necesario para estados honestos.
Detener también si una verificación falla dos veces tras ajustes razonables, si falta una decisión de producto requerida o si se necesita sobrescribir cambios ajenos. Entregar lo independiente ya preparado, sin declarar DONE global.

## Mantenimiento
Cada nuevo productor debe cumplir los mismos casos de estado, identidad y atribución. Revisar futuras migraciones y lectores junto con sus escritores. Mantener separados actividad, respuesta evaluada, espaciado, finalización y dominio; un test estático o un mock no demuestra sincronización real.

