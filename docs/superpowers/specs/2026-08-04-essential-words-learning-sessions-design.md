# Essential Words — Sesiones de aprendizaje, hints con precio y FSRS

**Fecha:** 2026-08-04
**Estado:** propuesto — pendiente de revisión
**Alcance:** 4 subsistemas, implementables en fases separadas

---

## Problema

Hoy la sesión de essential-words presenta 10 palabras nuevas seguidas, cada una con
su tarjeta de presentación y un botón "Practicar", y cada palabra recibe **un solo**
ejercicio antes de pasar a la siguiente.

Causa raíz en el código: `buildSessionQueue` devuelve `[...due, ...fresh]`
(`lib/essential-words/queue.ts:95`) y `phaseForEssentialWordItem` mapea cada item a
`study → speak` (`lib/essential-words/session-model.ts:14`). La unidad de la sesión
es la palabra, y un item equivale a un ejercicio.

Dos consecuencias:

1. **Monotonía estructural.** Diez ciclos presentar→practicar en serie.
2. **Dificultad invertida.** Una palabra nueva llega a la fase `speak` y cae en el
   fallback `speak_sentence` (`EssentialWordsSession.tsx:204`): se pide producción
   oral de una palabra vista por primera vez hace segundos.

---

## Los cuatro subsistemas

| # | Subsistema | Fase | Depende de |
|---|---|---|---|
| — | **Contenido**: frases clozeables para `high` y `offer` | **0** | — |
| 1 | Estructura de sesión (bloques, escalera, secuenciación) | A | 0 |
| 2 | Hints con precio + feedback | B | 1 |
| 3 | Migración SM-2 → FSRS | C | 2 |
| 4 | Techo de tiempo + estado intermedio | A/D | 1 |

**El contenido va primero (Fase 0).** Son 2 entradas y ~10 minutos, pero eliminan la
necesidad de construir `define_to_word` y su rama de grading (§1.5, §1.6). Arreglar
el dato antes de diseñar alrededor del hueco ahorra un componente entero.

El log de revisiones (§3.3) se implementa en **Fase A**, antes que FSRS: es el único
dato irreconstruible.

### Fases A y B se despliegan juntas

Existe un hueco de UX entre A y B: la Fase A entrega la estructura de bloques, pero
la escalera de pistas y el feedback con diff llegan en B. Un nivel de producción sin
pistas y con feedback pobre sería **más duro que el app actual**.

La salida obvia —que A entregue solo niveles 1 y 2— **es una regresión funcional
peor**, no un estado intermedio benigno. El razonamiento completo:

> La graduación exige ronda final de producción (§3.4). Si A no tiene producción,
> **ninguna palabra nueva entra jamás a repaso** mientras A esté desplegada. Las
> palabras se acumulan en "aprendiendo" indefinidamente, la cola de repaso se seca, y
> el usuario repite exposición y niveles 1-2 de material ya trabajado sin que nada
> consolide. Es un app que deja de enseñar, y dura lo que dure la brecha A→B.

**Resolución: A es estado interno de desarrollo. A y B se despliegan juntas.**

- La Fase A se implementa y verifica, pero **no llega a usuarios** hasta que B aporte
  hints y feedback.
- Ninguna palabra gradúa con criterio débil, así que **no hacen falta cartas marcadas
  como `graduatedWeak`** ni una rama de graduación desde nivel 2.
- El optimizador de la Fase C no recibe cartas graduadas por criterio más débil, que
  distorsionarían igual que las migradas (§3.2).

**Consecuencia para el plan de fases:** el plan de A no incluye despliegue. El punto
de entrega a usuarios es el final de B.

> Si en algún momento se decidiera desplegar A sola, la graduación tendría que
> ocurrir desde nivel 2 con ronda final de recuerdo, grado tope **Good** (nunca Easy),
> y flag `graduatedWeak` para excluir esas cartas del optimizador. No es el plan
> actual, y queda aquí solo para que la decisión no se rehaga sin ver el costo.

---

## 1. Estructura de sesión

### 1.1 Bloques

La unidad deja de ser la palabra y pasa a ser el **bloque**.

- Un bloque tiene **3 o 4 palabras. Nunca 1 ni 2.**
- Con N=10 → `3 + 3 + 4`.
- Regla general: si `N % 3 == 1`, el último bloque toma 4. Si `N % 3 == 2`, se
  redistribuye a `3+3+4` en vez de dejar un bloque de 2.

**Invariante testeable:** todo bloque tiene 3 o 4 palabras.

Por qué no bloques de 1: repetir la misma palabra seguida se resuelve desde memoria
de trabajo, no de largo plazo — genera fluidez falsa. Con 3 pasan ~30-60 s entre
repeticiones de la misma palabra: separación suficiente para recuperación real sin
la carga de intercalar 10.

Por qué no rellenar bloques incompletos con repasos: los repasos no llevan
exposición, así que ese bloque tendría 3 tarjetas de presentación y 4 palabras en
práctica. Asimétrico para el usuario y para el planner.

### 1.2 Anatomía del bloque

```
BLOQUE (3-4 palabras)
├─ Exposición: 3-4 tarjetas seguidas, SIN ejercicios
│    palabra 1 → palabra 2 → palabra 3
└─ Práctica: ejercicios mezclados de esas palabras
     nivel 1 (reconocimiento) de las 3
     nivel 2 (recuerdo) de las 3
     nivel 3 (producción) de las 3
```

La exposición se separa de la práctica: conocer la palabra antes de practicarla.

### 1.3 Orden y prioridad al truncar

**Repasos antes que nuevas.** La razón no es competencia por el tiempo, es
**prioridad al truncar**: cuando el techo corta, un repaso perdido es decaimiento de
memoria; una palabra nueva no vista es solo un retraso.

- Techo propio para repasos por sesión (un día de acumulación no puede destruir la
  sesión entera).
- Si los repasos vencidos superan ~15, se parten en chunks intercalados entre
  bloques, para no quemar la atención antes del material nuevo, que es lo más
  costoso.

### 1.4 Ronda final mixta

Al cerrar los bloques, una ronda corta de **producción con todas las palabras del
día**, fuera del contexto de su bloque.

Sin ella, cada palabra queda evaluada solo dentro del bloque donde el contexto la
sostiene, y no hay evidencia de que sobreviva fuera. **Es esta ronda la que decide
la graduación**, no el último ejercicio del bloque.

### 1.5 Escalera de dificultad

| Nivel | Modos | Canal entrenado |
|---|---|---|
| **1 · Reconocimiento** | `recognize_translation`, `recognize_meaning`, `recognize_audio` | forma → significado |
| **2 · Recuerdo** | `recall_translation`, `dictation_word` *(nuevo)* | significado → forma / **sonido → forma** |
| **3 · Producción** | `cloze_sentence`, `dictation_sentence`, `speak_sentence` *(opcional)* | producción libre |

Cada vez que una palabra reaparece dentro del bloque, sube un nivel.

**`dictation_word` (nuevo).** Audio de la palabra + glosa en español debajo. Cubre el
canal sonido→forma, que hoy no entrena nadie y que es la habilidad más débil de
hispanohablantes. La glosa desambigua homófonos (`be`/`bee`, `to`/`too`/`two`) sin
regalar la ortografía.

**`define_to_word` — descartado del alcance actual.** Se diseñó como piso garantizado
para las palabras sin cloze viable. Medido el dataset, **serviría a 2 entradas**
(`high`, `offer`), y ambas se arreglan con contenido (§5): las 4 frases candidatas
producen cloze válido, verificado contra `clozeFor`.

Construirlo ahora significaría un componente entero para dos palabras, y arrastraría
una rama de grading ("el piso degradado nunca da Easy") que casi nunca se ejecuta, un
peldaño de pista propio y una ruta de audio-como-pista.

La garantía se conserva **sin código**: el invariante 2 de §7 (toda palabra tiene ≥1
modo elegible en cada nivel) se verifica por test sobre las 2800 entradas, y **falla
el día que alguien añada una palabra sin frase clozeable**. Ese test es la señal para
reconsiderar este modo.

**`weak_form` sale del primer encuentro.** Solo 31 de 2800 palabras tienen `ipa_weak`
(1.1%), todas funcionales — cero sustantivos, cero verbos léxicos. Es un matiz de
pronunciación que pertenece a la vida posterior de la palabra: queda para repasos de
funcionales ya graduadas.

**`dictation_sentence` va a producción, no a recuerdo.** Transcribir una oración
completa es más difícil que producir una palabra suelta.

**`speak_sentence` es opcional.** Solo si ya hay permiso de micrófono concedido. Se
pide una vez, fuera del flujo. Nunca puede ser el único camino: pedir permiso a mitad
de un ejercicio rompe la sesión.

### 1.6 Elegibilidad y degradación

No toda palabra es elegible para todo modo. La selección **filtra por elegibilidad**
y degrada de forma **declarada**, nunca silenciosa.

**Invariante testeable:** toda palabra tiene ≥1 modo elegible en cada nivel.

Cobertura medida sobre las 2800 entradas:

| Modo | Cobertura | Nota |
|---|---|---|
| `recognize_*` | 100% | `translation` y `meaning` completos |
| `recall_translation`, `dictation_word` | 100% | |
| `cloze_sentence` (solo frase base) | 96.8% | 90 palabras sin cloze viable |
| **`cloze_sentence` (todas las frases)** | **99.93%** | solo 2 palabras sin cloze |
| `weak_form` | 1.1% | fuera del primer encuentro |

Hallazgo decisivo: de las 90 palabras sin cloze en su frase base, **88 ya tienen una
variante que sí funciona**. Basta con que `cloze_sentence` consulte *todas* las
frases disponibles, no solo la rotada.

Solo `high` (rank 148) y `offer` (rank 237) carecen de cloze en cualquier frase, y se
resuelven con contenido (§5), no con arquitectura.

Cadena de degradación dentro de producción:

```
cloze_sentence (cualquier frase)
  → dictation_sentence   (piso: example_sentence es obligatorio en toda entrada)
```

`speak_sentence` queda fuera de la cadena: es capacidad opcional, no piso.

`dictation_sentence` es piso suficiente porque `example_sentence` es obligatorio en
todas las entradas. Tras arreglar `high` y `offer` (§5), la cadena no se ejecuta para
ninguna palabra del dataset actual: existe como red de seguridad ante contenido
futuro, no como mecanismo.

### 1.7 Secuenciación

Reglas, verificables como invariantes:

- **Nunca la misma palabra dos veces seguidas** (distancia mínima de 2 ejercicios).
- **Al fallar, baja un nivel** y reaparece 2-3 ejercicios después, no de inmediato.
- **La frase de ejemplo rota** entre ejercicios, para que no memorice la tarjeta en
  vez de la palabra (ya implementado: `sentence-variants.ts`).
- Si el fallo ocurre cerca del final del bloque y no quedan 2-3 ejercicios por
  delante, **el bloque se extiende** con el ítem fallado. Mantiene la reparación
  cerca del contexto donde falló; el techo de tiempo limita cuánto puede crecer.

### 1.8 Arquitectura: máquina de estados, no lista

El plan **no puede ser un array estático**: un fallo reinserta ítems y extiende el
bloque. Módulo puro nuevo `lib/essential-words/session-plan.ts`:

```ts
nextStep(state): Step | null
applyResult(state, result): SessionState
```

- Determinista, con **seed** para reproducibilidad en tests.
- "Extender el bloque" cae solo, sin mutar una lista ya generada.
- Sin I/O: el hook orquesta, el módulo decide.

```ts
type Step =
  | { kind: 'expose'; word: EssentialWord }
  | { kind: 'exercise'; word: EssentialWord; level: 1|2|3; mode: EssentialWordMode }
```

---

## 2. Hints, grading y feedback

### 2.1 Principio: el grado lo produce el *cómo*, no el ejercicio

Hoy cada card llama `onGraded(5)` u `onGraded(2)` directamente. Eso desaparece: un
acierto con dos pistas no es un 5.

Módulo puro `lib/essential-words/attempt-grade.ts`:

```ts
interface AttemptOutcome {
  correct: boolean
  hintsUsed: number
  rescued: boolean          // pasó a opciones múltiples
  typo: boolean
  firstTryFailed: boolean
  latencyMs: number
}

type Grade = 'Again' | 'Hard' | 'Good' | 'Easy'
```

Las cards emiten un `AttemptOutcome`, **no un número**. El mapeo a `quality` 0-5
(SM-2 hoy, FSRS después) vive en un solo sitio — lo que hace barata la Fase C.

| Resolución | Grado | Efecto |
|---|---|---|
| Sin ayuda, latencia baja | **Easy** | Intervalo largo |
| Sin ayuda | **Good** | Intervalo normal |
| 1 pista | **Hard** | Crece poco |
| 2+ pistas | **Again** | Vuelve en la sesión |
| Rescate a opciones múltiples | **Again** *(siempre)* | Aunque acierte |
| `firstTryFailed` (falló, reintentó sin pistas, acertó) | **Again** | Falló la recuperación |
| Typo | como correcto | Sin penalizar |

`latencyMs` separa Good de Easy: un acierto correcto a los 25 s es Good, no Easy. Es
además la mejor señal temprana de leech.

### 2.2 Qué intento escribe en el scheduler

Una palabra nueva se toca 4 veces por sesión (niveles 1, 2, 3 y ronda final). El
scheduler espera **un evento por repaso**, no cuatro.

**Reglas:**

1. **El primer intento de la sesión para esa palabra fija el grado.** Solo él mide
   recuperación limpia: tras ver el feedback el ítem está contaminado y los aciertos
   posteriores solo miden memoria de trabajo.
2. **La reparación no vuelve a tocar el grado, pero no es inerte:** decide si la
   carta **sale de relearning** en esta sesión o queda pendiente. En FSRS un lapse
   manda la carta a relearning y es el intento de reparación el que decide si sale.
   Descartarla del todo dejaría la carta como si el usuario se hubiera rendido.
3. **Palabras nuevas: nada escribe en el scheduler hasta la graduación.** Los
   ejercicios del bloque alimentan la máquina de estados de la sesión, no FSRS.

> Esta regla es explícita para que nadie vuelva a cablear `onGraded` a cada ejercicio.

### 2.3 Escalera de pistas

Orden por costo creciente. **El audio va antes que la primera letra**: activa la
representación fonológica sin regalar la ortografía. La primera letra es información
estructural directa sobre la respuesta, y es más cara.

| Longitud de la palabra | Peldaños |
|---|---|
| **≥5 letras** | categoría ("verbo auxiliar, 6 letras") → audio* → primera letra (`b _ _ _ _`) → revelar |
| **2-4 letras** | categoría (**sin conteo de letras**) → audio* → revelar |

En palabras cortas no se da conteo ni primera letra: "verbo auxiliar, 2 letras" ya
casi entrega `be`, y `b _` lo entrega del todo. **Menos peldaños, no peldaños
degenerados.**

**Reglas duras:**

- **Ningún peldaño entrega la respuesta completa.** Si tras el último hint el usuario
  no tiene que escribir algo, ese hint no debería existir.
- **Revelar no es pista, es rendirse.** Cuenta como fallo.
- **El botón no existe antes del primer intento.** Se activa tras el primer fallo o
  tras ~5 s de inactividad con el campo vacío. Si está disponible desde el segundo
  cero, se pulsa por reflejo.
- Botón **discreto**, no de color.

**Por tipo de ejercicio:**

- **Dictado de oración:** la escalera es `0.75x` → audio segmentado por palabras →
  primera letra.
- **Opción múltiple: sin pistas.** Ya es reconocimiento; eliminar un distractor lo
  vuelve trivial. Mejor fallar rápido y recibir feedback.

**\* Audio como pista — regla corregida.** El audio cuesta **cuando no forma parte
del enunciado**:

| Modo | ¿El audio es el enunciado? | Costo |
|---|---|---|
| `dictation_word`, `dictation_sentence` | Sí — es el prompt | **Libre e ilimitado** |
| `cloze_sentence` (audio de la palabra objetivo) | No — el enunciado es la frase escrita | **Pista (peldaño 2)** |
| Resto | No revela la respuesta | Libre |

Castigar la reproducción del estímulo penalizaría a quien no captó el audio la
primera vez.

### 2.4 Rescate a opciones múltiples

Tras un fallo, el input libre puede convertirse en opciones múltiples.

Es **rescate emocional, no evaluación**: convertir producción en reconocimiento
cambia la tarea a mitad de camino. Sirve para que la sesión no se atore, nunca para
calificar. Por eso **siempre produce Again**, aunque acierte.

Un formato, un rol: por eso "recall con opciones" **no** existe como modo regular del
nivel 2. Si el mismo formato fuera a veces rescate y a veces ejercicio programado, la
señal de dificultad dejaría de significar nada.

### 2.4b Política de distractores

Las 624 colisiones a distancia 1 (§2.6) afectan también a la **generación de
distractores**, tanto en reconocimiento (nivel 1) como en el rescate a opciones.

Si los distractores salen al azar del dataset, unas veces la pregunta es trivial
(`the` vs `elephant`) y otras es un test de discriminación fina (`be` vs `he` vs
`we`). Esa varianza entra directa en la señal de dificultad — justo lo que la
Sección 2 existe para mantener limpia.

**De dónde salen.** Del **pool de palabras que ese usuario ya vio** (expuestas o
graduadas), no del dataset completo. Si salen del dataset entero, el usuario puede
acertar por eliminación al reconocer las otras tres; con palabras conocidas se ve
obligado a **discriminar** en vez de reconocer.

Fallback al dataset filtrado cuando el pool del usuario aún es pequeño (primeras
sesiones), aplicando los mismos criterios de abajo.

**Política declarada**, en `lib/essential-words/distractors.ts`:

1. **Misma categoría gramatical** que el objetivo (`pos` idéntico).
2. **Distancia ortográfica mínima ≥2** respecto al objetivo: excluye vecinos a
   distancia 1 (`be`/`he`, `to`/`do`, `of`/`on`).
3. **Sin homófonos** del objetivo (`be`/`bee`, `to`/`too`/`two`), que en
   `recognize_audio` y `dictation_word` harían la pregunta irresoluble por diseño.
4. **Sin duplicados** por forma superficial (ya implementado en `RecognizeCard`).
5. Si el filtro deja menos de los distractores necesarios, se **relaja el criterio 1
   antes que el 2**: mejor mezclar categorías que producir discriminación fina
   accidental.

La dificultad debe venir de si el usuario sabe la palabra, no de qué distractores le
tocaron.

### 2.5 Feedback al fallar

La pieza de mayor impacto, siempre activa.

1. **Mostrar el diff, no solo la respuesta.** "Escribiste *bi*, era *be*" enseña más
   que revelar la oración correcta.
2. **Distinguir typo de error** (§2.6).
3. **Explicar solo cuando hay regla.** Con `be` tiene sentido ("cambia a am/is/are
   según el sujeto"); con la mayoría de sustantivos no hay nada que explicar y un
   mensaje genérico es ruido.
4. **Reaparición obligatoria** del mismo ítem 2-3 ejercicios después, en la misma
   sesión. Feedback sin segundo intento informa pero no consolida.

### 2.6 Detección de typos — criterio semántico

**No se usa umbral de longitud.** Medición sobre el dataset:

- **47.4% del top-500 tiene ≤4 letras.** Una regla tipo "distancia 1 en palabras >4
  letras" sería inerte justo donde más se necesita.
- **624 palabras cortas tienen otra palabra del dataset a distancia 1**
  (`the`/`he`, `be`/`he`, `to`/`do`, `of`/`on`, `in`/`it`). Bajar el umbral aceptaría
  `he` como typo de `be`, convirtiendo desconocimiento en acierto.

**Criterio:** es typo si —

1. la cadena escrita **no es a su vez una palabra válida**, y
2. la edición pertenece a una **clase típica de tecleo**: tecla adyacente, letra
   doblada, o transposición.

`hapy` → `happy` es typo. `he` cuando se esperaba `be` **no lo es nunca**, aunque la
distancia sea 1. Funciona en palabras de cualquier longitud.

Un typo se acepta, se marca la corrección y **no se penaliza en el scheduler**:
castigar typos como desconocimiento envenena los datos de dificultad.

### 2.7 Consecuencias declaradas

Para que nadie las "arregle" creyendo que son bugs:

1. **El rescate produce Again siempre**, aunque el usuario acierte.
2. **Como 2 pistas ya producen Again, la 3ª pista y el revelar son gratis** en
   términos de grado. Es intencional: no se castiga el aprendizaje una vez el ítem ya
   está perdido. No añadir penalización extra por revelar.
3. **`hintsUsed` se registra siempre**, incluso en intentos que no gradan. Un *Again
   cold* y un *Again tras 3 pistas* son estados muy distintos; solo el segundo indica
   que la palabra debe salir de rotación.

---

## 3. Migración SM-2 → FSRS

### 3.1 Convergencia de write paths

Solo **3 archivos** programan intervalos (los otros ~28 únicamente leen el tipo
`SRSData`):

| Path | Qué programa | Destino |
|---|---|---|
| `lib/essential-words/grade.ts:30` | palabras c1k | **→ FSRS vía `attempt-grade.ts`** |
| `lib/practice/fragment-srs.ts:30` | fragmentos de journal | **→ converge** (mismo `SRSData`) |
| `components/vocabulary/decks/study-utils.ts` | `deck_entry_progress` | **excepción permanente** |

Los dos primeros comparten `SRSData` / `updateSRS` y convergen en un solo camino.

El tercero opera sobre **otra tabla y otro modelo de datos** (progreso de mazos, no
`SRSData`); forzarlo dentro acoplaría dos dominios por una falsa simetría. Queda como
excepción **declarada aquí con su razón**, no como olvido.

**Resultado: un único camino para todo lo que toca `SRSData`.**

### 3.2 Modelo de migración

**Arranque desde el estado SM-2 actual. No hay recálculo retroactivo.**

Razón: no existe log histórico de essential-words (§3.3), así que no hay nada que
recalcular. Un recálculo retroactivo sería inventar datos.

Derivación por carta:

```
stability  = min(interval, elapsedDays)
difficulty = f(ease)
```

`min(interval, elapsedDays)` porque derivar solo desde `interval` únicamente es
razonable si la carta está cerca de su vencimiento: una carta con 30 días de
intervalo pero 90 vencida tiene una estabilidad real muy distinta de 30.
**Subestimar es seguro; sobreestimar pierde la carta.**

**Ciclo de vida del flag.** No es un booleano permanente, es un contador:

```
fsrsRealReviews: number
```

El estado inicial de una carta migrada es una aproximación **inventada**, así que sus
primeras revisiones son observaciones contra un `stability` que nadie midió. **Toda
revisión de una carta migrada se excluye del optimizador** hasta acumular **3
revisiones reales propias**; a partir de ahí son datos legítimos y el flag deja de
aplicar.

### 3.3 Log de revisiones — empieza en Fase A

Ya existe `srsRatingEvents` (`lib/db/index.ts:225`) con `grade`, `occurredAt`,
idempotencia y sync a Supabase. **Pero solo lo escriben `word_bank` y `topic_srs`:
essential-words no registra nada**, y le falta el estado previo que FSRS necesita.

Es el **único dato irreconstruible**, así que se implementa **antes que FSRS**, aunque
SM-2 no lo use:

- Nuevo `entityType: "essential_words"`.
- Campos añadidos: `stability`, `difficulty`, `elapsedDays`, `state` (previos al
  repaso), `hintsUsed`, `latencyMs`.
- `isRepair: true` en intentos de reparación, para no contaminar la optimización.

### 3.4 Grado de graduación

**El modo no asigna el grado: lo limita.** El desempeño en la ronda final decide.

| Condición | Grado |
|---|---|
| Sin pistas + latencia baja + modo de **producción completo** | **Easy** |
| Todo lo demás que acierta | **Good** |

El modo actúa como **techo**: un modo degradado nunca puede dar Easy, solo Good. Con
el dataset actual esa rama no se ejecuta (§1.6), pero la regla se implementa porque
es la que mantiene válido el techo si entra contenido sin cloze viable.

Por qué no escalar multiplicadores de estabilidad inicial: FSRS tiene 4 valores de
estabilidad inicial (uno por grado) que vienen del set de parámetros. Escalarlos por
modo modificaría el modelo por fuera y **el optimizador estándar dejaría de poder
usarse** sobre el log.

Por qué tampoco basta con "modo → grado" directo: haría que la **disponibilidad de
contenido** determinara el grado. Una palabra resuelta con una pista y 30 s de duda
graduaría Easy por tener frase clozeable, y otra resuelta al instante graduaría Good
por haber caído a `dictation_sentence`. En FSRS la diferencia Good/Easy en estabilidad
inicial es de varias veces, no un matiz.

**Se registra con qué modo graduó cada palabra**, para poder auditar después.

### 3.5 Librería

`ts-fsrs` no está instalado. Se añade como dependencia en Fase C.

---

## 4. Techo de tiempo y estado intermedio

### 4.1 Ajuste de N

El techo es de **8-12 min**. El número de palabras nuevas se ajusta al tiempo, no al
revés: 10 nuevas × 3-4 ejercicios + repasos vencidos son fácilmente 60-70 ítems.

- El planner estima duración por ítem y reduce **palabras nuevas** hasta caber.
- Respeta el mínimo de bloque: **si no cabe un bloque completo de 3, no se empieza.**
- Prioridad al truncar: **repasos > nuevas** (§1.3).
- Se corta **en frontera de bloque** siempre que sea posible.

### 4.2 Estado intermedio persistido

Cuando el techo corta a mitad de bloque, una palabra **expuesta pero sin practicar**,
o practicada hasta nivel 2 sin llegar a producción, **no gradúa pero no es virgen**.

Hoy no hay dónde guardar eso: `SRSData` solo existe tras graduar, e
`introducedToday` es un booleano sin nivel. Si mañana volviera a exposición desde
cero, el usuario vería otra vez la presentación de algo que ya trabajó, y se sentiría
como pérdida de progreso.

Tabla nueva en Dexie, `essentialWordProgress`:

```ts
{
  wordId, userId,
  exposedAt: string,        // vio la tarjeta de presentación
  highestLevel: 0|1|2|3,    // nivel alcanzado
  lastSessionId: string,
  attempts: number,         // conserva hintsUsed acumulado
}
```

Es deliberadamente distinto de `SRSData`: esto es **pre-graduación**. Al graduar se
crea la fila FSRS y este registro se archiva.

RLS obligatoria si se sincroniza a Supabase.

### 4.3 Regla de reanudación

| Estado al reanudar | Qué ve el usuario |
|---|---|
| Expuesta, 0 ejercicios | Exposición **abreviada** (recordatorio, no presentación completa) + práctica desde nivel 1 |
| Nivel 1-2 alcanzado | **Sin exposición.** Retoma en el nivel alcanzado |
| Nivel 3 sin ronda final | **Sin exposición.** Va directo a ronda final |

**Nunca vuelve a la presentación completa de algo ya trabajado.**

---

## 5. Contenido

**Esta es la Fase 0: va antes que todo lo demás** (§"Los cuatro subsistemas").

- **`high` (rank 148) y `offer` (rank 237):** añadir una frase de ejemplo clozeable.
  Son 2 entradas, editables a mano, sin llamar a Gemini.

  Frases a añadir:

  | Palabra | Frase | Resultado del cloze |
  |---|---|---|
  | `high` | The wall in the garden is very high. | `The wall in the garden is very ___.` |
  | `offer` | They offer free coffee every morning. | `They ___ free coffee every morning.` |

  Ambas fallan hoy porque sus frases actuales son demasiado cortas para
  `hasEnoughContext`: `"The wall is very high."` y `"They offered help."`.

  > **Nota de redacción.** Las primeras candidatas fueron
  > `"The mountain behind our village is extremely high."` y
  > `"They offer free coffee to every morning customer."`. Producen cloze válido,
  > pero introducen `village`, `extremely`, `behind` y `customer` — vocabulario más
  > difícil que la palabra que se enseña. La causa raíz ("la frase falla por corta")
  > empuja justo hacia ese error: alargar es fácil, alargar sin salirse del
  > vocabulario conocido no.

  Al aplicarlas, `cloze_sentence` pasa a **100%** de cobertura y `define_to_word` deja
  de ser necesario (§1.5).

- **Glosa de `dictation_word`:** ya existe — es el campo `translation`, completo al
  100%.

### 5.1 Guía de redacción para frases nuevas

Al escribir frases de ejemplo, preferir vocabulario **concreto y cotidiano**, y no
introducir palabras raras solo para alcanzar la longitud que pide
`hasEnoughContext`. `"The wall in the garden is very high"` cumple longitud sin
salirse del vocabulario básico; `"The mountain behind our village is extremely high"`
no.

**Por qué esto es una guía y no un invariante automático.** Se evaluó la regla
"ninguna palabra de la frase debe ser menos frecuente que la palabra objetivo",
medida sobre las 2800 entradas:

| Formulación | Entradas que la violan |
|---|---|
| Estricta | **2797 / 2800 (99.9%)** |
| Con techo `rank + 600` y manejo de flexiones | **2563 / 2800 (91.5%)** |
| Con techo `rank + 1000` | 2463 / 2800 (88.0%) |

La regla estricta es **matemáticamente imposible** para vocabulario de alta
frecuencia: para enseñar `the` (#1), toda palabra de contenido es por definición más
rara. `"Give me the book please."` es una frase A1 impecable y la viola (`give` #77,
`book` #171).

Con techo generoso siguen marcadas frases correctas: `"I have a dog at home"`
(`dog` #894), `"They are playing in the park now"` (`park` #657). El vocabulario
concreto — `dog`, `park`, `pen`, `cup` — tiene rank alto porque las listas de
frecuencia están dominadas por palabras funcionales, pero es justo el vocabulario que
un A1 conoce.

El principio pedagógico es correcto; **el rank de frecuencia no es el proxy que lo
mide**. Un invariante que falla en el 91-99% de los casos no es un invariante: es
ruido que nadie puede arreglar y que acabaría silenciado.

---

## 6. Componentes nuevos

| Componente | Responsabilidad |
|---|---|
| `lib/essential-words/session-plan.ts` | Máquina de estados pura: `nextStep` / `applyResult` |
| `lib/essential-words/attempt-grade.ts` | `AttemptOutcome` → `Grade`. Único mapeo a scheduler |
| `lib/essential-words/typo.ts` | Detección semántica de typos |
| `lib/essential-words/hint-ladder.ts` | Escalera por longitud y por modo |
| `lib/essential-words/distractors.ts` | Política de distractores (§2.4b) |
| `components/.../DictationWordCard.tsx` | Audio + glosa → escribir |
| `components/.../HintButton.tsx` | Botón discreto, activación diferida |
| `components/.../AnswerDiff.tsx` | Feedback con diff |

Todos ≤250 líneas, con comentario de estructura planeada antes de implementar
(regla del proyecto).

---

## 7. Invariantes testeables

1. Todo bloque tiene **3 o 4** palabras.
2. Toda palabra tiene **≥1 modo elegible en cada nivel**. *(Verificado sobre las 2800
   entradas. Es la garantía que sustituye a `define_to_word`: si alguien añade una
   palabra sin frase clozeable ni dictable, este test falla.)*
3. **Nunca la misma palabra dos veces seguidas** (distancia ≥2).
3b. Ningún distractor está a **distancia ortográfica 1** del objetivo ni es homófono
   suyo, y todos salen del **pool ya visto por el usuario** mientras ese pool alcance
   (§2.4b).
4. Un ejercicio **nunca** se renderiza con datos ausentes.
5. **Un solo write de grade por palabra y sesión** (el primer intento).
6. Una palabra nueva **no escribe en el scheduler** antes de graduar.
7. Ningún peldaño de pista **entrega la respuesta completa**.
8. El rescate a opciones **siempre** produce `Again`.
9. Toda revisión de carta migrada con `fsrsRealReviews < 3` queda **excluida del
   optimizador**.
10. Una palabra con `highestLevel > 0` **nunca** vuelve a exposición completa.

---

## 8. Fuera de alcance

- Migrar `deck_entry_progress` a FSRS (§3.1, excepción declarada).
- Optimización de parámetros FSRS sobre el log. Requiere meses de datos reales;
  el log se empieza a acumular en Fase A.
- `weak_form` en el flujo de primer encuentro (§1.5).
- **`define_to_word`** (§1.5): descartado tras medir que serviría a 2 entradas, ambas
  reparables con contenido. Se reconsidera solo si el invariante 2 de §7 empieza a
  fallar por contenido nuevo.
- Generación de contenido a escala vía Gemini: solo 2 entradas manuales (§5).
- **Despliegue de la Fase A por separado**: A es estado interno; A y B llegan juntas a
  usuarios. Desplegar A sola secaría la cola de repaso (ver "Fases A y B se despliegan
  juntas").
- **Invariante automático de frecuencia de vocabulario**: descartado tras medirlo
  (§5.1). Queda como guía de redacción.
