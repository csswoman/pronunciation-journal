# Plan 073: Conectar todo el contenido al ciclo común de aprendizaje

> **Executor instructions**: Ejecuta primero el Plan 074 y confirma sus criterios
> de integridad. Después implementa este plan como integración de contratos
> existentes. No crees un segundo scheduler, no conviertas completion o guardado
> en mastery y no acoples el presupuesto de Palabras esenciales al Plan diario.
> Lee primero `docs/architecture/integrated-learning-loop.md` y actualiza la fila
> 073 de `plans/README.md` al terminar cada fase verificable.
>
> **Drift check (run first)**:
> `git diff --stat ce654374..HEAD -- docs/architecture lib/progress lib/practice lib/tracking lib/essential-words lib/pronunciation components/courses components/mini-lessons components/tracking components/progress hooks/useDailyPlan.ts hooks/useEssentialWordsSession.ts`

## Status

- **Priority**: P1 product/pedagogy
- **Effort**: XL
- **Risk**: HIGH
- **Depends on**: plans/074-sanitize-review-and-learning-evidence.md, plans/066-create-pronunciation-target-registry.md
- **Continues**: remaining plan 065 phrase work and deferred plan 068/070 launch wiring
- **Blocks**: plans/075-consolidate-exercise-capabilities.md
- **Category**: product architecture, pedagogy, integration
- **Planned at**: commit `ce654374`, 2026-08-10
- **Current status**: DONE (2026-08-10: all eight phases implemented and verified)

## Why this matters

English Journal ya contiene teoría, vocabulario, pronunciación, práctica,
contenido personal, repaso y métricas. Varias superficies escriben al backbone
común, pero la conexión todavía depende de adapters parciales: una frase personal
puede quedar sin destino practicable; Ruta/Daily/Tracking no activan todos los
launch contracts; y completion, actividad y aprendizaje no siempre se presentan
como dimensiones distintas.

El objetivo no es hacer que cada pantalla escriba en todas las tablas. Es lograr
un ciclo verificable `contenido → target → ejercicio → evidencia → scheduling →
progreso` en el que cada acción aporte la señal que realmente representa.

## Current state

- `lib/practice/queries.ts::savePracticeAnswer` persiste answers y dirige efectos
  SRS solo a targets explícitos/compatibles.
- `lib/progress/activity-hub.ts::recordActivitySession` es la salida común de
  sesiones y reconciliación del Plan diario.
- `lib/practice/daily-plan/composer.ts` ya combina review, palabras
  guardadas/familiares, errores, sonidos débiles y siguiente teoría.
- Palabras esenciales registra answers/sesiones y mantiene un runtime/SRS propio;
  su cuota no debe derivarse del Plan diario.
- quizzes de Mazos/Mini-lecciones registran evidencia; `lesson_completions`
  conserva completion por separado.
- `lib/tracking/review-queue.ts` practica palabras y enlaza lecciones, pero omite
  frases sin resolver con `canonical_target_unresolved`.
- el registro canónico de pronunciación y los launch contracts de misiones ya
  existen; las notas de los planes 068/070 dejan Daily/Tracking/Route parcialmente
  sin call sites.
- Progreso ya consume sesiones, answers y estados de dominio, pero el producto
  necesita separar de forma sistemática actividad, cobertura y aprendizaje.
- El Plan 074 es responsable del bug topic-only de Repaso, la resolución
  canónica answer→skills, la eliminación de completion del score de aprendizaje
  y la persistencia exacta de intentos Essential Words. Este plan consume esas
  invariantes; no vuelve a implementarlas.

## Target contract

Toda superficie debe declarar uno de estos resultados:

1. `exposure`: el contenido fue visto.
2. `completion`: una unidad fue terminada.
3. `intent`: el usuario guardó o priorizó contenido.
4. `objective_evidence`: un ejercicio evaluó targets y modalidades explícitas.
5. `transfer`: el target se usó en material o contexto nuevo con una señal válida.

Solo `objective_evidence`/`transfer` pueden modificar estados de aprendizaje, y
únicamente según la política del owner. Un `PracticeContext` declara procedencia;
no identifica por sí solo el target.

## Scope

**In scope**:

- inventario y manifest verificable de contenido → targets → práctica;
- target refs explícitos en Ruta, Mazos y Mini-lecciones;
- cierre del resolver de frases personales sin target guessing;
- launch/reconcile entre Ruta, misiones, Plan diario y Tracking;
- política determinista de selección diaria con reason metadata;
- salida común answer/session para toda práctica evaluable;
- read models separados para actividad, cobertura y aprendizaje;
- tests de atribución, cross-surface sharing, offline/idempotencia y copy honesta;
- actualización de documentación arquitectónica.

**Out of scope**:

- reemplazar FSRS/SM-2 o crear un scheduler universal nuevo;
- fusionar `word_bank`, `tracked_items`, `topic_srs` y Essential Words en una tabla;
- hacer obligatorios todos los guardados en el Plan diario;
- contar navegación, lectura, completion o favoritos como mastery;
- evaluación acústica de fonema, stress, ritmo o entonación;
- rediseño visual amplio de Home, Daily, Review o Progress;
- autorar masivamente contenido nuevo antes de cerrar cobertura/identidad.
- corregir el bug topic-only, la clasificación base de skills o el writer de
  intentos Essential Words, que pertenecen al Plan 074;
- activar/retirar `error_correction` o `conjugation_blank` y consolidar
  generadores, que pertenecen al Plan 075.

## Phases

### Phase 1: Crear un inventario ejecutable de cobertura

Crear estos artefactos canónicos:

- `lib/learning-loop/types.ts` — tipos de content identity, target refs, señales,
  owners y disponibilidad de práctica;
- `lib/learning-loop/content-manifest.ts` — proyección/inventario ejecutable de
  manifests autorales existentes;
- `scripts/audit-learning-loop.mjs` — auditor read-only;
- `lib/learning-loop/__tests__/content-manifest.test.ts` — exhaustividad,
  duplicados, refs colgantes y allowlist;
- script `audit:learning-loop` en `package.json`.

El inventario debe enumerar todas las superficies y contenidos aprendibles:
currículo/Ruta, grammar decks, Mini-lecciones, Essential Words, Sound
Lab/pronunciation path, misiones y fuentes practicables de Tracking.
Por entrada debe declarar content id, target refs, tipo de señal, práctica
disponible y owner de progreso.

No crear un mega-registry runtime si manifests autorales existentes pueden
proyectarse a una vista de auditoría. El resultado debe fallar en CI ante ids
colgantes, duplicados incompatibles o contenido que promete práctica sin adapter.

**Verify**: `pnpm audit:learning-loop` y el test del manifest reportan cobertura
por superficie, cero target refs desconocidos y una allowlist explícita para
exposición no evaluable.

### Phase 2: Compartir identidad entre Ruta, Mazos y Mini-lecciones

Hacer que cada lección evaluable declare el topic o pronunciation target real que
enseña. Ruta y Mazos deben apuntar a la misma identidad autoral; Mini-lecciones
reutilizan esa identidad cuando hay equivalencia y conservan una identidad propia
cuando solo son contenido complementario.

Completion sigue escribiendo exclusivamente `lesson_completions`. Quiz/práctica
usa `PracticeAnswer` con topic/attribution explícitos. No migrar completions
históricos a mastery.

**Verify**: una lección abierta no cambia SRS; completion solo cambia cobertura;
un quiz/práctica desde Mazo y Mini-lección equivalente actualiza el mismo topic.

### Phase 3: Completar frases personales en Tracking

Cerrar los pendientes del plan 065 ahora que existe el registro 066. Definir un
resolver explícito que pueda producir:

- material de escucha/shadowing sin efecto SRS cuando solo existe la frase;
- pronunciation target refs autorales/seleccionados cuando estén disponibles;
- vocab/topic outcomes únicamente cuando se resolvieron a owners reales.

El texto normalizado de una frase no es suficiente para adivinar un target. No
crear un namespace SRS de `tracked_items`. Los elementos irresolubles siguen
siendo guardables y deben explicar qué evidencia falta para una práctica con
progreso.

**Verify**: colas exactas de palabras/frases/lecciones, frase solo actividad,
frase con targets explícitos, refs eliminadas, duplicados, offline reload y dos
cuentas sin fuga de datos.

### Phase 4: Activar launches canónicos

Conectar los contratos existentes de Ruta de pronunciación y misiones a call
sites reales:

- Ruta → contenido/práctica/misión del target exacto;
- Plan diario → misión o sesión con `targetIds`, source y step id;
- Tracking → práctica/misión de la selección exacta;
- Sound Lab/results → siguiente práctica de transferencia cuando corresponda.

La finalización debe reconciliar únicamente el step/source original. Cancelar,
fallar o completar otro target no puede cerrar el paso.

**Verify**: contract tests por origen prueban launch, resume, cancel, complete e
idempotencia; ninguna ruta usa slugs heurísticos cuando ya existe target id.

### Phase 5: Formalizar la política del Plan diario

Extraer/centralizar una política testeable de candidatos y prioridad:

1. due y verification-due;
2. errores/targets débiles;
3. siguiente paso de Ruta o prescripción;
4. máximo 1–2 guardados/familiares como desempate;
5. variedad/fallback.

Cada candidato debe incluir `reason`, target refs, fuente, estimación y capacidad
requerida. Mantener el cap actual del Plan diario y la independencia de la sesión
de Palabras esenciales. Evitar duplicar un target en dos pasos del mismo día.

**Verify**: tests deterministas prueban prioridad, capacidad, dedupe, offline,
degradación de servicios y que Daily nunca cambia intervalos antes de practicar.

### Phase 6: Cerrar todas las salidas de evidencia

Auditar cada ejercicio/runner. Toda respuesta evaluable llama exactamente una
vez a `savePracticeAnswer`; cada sesión coherente llama exactamente una vez a
`recordActivitySession`. Completion/exposure/intención usan sus writers propios
y no fabrican answers.

Corregir solo los gaps comprobados por el inventario. Mantener writers de dominio
especializados cuando son autoritativos y usar attribution para declarar efectos
multi-target o `srsEligible: false`.

**Verify**: matrices de caracterización por superficie prueban conteos exactos,
errores parciales, reintentos, resume y no duplicación answer/session.

### Phase 7: Separar los read models de Progreso

Definir tres projections explícitas:

- `activity`: sesiones, ejercicios, consistencia y tiempo;
- `coverage`: contenido encontrado/terminado;
- `learning`: retención, objective mastery, debilidades y transferencia.

Los queries deben conservar provenance y modalidad. La UI puede componer las
tres, pero no sumar señales incompatibles en un único porcentaje. Copy de
pronunciación se limita a la señal real (`stt_intelligibility`, percepción, etc.).

**Verify**: fixtures demuestran que guardar/leer/completar no aumenta learning;
answers espaciadas sí; una caída posterior reduce/abre review según el owner.

### Phase 8: Rollout, documentación y mantenimiento

Añadir feature flags únicamente donde una nueva recomendación/copy necesite
rollback, no para ocultar integridad de datos. Documentar migrations y backfill
si aparecen nuevos campos; validar RLS, user scoping y outbox antes de activar.

Actualizar `docs/architecture/integrated-learning-loop.md`, `progress.md`,
`exercises.md`, `srs.md` y los planes 065/068/070 con el estado realmente
cerrado. Añadir el checklist de contenido nuevo al proceso editorial/CI.

**Verify**: documentación sin enlaces rotos, migrations locales/RLS cuando
aplique, focused suites, typecheck, token lint si hay UI y smoke manual de los
recorridos principales.

## Suggested execution order

El plan es XL y debe ejecutarse en verticales pequeños, no como un solo PR:

0. Confirmar Plan 074 DONE y sus tests verdes.
1. Coverage audit + manifests.
2. Theory target refs.
3. Tracking phrases (cierre 065).
4. Route/Daily/Tracking mission launches (cierres diferidos 068/070).
5. Daily policy hardening.
6. Evidence exit audit.
7. Progress projections y copy.
8. Rollout/docs final.

Cada vertical debe dejar tests verdes y un commit aislado. No mezclar cambios
editoriales masivos con migrations o refactors de persistencia.

## Verification commands

Los paths finales dependen de los módulos creados, pero el executor debe cubrir
como mínimo:

```powershell
pnpm exec vitest run lib/tracking lib/practice/daily-plan lib/progress --maxWorkers=1
pnpm exec vitest run lib/pronunciation lib/ai-practice/missions --maxWorkers=1
pnpm exec vitest run components/mini-lessons components/courses --maxWorkers=1
pnpm audit:learning-loop
pnpm type-check
pnpm lint:design-tokens
git diff --check
```

Si una fase no toca UI, `lint:design-tokens` puede registrarse como N/A; no debe
usarse como sustituto de tests de atribución o scheduling.

## Done criteria

- [x] Todo contenido aprendible aparece en el inventario con identidad y señal.
- [x] Ruta, Mazos y Mini-lecciones comparten targets cuando corresponde.
- [x] Frases personales pueden practicarse sin target guessing ni SRS paralelo.
- [x] Ruta, Daily, Tracking, Sound Lab y misiones usan launches/reconcile exactos.
- [x] Plan diario prioriza todos los dominios con una política determinista.
- [x] Palabras esenciales conserva sesión/presupuesto independiente.
- [x] Cada ejercicio y sesión escribe evidencia exactamente una vez.
- [x] Progreso separa actividad, cobertura y aprendizaje comprobado.
- [x] Guardado, familiaridad, completion y mastery permanecen distintos.
- [x] Spoken evidence no promete precisión acústica no disponible.
- [x] Tests offline, idempotencia, target sharing y dos cuentas pasan.
- [x] Las invariantes del Plan 074 siguen verdes después de conectar superficies.
- [x] Documentación relacionada y estado de planes 065/068/070 están reconciliados.

## STOP conditions

- Un contenido no puede mapearse a identidad canónica: registrarlo como gap o
  exposición, no inferir un target por texto parecido.
- La propuesta requiere duplicar `word_bank`, `topic_srs`, Essential Words o el
  scheduler de pronunciación en una tabla paralela.
- Daily desplaza due work para introducir guardados o acopla su cuota al
  presupuesto interno de Palabras esenciales.
- Completion, bookmark, racha o volumen serían presentados como mastery.
- Un aggregate/group score actualizaría un target individual sin outcomes
  explícitos.
- STT/transcript matching sería etiquetado como phoneme, stress, rhythm o
  intonation accuracy.
- Una migration user-scoped no puede probar RLS, aislamiento y replay idempotente.

## Maintenance notes

`docs/architecture/integrated-learning-loop.md` es la fuente de verdad para la
relación entre superficies. Los documentos de cada dominio pueden especializar
su política, pero no redefinir las señales comunes. Toda feature nueva debe pasar
el checklist de contenido → target → señal → owner → scheduling → progress antes
de considerarse conectada.
