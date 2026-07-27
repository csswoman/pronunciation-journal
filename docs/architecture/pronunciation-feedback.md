# Feedback de pronunciación accionable (plan 069)

El feedback comparte `PronunciationFeedbackModel`; no es un evaluador nuevo.

## Señales y honestidad

- `stt_intelligibility` describe el texto reconocido y puede compararse solo
  con la misma versión de evaluador.
- `transcript_phoneme_inference` proyecta el transcript con diccionario: puede
  proponer un target registrado, pero nunca mide acústica, acento, ritmo o
  entonación.
- `unscored`, `skipped` y `failed` no prueban mejora, dominio ni repaso.

La prioridad es una sola y debe tener un `targetId` canónico. Si no hay
confianza o mapeo suficiente, el modelo se abstiene.

## Remediación y privacidad

Las superficies usan la misma secuencia: escuchar modelo normal/lento,
leer una pista breve, reintentar y, cuando exista, transferir a una frase
variada. Los controles son botones accesibles; no reproducen grabaciones del
usuario automáticamente.

`pronunciation_feedback_evidence` almacena solo usuario, target, evaluador,
outcome, pareja de intentos y hora. No persiste audio ni transcript. La ruta
de pronunciación consume esa evidencia y el handoff usa `tracked_items`, el
scheduler existente; no existe un SRS específico de feedback.
