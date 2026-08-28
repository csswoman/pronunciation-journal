# Backlog — Lo que falta después del cableado cursos↔práctica

> Complementa: `2026-08-27-daily-plan-course-wiring.md`
> Estado: propuesta, no aprobado · Fecha: 2026-08-27

Este documento recoge todo lo discutido que **no** entró en el plan de cableado,
más lo que la exploración reveló como pendiente real. Ordenado por retorno sobre
esfuerzo, no por orden de conversación.

## Verificaciones que cambian el backlog

Antes de planear, cuatro comprobaciones sobre supuestos de la conversación:

1. **La consolidación de rutas de vocabulario YA ESTÁ HECHA.**
   `/vocabulary` → redirige a `/tracking`; `/saved` → `/tracking`;
   `/lexicon` → `/dictionary`; `/dictionary` → re-exporta `/words/page`.
   Solo `/words` tiene implementación real (108 líneas). **Esta tarea sale del
   backlog**: quedaba pendiente en la propuesta original y ya no aplica.

2. **El fallback de grabación por audio está a medias.** Existen los dos
   adaptadores (`lib/speech/adapters/webSpeechAdapter.ts` y `geminiAdapter.ts`)
   y `geminiAdapter` fue endurecido el 2026-08-27 (timeouts, aborts). Pero no se
   encontró un selector que elija entre ellos según capacidad del navegador.
   **Lo que falta es la lógica de selección**, no los adaptadores.

3. **`selectable` sigue siendo un flag muerto** (ver plan de cableado, hallazgo
   3). Bloquea la retirada de ejercicios del plan diario.

4. **Los juegos existen** (`PRACTICE_GAMES`, p. ej. Word Chain) pero viven solo
   en el hub de práctica libre. La diaria no tiene ninguno.

---

## Prioridad 1 — Desbloqueos

### B1 · Selector de adaptador de voz según capacidad
**Tamaño:** pequeña-mediana · **Riesgo si no se hace:** alto

Sin Web Speech API (Safari iOS, Firefox) los ejercicios hablados no funcionan.
Los dos adaptadores ya existen; falta detectar capacidad y rutear a
`GeminiAdapter` cuando `webkitSpeechRecognition` no está disponible.

Ya existe `lib/pronunciation/assessment/capability.ts` y
`lib/speech/browser-support-message.ts` — revisar si el punto de decisión debe
vivir ahí antes de crear módulo nuevo.

**Por qué primero:** el plan de cableado apoya dos de sus cinco pasos diarios en
producción hablada. En un navegador sin Web Speech, esa diaria queda coja.

### B2 · Mecanismo para retirar ejercicios del plan diario
**Tamaño:** mediana · **Bloquea:** B3

`selectable` está declarado en las 19 capabilities y **ningún selector lo lee**.
Hoy no existe forma de decir "este ejercicio existe y funciona, pero el
planificador diario no lo elige".

Propuesta: campo `surfaces` en `ExerciseCapability`, ortogonal a `status`:

```
surfaces: readonly ('daily_plan' | 'free_practice' | 'review' | 'diagnostic')[]
```

`status` describe **salud del código** (`active`/`deferred`/`legacy`);
`surfaces` describe **política pedagógica**. Mezclarlos hace que `deferred`
signifique dos cosas y en seis meses nadie sepa cuál.

Trabajo real: **hacer que el selector lo lea**. Cambiar el campo sin conectarlo
no hace nada. Añadir regla al validador: `status: 'active'` + `surfaces` vacío =
error, para que nadie deje un ejercicio huérfano en silencio.

**Preservar:** `answer_history` ya tiene filas de `match_pairs` y
`sentence_dictation` con sus `dbId`. Retirarlos no debe invalidar ese historial
ni romper `skill-matrix` / `session-summary-view`. Como la capability no se
borra, sigue funcionando — pero conviene un test que lo fije.

### B3 · Reparto diaria / práctica libre
**Tamaño:** pequeña una vez existe B2 · **Depende de:** B2

- `match_pairs` → solo `free_practice`
- `sentence_dictation` → solo `free_practice`
- `multiple_choice` → solo `diagnostic` (decisión ya tomada en conversación)

Los dos primeros son reconocimiento y ortografía: funcionan bien como juego y no
deben ocupar plazas de producción en la diaria.

---

## Prioridad 2 — Que la diaria enganche

### B4 · Feedback inmediato y visible
**Tamaño:** mediana · **Retorno:** el más alto de esta sección

Pediste "mucha práctica pero divertido, que entretenga". La respuesta **no** es
añadir un juego a la diaria. Lo que engancha es feedback inmediato: acertar un
minimal pair y verlo al instante; oír tu grabación al lado del modelo.

Más barato de construir que un juego nuevo y rinde más. Aplica a los pasos 1 y 2
de la diaria (oído y boca), que son el foco declarado.

### B5 · Reorganizar el hub en cuatro puertas
**Tamaño:** mediana

17 rutas bajo `/practice`. La práctica libre no falla por falta de contenido;
falla porque no sabes qué elegir.

| Puerta | Contiene |
|---|---|
| Sonidos | sounds, minimal-pairs, intonation, connected-speech |
| Palabras | essential-words, core-1000, words, **diccionario** |
| Leer y escuchar | reader, immersion, courses |
| Jugar | word-search, `PRACTICE_GAMES`, + lo retirado en B3 |

El diccionario aterriza aquí, en Palabras — fuera de ejercicios, según decisión.

Existe ya `PRACTICE_CATEGORIES` en `lib/practice/practice-categories.ts`:
revisar si las cuatro puertas se expresan ahí antes de rediseñar componentes.

### B6 · Plaza rotativa en la diaria
**Tamaño:** pequeña · **Depende de:** el cableado estar hecho

El paso 5 rota entre juego, reader, misión o repaso. Es lo que evita que la
diaria se sienta idéntica cada día. `mission-cadence.ts` ya tiene el patrón de
rotación por día de semana.

---

## Prioridad 3 — Ejercicios nuevos

Los seis hablados de la propuesta original, **reducidos a cuatro** y por fases.
Cada ejercicio nuevo cuesta: entrada en registry, prompt de generación, prompt de
grading, componente, tests y contenido semilla. Seis a la vez es un trimestre.

### B7 · Fase 1 — dos ejercicios
**Tamaño:** mediana cada uno

- **Rodeo** — describe una palabra sin usarla. El mejor de la lista:
  circumlocución es lo que separa B1 de B2 y casi nadie lo entrena explícitamente.
- **Transformación hablada** — oyes presente, la dices en pasado/perfecto/futuro.
  Ataca morfología verbal, donde el español más interfiere.

Medir retención a 2 semanas antes de seguir.

### B8 · Fase 2 — según datos
- **Narración en pasado** (3 imágenes en secuencia).
- **Respuesta sin preparación** — fusiona "Ronda rápida" y "Pregunta inesperada",
  que se solapaban: ambos son "responde sin preparación". La diferencia (1 vs. 8
  preguntas) es configuración, no tipo. Un solo registry entry con parámetros
  `question_count`, `time_per_answer`, `preview_seconds`.

### B9 · Justificación — replantear antes de construir
**Problema sin resolver:** ¿cómo puntúas "defiende tu elección en 2 frases"? No
hay respuesta correcta. O grading blando de Gemini (caro, lento, ruidoso) o
rúbrica estrecha (¿usó `because`/`so`? ¿dos oraciones? ¿tiempo verbal coherente?).

Recomendación: rúbrica estrecha, y llamarlo lo que es — **un ejercicio de
conectores**, no de argumentación.

### B10 · Modificaciones a ejercicios existentes
**Tamaño:** pequeña cada una

- `reorder_words` → modo recuperación: se muestra 3 s, se oculta, lo dices de
  memoria. **Cuidado:** con frases de 6+ palabras se vuelve test de memoria de
  trabajo y falla por razones no lingüísticas. Escalar el tiempo con la longitud
  o limitar a frases cortas.
- `fill_blank` → sin la palabra a la vista.
- `multiple_choice` → máximo 3 opciones y solo como diagnóstico (ver B3).

---

## Prioridad 4 — Inteligencia del sistema

### B11 · Contexto de aprendizaje para la IA
*(era pieza 10 del plan de cableado)*

`lib/ai-practice/learning-state.ts` ya importa `ConceptSignal`. Falta que el
coach reciba: qué se estudió hoy, nivel CEFR, con qué pidió ayuda. Sin esto habla
en nivel genérico y propone estructuras aún no vistas.

### B12 · Dificultad por nivel CEFR
*(era pieza 11)* · **Tamaño:** grande, transversal

Los generadores producen ejercicios sin conocer el CEFR. El cableado da *el tema
correcto* pero no *la dificultad correcta*: vocabulario, longitud de frase,
velocidad de audio. Toca todos los generadores.

---

## Prioridad 5 — Descartado o al final

### B13 · Reto semanal de habla larga (60–90 s)
**Riesgo:** abandono. Un reto semanal que fallas una vez se vuelve culpa, y la
culpa mata la racha. Si se hace: **acumulativo** (4 al mes, no uno cada lunes) y
sin castigo por saltarlo.

### B14 · Mapa visual de conocimiento
**El de menor retorno.** El dato ya existe, pero el coste no es el dato: es el
layout, el rendimiento con 1000 nodos, el responsive y el estado vacío. Las
vistas bonitas de progreso se miran dos veces y luego nunca.

Nota: parte de su valor lo absorbe la pieza 9 del plan de cableado
(`/progress` con dominados y lo que falta para el siguiente nivel).

---

## Orden sugerido

```
B1 → B2 → B3 → B4 → B5 → B6 → B7 → B10 → B11 → B8 → B9 → B12 → B13 → B14
```

- **B1 primero**: el plan de cableado depende de producción hablada funcional.
- **B2 antes que B3**: sin mecanismo no hay retirada posible.
- **B4 antes que ejercicios nuevos**: hace rendir más lo que ya existe.
- **B12 al final**: grande y transversal; se beneficia de que todo lo demás esté
  estable.

## Dependencias con el plan de cableado

| Backlog | Requiere |
|---|---|
| B1 | — (independiente, puede ir en paralelo) |
| B6 | Cableado completo (piezas 1–6) |
| B11 | Pieza 7 (evidencia → ConceptSignal) |
| B12 | Pieza 9 (`/progress`) para validar niveles |
