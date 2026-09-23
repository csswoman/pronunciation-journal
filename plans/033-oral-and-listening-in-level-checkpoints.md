# Plan 033: Evaluar comprensión auditiva en todos los checkpoints de nivel

> **Executor instructions**: Revisa los contratos y la ruta de puntuación del cliente y del servidor antes de implementar. La promoción debe depender de una respuesta auditiva corregida por el servidor. Actualiza `plans/README.md` al terminar.
>
> **Drift check (run first)**: compara `lib/courses/curriculum.ts`, `lib/courses/assessment.ts`, `lib/courses/server-assessment.ts`, `components/courses/AssessmentClient.tsx`, `components/courses/AssessmentInputViews.tsx`, `lib/courses/assessment-schema.ts` y `app/api/assessment/results/route.ts` con el código vigente. Ajusta la implementación si cambió el contrato.

## Status

- **Execution**: IN PROGRESS — banco e integración A1–C2 implementados; cada nivel aprobado ahora muestra su puntaje, errores y temas para repasar antes de avanzar. Suite focalizada verificada (7 archivos, 64 tests, 2026-09-23). Falta solo la comprobación interactiva de audio/teclado en navegador.
- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: assessment / pedagogy
- **Planned at**: commit `87636eca`, 2026-09-22; alcance corregido

## Why this matters

Los contratos de nivel contemplan gramática, vocabulario y lectura, pero ninguna tarea de escucha. El plan anterior solo añadía listening en A1/A2 y proponía dejar el habla para una fase indefinida. Eso no resolvía el diagnóstico para B1–C2. Este plan cubre **comprensión auditiva A1–C2**; la producción oral tiene su propio contrato y verificación en el Plan 034.

## Current state

- `AssessmentQuestion` distingue ejercicios escritos y auditivos. El servidor conserva claves; `toClientAssessmentQuestions` entrega solo prompt, opciones y URL del audio.
- Cada nivel usa seis preguntas de gramática, dos de lectura y seis auditivas (tres diálogos, dos preguntas cada uno): 14 por nivel.
- Los umbrales son 10/14 y al menos 3/6 auditivas en A1; 12/14 y al menos 4/6 auditivas en A2–C2.
- `/api/assessment/score` corrige placement/invitados sin persistir; `/api/assessment/results` reconstruye y puntúa de nuevo antes de persistir una cuenta autenticada.
- Las preguntas auditivas requieren reproducción completa para habilitar respuestas; el error conserva la selección, deshabilita el avance y ofrece reintento.

## Scope

**In scope**: banco curado A1–C2, reproducción accesible, composición determinista en cliente y servidor, puntuación y promoción con un mínimo auditivo explícito, tests de ambos caminos.

**Out of scope**: declarar competencia oral; aceptar una transcripción como respuesta del alumno; cambiar la escritura de nivel sin comprobar su contrato; generar audio a partir de texto visible en una prueba de escucha.

## Steps

1. Define ítems de escucha por nivel con audio curado estable, pregunta, opciones y respuesta. El estímulo debe ser reproducible en el entorno soportado y no mostrar una transcripción antes de responder. Fija IDs estables y valida existencia de assets. A1–C2 deben tener al menos un ítem evaluable cada uno, con dificultad y función comunicativa apropiadas al nivel.
2. Integra los ítems en `buildAssessmentQuestions` sin depender de un array que solo conozca el cliente. `buildServerAssessment` debe reconstruir exactamente IDs y claves de respuesta. Mantén la longitud y los umbrales del examen coherentes con el nuevo número de preguntas; no supongas que añadir `listening` a `questionTypes` por sí solo agrega ítems al runtime.
3. Define una condición auditiva independiente para aprobar cada checkpoint: acertar solo preguntas escritas no debe compensar cero aciertos de escucha. Mantén el resultado agregado y el detalle de dominio suficientemente claros para no presentar un total como dominio oral. Decide de forma explícita cómo se usa listening en placement y en modo invitado, sin alterar silenciosamente la promoción existente.
4. En `AssessmentInputViews.tsx`, usa un control de audio accesible por teclado y táctil con estados de carga, error y repetición. La pregunta no debe revelar el texto del audio por props, HTML, aria-label ni fallback visual antes de responder. Si el audio no está disponible, ofrece reintento y conserva el intento; no otorgues el punto ni apruebes por omisión.
5. Actualiza tests de currículo, construcción cliente/servidor, scorer, endpoint y UI. Incluye casos de respuesta auditiva ausente/errónea con las escritas correctas, audio no disponible y correspondencia de IDs entre ambos lados. Verifica que los cambios no filtren respuestas en la carga inicial.

## Done criteria

- [x] Los checkpoints A1–C2 incluyen tres audios curados con dos preguntas cada uno; existen los 18 WAV y el usuario confirmó que los audios están bien.
- [x] La promoción de cada nivel exige el umbral de escucha y un total mínimo, recalculados en el servidor.
- [x] El texto escuchado y la respuesta no se envían al cliente antes de responder; la construcción de puntuación es `server-only`.
- [x] El modo invitado usa el endpoint de puntuación sin persistencia remota; placement avanza solo tras la respuesta de puntuación del servidor.
- [x] Cada nivel aprobado muestra el puntaje de ese bloque, sus errores por tema y la comprensión auditiva antes de ofrecer el avance al siguiente nivel.
- [x] `pnpm type-check` y `pnpm lint` pasan después del resumen por nivel.
- [x] Suite focalizada actualizada (7 archivos), incluido el test UI que confirma el resumen antes de avanzar. Verificado 2026-09-23: 7 archivos, 64 tests pasan.
- [ ] Comprobación manual de audio y accesibilidad en navegador documentada.
- [x] `plans/README.md` refleja el resultado real.

## STOP conditions

- El cliente y el servidor generan preguntas diferentes para el mismo checkpoint.
- No hay assets auditivos fiables para un nivel requerido.
- El backend acepta una aprobación sin respuesta de escucha o el ítem revela su transcripción.
