# Conectar chunks, palabras y sonidos

Este brief define el modelo autoral que permite enseñar palabras dentro de frases y reutilizar las relaciones sin depender de coincidencias de texto.

## Objetivo

Crear relaciones estables entre cada chunk, sus palabras ancla, su intención, sus variaciones y sus objetivos de pronunciación.

## Alcance

- Extender el contrato de contenido de chunks con identificadores estables
- Vincular palabras de Essential Words y `word_bank` mediante identidad canónica
- Derivar los rangos de subrayado desde markup autoral validado
- Asociar objetivos fonéticos y variantes solo cuando estén documentados
- Añadir validación de catálogo que falle ante referencias inválidas

## Fuera de alcance

- Rediseñar el Plan diario
- Cambiar políticas SRS
- Expandir todo el catálogo antes del piloto A1
- Inferir relaciones por coincidencia textual durante la sesión

## Dependencias

Esta tarea es la base para los planes 11, 12, 14 y 15.

## Criterios de aceptación

- Un chunk puede resolver sus palabras, variaciones y sonidos por identificador
- La palabra objetivo se subraya sin offsets manuales duplicados
- El validador rechaza referencias inexistentes y rangos ambiguos
- El contenido sin relaciones nuevas conserva un fallback explícito
- Las relaciones funcionan offline

## Implementación

Implementado el 2026-09-13 con un piloto de 25 chunks A1. El catálogo resuelve
texto visible, rangos de subrayado derivados, referencias `c1k:<word>` y targets
fonéticos registrados. `word_bank` está disponible en el contrato para referencias
por UUID, pero el contenido autoral no crea referencias a palabras personales.

`pnpm validate:chunk-catalog` valida las referencias contra el índice de Palabras
esenciales y el registro de pronunciación. El comando forma parte de `prepush`.
Los chunks que aún no pertenecen al piloto reciben texto sin resaltado y arrays
vacíos, sin cambiar su práctica actual.
