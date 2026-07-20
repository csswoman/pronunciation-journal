# Plan 055: Permitir guardar palabras desde Reader

## Status

- **Priority**: P2 product
- **Effort**: M
- **Risk**: MED
- **Depends on**: T50 manual Reader QA completed
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Reader recicla vocabulario pero no permite capturar una palabra encontrada en contexto. Tap-to-save crea una entrada natural al word bank y al Daily posterior.

## Current state

- `ReaderExercise.tsx:58` renderiza el pasaje como un único `<p>`.
- `quickAddWord` acepta text/context/deckId; no acepta source.
- `/api/words` valida body estricto e inserta sin `source`; el default actual es manual.
- La columna `source` es texto abierto, pero su documentación solo enumera manual/lexicon/practice.
- T50 debe cerrar el comportamiento actual antes de cambiar Reader.

## Scope

**In scope**: tokenizador puro, `TappableWord`, `WordSavePopover`, Reader, extensión compatible de quickAdd/API para `source:'reader'`, tests de ruta/componentes y documentación de source.

**Out of scope**: diccionario inline, cambiar comprehension/scoring/exposure, guardar offline, resetear SRS de palabras existentes, rediseñar Reader.

## Steps

1. Crear tokenizador que preserve espacios/puntuación y asocie cada token a su oración de contexto; normalizar lookup sin alterar el texto visible. Probar mayúsculas, apóstrofes, guiones, repetidas y puntuación.
2. Extender `quickAddWord` y `WordsRequestSchema` con source enum server-controlled `manual|reader`; default manual. Insertar source solo al crear, nunca al retry.
3. Crear palabra interactiva accesible (button o trigger válido, sin controles anidados) y popover con Guardar/Escuchar/cerrar/focus management.
4. Antes de guardar, comprobar `isWordInBank`; mostrar already saved. Enviar oración como context y source reader. Tratar carreras/errores sin bloquear Reader.
5. Offline: permitir selección y escucha TTS, deshabilitar Guardar con explicación; no encolar una escritura nueva en v1.
6. Integrar tokenización solo en el texto, manteniendo preguntas y `recordReaderExposure` intactos.
7. Añadir tests de tokenización, popover, dedupe, offline, API source y regresión de completion.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- components/practice/reader app/api/words lib/word-bank` | tests verdes |
| `pnpm type-check && pnpm lint` | exit 0 |
| checklist manual Reader | guardar 2 palabras, aparecen en `/words` con contexto |

## Done criteria

- [ ] Tap funciona con teclado/touch y mantiene el texto legible.
- [ ] Palabra nueva queda source reader y entra al enrichment existente.
- [ ] Palabra existente no reinicia SRS ni crea duplicado desde la UI.
- [ ] Offline explica la limitación y no rompe comprensión/completion.

## STOP conditions

- El baseline T50 sigue abierto.
- Para evitar duplicados se requiere una migración/índice destructivo; separar esa decisión.

## Git workflow and maintenance

- Branch: `codex/055-reader-word-save`; commit: `feat(reader): save words from passages`.
- Cambios futuros al markup del pasaje deben conservar selección por teclado, contexto de oración y tests de completion/exposure.
