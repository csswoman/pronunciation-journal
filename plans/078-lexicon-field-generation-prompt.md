# 078 — Prompt: generación de campos faltantes del léxico

**Estado:** EJECUTADO 2026-08-28 · **Rama:** `dev`

## Resultado

| Campo | Antes | Después |
|---|---|---|
| `ipa` | 534/695 | **695/695** |
| `translation` | 236/695 | **470/695** |

Las 3 categorías productivas (`professional`, `technical-writing`,
`personal-interview`) quedan deliberadamente **sin traducción** — ver "Fuera de
alcance" en la Tarea B.

## Por qué se conserva este documento

Documenta la convención IPA del corpus, que **no es IPA académico** sino CMUdict
convertido mecánicamente. Un LLM produce por defecto `/ˈsɛn.tɹɔɪd/` — mejor
fonéticamente y peor operativamente, porque deja dos convenciones incompatibles
en el mismo campo y rompe el emparejamiento con el motor de pronunciación
(`lib/practice/daily-plan/sound-word-bridge.ts`).

CMUdict **no** resuelve estos términos: de los 161 sin IPA solo cubría 4 exactos
y 39 compuestos. Es un diccionario de 1993; no contiene `webhook`, `serverless`,
`GraphQL`, `Zustand`, `MDX`.

## Herramientas

- `scripts/merge-lexicon-fields.mjs` — fusiona la salida en `public/lexicon/`.
  Solo rellena campos vacíos, valida formato, nunca sobrescribe. Soporta `--dry`.
- `scripts/normalize-lexicon-fields.mjs` — normaliza `ipa` y `translation` a la
  convención. Idempotente. Soporta `--dry`.

Los archivos de entrada se generan en `tmp/lexicon-gaps/` (ignorado por git).

---

> Dos tareas independientes. Ejecútalas por separado, en dos sesiones distintas.
> No mezcles: producen archivos distintos y tienen reglas de validación distintas.

---

## TAREA A — Transcripción IPA (161 términos)

**Archivo de entrada:** `tmp/lexicon-gaps/missing-ipa.json`
**Archivo de salida:** `tmp/lexicon-gaps/filled-ipa.json`

### Rol

Eres un fonetista especializado en inglés norteamericano general (General American).
Vas a transcribir términos técnicos de ingeniería, diseño y comunicación profesional.

### Tarea

Para cada entrada del archivo de entrada, produce la transcripción IPA de `word`
en inglés norteamericano.

### Formato de salida — REGLAS ESTRICTAS

Estas transcripciones se insertan en un corpus existente de 534 términos ya
transcritos. **Debes replicar exactamente esa convención, aunque te parezca
imprecisa o mejorable.** La consistencia importa más que la precisión fonética
académica. Si te apartas del estilo, el campo queda con dos convenciones
incompatibles y se rompe el emparejamiento con el motor de pronunciación.

1. **Envuelve en barras:** `/…/` — el 100% del corpus existente lo hace.
2. **NO uses marcas de acento** (`ˈ` primaria, `ˌ` secundaria). El corpus existente
   las omite en 531 de 534 casos. Omítelas siempre.
3. **NO uses puntos de separación silábica** (`.`).
4. **Vocal reducida:** usa `ʌ` para schwa, no `ə`. El corpus deriva de CMUdict con
   `AH0 → ʌ`.
5. **Vocales largas:** usa `iː` y `uː` con el signo de longitud.
6. **Rótica:** usa `ɹ` en posición de ataque (`/æɡɹʌɡeɪʃʌn/`) y `r` en secuencias
   tipo `ɜr` (`/ɪnfɜrʌns/`). Sigue los ejemplos.
7. **Términos multipalabra:** separa con un espacio simple dentro de las barras.
   Ejemplo: `anomaly detection` → `/ʌnɑmʌliː dɪtɛkʃʌn/`
8. **Siglas deletreadas** (ETL, JWT, ORM, TTL, UUID, SSE, TOC, MVP, CDN, WCAG,
   CVA, MDX): transcribe cómo se **pronuncian letra por letra**.
   Ejemplo: `ETL` → `/iːtiːɛl/`
   Excepción: las que se leen como palabra (OAuth → `/oʊɔθ/`, JSDoc, README)
   se transcriben como palabra.

### Ejemplos verificados del corpus existente

Cópialos como referencia de estilo:

```
aggregation             /æɡɹʌɡeɪʃʌn/
anomaly detection       /ʌnɑmʌliː dɪtɛkʃʌn/
arithmetic mean         /ɛɹɪθmɛtɪk miːn/
Bayesian inference      /beɪʒɪn ɪnfɜrʌns/
binary classification   /baɪnɜriː klæsʌfʌkeɪʃʌn/
categorical variable    /kætʌɡɑɹɪkʌl vɛɹiːʌbʌl/
class imbalance         /klæs ɪmbælʌns/
batch                   /bætʃ/
bias                    /baɪʌs/
```

### Formato del archivo de salida

JSON array. **Solo dos campos por entrada.** No repitas `definition`, `pos` ni
`category` — se descartan al fusionar.

```json
[
  { "id": "backpropagation", "ipa": "/bækpɹʌpʌɡeɪʃʌn/" },
  { "id": "etl", "ipa": "/iːtiːɛl/" }
]
```

- El `id` debe coincidir **exactamente** con el del archivo de entrada.
- Deben salir **exactamente 161 entradas**, ni una más ni una menos.
- Si dudas de un término, transcríbelo igualmente y **añádelo a una lista aparte
  al final de tu respuesta** (fuera del JSON) bajo el encabezado `## Dudosos`.
  No lo omitas del JSON.

### Ojo con estos casos

Hay términos que aparecen en **dos categorías** con el mismo `id`
(`backpropagation`, `centroid`, `DataFrame`, `ETL`, `hyperparameter`,
`overfitting`, `regularization` y otros están en `artificial-intelligence` **y**
en `data-science`). Emite **una entrada por cada aparición del archivo de
entrada**, con IPA idéntica. No las deduplifiques.

---

## TAREA B — Traducción al español (234 términos)

**Archivo de entrada:** `tmp/lexicon-gaps/missing-translation.json`
**Archivo de salida:** `tmp/lexicon-gaps/filled-translation.json`

### Rol

Eres un traductor técnico especializado en documentación de software y diseño,
con dominio del español neutro usado en documentación técnica profesional
(no localismos regionales).

### Tarea

Para cada entrada, produce el campo `translation`: una glosa breve en español
que sirva a un hispanohablante para fijar el significado del término inglés.

### Reglas

1. **Es una glosa, no una traducción literal.** El objetivo es que el aprendiz
   ancle el concepto, no que sustituya la palabra. Puede ser más explícita que
   el término original.
2. **Longitud: 1 a 4 palabras.** Máximo ~40 caracteres.
3. **Múltiples equivalentes válidos:** sepáralos con coma.
   Ejemplo: `array` → `Arreglo, vector`
4. **Capitaliza la primera letra.** Sin punto final.
5. **Conserva el anglicismo cuando es lo que realmente se usa** en el habla
   profesional hispanohablante. No fuerces una traducción artificial.
   `breakpoint` en CSS se dice "breakpoint"; una traducción como "punto de
   quiebre" es correcta y usada — elige según lo que un desarrollador
   hispanohablante diría de verdad. Si el anglicismo domina de forma clara,
   úsalo o combínalo: `Breakpoint, punto de ruptura`.
6. **Usa la `definition` en inglés que viene en el input** para desambiguar.
   Muchos términos son polisémicos: `chunking` en UX no es `chunking` en redes.
   La definición te dice cuál es el sentido correcto.
7. **Español neutro.** Evita "ordenador"/"computadora" si puedes rodearlo;
   evita voseo y regionalismos.

### Ejemplos verificados del corpus existente

```
aggregation             Agregación de datos
anomaly detection       Detección de anomalías
array                   Arreglo, vector
arithmetic mean         Promedio aritmético
backpropagation         Retropropagación del error
baseline                Modelo de referencia
batch                   Lote, conjunto de datos
bias                    Sesgo, error sistemático
```

Nota el patrón: varias añaden una palabra de contexto que no está en el inglés
("de datos", "del error", "Modelo de"). Eso es deliberado y correcto — la glosa
desambigua.

### Formato del archivo de salida

```json
[
  { "id": "affordance", "translation": "Affordance, invitación de uso" },
  { "id": "breakpoint", "translation": "Breakpoint, punto de ruptura" }
]
```

- **Exactamente 234 entradas.**
- `id` idéntico al del input.
- Mismo tratamiento de duplicados entre categorías que en la Tarea A: una
  entrada por aparición.

### Fuera de alcance

Las categorías `professional`, `technical-writing` y `personal-interview` **no**
están en este archivo y no deben traducirse. Es una decisión pedagógica
deliberada: son vocabulario de producción oral, donde la glosa L1 fomenta que el
aprendiz traduzca mentalmente en vez de recuperar directamente en inglés. Si ves
que faltan, no las añadas.

---

## Restricciones comunes a ambas tareas

- **No modifiques ningún otro campo.** No toques `definition`, `word`, `pos`,
  `tags`, `difficulty`, `exampleSentence`.
- **No reescribas los archivos de `public/lexicon/`.** Emite archivos nuevos.
  La fusión se hace después con un script, para poder revisar el diff en git.
- **No inventes entradas** que no estén en el input.
- Si un término te resulta genuinamente ambiguo o crees que la `definition` del
  input es incorrecta, **complétalo igualmente** y repórtalo en la sección
  `## Dudosos` al final. No dejes huecos.
