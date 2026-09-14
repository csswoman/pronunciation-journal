# Graduar ejercicios por nivel CEFR

Estado: implementación inicial. La política CEFR controla el andamiaje de chunks, ofrece modelo auditivo y cloze con apoyo en A1, bloquea dictado completo hasta B2 e introduce sustitución autoral, reconstrucción, turnos de microdiálogo y producción menos guiada progresivamente. Los chunks sin diálogo autorado no reciben un diálogo inventado; las tareas abiertas no fabrican una respuesta de referencia que el catálogo no provee.

Este brief adapta el apoyo y la producción de cada ejercicio al nivel del alumno.

## Objetivo

Permitir comprensión y habla desde A1 sin exigir tareas que pertenecen a niveles posteriores.

## Alcance

- Declarar capacidades y dificultad CEFR por tipo de ejercicio
- Crear la progresión intención, escucha, cloze, reconstrucción, sustitución y producción
- Limitar el dictado completo temprano en A1
- Retirar apoyos de forma gradual entre A1 y C1
- Ajustar longitud, velocidad, distractores y libertad de respuesta

## Fuera de alcance

- Inferir nivel solo por porcentaje de aciertos
- Equiparar palabras poco frecuentes con dificultad avanzada
- Inventar transcripciones IPA ausentes
- Exigir scoring oral cuando el navegador no tiene capacidad

## Dependencias

Usa las relaciones del plan 10. El selector del plan 11 consume sus capacidades.

## Criterios de aceptación

- A1 puede completar el arco con producción formulaica y apoyos visibles
- A2 introduce sustitución y un turno breve
- B1 introduce dictado parcial y microdiálogo
- B2 y C1 exigen inferencia, reformulación y menor preparación
- Los tests bloquean ejercicios incompatibles con nivel o capacidad
- El fallback conserva una práctica válida cuando no hay reconocimiento de voz
