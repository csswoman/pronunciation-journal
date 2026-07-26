# Plan 068 — Ruta de pronunciación basada en transferencia (vertical delgado)

> **Diseño (spec) generado en brainstorming, 2026-07-25.** Este documento es el
> spec; el plan ejecutable se deriva después con writing-plans
> (`docs/superpowers/plans/2026-07-25-pronunciation-learning-route.md`).

## Por qué importa

La Ruta CEFR actual trata la pronunciación como un enlace genérico a Sound Lab.
Eso no comunica qué aprender primero ni exige transferencia de palabra → frase →
uso. El registro 066 y el diagnóstico 067 ya existen; falta una superficie que
los orqueste sin inventar otro sistema de progreso ni scores acústicos
(071 = NO-SHIP).

## Decisiones de brainstorming

| Decisión | Elección |
|---|---|
| Alcance del primer ship | **Vertical delgado**: modelo 5 etapas + UI `/courses/pronunciation` + CTA desde diagnóstico. Audit de contenido, Daily y Sound Lab “next” → commits / ships siguientes. |
| Fuente de “siguiente acción” | Prioridades del diagnóstico 067 si existen; si no, primer target incompleto de la etapa 1 (orden canónico). |
| Estados de unidad | Los 4 estados completos: `not_started \| learning \| ready_for_transfer \| retained`, con tests puros. |
| Enfoque de UI | Orquestador puro + UI tokenizada (`PageLayout`/`PageHeader` + Tailwind). No clonar `course-path.css`. |

## Objetivo

Exponer `/courses/pronunciation` como orquestador sobre registry 066 + completion
059 + evidencia hablada 063 + prioridades del diagnóstico 067, con una sola
siguiente acción clara y cinco etapas de transferencia visibles.

## Alcance

**In scope (este ship):**
1. `lib/pronunciation/path/*` — curriculum de 5 etapas, `unit-state`, `recommend`.
2. Ruta `/courses/pronunciation` + `components/courses/pronunciation-path/*`.
3. Feature flag de copy `pronunciationPathCopy` (solo phrasing de outcome/nivel).
4. CTA desde resultados del diagnóstico → `/courses/pronunciation?target=<id>`.
5. Enlace contextual desde el aside de Courses (reemplazar/complementar el genérico a Sound Lab).
6. Deep links `?target=` y `?stage=1..5`.
7. Tests puros + de componentes; typecheck; design-token lint.
8. Actualizar `plans/README.md` fila 068 y doc de arquitectura breve.

**Out of scope (ships siguientes):**
- Audit exhaustivo / autoría de lecciones nuevas (`pnpm audit:course-content` como gate de gaps).
- Integración Daily “reason → unidad”.
- Sound Lab completion → “next phrase/route action”.
- Misión de transferencia real (plan 070) — solo placeholder / contrato reservado.
- Nuevo ítem primario en el sidebar.
- Cualquier score acústico de vocales/prosodia (071 NO-SHIP).
- Reemplazar la Course Path gramatical.

## Diseño

### 1. Curriculum (`lib/pronunciation/path/curriculum.ts`)

Agrupación **fija y determinista** de los targets del registry (sin duplicar
definiciones de target en la UI):

| Stage id | Título (ES) | Target ids (orden canónico) |
|---|---|---|
| `sounds` | Sonidos y contrastes | `segmental.contrast.θ\|ð`, `segmental.contrast.iː\|ɪ`, `segmental.phoneme./ə/` |
| `word-stress` | Sílabas y word stress | `prosody.word-stress` |
| `sentence-prosody` | Sentence stress, ritmo y weak forms | `prosody.sentence-stress`, `prosody.rhythm` |
| `connected` | Linking, reductions, elision, assimilation | `connected.reduction.gonna`, `connected.linking`, `connected.elision`, `connected.assimilation` |
| `intonation-transfer` | Intonation y transferencia | `prosody.intonation.rising-question` (+ slot misión 070 no implementado) |

Cada unidad declara:
- `targetId` (canónico 066)
- `contentRefs` desde `content-map` (theory/practice assets existentes)
- `practiceHref` vía `targetIdToPracticeRoute` (segmental → `/practice/sounds`; prosody/connected → `null` hasta que existan rutas; entonces el CTA primario puede apuntar a la lección mapeada o a “contenido de la ruta”)
- `prerequisites` del registry (no redefinir)

Invariantes de test: 5 etapas, cada registry target aparece exactamente una vez,
prereqs acíclicos, todos los ids `getTarget(...).ok`.

### 2. Estados de unidad (`lib/pronunciation/path/unit-state.ts`)

```ts
type UnitLearningState =
  | 'not_started'
  | 'learning'
  | 'ready_for_transfer'
  | 'retained'
```

**Entradas (puro, inyectables):**
- `completedLessonKeys: ReadonlySet<string>` — keys `courseSlug:lessonSlug` (o el
  shape canónico de 059) filtrables por slugs del content-map del target.
- `spokenAttempts: readonly SpokenAttempt[]` — solo `outcome === 'scored'` cuenta.
- `diagnosticResult?: TargetResult` — opcional; `needs_evidence` / prioridades.

**Reglas (honestidad 071):**
- Visitar la ruta ≠ progreso.
- `unscored` / `skipped` / `failed` ≠ progreso objetivo.
- No fabricar scores acústicos; dimensiones no medidas no impulsan `retained`.
- Targets con `masteryEligible: false` no alcanzan `retained` por STT solo
  (pueden llegar a `learning` / `ready_for_transfer` vía perception/self-report
  documentado, o quedarse en `learning` si solo hay completion de contenido).
- `not_started`: sin completion de contenido mapeado y sin attempts scorables.
- `learning`: hay completion teórica y/o al menos un attempt scorable, pero aún
  no cumple umbral de transferencia.
- `ready_for_transfer`: contenido relevante done (si existe mapping) **y**
  evidencia objetiva de producción/percepción según capabilities del target
  (p.ej. ≥1 scorable controlled/contextual attempt, o percepción objetiva para
  word-stress).
- `retained`: evidencia scorable espaciada (umbral documentado en código, p.ej.
  ≥2 scorables en días distintos o intervalo mínimo). Si no hay intentos
  persistidos disponibles en el adapter, **no** subir a `retained`.

Badge UI (no es un 5º estado): si el diagnóstico marca el target
`needs_evidence`, mostrar “necesitamos más evidencia” sin cambiar el estado
derivado.

### 3. Recomendación (`lib/pronunciation/path/recommend.ts`)

Orden de decisión:
1. Targets con `status === 'priority'` en el último diagnóstico local, en orden
   de prioridad, cuyo `UnitLearningState !== 'retained'`.
2. Si no hay diagnóstico o no quedan prioridades: primer target del orden
   canónico global (etapa 1 → … → 5) con estado ≠ `retained`.
3. Si todo está `retained`: recomendar exploración / re-diagnóstico (copy
   neutro).

Salida: `{ targetId, stageId, reasonKind: 'diagnostic_priority' | 'canonical_next' | 'all_retained', reasonEs }`
(el string de reason va detrás del flag de copy cuando afirma outcome).

### 4. Wiring de datos (cliente)

- Completions: leer `db.completedLessons` scoped por `userId` (plan 060).
- Spoken attempts: adapter delgado que proyecta lo ya persistido con `targetId`
  (p.ej. attribution / answer history si existe). Si la fuente está vacía, los
  estados se basan en completion + diagnóstico — **sin inventar intentos**.
- Diagnóstico: último `pronunciation_assessments` / mirror local de 067.

El UI no llama Supabase directamente; usa queries/`useLiveQuery` existentes o
adapters nuevos bajo `lib/pronunciation/path/` / `store/` según el patrón del
repo.

### 5. UI (`components/courses/pronunciation-path/*`)

```
// Planned structure:
// <PronunciationPathPage>
//   <PageHeader />
//   <PronunciationPathNextAction />
//   <PronunciationPathStageNav />
//   <PronunciationPathActiveUnit />
//   <PronunciationPathExplore />
// </PronunciationPathPage>
```

- Español; tokens semánticos; DM Sans / DM Mono / `font-ipa`; touch ≥44px.
- Progressive disclosure: una unidad activa + resto explorables.
- Flag `pronunciationPathCopy`: off → sin claims de nivel/accuracy; títulos
  neutros (“Siguiente práctica”, “Unidad”). Derivación de estados **no** se apaga.
- Placeholder etapa 5 transfer → “Misión contextual — próximamente” (070).

### 6. Integraciones de este ship

| Superficie | Cambio |
|---|---|
| Diagnóstico `PronunciationResults` | CTA primario (y plan día 1 cuando aplique) → `/courses/pronunciation?target=<id>` con fallback Sound Lab solo si no hay target. |
| Courses aside | Link a `/courses/pronunciation` (además o en lugar del genérico Sound Lab, sin romper deep links `focus=`). |
| Sidebar | Sin nuevo item primario. |

### 7. Deep links y compatibilidad

- `/courses/pronunciation?target=<canonicalId>` selecciona unidad/etapa.
- `/courses/pronunciation?stage=sounds|word-stress|…` o `1..5` para explorar.
- `/practice/sounds?focus=` y legacy adapters 066 **siguen funcionando**.

## Verificación

| Check | Comando / prueba |
|---|---|
| Modelo puro | `pnpm exec vitest run lib/pronunciation/path` |
| UI | `pnpm exec vitest run components/courses/pronunciation-path` |
| Typecheck | `pnpm type-check` |
| Tokens | `pnpm lint:design-tokens` |
| Flag off | Test de componente: sin phrasing de nivel/accuracy |
| Manual | light / dark / custom hue + mobile/desktop en `/courses/pronunciation` |

Diferido: `pnpm audit:course-content` como gate de gaps, Playwright a11y
grep “pronunciation path”, integraciones Daily/Sound Lab.

## Done criteria (este vertical)

- [ ] `/courses/pronunciation` expone cinco etapas coherentes.
- [ ] Targets vienen del registry 066; content-map se reutiliza (sin autoría masiva).
- [ ] Los cuatro estados se derivan sin tratar visitas como mastery.
- [ ] Diagnóstico lleva al target recomendado exacto.
- [ ] Deep links Sound Lab legacy siguen compatibles.
- [ ] Copy de outcome detrás de flag; tokens only.
- [ ] Tests enfocados + typecheck + token lint pasan.
- [ ] `plans/README.md` fila 068 actualizada.

## STOP conditions

- Inventar target ids o una nueva tabla de progreso.
- Más de tres assets de lección nuevos antes del audit de gaps (reportar gaps).
- Claims de accuracy fonémica / “acento nativo” / scores acústicos no shippeados.
- Colores/radii locales fuera del sistema de tokens.
- Empezar integraciones Daily/Sound Lab/audit dentro de este vertical sin acuerdo.

## Mantenimiento

La ruta es un orquestador, no una fuente de verdad. Contenido nuevo = registrar
target + content-map + pasar tests de coverage; no editar JSX de la ruta para
“añadir una lección”.
