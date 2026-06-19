# 06 · Puente fonema ↔ vocabulario

> 🟠 **Importante** · Impacto medio · ~3-4 días · Estado: ✅ Hecho (2026-06-19, tareas 1-2; tarea 3 diferida)
>
> Implementado en `lib/practice/daily-plan/sound-word-bridge.ts` + `composer.ts`.
> Spec: `docs/superpowers/specs/2026-06-19-phoneme-vocab-bridge-design.md`.
> Heurística IPA-only, sesgo suave (cuota ½). Tarea 3 (palabras del word_bank
> dentro del paso de fonema) queda como follow-up opcional.

## Problema

Phoneme Practice (`user_sound_progress`) y Generic/vocab (`word_bank`) son **dos apps pegadas** con SRS separados (`exercises.md:35-36`). Si el alumno falla /ɪ/ vs /iː/, el sistema **no le trae `ship`/`sheep`** desde su propio `word_bank`. La discriminación de sonidos vive desconectada del vocabulario real del alumno.

Es el "puente que falta" del mapa de conexiones de la auditoría.

## Objetivo

Cuando un sonido es débil (SRS de sonido), **priorizar palabras del `word_bank` que lo contienen** en la sesión de vocabulario — y viceversa, usar el vocabulario del alumno como material para la práctica del sonido.

## Estado de partida

- SRS de sonidos: `lib/phoneme-practice/sr.ts`, tabla `user_sound_progress`.
- `buildPhonemeFocusStep` (`step-builders.ts`) ya selecciona un sonido débil (`isWeak`).
- Las palabras del `word_bank` tienen texto; falta el cruce IPA/sonido → palabra.
- `lib/phoneme-practice/phoneme-similarity.ts` ya modela similitud fonética.

## Tareas (alto nivel)

1. Helper que, dado un `sound`, devuelva palabras del `word_bank` del alumno que lo contienen (matching IPA o heurística ortográfica).
2. En el daily-plan, cuando hay un sonido débil, sesgar la selección de palabras de vocabulario hacia ese sonido.
3. (Opcional) En el paso de fonema, usar palabras del word_bank del alumno como ejemplos en vez de solo seed words.

## Criterios de aceptación

- [ ] Un sonido débil influye en qué palabras del word_bank entran al paso de vocabulario.
- [ ] El cruce no rompe si el alumno no tiene palabras con ese sonido (fallback al comportamiento actual).
- [ ] `pnpm type-check && pnpm test` verde.

## Riesgos / decisiones abiertas

- **Matching sonido→palabra**: las palabras del word_bank pueden no tener IPA. Definir heurística (¿IPA si existe, si no grafema→fonema aproximado?).
- No sobre-sesgar: mantener variedad para no convertir cada sesión en monotema fonético.
