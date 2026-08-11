# Piloto frío del learning loop

## Estado y pre-registro

- Pre-registrado: 2026-08-11
- Estado: **PREPARADO — sin participante inscrito ni baseline ejecutado**
- Cohorte prevista: 1–3 participantes, identificados solo como `P01`, `P02`, `P03`
- Ventana: 7 días reales por participante; día 2 = 48 h ± 8 h y día 7 = 168 h ± 12 h desde la práctica
- Política congelada durante el piloto: FSRS, `desiredRetention`, Daily, budgets y MaturityPolicy no cambian

No hay resultados en este documento. Las celdas de resultados se completan solo
en el momento de cada sesión; nunca se reconstruyen retrospectivamente.

## Preguntas

1. ¿La evidencia local/outbox queda completa y sin duplicados en uso real?
2. ¿Qué proporción de targets se retiene en día 2 y día 7 sin pre-exposición?
3. ¿La retención se transfiere a una oración o contexto nuevo?
4. ¿El usuario sigue las recomendaciones de repaso cuando aparecen?

## Muestra

Cada participante trabaja 20–30 targets, con esta distribución objetivo:

| Segmento | Targets | Modalidades mínimas | Superficie de práctica |
|---|---:|---|---|
| Vocabulario | 6–8 | meaning recall, contextual use | Essential Words, Daily |
| Grammar topic | 5–7 | contextual use, written production compatible | Ruta/Mazo/Mini-lección, Review |
| Listening/pronunciation | 5–7 | perception, STT intelligibility cuando exista | Sound Lab, Ruta de pronunciación |
| Frases | 4–6 | contextual use o spoken production con target explícito | Tracking, misión |

Se eligen IDs canónicos resolubles antes del baseline. Una frase sin target puede
usarse para verificar activity-only, pero no cuenta como target elegible de
retención.

## Procedimiento

### Baseline — día 0

1. Registrar alias, timestamp y entorno, sin PII.
2. Evaluar cada target sin mostrar definición, respuesta, IPA o ejemplo justo antes.
3. Registrar respuesta, modalidad, latencia y ayudas. Una exposición o completion no es un acierto.
4. Practicar los targets mediante al menos tres superficies.
5. Registrar resultado inmediato y auditar outbox/historial: una answer por attempt ID y un summary por sesión.

### Retest frío — día 2

1. No repasar el target en los 30 minutos previos.
2. Evaluar el mismo target con la misma modalidad base, sin pista inicial.
3. Para targets compatibles, evaluar transferencia con oración/contexto nuevo.
4. Registrar skips técnicos por separado; nunca convertirlos en fallos pedagógicos.

### Retest frío — día 7

Repetir el protocolo de día 2. Después auditar duplicados/faltantes y calcular
las métricas predefinidas. Solo entonces registrar una decisión.

## Registro por intento

| participant | timestamp | phase | target_id | segment | modality | origin | baseline | hints | immediate | day_2 | day_7 | transfer | latency_ms | technical_skip | answer_id | session_id |
|---|---|---|---|---|---|---|---|---:|---|---|---|---|---:|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

Valores de resultado: `correct`, `incorrect`, `not_checked`. `technical_skip`
usa un código breve y una nota en el log de incidencias.

## Registro de sesiones y recomendaciones

| participant | session_id | surface | started_at | completed_at | answers_expected | answers_found | summary_count | recommendation_shown | recommendation_followed |
|---|---|---|---|---|---:|---:|---:|---|---|
| — | — | — | — | — | — | — | — | — | — |

## Métricas predefinidas

- Retención día 2 y día 7: aciertos / checks elegibles, total y por target/segmento/modalidad.
- Transfer success: aciertos de transferencia / checks de transferencia elegibles.
- Follow-through: recomendaciones seguidas / recomendaciones mostradas.
- Integridad: answers duplicadas, answers faltantes, summaries duplicados, summaries faltantes.
- Resolución: targets no resolubles / targets seleccionados.
- Actividad y completion se reportan aparte y no entran al numerador de aprendizaje.
- `0.90` se muestra solo como referencia descriptiva del scheduler.

No se cambia ninguna política con menos de 30 checks elegibles por
segmento/modalidad. Un único acierto nunca se etiqueta como `mastered`.

## Reglas de decisión

1. Cualquier answer/session duplicada o faltante reabre aceptación técnica.
2. Si el usuario no vuelve al repaso, proponer activar el Plan 043.
3. Si vuelve y falla retención, investigar contenido, scaffolding o scheduling.
4. Si retiene pero no transfiere, priorizar producción contextual/misiones.
5. `conjugation_blank` permanece deferred sin evidencia y plantillas autoradas.
6. Con muestra insuficiente, la decisión es `continue` y se conserva la incertidumbre; no se ajusta FSRS/Daily.

## Resultados

Pendientes. Requieren baseline real, día 2, día 7 y transferencia.

## Decisión

Pendiente: `continue`, `adjust` o `stop` solo después del retest de día 7 y con
referencia explícita a las tablas anteriores.
