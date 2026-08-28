# Plan — Cablear cursos con la práctica diaria

> Estado: aprobado para ejecución · Rama base: `dev` · Fecha: 2026-08-27

## Objetivo

Convertir la diaria de "5 tareas sueltas" en **una lección practicada de varias
formas**, con foco declarado en percepción y producción de sonidos, y con
control manual del ritmo por parte del usuario.

## Decisiones tomadas (no reabrir)

| # | Decisión | Valor |
|---|---|---|
| 1 | Tope de pronunciación | Sube a 2: **1 percepción + 1 producción**, cubos separados |
| 2 | La lección del día siembra gramática y producción | **Sí** |
| 3 | Cadencia de teoría | **Cada 2 días**, más acceso libre permanente a `/courses` |
| 4 | Anti-estancamiento | Lección nueva forzada **cada 3 días** |
| 5 | Señal manual vs. assessment | **La manual gana** |
| 6 | Diccionario | **Fuera** de ejercicios. Solo práctica libre |
| 7 | `/progress` | **Aditivo**. No se borra nada |

## Hallazgos de la exploración (leer antes de ejecutar)

Cuatro supuestos resultaron falsos. Ahorran e imponen trabajo:

1. **El mapeo lección→deck YA EXISTE.** `buildCurriculum.ts:33` asigna
   `slug: course.g`, donde `g` es el slug del grammar deck
   (`public/grammar-decks/<g>.json`, 262 decks). Además `topicId` ya se deriva
   vía `theoryTopicForDeck`. **No hay que escribir ninguna tabla.** La pieza 3
   baja de mediana-grande a pequeña.

2. **`TrackedKind` ya incluye `"lesson"`** (`lib/tracking/types.ts:3`), y
   `PersistedTrackedKind` lo conserva. Guardar lecciones no necesita esquema
   nuevo — solo el corazón en la UI.

3. **`selectable` en `capabilities.ts` es un flag muerto.** Está declarado en
   las 19 capabilities pero ningún selector lo lee; los únicos consumidores son
   el validador y dos componentes de IPA que usan la palabra para otra cosa.
   Retirar ejercicios del plan diario necesita un mecanismo nuevo, no este.

4. **`buildTheoryClaimSignal` ya existe** (`lib/learning-focus/claims.ts`) y
   produce exactamente el signal que necesita el botón de ayuda:
   `status: 'review'` + `verificationDueAt` a 24 h (`CLAIM_VERIFICATION_MS`).
   La pieza 5 lo reutiliza en lugar de inventar nada.

### Limitación conocida, por diseño

`DECK_CONSTRAINT_MAP` documenta los temas que **deliberadamente no tienen**
constraint hablada honesta: voz pasiva, estilo indirecto, cláusulas relativas,
phrasal verbs. En esas lecciones la siembra de **producción hablada** (pieza 4)
no aplica y debe caer al comportamiento actual. No forzar un mapeo: el comentario
del módulo explica por qué sería peor que no tener ninguno.

---

## Lote A — Cableado

### Pieza 1 · Separar oído de boca
**Tamaño:** pequeña · **Archivo:** `lib/practice/daily-plan/constants.ts`

Hoy `MAX_PRONUNCIATION_STEPS = 1` cubre cuatro tipos en un solo cubo, así que
percepción y producción compiten por la misma plaza y nunca coinciden el mismo
día.

- Partir en dos listas: percepción (`minimal_pairs`, `listening`) y producción
  (`phoneme_focus`, `connected_speech`), con tope 1 cada una.
- `capPronunciationSteps` cuenta por cubo, preservando el orden.
- **Actualizar el comentario existente** que justifica el tope en 1. Documenta
  una decisión que estamos revirtiendo; si se deja, queda mintiendo. Explicar el
  nuevo balance: el foco declarado del usuario es oír y replicar sonidos.

**Verificar:** una diaria puede contener un paso de percepción y uno de
producción simultáneamente, y nunca dos del mismo cubo.

### Pieza 2 · Cadencia de teoría cada 2 días
**Tamaño:** pequeña · **Archivos:** `study-deck.ts`, `constants.ts`

Copiar el patrón de `mission-cadence.ts` (función pura sobre día, sin estado).

- `buildStudyDeckStep` solo emite paso los días de teoría.
- Los días intermedios esa plaza la ocupa práctica del mismo tema (piezas 3–4).
- **Acceso libre:** enlace permanente a `/courses` en la diaria, visible siempre
  aunque no toque teoría. Sin bloqueo — decisión 3.

**Verificar:** en día sin teoría el plan sigue teniendo 5 pasos, y el enlace a
`/courses` aparece igual.

### Pieza 3 · La lección siembra la gramática
**Tamaño:** pequeña (revisada) · **Archivos:** `composer.ts`, `study-deck.ts`

`buildGrammarFocusStep(deckSlug, ...)` ya recibe un slug de deck; hoy viene de
`deckSlugForWeakTopics` (temas débiles). El cambio es **de dónde sale ese slug**.

- Exponer el `slug` de `selectStudyDeckTarget` aunque el paso de teoría no se
  emita ese día (necesario por la pieza 2).
- `composer.ts` pasa ese slug a `buildGrammarFocusStep`.
- **Fallback obligatorio:** si la lección no tiene `g` (`slug` es opcional en
  `CoursePathLesson`), volver a `deckSlugForWeakTopics`.

**Verificar:** test que fije que una lección sin `slug` no rompe el plan y cae
limpiamente al comportamiento actual.

### Pieza 4 · La lección siembra la producción hablada
**Tamaño:** pequeña · **Archivo:** `composer.ts`

`constraintIdForDeck` ya convierte deck→constraint y
`generateSpokenProductionFromWordBank` ya acepta constraints preferidas.

- Reusar el slug de la pieza 3.
- **Preservar la prioridad actual:** las reparaciones de errores
  (`repairConstraints`) siguen ganando sobre el tema del día. Ese orden está
  documentado en `grammar-focus.ts` y es correcto.
- Temas sin constraint (ver limitación arriba): caer al comportamiento actual.

### Pieza 6 · Anti-estancamiento
**Tamaño:** pequeña · **Archivo:** `study-deck.ts` · **No es opcional**

`signaledTarget` siempre sirve `review` antes que `learn`. Sin esta pieza,
pulsar "necesito ayuda" un par de veces congela el avance para siempre y el
botón se vuelve un castigo.

- Regla: **cada 3 días**, o si los `review` pendientes superan un umbral, forzar
  una lección nueva (`learn`) aunque haya reviews pendientes.
- Se implementa **antes** que la pieza 5, a propósito: la red de seguridad va
  antes que la cosa que la necesita.

**Verificar:** con N reviews pendientes acumulados, al tercer día aparece una
lección nueva.

### Pieza 5 · Botón "necesito ayuda con esto"
**Tamaño:** mediana · **Archivos:** `lib/learning-focus/`, Dexie, UI de
`/courses/study/[n]` y paso de gramática

**Tres opciones, no dos** — un binario obliga a decidir demasiado y pierde la
duda, que es justo el estado a detectar:

| Opción | Efecto |
|---|---|
| Lo tengo | `status: 'mastered'` |
| Más o menos | `status: 'review'`, vencimiento normal |
| Necesito ayuda | `status: 'review'`, `verificationDueAt` corto (mañana) |

- Reutilizar `buildTheoryClaimSignal` (ya hace exactamente esto con
  `CLAIM_VERIFICATION_MS = 24h`).
- Persistir en **Dexie** vía `mergeConceptSignals` → offline funciona (regla dura
  del proyecto).
- **Resolver el conflicto de precedencia (decisión 5):** `mergeConceptSignals`
  hoy resuelve por `assessedAt >= previous.assessedAt`, pensado para fusionar
  assessments. Una señal manual no debe ser pisada por el siguiente assessment
  sin más. La manual gana hasta que un quiz la contradiga con evidencia real.
  Esto **requiere tocar `mergeConceptSignals`** o marcar el origen del signal.
- Incluir el opuesto ("lo tengo") desde el principio: sin él, el botón solo
  puede alargar el camino, nunca acortarlo.

---

## Lote B — Cierre del bucle

### Pieza 8 · Corazón para guardar lecciones
**Tamaño:** pequeña · **Archivos:** UI de `/courses`, `lib/tracking/queries.ts`

`TrackedKind` ya soporta `"lesson"`. Solo falta el control en la UI que escriba
el `TrackedItem` con `kind: 'lesson'`, `ref` = slug de la lección y `title`.

Se ejecuta **temprano** por ser casi gratis y visible de inmediato en
`/tracking`, que ya tiene la sección.

### Pieza 7 · Evidencia de ejercicios → ConceptSignal
**Tamaño:** mediana · **Prioridad alta**

**Este es el hueco que faltaba.** Cableamos lección → ejercicios, pero no el
retorno: si estudias present perfect y fallas 4 de 5 producciones, nada escribe
eso de vuelta. Hoy el único camino a `review` es el assessment o el botón manual.
El sistema ya tiene la evidencia en `answer_history` y la tira.

- Al cerrar una sesión, agregar el resultado de los ejercicios sembrados por una
  lección y escribir/actualizar el `ConceptSignal` de esa lección.
- Requiere que los ejercicios sepan a qué lección pertenecen → **por eso va
  después del cableado** (piezas 3–4).
- Sin esto, el botón manual carga solo con todo el trabajo de detectar qué no
  dominas.

### Pieza 9 · `/progress`: dominados y lo que falta para el siguiente nivel
**Tamaño:** mediana · **Puramente aditiva** (decisión 7)

Derivable sin datos nuevos: `deriveLevelView` da lecciones completadas por nivel
y `ConceptSignal.status` da dominio real.

- Mostrar temas dominados y los que faltan para A2 → B1, etc.
- **Matiz obligatorio:** *completar* una lección ≠ *dominarla*. `study-deck.ts`
  ya distingue ambos ejes (una lección `mastered` se salta sin marcarse
  completada). La vista debe mostrar los dos ejes o mentirá.
- No borrar nada de lo existente.

---

## Lote C — Después

### Pieza 10 · Contexto de aprendizaje para la IA
**Tamaño:** mediana

`lib/ai-practice/learning-state.ts` ya importa `ConceptSignal`, así que el canal
existe. Falta que el coach reciba qué se estudió hoy, el nivel CEFR y con qué
pidió ayuda. Mientras no lo tenga, hablará en nivel genérico y propondrá
estructuras aún no vistas.

### Pieza 11 · Dificultad por nivel CEFR
**Tamaño:** grande · **No en este lote**

Los generadores producen ejercicios sin conocer el CEFR. El cableado da *el tema
correcto* pero no *la dificultad correcta* (vocabulario, longitud de frase,
velocidad de audio). Trabajo transversal a todos los generadores.

---

## Orden de ejecución

```
1 → 2 → 8 → 3 → 4 → 6 → 5 → 7 → 9 → 10
```

- **1 y 2** son independientes entre sí; pueden ir en paralelo.
- **8** sube temprano: casi gratis, el tipo ya existe.
- **6 antes que 5**: la red de seguridad antes que el botón que la necesita.
- **7 después del cableado**: necesita que los ejercicios conozcan su lección.
- **11** queda explícitamente fuera.

## Reparto diaria / práctica libre (contexto)

**Diaria — 5 pasos** (+ teoría en días alternos):

| # | Paso | Sembrado por |
|---|---|---|
| 0 | Teoría (días alternos) | `selectStudyDeckTarget` |
| 1 | Oído — percepción | Foco fonético |
| 2 | Boca — replicar | El paso 1 |
| 3 | Gramática | ← la lección (pieza 3) |
| 4 | Producción hablada | ← la lección (pieza 4) |

**Práctica libre — cuatro puertas** en lugar de 17 rutas sueltas: Sonidos ·
Palabras (incluye diccionario) · Leer y escuchar · Jugar.

`match_pairs` y `sentence_dictation` salen del plan diario y viven en **Jugar** —
son reconocimiento y ortografía, funcionan bien como juego y no deben ocupar
plazas de producción. **Esto queda pendiente de mecanismo:** `selectable` no
sirve (hallazgo 3) y requiere su propia decisión de diseño, fuera de este plan.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Lecciones sin `slug` (`g` opcional) | Fallback a `deckSlugForWeakTopics`, con test |
| Temas sin constraint hablada | Caer al comportamiento actual; no forzar mapeo |
| Estancamiento por reviews acumulados | Pieza 6, obligatoria y previa a la 5 |
| Señal manual pisada por assessment | Resolver precedencia en `mergeConceptSignals` |
| Offline roto | Todo signal se escribe en Dexie primero |
