Auditoría: evaluación → progreso → UI (english-journal, rama dev, 2026-09-26)
Contexto
Pediste revisar, antes de refactorizar nada, si las respuestas del usuario llegan de verdad al progreso que muestra la app. Esta fase solo leyó el código y la base de datos real (proyecto enpxrijfnkcgvkyrjxod, con consultas SELECT). Cada hallazgo está marcado como BUG CONFIRMADO / RIESGO / MEJORA / NO VERIFICABLE. Al final hay un plan de ejecución: primero tests que reproducen los bugs y después solo los arreglos pequeños e inequívocos.

A. Arquitectura actual
Hay 12 sistemas de progreso independientes. No comparten fórmula, escala ni tabla:

#	Sistema	Fórmula	Dónde se guarda
1	SM-2 del banco de palabras	RPC apply_word_bank_rating_event (servidor)	word_bank, srs_rating_events
2	SM-2 por tema	RPC apply_topic_srs_rating_event	topic_srs
3	FSRS de chunks y fragments	se calcula en el cliente y se sube el estado final	Dexie srsData + content_srs
4	Modelo de habilidades de Essential Words (FSRS + madurez)	runtime-engine	learning_items, attempt_logs, srs_review_events
5	Maestría por contraste de sonido	EMA con decaimiento × escala por repeticiones (mastery-pct.ts)	user_contrast_progress
6	SR binario de sonidos	intervalos 1/3/7 (phoneme-practice/sr.ts)	ídem
7	Puntuación de fluidez por habilidad	0.6·aciertos + 0.3·volumen + 0.1·retención (fluency-scores.ts)	se calcula al cargar /progress
8	Señales de concepto (lecciones)	≥80% en una sesión = "mastered"	user_learning_state (JSON)
9	Ruta del curso	lecciones completadas / total	lesson_completions
10	Rachas	4 implementaciones (umbral 1 o 5)	se calculan al vuelo; Dexie userStats
11	XP y actividad	sessionXp	activity_sessions
12	Coach (EMA de errores por tema)	α = 0.3	user_learning_state
Tipos de ejercicio: 24 slugs (lib/practice/types.ts), divididos en genéricos y de fonemas. Cada uno se asigna a una habilidad en EXERCISE_SKILL_MATRIX (lib/progress/skill-matrix.ts). La habilidad se usa solo para analítica: no afecta al SRS.
Cómo se decide si una respuesta es correcta: cada componente lo decide por su cuenta (matchAnswer, gradeWithLocalFirst, evaluateExercise, igualdad exacta de strings o scorePronunciation).
Calidad SM-2: se calcula en un único sitio, answerToGrade (lib/practice/grade.ts). Solo mira acierto, firstTryFailed, latencia y, en 3 tipos, un score.
Persistencia: todo pasa por Dexie → outbox (lib/sync/sync-manager.ts) → Supabase. Si una escritura falla 3 veces se marca como failed para siempre.
Pistas: hintCount solo cambia el texto del feedback. No llega a la calificación.
Intentos: hay límite de 2 correcciones con IA (grading-attempts.ts). En los ejercicios genéricos, reintentar pone firstTryFailed y la calidad queda en 1.
Parcialmente correcto: fuera de speak/production no hay crédito parcial. Un typo (score 90) califica igual que la respuesta exacta.
B. Flujo de datos real
componente.onResult(isCorrect, answer, ms, extras)
 → GenericExerciseView.handleResult/handleContinue   ⚠ ignora extras.resultStatus, extras.firstTryFailed y hintCount
 → useSessionState.handleSubmit → buildExerciseResult (attemptId = session:index:exerciseId)
 → savePracticeAnswer (lib/practice/queries.ts:78)
     ├ answer_history (upsert por id; deduplica solo si la entrada sigue en el outbox)
     ├ word_bank / topic_srs  → RPC con idempotency_key = randomUUID() en cada llamada ⚠
     └ content_srs (fragments/chunks) → estado absoluto, gana la última escritura
 → al terminar la sesión: recordActivitySession → activity_sessions + señales de concepto (user_learning_state)
 → outbox flush → Supabase
 → /progress: getProgressPageData (Server Component) lee answer_history (30 días), word_bank, topic_srs, contrasts…
     → computeFluencyScores / getAccuracyStats / buildTopicStatusByDeck → tarjetas
C. Qué funciona bien (verificado)
SM-2 puro (lib/srs/schedule.ts): la calidad se limita a 0–5, ease ≥ 1.3, sin NaN y con 21 tests.
RPCs del servidor: usan idempotency key + FOR UPDATE y aplican SM-2 en el servidor. Un reintento de red nunca duplica una calificación ya enviada.
matchAnswer: ignora mayúsculas, espacios y puntuación, admite contracciones equivalentes y typos (Damerau ≤ 1, sin perdonarlos en las palabras objetivo) y tiene plantillas {a|b}.
Calificación con IA (local-first con caché y banco de respuestas aceptadas): el presupuesto de 2 correcciones se respeta.
answerToGrade: saltos y respuestas no evaluadas devuelven null, así que el SRS no los toca. Reintentar en genéricos da calidad 1.
Essential Words (modelo de habilidades): es el subsistema más riguroso. Tiene en cuenta pistas, rescate, typos, firstTryFailed y latencia, y la madurez exige estabilidad ≥ 30 y ≥ 4 aciertos.
Procedencia de la palabra "Dominada": exige ≥ 2 evidencias objetivas seguidas y se reinicia con un fallo.
Outbox: respeta el orden por entidad, recupera entradas atascadas en syncing y distingue errores permanentes de transitorios.
buildSessionResult: excluye los saltos de la precisión de la sesión.
D. Problemas (ordenados por prioridad)
P	Tipo	Problema	Archivo	Solución
P0	BUG CONFIRMADO	Las respuestas de Essential Words nunca llegan a answer_history	lib/essential-words/runtime-engine.ts:309	Ampliar el CHECK a 'essential-words' (migración) y reencolar las entradas failed
P0	BUG CONFIRMADO	Repetir en la misma sesión cuenta como repaso espaciado; se llega a "dominado" en minutos	RPCs en 20260720080000_srs_rating_events.sql y 20260721194346_…sql; savePracticeAnswer	Ignorar calificaciones ≥3 si la tarjeta no está vencida, o como mucho 1 avance por entidad y día
P0	BUG CONFIRMADO	La autoevaluación y los fallos del evaluador se guardan como respuestas answered	components/practice/session/GenericExerciseView.tsx:57,66,77	Mapear extras.resultStatus → status y conservarlo en result
P1	BUG CONFIRMADO	La "habilidad %" de /progress mezcla volumen de actividad con aprendizaje	lib/progress/fluency-scores.ts:115-118 + queries.ts:473	Quitar la frecuencia del score, filtrar filas sin grade, deduplicar por contenido y exigir un mínimo de evidencia
P1	BUG CONFIRMADO	La maestría de sonidos baja tras una buena sesión	lib/phoneme-practice/mastery-pct.ts:52-64	Guardar la EMA sin escalar y aplicar repScale solo al mostrarla
P1	BUG CONFIRMADO	Las pistas no afectan la calificación; el firstTryFailed del componente hijo se pierde	GenericExerciseView.tsx:66, lib/practice/grade.ts	Pasar hintsUsed y firstTryFailed a answerToGrade (con pista → 3, dos o más → 1)
P1	BUG CONFIRMADO	Coach: sin latencia la calidad es 5; cada reintento se guarda como una respuesta nueva	lib/ai-practice/coach-progress.ts:36, FillBlankWidget.tsx:55	Pasar la latencia, dar un attemptId por widget y marcar firstTryFailed en los reintentos
P1	BUG CONFIRMADO	Fonemas: el reintento tras las pistas reutiliza el attemptId y duplica los resultados	components/practice/session/useSessionState.ts:116,153-155,197	Poner un sufijo de intento en el attemptId y reemplazar el resultado en vez de añadir otro
P1	BUG CONFIRMADO	Las escrituras de SRS no son idempotentes por intento (idempotency key aleatoria en cada llamada)	lib/word-bank/srs-queries.ts:250, lib/practice/topic-srs-queries.ts:69, queries.ts:145-189	Derivar la key del attemptId (uuidv5) y ponerla también en answer_history
P1	BUG CONFIRMADO	Lección "completada" sin evidencia; concepto "mastered" con 1/1 correcto	MiniLessonQuiz.tsx:137-143, GrammarStudyDeck.tsx:134, activity-hub.ts:227	Etiquetar como "vista" (actividad) y exigir n ≥ 5 y acumular antes de "mastered"
P1	BUG CONFIRMADO	Números inventados en la UI	ver sección H	Mostrar un estado vacío real
P2	BUG CONFIRMADO	La retención de vocabulario divide entre un total inflado	lib/progress/fluency-scores.ts:88,237 + queries.ts:346-368	Sumar solo new, learning, review, mastered y legacyMastered
P2	BUG CONFIRMADO	Los errores de consulta se muestran como 0%	lib/progress/queries.ts:176,299,356,464	Revisar .error y añadirlo a dataErrors
P2	RIESGO	answer_history sin paginar (PostgREST corta en 1000 filas, sin orden)	queries.ts:445,292	Usar agregados en un RPC o .order().range()
P2	BUG CONFIRMADO	Cada paso diario escribe una fila activity_sessions vacía de más	hooks/useDailyPlan.ts:158	No llamarlo cuando el paso ya generó una sesión real
P2	BUG CONFIRMADO	Connected speech: id no es uuid y la columna score no existe, así que la escritura falla para siempre	lib/sounds/queries.ts:199,207	Usar crypto.randomUUID() y quitar score
P2	BUG CONFIRMADO	's y 'd solo se expanden a is/would ("He's been" se rechaza); hay dos tablas de contracciones distintas	lib/exercises/answer-match.ts:31, grading-pipeline.ts:6	Probar las dos expansiones (is/has, would/had) y unificar la tabla
P2	BUG CONFIRMADO	Los quizzes de curso (MC) no alimentan ninguna habilidad; los drills del grammar-deck no tocan ningún SRS	lib/practice/queries.ts:240-259; resolve-attribution	Enviar taskSkill/topic en el payload
P2	RIESGO	Un error transitorio repetido 3 veces deja la entrada del outbox en failed para siempre (solo se recuperan los errores de esquema)	lib/sync/sync-manager.ts:213	Reintentar las failed transitorias al reconectar y mostrarlas en la UI
P2	RIESGO	user_contrast_progress tiene 2 escritores incompatibles: totales absolutos frente a incrementos (se pueden perder actualizaciones)	contrast-queries.ts:135, RPC essential-word-contrast	Usar incrementos en el servidor
P2	BUG CONFIRMADO	La racha de inmersión en home usa umbral 5; en otra pantalla usa 1	lib/home/queries.ts:359	Pasar 1
P3	MEJORA	Métricas inconsistentes: exercises_total incluye saltos y accuracy_pct no; el resultado parcial al salir tiene otra fórmula; saltar da 2 XP; flushOutbox() sin userId no hace nada; weakestPhonemes.accuracy es en realidad maestría; "retención" en el hub es precisión; el interval de los fragments queda viejo	varios	Unificar en buildSessionResult y renombrar
Evidencia de los P0
Essential Words. El CHECK en la base real es context IN ('sound_lab','courses','ai_coach','practice','daily','core-1000','review'). El runtime envía 'essential-words', Postgres responde 23514 y el outbox lo marca como failed permanente.
Datos reales: 0 filas de essential-words en answer_history frente a 11 activity_sessions de essential_words.
Impacto: la precisión, las habilidades, el heatmap de 5 respuestas/día y "can-say-now" ignoran todo lo practicado en Essential Words. El SRS propio de Essential Words sí funciona.
Reproducir: completar una sesión de Essential Words y mirar Dexie syncOutbox (table=answer_history, status=failed, código 23514).
Repetición en la misma sesión. _sm2_schedule_next no comprueba next_review_at. Cada calificación ≥3 hace repetitions += 1, y los intervalos quedan en 1 → 6 → ~16 → ~42 → mastered.
Datos reales: el tema vocab:vocabulary tuvo 3 calificaciones en 41 segundos y quedó con interval 14 y reps 3. buildTopicStatusByDeck (reps ≥3 e interval ≥7) ya lo muestra como dominado.
Un quiz de mini-lección de 5 preguntas del mismo tema, todas correctas, lo lleva a "mastered".
Lo mismo pasa con una palabra de word_bank repetida 4 veces en una sesión. La procedencia objective exige ≥ 2 evidencias, pero no pide que estén separadas en el tiempo.
Estado de autoevaluación.
WrittenProductionExercise.handleSelfCheck llama onResult(true, …, {resultStatus:'unscored'}). Pero GenericExerciseView lee extras?.status ?? 'answered' (en producción) o fija 'answered' a mano (ruta genérica, línea 77).
Resultado: una autoevaluación hecha offline cuenta como acierto con calidad 5/4/3, que avanza el SRS del tema y sube la precisión y la habilidad "writing".
Al revés, cuando falla el micrófono o el evaluador (SpokenProduction, CsShadow), se guarda isCorrect=false, lo que en SRS es un lapso (calidad 1). Es un falso negativo.
La misma pérdida ocurre en ErrorCorrection, SentenceTransformation y Personalization.
E. Falsos positivos
La repetición inmediata avanza el SRS (P0 nº 2).
La autoevaluación cuenta como acierto (P0 nº 3).
fluency: 1 sola respuesta correcta = 62% en esa habilidad (0.6·100 + 0.3·5); 20 respuestas incorrectas = 30%; repetir el mismo ejercicio fácil 20 veces lleva a ~90%. La dificultad no se tiene en cuenta.
Las pistas no penalizan. En ErrorCorrection, fallar localmente y acertar después califica 5 porque el firstTryFailed del hijo se descarta.
El "Mostrar opciones" del Coach convierte producción en reconocimiento (50% de acertar al azar con 2 opciones) sin cambiar la calificación. En el Coach, un acierto sin latencia vale calidad 5.
Una opción múltiple acertada al azar en menos de 5 s vale calidad 5, igual que la producción. Es una limitación de diseño (MEJORA: tope de 4 para reconocimiento).
Lección completada con 0/N en el quiz, o solo pasando las tarjetas. Concepto "mastered" con 1/1. mergeConceptSignals reemplaza la señal entera en vez de acumular.
22 filas daily_plan vacías (datos reales) inflan el número de sesiones y el historial.
F. Falsos negativos
Todo Essential Words queda fuera de answer_history (P0 nº 1).
Un fallo del evaluador o del micrófono se guarda como respuesta incorrecta (lapso).
En fluency, las filas saltadas o unscored cuentan como incorrectas: mapRows no filtra por status ni grade.
La maestría de sonido baja tras una buena sesión. Con 80% de acierto: 1.ª sesión = 25, 2.ª al día siguiente = 13.
"He's been", "I'd finished" y "It's got" se rechazan si la referencia es la forma larga (answer-match.ts:32-43). No aplica si la plantilla ya incluye la contracción.
evaluateExercise (Coach) no reconoce "do not" como equivalente de "don't".
Los quizzes de curso sin taskSkill y los drills del grammar-deck no aportan nada a habilidades ni al SRS.
Connected speech falla siempre al sincronizar.
No es bug: la ruta legacy de Essential Words solo corre para usuarios anónimos, así que no se pierden datos ahí.
G. Inconsistencias de datos
La "precisión" tiene 4 fórmulas:
buildSessionResult excluye todo lo no respondido;
getAccuracyStats solo excluye 'skip';
fluency no excluye nada;
buildPartialResult (al salir de la sesión) cuenta los saltos como fallos.
activity_sessions.exercises_correct/exercises_total no coincide con accuracy_pct cuando hay saltos.
"Dominado" tiene 3 definiciones: interval > 21 días (SM-2); maestría ≥ 85 con 10 intentos y racha 3 (contrastes); madurez FSRS (Essential Words). En topic-progress basta con reps ≥ 3 e interval ≥ 7.
Hay 4 rachas: con umbral 1, con umbral 5 (heatmap), la de inmersión con 5 y la de Dexie userStats, que solo escribe Essential Words (son los puntos de "Esta semana" en el curso).
El % del curso usa denominadores distintos: el hub cuenta solo lecciones core y la ruta incluye las opcionales.
Días activos: el RPC de proyecciones usa fecha UTC y la racha usa America/Lima.
H. Problemas de UI
Datos inventados, todos BUG CONFIRMADO:

ThisWeekCard.tsx:9,21 muestra 53 ejercicios y 8 al día cuando el valor es 0.
DailyProgressSidebar.tsx:48,55: "29 repasos" y "bajan a 23".
SessionReady.tsx:25,71: nuevas: 2 y || 2800.
SessionReadyHero.tsx:135: "Última: sin fallos · 1/1 · 0:42".
SkillsBalanceCard.tsx:185: ?? "Mejorando esta semana".
VocabularyReviewCard pinta 1 segmento lleno con 0 aprendidas.
Etiquetas que no corresponden al dato:

"X %" de sonidos débiles es maestría con decaimiento, no precisión.
"% de retención" en el hub es la precisión de 7 días.
FluencyRadarCard dice "6 dimensiones" y muestra 7.
SkillsBalanceCard oculta writing, así que quien solo practica escritura ve todo en 0.
I. Casos extremos
Usuario	Esperado	Actual
Nuevo, 0 respuestas	0 / estado vacío	Habilidades en 0 ✓. SessionReady muestra "2 de 2800" y la tarjeta semanal 53 ✗
1 respuesta correcta	Evidencia insuficiente	Habilidad al 62% ✗
1 respuesta incorrecta	Poca evidencia	0.3·5 = 2% ✓ (aceptable)
Responde al azar en MC	~25–50%	Precisión ≈ azar ✓, pero los aciertos rápidos valen calidad 5 ✗
Repite el mismo ejercicio 50 veces	Evidencia limitada	Frecuencia al 100% y SRS del tema "mastered" ✗
Falla 5 veces y acierta	Calidad 1	Genéricos: 1 ✓. ErrorCorrection: 5 ✗. Coach: 5 respuestas guardadas y la última con calidad 5 ✗
Usa todas las pistas	Penalizar	Sin efecto en la calificación ✗ (Essential Words sí penaliza ✓)
Solo aciertos fáciles	No debe subir nivel alto	La dificultad no se mira; el nivel CEFR no se calcula con la práctica (no infla el nivel) ✓/✗
Usuario con progreso antiguo (>30 días)	Conservar el dominio	Las habilidades vuelven a 0 fuera de la ventana de 30 días ✗ (RIESGO de diseño)
Abandona la sesión	Respuestas guardadas, sin sesión	Respuestas guardadas por ejercicio ✓. activity_sessions no se crea ✓
Refresca mientras guarda	Nada duplicado	La restauración reanuda desde el índice guardado. Si refresca durante las pistas de fonemas (el progreso no se guarda en esa rama) repite el ejercicio con otro sessionId y duplica ✗
Mismo ejercicio en dos pestañas	Una evidencia	Dos respuestas y dos avances de SRS (no hay clave de idempotencia por contenido) ✗
Conexión lenta u offline	Guardar en local y sincronizar	Offline ✓ (outbox). Tras 3 errores transitorios queda en failed sin recuperación ✗ (RIESGO)
Usuario avanzado (>1000 respuestas en 30 días)	Métrica completa	Truncado a 1000 filas sin orden (RIESGO)
J. Tests existentes
Hay 943 archivos de test:

Bien cubierto: SM-2 y FSRS, matchAnswer, pipeline de calificación, answerToGrade, attempt-grade de Essential Words, outbox (incluye un test titulado "BUG: … applies it twice").
fluency-scores.test.ts solo comprueba > 0, sin invariantes.
mastery-pct.test.ts no simula sesiones consecutivas.
Sin tests: HabitHero, SkillsBalance, AccuracyGauge, AccumulatedPractice, WhereToFocus, ThisWeek, DailyProgressSidebar, getAccuracyStats, getPracticeHubData, la propagación de resultStatus, el attemptId en reintentos y el SRS en la misma sesión.
Playwright solo cubre accesibilidad y rendimiento. No hay e2e de progreso.
K. Tests que faltan (invariantes)
Archivo nuevo: lib/progress/__tests__/progress-invariants.test.ts. Primero los "caracterizo": fallan hoy y demuestran cada bug.

// fluency: 1 respuesta no puede dar >40% ; volumen incorrecto no puede subir la habilidad
expect(computeFluencyScores({...base, answers:[ans({isCorrect:true})]}).grammar).toBeLessThan(40)
expect(computeFluencyScores({...base, answers: Array(20).fill(ans({isCorrect:false}))}).grammar).toBe(0)
// skips / unscored no cuentan
expect(score([ans({isCorrect:false, grade:null})])).toBe(0)
// retención de vocab usa el total real
expect(computeFluencyScores({...base, answers:[], wordsByStatus:{new:5,learning:0,review:0,mastered:5,saved:5,verified:5}}).vocabulary).toBe(35) // 0.7*50
// maestría de sonido monótona con buena práctica
const s1 = computeNextMasteryPct(0,80,null,1); const s2 = computeNextMasteryPct(s1,80,d1,2, d2)
expect(s2).toBeGreaterThanOrEqual(s1)
// maestría ∈ [0,100], nunca NaN (property test con fast-check o bucle aleatorio)
Otros tests:

GenericExerciseView.status.test.tsx: onResult(true,…,{resultStatus:'unscored'}) debe llegar a onSubmit con status:'unscored'. También: el firstTryFailed del hijo se conserva y hintCount > 0 llega a extras.
answerToGrade: pista usada → ≤ 3; status:'unscored' → null.
savePracticeAnswer.idempotency.test.ts: la misma attemptId dos veces produce 1 answer_history y 1 evento de SRS.
useSessionState.retry.test.tsx: un fonema incorrecto → retry → correcto deja 1 resultado y 2 attemptIds distintos (o reemplazo) y calidad 1.
SQL (en vitest.integration.config.ts, contra una rama de Supabase): 4 calificaciones de 5 en 1 minuto no deben dejar srs_status='mastered'.
answer-match: "He's been there" frente a "He has been there" devuelve variant.
Contrato del CHECK: todo PracticeContext que se emite debe estar en la lista del CHECK (test estático que compara el union con la migración).
UI: SessionReady con dashboard null y ThisWeekCard con 0 no deben mostrar números inventados.
L. Riesgos arquitectónicos
Doce sistemas de progreso sin una definición común de "dominado".
Idempotencia a medias: la hay en la red, pero no por intento lógico ni por contenido.
SRS sin ventana de vencimiento: cualquier superficie de práctica libre avanza el calendario.
user_learning_state es un JSON entero donde gana la marca de tiempo más nueva. Los conceptos y el coach pueden perder actualizaciones entre pestañas.
Las métricas se calculan con consultas sin paginar y errores tragados.
El estado de las respuestas (answered, unscored, evaluator_failed, skipped) se escribe con dos nombres (status y resultStatus).
M. Cambios recomendados
Correcciones necesarias (tienen tests de la sección K):

(a) resultStatus → status y conservar firstTryFailed e hintsUsed, en GenericExerciseView.tsx y grade.ts.
(b) Migración del CHECK para añadir 'essential-words' y reencolar las entradas failed con código 23514.
(c) Guarda de vencimiento en las dos RPCs de SM-2. Si la tarjeta no está vencida y la calificación es ≥3: registrar el evento sin avanzar repetitions. Es una migración nueva; sin ella el P0 nº 2 sigue abierto.
(d) Idempotency key derivada del attemptId en enqueueWordBankSRSUpdate, enqueueTopicSRSUpdate y savePracticeAnswer.
(e) Fórmula de fluency: sin volumen, filtrar grade null y con un mínimo de n. Denominador de vocabulario.
(f) computeNextMasteryPct: guardar la EMA sin escalar.
(g) Quitar los números inventados de la UI (sección H).
(h) Connected speech: id uuid y sin score.
Mejoras recomendadas:

Coach: latencia real, attemptId y firstTryFailed.
Lección "vista" frente a "aprobada"; señales de concepto acumulativas.
Unificar la precisión en buildSessionResult.
Reintentar las entradas failed transitorias del outbox.
Tabla de contracciones única que pruebe las dos expansiones.
Evitar la fila daily_plan duplicada.
Revisar .error en las consultas de progreso.
Umbral de la racha de inmersión.
Mejoras opcionales:

Tope de calidad 4 para reconocimiento/MC.
Pasar las métricas a RPCs de agregado.
Definición única de "dominado".
Incrementos en el servidor para user_contrast_progress.
N. Veredicto por subsistema
Subsistema	Estado	Evidencia
Evaluación de respuestas	Funciona con problemas	matchAnswer sólido; hay huecos con 's/'d y dos tablas de contracciones distintas
Asignación ejercicio → habilidad	Funciona con problemas	La matriz es exhaustiva, pero MC sin taskSkill y grammar-deck no aportan
Scoring (calidad)	Incorrecto	Ignora pistas y autoevaluación; el Coach da 5 por defecto
Maestría	Incorrecto	Repetir en la misma sesión lleva a mastered (confirmado con datos reales); la maestría de sonido decrece
Persistencia	Funciona con problemas	Outbox sólido; Essential Words rechazado por el CHECK; failed permanentes
Agregaciones	Incorrecto	Fluency mezcla volumen; el denominador de vocabulario está inflado; 4 fórmulas de precisión
API / loaders	Funciona con problemas	Errores tragados y sin paginación
Estado del frontend	Funciona con problemas	Resultados duplicados en el retry de fonemas
UI de progreso	Incorrecto	6 valores inventados y etiquetas engañosas
Protección contra duplicados	Funciona con problemas	Idempotente en la red, no por intento ni en dos pestañas
Manejo de errores	Funciona con problemas	dataErrors parcial; `
No se pudo verificar	—	El estado del outbox en los navegadores reales (Dexie local) y el SR de deck_entry_progress
Plan de ejecución (tras aprobar)
Trabajo en dev. Sin refactor masivo. Máximo 250 líneas por archivo.

Guardar la auditoría: copiar este documento a docs/audits/2026-09-26-learning-progress-audit.md.
Tests de caracterización (sección K), en rojo. Unit primero, luego hooks y componentes. pnpm test los debe mostrar fallando por la razón esperada.
Arreglos pequeños e inequívocos, cada uno en su commit con su test en verde:
a: GenericExerciseView.tsx y lib/practice/grade.ts
e: fluency-scores.ts, solo el denominador de vocabulario y el filtrado de grade null (el cambio de pesos de la fórmula queda para después, lo decides tú)
f: mastery-pct.ts
g: ThisWeekCard, DailyProgressSidebar, SessionReady, SessionReadyHero, SkillsBalanceCard
h: lib/sounds/queries.ts
Pendientes de tu confirmación, porque tocan la BD remota o cambian producto:
b: migración del CHECK
c: guarda de vencimiento en las RPCs
d: idempotency key determinista
cambio de pesos de fluency
"vista" frente a "aprobada"
Verificación:
pnpm type-check && pnpm lint && pnpm test.
Manual con pnpm dev: una sesión de práctica con autoevaluación offline debe quedar como unscored en Dexie syncOutbox; /progress sin números inventados con un usuario nuevo.
Después de (b): SELECT de answer_history con context='essential-words' tras una sesión.