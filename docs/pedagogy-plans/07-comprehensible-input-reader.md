# 07 · Reader de comprehensible input

> 🟠 **Importante** · Impacto alto · ~5-7 días · Estado: 📋 Por planear

## Problema

No hay input de **más de una oración**. La auditoría marcó **Comprehensible Input (Krashen, i+1) ausente** y Reading extensivo inexistente. Todo el listening/reading actual es a nivel de oración aislada y orientado a test, no a comprensión de un mensaje real.

Sin input rico y comprensible, falta la materia prima de la adquisición: el alumno discrimina y recupera, pero nunca *procesa significado* en contexto extendido.

## Objetivo

Un **reader de párrafos cortos** que:

- Recicla el **vocabulario reciente del alumno** (cierra el loop con el SRS del plan 01 — los ítems que está aprendiendo reaparecen *en contexto narrativo*).
- Está al nivel i+1 (mayormente conocido + poco nuevo).
- Pide **comprensión ligera** (1-2 preguntas), no análisis exhaustivo.

## Estado de partida

- `text_fragments` ya existe como fuente de texto del usuario.
- Generación IA: `/api/gemini/*` + prompt en `lib/ai-prompts.ts`.
- El SRS del plan 01 dará la lista de "vocab reciente a reciclar".
- `multiple_choice` (tipo existente, hoy huérfano) puede servir para las preguntas de comprensión.

## Tareas (alto nivel)

1. Prompt IA que genera un párrafo i+1 incrustando N palabras objetivo del alumno.
2. Ruta `/api/gemini/generate-reader`.
3. Tipo/componente `reader` (texto + audio TTS + 1-2 preguntas de comprensión, reusando `multiple_choice`).
4. Selección de palabras objetivo desde el SRS (estado `learning`/`review`).
5. Registrar comprensión correcta como señal SRS (refuerza los ítems reciclados).

## Criterios de aceptación

- [ ] El alumno lee un párrafo que contiene su vocabulario reciente y responde comprensión.
- [ ] El párrafo está mayormente compuesto de vocab conocido (i+1, no muro de palabras nuevas).
- [ ] Las palabras recicladas reciben señal SRS por la comprensión.
- [ ] Sin prompts inline; toda generación vía `/api/gemini/*`.

## Riesgos / decisiones abiertas

- **Calidad/seguridad del párrafo generado**: el prompt debe garantizar nivel y reciclaje real de las palabras objetivo.
- **Online-only**: generación requiere red; cachear en Dexie el párrafo generado para relectura offline.
- Depende de [01](./01-close-vocab-srs.md) para saber qué reciclar — hacer después.
