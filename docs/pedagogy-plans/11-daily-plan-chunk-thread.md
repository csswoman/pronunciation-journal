# Componer un hilo diario con novedad y repaso

Estado: implementada localmente. El plan conserva la señal SRS de chunks, introduce 3, 2 o 1 chunks inéditos según la carga vencida, prioriza dentro de la cola ya seleccionada las palabras con anclas autoradas del hilo y, en el fallback de Palabras esenciales, intenta cargar esas anclas antes de la rotación general. La tira del hilo usa el ID esencial autorado, de modo que puede relacionar “going” con la palabra base `go`. Expone una mezcla auditable de acciones; la proporción real se calibrará con el piloto de la tarea 15.

Este brief convierte el Plan diario en una secuencia comunicativa centrada en chunks relacionados.

## Objetivo

Garantizar progreso perceptible mediante contenido nuevo, recuperación espaciada y una transferencia final dentro de la misma situación.

## Alcance

- Seleccionar uno, dos o tres chunks nuevos según carga y antigüedad
- Mantener repasos vencidos sin eliminar toda novedad en modo normal
- Reservar cerca del 70% de las acciones agregadas para trabajo con chunks
- Reutilizar palabras ancla y objetivos auditivos dentro del hilo
- Explicar por qué aparece cada paso
- Evitar más de una actualización SRS del mismo target por evidencia equivalente

## Fuera de alcance

- Compartir el presupuesto interno de Palabras esenciales
- Crear un scheduler paralelo
- Declarar mastery por completar el hilo
- Forzar 70/30 exacto en cada sesión corta

## Dependencias

Requiere el modelo del plan 10. Puede implementarse antes del plan 15 con métricas diagnósticas.

## Criterios de aceptación

- Una sesión normal contiene al menos un chunk nuevo
- Los pasos comparten situación, chunks o palabras ancla verificables
- Una sesión de carga alta reduce novedad, pero conserva un chunk nuevo
- “Solo repasar” existe únicamente como elección explícita
- La auditoría reporta acciones de chunk y acciones de palabra o sonido
- El resumen distingue contenido nuevo de contenido recuperado
