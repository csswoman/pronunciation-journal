0# Plan de rediseño — Práctica de fonemas (`/practice/sounds`)

**Fecha:** 2026-06-02
**Estado:** Decisiones cerradas — listo para implementar por fases
**Reemplaza/corrige:** [`docs/superpowers/specs/2026-06-02-phoneme-practice-pedagogical-design.md`](./superpowers/specs/2026-06-02-phoneme-practice-pedagogical-design.md) (en adelante, "el doc de diseño original")

Este documento es la fuente de verdad para la implementación. Cada fase está pensada para ejecutarse en su propia sesión leyendo **solo este documento**. Donde una decisión cambia respecto al doc de diseño original, se marca con **⚠️ CAMBIA**.

---

## (a) Decisiones cerradas

### 1. Mastery por contraste, no por sonido — ⚠️ CAMBIA

- El progreso del usuario se trackea por **par confusable** (ej. `iː–ɪ`), no por `sound_id`.
- El "mastery del sonido" se **deriva** como agregado de sus contrastes (un sonido está dominado cuando sus contrastes asociados lo están).
- **Tracking por contraste, display por sonido:** la grid `/practice/sounds` **no cambia su navegación ni su modelo visual**. El usuario sigue viendo sonidos; por debajo, el estado vive por contraste.
- Esto es la base del **SRS por contraste** y de la **mezcla adaptativa** (elegir ejercicios según el contraste más débil).
- **Vs. doc de diseño original:** el original mantenía explícitamente "el mastery actual se mantiene" (por sonido). Aquí giramos a contraste; `lib/phoneme-practice/{sr,mastery,finish-session}.ts` y el modelo de `user_sound_progress` se reorientan.
- **Identidad del contraste:** clave canónica = par ordenado de IPAs, ej. `iː|ɪ` (orden lexicográfico estable). Derivable de `PHONEME_CONFUSION` en [phoneme-similarity.ts](../lib/phoneme-practice/phoneme-similarity.ts).
- **Agregación (default revisable):** sonido dominado = **todos** sus contrastes sobre su umbral
  SRS (mínimo, no promedio). Razón: el promedio enmascara un contraste débil residual.

### 2. Online-only por ahora — ⚠️ CAMBIA (corrige supuesto falso)

- **Hecho verificado:** el flujo de `/practice/sounds` **no usa Dexie hoy**; el estado de usuario es **Supabase puro** (`user_sound_progress`, `answer_history`). El doc de diseño original asumía Dexie en uso ("Dexie recuerda la lección vista", "estado persistente en Dexie") — eso es falso para este flujo.
- **Decisión:** **no** construimos la capa Dexie⇄Supabase todavía. Hacerlo ahora implicaría migrar dos veces (una para Dexie, otra tras el giro a contraste).
- Este flujo queda documentado como **online-only por ahora**. Dexie se aplaza hasta que el modelo por contraste esté estable (ver sección (c)).
- **Acción de documentación:** `CLAUDE.md` dice "User data → Dexie ⇄ Supabase" y "offline-safe". Hay que anotar la **excepción explícita** de `/practice/sounds` (online-only temporal) para no romper la regla silenciosamente. *(Esto es edición de doc, no de código de app; se hace en la fase correspondiente.)*

### 3. Producción: shadowing sin veredicto — ⚠️ CAMBIA

- **Eliminar** el feedback de `speak_word` basado en ASR: hoy `SpeechRecognition` + Levenshtein juzgan la **palabra entera**, no el fonema objetivo → veredicto engañoso (acepta "sheep" por "ship", castiga aciertos con error en otro fonema).
- **Reemplazo (shadowing neutral):**
  - Grabar la voz del usuario.
  - Reproducirla **junto al modelo** (modelo → tu voz, o lado a lado).
  - Mostrar **duración como espejo neutral** (ej. barra/número de ms del modelo vs. del usuario) — pista útil para contrastes de longitud sin emitir juicio.
  - **Sin nota, sin correcto/incorrecto, sin puntuar.**
- ASR-veredicto se **aplaza** hasta tener alineamiento fonético real (fuera de alcance).

### 4. HVPT barato primero

- **Variabilidad de hablante:** rotar voces del sistema con `speechSynthesis.getVoices()` (filtrando `lang` en-US/en-GB), alternando voz entre repeticiones de la misma sesión.
- **Variabilidad de token:** ampliar el pool de ejemplares más allá de los **3 pares fijos** por fonema de `IPA_EXTRA` (usar `words` de Supabase + más pares por contraste).
- **Gemini TTS pre-generado/cacheado** se aplaza como **upgrade de calidad**: mejora consistencia y latencia, pero **no bloquea** el HVPT barato.

### 5. ABX gateado a B1+

- **A1/A2:** identificación, same/different (AX), `odd_one_out`.
- **B1+:** se habilita ABX.
- **Vs. doc de diseño original:** el original ponía 2 ABX en la mezcla base sin gating. ABX tiene carga de memoria de trabajo alta (mantener A y B mientras se juzga X) → no apto para principiante.

### 6. Consonantes finales = único contenido nuevo temprano

- Problema fuerte y predecible del hispanohablante (devoicing/elisión de finales), **derivable** del contenido existente.
- **Prosodia, reducciones y discurso conectado se aplazan** (B2/C1): requieren datos y tipos de ejercicio nuevos (ver sección (c)).

### 7. Bugs baratos primero (independientes de todo lo anterior)

- `rate = 0.85` fijo en [tts.ts](../lib/phoneme-practice/tts.ts): ralentizar **daña** los contrastes de duración (iː/ɪ, ʊ/uː) porque distorsiona la pista de longitud. → velocidad natural por defecto.
- Diptongos que suenan mal: `playIpaSound` en [ipa-audio.ts](../lib/pronunciation/ipa-audio.ts) usa **solo el primer carácter** (`aɪ` → `a`).
- Refactor táctil **seleccionar → confirmar**: hoy el audio se dispara en `onMouseEnter` (no existe en táctil) y el submit ocurre al primer clic. Separar *seleccionar* (reproduce + marca) de *confirmar* (envía). Habilita además el reintento con pistas.

---

## (b) Fases de implementación — PRs atómicos (un task por PR)

Reordenadas por: independencia, valor inmediato y prerequisitos. Las Fases 1-3 no dependen del giro a contraste; las Fases 5+ sí.

### Fase 1 — Bugs de fidelidad de audio (decisión 7, parte audio)
**Independiente. No depende de nada.**
- `tts.ts`: quitar `rate = 0.85` por defecto → velocidad natural (1.0). Mantener `rate` como parámetro opcional para usos explícitos.
- `ipa-audio.ts` `playIpaSound`: manejar diptongos correctamente (no recortar al primer carácter). Para símbolos compuestos sin `.ogg` propio, decidir fallback explícito (reproducir la palabra de ejemplo del diptongo en vez del símbolo monoptongo incorrecto).
- **Criterio de hecho:** iː/ɪ y diptongos suenan a velocidad/forma correcta; sin regresión en los demás símbolos.

### Fase 2 — Refactor táctil seleccionar→confirmar (decisión 7, parte UI)
**Independiente. Base para pistas/reintento.**
- Patrón en todos los ejercicios de selección (`MinimalPairExercise`, `PickWordExercise`, `PickSoundExercise`, y futuros): **tocar = reproduce + marca seleccionada** (re-tocable, no confirma); **botón "Confirmar" abajo** envía.
- Eliminar audio en `onMouseEnter`.
- Respetar CLAUDE.md: componentes < 250 líneas, una responsabilidad, tokens, sin estilos inline (salvo runtime).
- **Criterio de hecho:** funciona en táctil; se puede re-escuchar y cambiar selección antes de confirmar.

### Fase 3 — Pistas escalonadas + reintento + contexto de contraste
**Depende de Fase 2 (separar seleccionar/confirmar).**
- Pistas escalonadas sin penalización (como el doc de diseño original, pieza 3) **pero ⚠️ CAMBIA la pista "nivel 1: más lento"**: no ralentizar contrastes de duración; en su lugar **repetir a velocidad natural rotando voz** (enlaza con Fase 6) o repetir con énfasis. La pista de "más lento" solo se permite en contrastes que no sean de duración.
- Nuevo `components/phoneme-practice/ExerciseHints.tsx` (< 120 líneas): niveles = re-escuchar (voz alternada) → resaltar letra del sonido → tip de boca/lengua (`spanishTip` / `articulationEs`).
- Pistas = estado de UI efímero (local/Zustand), nunca persistente.
- Enriquecer eyebrows en `exercise-labels.ts` con el contraste ("Distingue /ɪ/ corto de /iː/ largo").
- **Criterio de hecho:** fallar ofrece pista (no salta), pedir pista no afecta score/mastery/racha, se puede reintentar.

### Fase 4 — Lección previa + `articulationEs`
**Independiente de las demás (solo lee `IPA_EXTRA`).**
- Añadir campo `articulationEs: string[]` a `PhonemeExtra` en `ipa-data.ts` (traducción del `articulation` EN existente; **no** reemplazar el inglés).
- `components/phoneme-practice/PhonemeLessonIntro.tsx` (< 150 líneas) como paso-0 de la sesión (como el doc original).
- **⚠️ CAMBIA "lección vista":** el doc original la guardaba en Dexie. Como estamos
  **online-only** (decisión 2), no persistimos la marca todavía. Pero sin persistencia, una
  lección "saltable obligatoria" reaparece **cada sesión** y molesta rápido en pruebas con
  usuarios. **Decisión:** invertir el default a **opt-in** — la lección no es paso obligatorio;
  el paso-0 ofrece un botón "Ver la lección de este sonido" y por defecto entra directo a
  practicar. Accesible siempre, sufrida por nadie. La persistencia de preferencia llega con Dexie.
- **Criterio de hecho:** la lección es accesible vía botón en el paso-0, no bloquea el inicio de
  la práctica, y muestra contenido en español desde `IPA_EXTRA` con ejemplos en inglés con audio.

### Fase 5a — Esquema de datos por contraste (decisión 1, backend — parte esquema)

**Prerequisito de 5b. Es la base del giro arquitectónico.**

- Definir la **identidad de contraste** (clave canónica `ipaA|ipaB`) en **una única función**
  reutilizada en escritura y lectura — no reimplementar el orden en varios sitios. Nota: el
  orden lexicográfico de IPA no coincide con el orden fonético/visual y hay símbolos
  multi-carácter o con combinantes (ej. `ː`); lo que importa es que la normalización sea
  consistente vía esa única función.
- Derivar el catálogo de contrastes desde `PHONEME_CONFUSION` (phoneme-similarity.ts).
- Tabla nueva de estado por contraste: `{ contrastId, ease_factor, interval_days, streak,
  next_review, last_seen, total_attempts, correct_answers }`. En **Supabase** (online-only),
  con **RLS habilitada antes de merge** (regla dura de CLAUDE.md).
- Escritura del estado: una respuesta actualiza la fila del contraste correcto.
- **Decisión de migración del `user_sound_progress` existente:** **DESCARTAR** (decidido 2026-06-02).
  El modelo cambia de "progreso por sonido" a "progreso por par confusable". La conversión 1:1
  es ambigua (un sonido → N contrastes) y el historial viejo aportaría ruido. Para ~50 usuarios
  en una feature en rediseño, empezar limpio es la opción correcta. La migración SQL hace `DROP
  TABLE user_sound_progress CASCADE` y crea `user_contrast_progress` desde cero.
- **Criterio de hecho:** una respuesta escribe la fila del contraste correcto; RLS verificada;
  la clave canónica viene de una sola función; la decisión de migración está documentada.

### Fase 5b — Lógica de derivación: SRS y mastery por contraste (decisión 1, backend — parte lógica)

**Depende de Fase 5a. Prerequisito de Fases 6-9.**

- `sr.ts` / `mastery.ts` / `finish-session.ts`: reorientar el SRS a operar por contraste.
- **Mastery del sonido = agregado derivado** de sus contrastes. **Default (revisable):** un sonido
  está dominado cuando **todos** sus contrastes asociados superan su umbral SRS individual — **no**
  el promedio. El promedio deja pasar el caso malo (dominar /ɪ/–/e/ pero fallar /ɪ/–/iː/ y aun así
  mostrar el sonido "verde").
- La grid `/practice/sounds` **no cambia**: lee el agregado derivado para el display por sonido.
- **Criterio de hecho:** el estado del sonido se calcula como derivado por mínimo; un contraste
  débil impide que su sonido aparezca dominado.

### Fase 6 — HVPT barato (decisión 4)
**Depende de Fase 5 (para variar por contraste con sentido) — o puede empezar la parte de voces antes.**
- Rotación de voces: util en `lib/phoneme-practice/` que seleccione voces de `speechSynthesis.getVoices()` (en-US/en-GB) y rote por repetición. Pasar voz a `speak()`.
- Ampliar pool de tokens por contraste más allá de los 3 pares fijos (combinar `words` de Supabase + `minimalPairs`).
- **Criterio de hecho:** la misma sesión usa ≥2 voces y ≥4 tokens por contraste cuando hay datos.

### Fase 7 — Ejercicios de discriminación nuevos + mezcla adaptativa y gateada (decisiones 1 y 5)
**Depende de Fases 5 y 6.**
- Nuevos tipos en `types.ts`: `identify`, `ax_same_different`, `odd_one_out`, `abx`.
- Generadores en `exercises.ts` (reusan `getConfusableSounds`/`pickConfusableIpas`).
- Componentes (< 150 líneas c/u): `OddOneOutExercise.tsx`, `ABXExercise.tsx`, `AxSameDifferentExercise.tsx`, `IdentifyExercise.tsx`.
- **Mezcla adaptativa** en `mixed-session.ts`: prioriza el **contraste más débil** del usuario
  (datos de Fase 5) y **gatea ABX a B1+** (decisión 5). A1/A2: identificación + AX + odd_one_out.
- **Arranque en frío (sin historial):** un usuario nuevo no tiene datos por contraste. Hasta que
  haya señal propia, la mezcla ordena por la **dificultad conocida de L1** — `difficulty` de
  `IPA_EXTRA` + contrastes de `HARD_FOR_SPANISH_SPEAKERS`. Con historial, ordena por contraste
  más débil del usuario.
- **Criterio de hecho:** A1/A2 nunca ve ABX; con cero historial la mezcla ordena por dificultad
  de L1; con historial sobre-representa el contraste más débil del usuario.

### Fase 8 — Producción como shadowing sin veredicto (decisión 3)
**Independiente de 5-7; depende solo de tener un word/contraste objetivo.**
- Reescribir `SpeakExercise` (o componente nuevo): grabar → reproducir junto al modelo → mostrar **duración del modelo vs. usuario** como espejo neutral. Quitar ASR/Levenshtein/veredicto.
- No puntúa, no afecta mastery.
- **Criterio de hecho:** el usuario oye su voz contra el modelo y ve duraciones; ningún "correcto/incorrecto".

### Fase 9 — Consonantes finales (decisión 6)
**Depende de Fase 5 (contrastes) y 7 (tipos de ejercicio).**
- Derivar contrastes de posición final (devoicing de finales sonoras, elisión) del contenido existente; marcar `syllablePosition` donde haga falta en `IPA_EXTRA` (campo nuevo, versionado).
- Ejercicios de identificación/discriminación enfocados a final de palabra.
- **Relación con 5a (fijar antes de implementar):** si la posición final crea **contrastes nuevos**
  vs. **reusar pares existentes** en posición final — **asumir reúso** salvo que los datos digan lo
  contrario. Es decir: los contrastes de final son los **mismos pares** (/d/–/t/, etc.) practicados
  en posición final, **sin nueva identidad de contraste**; `syllablePosition` marca *dónde* se
  practica, no genera una clave de contraste distinta → **no toca 5a** ni la función canónica.
  Solo si los datos revelaran un contraste de final genuinamente nuevo, esta fase tocaría territorio
  de 5a y la función canónica tendría que contemplar posición — leer esto resuelto, no decidir aquí.
- **Criterio de hecho:** existe al menos un set de práctica de consonante final con datos derivados, sin contenido inventado.

### Fase 10 — Documentar excepción online-only en CLAUDE.md (decisión 2)
**Independiente; hacer junto con Fase 5 o al cerrar el ciclo.**
- Anotar en `CLAUDE.md` la excepción: `/practice/sounds` es online-only temporalmente hasta que el modelo por contraste esté estable y se añada Dexie.
- **Criterio de hecho:** la regla "offline-safe / Dexie⇄Supabase" tiene su excepción documentada.

---

## (c) Aplazado y por qué

| Aplazado | Por qué | Cuándo retomar |
|---|---|---|
| **Capa Dexie⇄Supabase** (offline) | Hacerlo ahora = migrar dos veces (Dexie + giro a contraste). | Cuando el modelo por contraste (Fase 5) esté estable. Entonces persistir SRS-por-contraste y "lección vista" en Dexie. |
| **ASR-veredicto de producción** | Juzgar palabra entera es feedback engañoso; un veredicto fonémico real necesita **alineamiento fonético**, que no tenemos. | Cuando exista alineamiento fonético fiable (fuera de alcance actual). |
| **Gemini TTS pre-generado/cacheado** | El HVPT barato (voces del sistema) ya da variabilidad sin coste. Es upgrade de calidad/latencia, no bloqueante. | Tras Fase 6, si la consistencia/latencia de las voces del sistema resulta insuficiente. |
| **Prosodia, reducciones, discurso conectado** (B2/C1) | Requieren datos nuevos y tipos de ejercicio nuevos (frase/discurso); no derivables del contenido actual. | Tras estabilizar A1–B1 y el modelo por contraste. |
| **"Más lento" como pista en contrastes de duración** | Ralentizar distorsiona la pista de longitud que es el objetivo perceptivo. | No retomar para pares de duración; sí permitido para otros contrastes. |
| **Persistencia de "lección vista"** | Depende de Dexie (o de escribir a Supabase), aplazado con la decisión 2. | Junto con la capa Dexie. |

---

## Notas de cumplimiento (CLAUDE.md)

- Componentes < 250 líneas, una responsabilidad, tokens de diseño, sin estilos inline salvo runtime.
- Generadores/lógica en `lib/`; nada de prompts en componentes (no aplica: sin Gemini en este flujo).
- Tabla nueva de Fase 5 → **RLS obligatoria antes de merge**.
- Giro a contraste (Fase 5a) toca estado de usuario existente → **decisión de migración de
  `user_sound_progress` documentada antes del merge** (migrar / descartar / coexistir).
- Excepción online-only documentada en `CLAUDE.md` (Fase 10).
- Sin contenido pedagógico inventado: todo deriva de `IPA_EXTRA` / `PHONEME_CONFUSION` / `words`.
