# Assessment result

Resultado de colocación y checkpoint en `components/courses/`.

- `AssessmentCheckpointResultView` muestra el umbral del examen, temas que siguen
  disponibles y correcciones por pregunta. Usa `PastelCard` en mint al aprobar y
  butter para repasar; el color siempre acompaña una etiqueta de estado.
- `AssessmentPlacementResultView` combina el punto de partida, el resultado por
  nivel y temas de repaso ordenados por errores evaluados.
- `AssessmentQuestionFeedbackList` presenta pregunta, respuesta elegida,
  respuesta correcta y explicación editorial cuando existe.
- `AssessmentLevelBreakdown` representa aciertos de cada nivel como conteo y
  señales accesibles por pregunta. “Umbral alcanzado” describe el checkpoint; no
  afirma dominio permanente.

Las superficies usan `PastelCard`, `Badge`, `PillButton` y tokens semánticos. Los
enlaces internos conservan semántica de navegación con `next/link` y replican
los tokens de acción de sesión. No se añaden paletas, estimaciones de tiempo ni
afirmaciones de dominio fuera de la evidencia calculada por el servidor.
