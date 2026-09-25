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

### Desglose por sonido (plan 038, fase A)

Con `stt_intelligibility` el desglose no puede afirmar que un sonido esté bien:
el reconocedor devuelve palabras y corrige hacia palabras válidas, así que decir
"berry" y ver "¡Excelente!" en /v/ era una nota inventada. `PhonemeFeedbackTable`
se alimenta de `buildSttFeedbackRows`
(`lib/pronunciation/phoneme-feedback-rows.ts`), con tres reglas:

- Palabra reconocida → una sola fila **"Palabra reconocida"**. Nunca
  "¡Excelente!" por fonema.
- Palabra no oída → una sola fila; señalar cada fonema sería inventar.
- Palabra reconocida como otra → solo los fonemas que difieren, etiquetados
  **"Posible dificultad"** (no "Incorrecto"), con su consejo de articulación.

La tabla cierra diciendo que la pista viene del texto reconocido, no de un
análisis del sonido. `PhonemeDifficultyHeadword` resalta en la grafía el único
sonido que merece atención (`pickPrimaryFix` + `alignWordToPhoneme`).

### Comparación tú vs. modelo

`SelfPlaybackAudioBar` da los dos botones que hacen el trabajo sin puntuar:
reproducir tu grabación y reproducir el modelo. El modelo suena con el TTS del
navegador (`lib/phoneme-practice/tts.ts`), nunca con TTS de Gemini. La grabación
la captura `useSelfListening` sobre el stream del micrófono ya abierto: vive solo
en memoria como blob URL y se revoca al reintentar, al pasar de palabra y al
desmontar. No se persiste ni se envía a ningún servicio.

## Remediación y privacidad

Las superficies usan la misma secuencia: escuchar modelo normal/lento,
leer una pista breve, reintentar y, cuando exista, transferir a una frase
variada. Los controles son botones accesibles; no reproducen grabaciones del
usuario automáticamente.

`pronunciation_feedback_evidence` almacena solo usuario, target, evaluador,
outcome, pareja de intentos y hora. No persiste audio ni transcript. La ruta
de pronunciación consume esa evidencia y el handoff usa `tracked_items`, el
scheduler existente; no existe un SRS específico de feedback.
