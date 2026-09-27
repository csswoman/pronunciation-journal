# Métricas honestas de progreso

**Estado:** Fase A y Fase B implementadas. Fórmula aprobada.

Este contrato separa actividad, precisión y evidencia. Progreso continúa siendo
una proyección de solo lectura: no convierte volumen, completion ni intentos no
evaluados en dominio.

## Denominadores

- `SessionResult.results.length` describe interacciones de la sesión.
- `SessionResult.evaluatedTotal` cuenta únicamente respuestas evaluables y es el
  denominador de `accuracy` y de `bySlug`.
- `activity_sessions.exercises_total` conserva volumen de actividad; puede ser
  mayor que `evaluatedTotal`. `accuracy_pct` procede del denominador evaluado.
- Saltos, autoevaluaciones sin nota y fallos del evaluador permanecen como
  actividad, pero no aportan precisión, habilidad ni evidencia SRS.

Una respuesta nueva es evaluable solo con `status = answered`. Para filas
históricas sin status se conserva compatibilidad si `user_answer != skip` y
existe grade numérico. `grade = 0` es una nota real; `grade = null` significa
que no hubo evaluación.

## Vocabulario

El total de word bank suma solo buckets SRS mutuamente exclusivos: `new`,
`learning`, `review`, `mastered` y `legacyMastered`. Los ejes `saved`,
`familiar` y `verified` describen señales independientes y nunca amplían el
denominador. En el lector actual, `mastered` y `legacyMastered` son ramas
exclusivas de una misma fila.

## Lectura completa y disponibilidad

Las consultas de `answer_history` usadas por las métricas se paginan en bloques
de 1000 con orden estable por `answered_at ASC, id ASC` y una ventana temporal
capturada antes de leer. Esto evita el truncamiento implícito incluso cuando
muchas filas comparten timestamp.

Cada sección comprueba `.error`. Un conjunto vacío válido produce cero o el
estado vacío correspondiente; un fallo agrega el nombre de la sección a
`ProgressPageData.dataErrors`. Los datos parciales no se presentan como un cero
confirmado.

## Fórmula de habilidades (Fase B — aprobada)

### Contrato `SkillScore`

Cada habilidad produce un `SkillScore` con estos campos:

| Campo | Tipo | Significado |
|---|---|---|
| `score` | `number \| null` | 0-100 o null si evidencia insuficiente |
| `accuracy` | `number` | % correcto sobre respuestas deduplicadas evaluables |
| `uniqueContentCount` | `number` | Contenidos canónicos distintos en la ventana |
| `evidenceCount` | `number` | Total de respuestas deduplicadas evaluables |
| `insufficientEvidence` | `boolean` | `true` si `uniqueContentCount < 5` |

### Fórmula

```
score = round(min(100, 0.75 × accuracy + 0.25 × retention))
```

- `accuracy` = % correcto sobre respuestas evaluadas deduplicadas por skill.
- `retention` = señal a largo plazo: mastered/total para vocabulario,
  contrast accuracy para pronunciación, 0 para el resto.
- `frequency` (volumen) fue retirado — no es evidencia de habilidad.

### Deduplicación

Dentro de la ventana de 30 días, por cada `content_id` se cuentan como máximo
los **3 intentos más recientes** (aciertos y fallos por igual; nunca se elige
solo el mejor). Las filas sin `content_id` (legacy/null) no se deduplicaron
(no se puede deduplicar lo que no tiene identidad), pero tampoco incrementan
`uniqueContentCount`.

### Umbral de evidencia mínima

Se requieren al menos **5 contenidos canónicos distintos** (`uniqueContentCount
>= 5`) para calcular un score numérico. Por debajo:

- `score` devuelve `null` (no 0).
- La UI muestra estado `insufficient-evidence`.
- El promedio general excluye skills sin evidencia suficiente.

### Invariantes

- Veinte fallos no elevan habilidad.
- Cincuenta repeticiones del mismo contenido no simulan amplitud.
- Un dato anterior a 30 días sale de la ventana activa sin tratarse como 0.

## Fuera de alcance

No se cambian XP por skip, retención, nivel CEFR ni pesos de dificultad como
parte de esta fase.
