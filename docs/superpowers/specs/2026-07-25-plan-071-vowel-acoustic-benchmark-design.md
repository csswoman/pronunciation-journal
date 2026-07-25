# Plan 071 — Benchmark de evaluador acústico de vocales (gratis, Web Audio)

> **Diseño (spec) generado en brainstorming, 2026-07-25.** Este documento es el
> spec; el plan ejecutable (`plans/071-*.md`) se deriva después con writing-plans.

## Por qué importa

El diagnóstico de pronunciación (plan 067) mide honestamente **percepción** (forced-choice
auditivo) e **inteligibilidad STT**, pero **no mide la producción acústica** del usuario.
Un STT que entiende "ship" por contexto no prueba que el usuario distinga /ɪ/ de /iː/ al
hablar. Por eso el 067 marca esas dimensiones como `not_measured` — es honesto, pero se
siente vacío para el usuario.

Los planes 064–070 referencian repetidamente un "benchmark del plan-071" como la puerta que
autorizaría scores acústicos reales. **Ese plan nunca se escribió.** Este spec lo define.

El plan 064 ya creó la interfaz `AcousticEvaluator` (`lib/pronunciation/acoustic-evaluator.ts`)
pero se detuvo por falta de corpus con licencia y vendor aprobado. El 071 desbloquea el
camino **gratis**: un evaluador propio en el navegador (Web Audio API, formantes F1/F2),
validado contra un corpus público etiquetado, **empezando solo por contrastes vocálicos**
donde la señal acústica es más robusta.

## Objetivo y contrato

**Qué es:** un benchmark que valida un **evaluador acústico de vocales gratis** (Web Audio,
formantes F1/F2) contra juicio humano, y toma una decisión honesta **ship / partial-ship /
no-ship**.

**Qué NO es:** no es el evaluador wired a producción. Es la *validación* que autoriza (o
rechaza) usarlo, igual que el 064 validó dirección sin habilitar evaluador.

**Contrato de éxito:**
- El evaluador implementa la interfaz existente `AcousticEvaluator`.
- Scorea la dimensión `segmental` **solo para contrastes vocálicos v1** (empezando por
  /ɪ/ vs /iː/, luego otros pares vocálicos donde el benchmark lo permita).
- **Abstiene** (`abstained: true`) cuando el audio es ruidoso, corto o de baja SNR — nunca
  inventa un score.
- La decisión ship se basa en acuerdo/correlación con etiquetas humanas del corpus.

## Alcance

**In scope:**
- `lib/pronunciation/acoustic/formant-extraction.ts` — DSP puro (ventana → LPC/
  autocorrelación → picos de formantes). Aislado, testeable con señales sintéticas de
  formante conocido.
- `lib/pronunciation/acoustic/formant-evaluator.ts` — implementa `AcousticEvaluator`.
  Dado audio + vocal objetivo, extrae F1/F2 de la porción vocálica y clasifica la vocal
  producida. Puro (recibe muestras, no toca el micrófono). Abstiene ante audio malo.
- `lib/pronunciation/acoustic/benchmark/` (no se despliega):
  - `corpus-loader.ts` — carga el subconjunto vocálico de **speechocean762** (audio +
    etiqueta humana por fonema).
  - `run-benchmark.ts` — corre el evaluador sobre el corpus, compara vs etiquetas, emite
    métricas (acuerdo %, matriz de confusión vocálica, tasa de abstención, correlación con
    score humano).
  - `decision.md` — veredicto ship/partial/no-ship escrito, con los números.
- Conexión con 067: **solo si ship**, `lib/pronunciation/assessment/scoring.ts` gana un
  caso nuevo donde vocales dejan de abstener y reciben `segmental` real. Si no-ship, **nada
  cambia** en el 067.

**Out of scope:**
- Consonantes (/θ/, /ð/, etc.) — más ruidosas, se difieren a un benchmark posterior.
- Stress / ritmo / entonación acústicos — otras dimensiones, otro benchmark.
- Retención de audio crudo más allá de lo que el benchmark necesite localmente.
- Cualquier vendor de pago.
- Wire del evaluador a producción sin veredicto ship.

## Corpus: speechocean762

- Corpus abierto (licencia CC) de pronunciación **no-nativa**: ~5000 emisiones de ~250
  hablantes, con **scoring por fonema y acento etiquetado por expertos**.
- Es literalmente un benchmark de pronunciation-assessment ya etiquetado — mejor que grabar
  a mano o buscar formantes crudos, porque valida si el evaluador **generaliza** a voces
  reales variadas.
- **Verificar en ejecución:** licencia exacta, formato de etiquetas, cómo aislar ítems/
  segmentos vocálicos. Si el aislamiento vocálico no es viable, caer a palabras de vocal
  conocida.

## Flujo de datos y decisión

```
speechocean762 (audio no-nativo + score humano por fonema)
        │  filtrar solo ítems vocálicos (/ɪ/ /iː/ /æ/ /ʌ/ …)
        ▼
  corpus-loader ──► [ {audio, vocalObjetivo, scoreHumano} ]
        ▼
  formant-evaluator (F1/F2 → vocal predicha + confianza | abstiene)
        ▼
  run-benchmark: comparar predicción vs etiqueta humana
        ▼
  métricas: acuerdo %, confusión vocálica, tasa abstención, correlación con score humano
        ▼
  DECISIÓN honesta:
   • ship         → acuerdo alto en ≥N contrastes vocálicos  → 067 libera esas vocales
   • partial-ship → solo algunos contrastes fiables          → 067 libera solo esos
   • no-ship      → 067 sigue con vocales = not_measured (sin cambios)
```

### Umbrales de decisión (fijados ANTES de correr, para no hacer trampa)

- **ship** de un contraste vocálico: el evaluador acierta la vocal **≥ ~85%** de las veces
  en ese par **y** su tasa de abstención en audio malo es alta (no adivina bajo ruido).
- Si un contraste no llega al umbral, **no se libera** — se queda `not_measured`.
  **partial-ship es un resultado válido y esperado.**
- **no-ship es un éxito del proceso, no un fracaso**: significa que la app siguió sin
  mentir. El plan 067 explícitamente permite este desenlace (STOP condition línea 154).

## Garantía de honestidad (regla de oro)

El navegador **nunca** puntúa una vocal en producción hasta que el benchmark haya dicho
ship para ese contraste. El benchmark es un **gate de datos**, no código de runtime. El
JSON de resultado del 067 conserva sus campos `not_measured` / evaluator-version
independientemente del veredicto; solo cambia si un contraste concreto pasó el gate.

## Plan de pruebas

- `formant-extraction`: tests con señales sintéticas de formante conocido (seno con F1/F2
  fijos) → verificar que extrae picos correctos.
- `formant-evaluator`: fixtures de audio con vocal conocida → predice la vocal correcta;
  audio ruidoso/corto → `abstained: true`.
- `run-benchmark`: correr sobre un subconjunto pequeño del corpus en CI (o marcado como
  benchmark manual si el corpus es grande) → produce métricas reproducibles.
- No wire a producción en este plan salvo que el veredicto sea ship y se agregue el caso
  en `scoring.ts` con su propio test.

## Criterios de hecho (Done)

- [ ] `formant-extraction` y `formant-evaluator` implementados, puros y testeados.
- [ ] `benchmark/` corre sobre speechocean762 (subconjunto vocálico) y emite métricas.
- [ ] Umbrales fijados y documentados **antes** de correr.
- [ ] `decision.md` con veredicto ship/partial/no-ship y números que lo respaldan.
- [ ] Si ship/partial: `scoring.ts` libera **solo** los contrastes aprobados; test lo prueba.
- [ ] Si no-ship: cero cambios en el comportamiento del 067.
- [ ] Ninguna vocal recibe score en producción sin veredicto ship para su contraste.
- [ ] `pnpm type-check` y tests enfocados pasan.

## STOP conditions

- La licencia de speechocean762 no permite el uso previsto → detener y buscar alternativa
  (auto-grabado o corpus CC0).
- El aislamiento de segmentos vocálicos no es viable con las etiquetas del corpus →
  reevaluar el diseño de extracción antes de seguir.
- Presión de producto por liberar scores antes de que el benchmark diga ship → detener;
  partial/no-ship deben poder ganar.
```

## Dependencias

- `lib/pronunciation/acoustic-evaluator.ts` (interfaz, plan 064).
- `lib/pronunciation/assessment/scoring.ts` (consumidor, plan 067).
- ADR `docs/architecture/adr-064-acoustic-pronunciation-assessment.md`.
