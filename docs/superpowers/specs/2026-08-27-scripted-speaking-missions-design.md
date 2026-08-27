# Misiones de habla con guión (Scripted Speaking Missions)

**Fecha:** 2026-08-27
**Estado:** Aprobado (diseño)
**Rama:** dev

## Problema

Las misiones del AI Coach son roleplay conversacional libre: el estudiante
improvisa contra Gemini. Eso ejercita fluidez, pero no da un modelo que imitar
ni feedback accionable sobre *qué* se pronunció mal.

Falta el ejercicio complementario: un diálogo con **guión fijo**, donde el
estudiante oye cómo suena la línea, la dice, y ve exactamente qué sílabas
falló — con posibilidad de repetir y de comparar su puntuación contra intentos
anteriores.

Además, el coach hoy recibe un contexto pobre del estudiante
(`buildCoachPrefill` solo pasa palabras de la sesión o el tema), así que no
puede sugerir contenido acorde al nivel CEFR ni atacar debilidades concretas.

## Objetivos

1. Un tipo nuevo de misión: diálogo con guión, dos voces, grabación y
   evaluación por sílaba.
2. Feedback visual verde/amarillo/rojo a nivel de **sílaba**, con remediación
   articulatoria del fonema culpable.
3. Comparación de audio: la voz de la IA frente a la grabación propia.
4. Puntuación persistente por guión, para medir mejora entre intentos.
5. El coach conoce el perfil del estudiante (CEFR, temas, debilidades) y
   sugiere contenido acorde — sin quitarle la libertad de elegir tema.
6. Integración con las misiones diarias existentes.

## No objetivos

- **Persistir audio del usuario.** La grabación es efímera, vive en memoria
  durante la sesión y se descarta al salir. Guardar voz exige un diseño propio
  de consentimiento y retención; queda explícitamente fuera.
- Reemplazar las misiones conversacionales. Conviven.
- Autorar contenido nuevo de sílabas. La remediación cuelga del fonema, que ya
  tiene contenido en la app.

## Contexto: qué ya existe

Este proyecto es en gran medida **composición**, no construcción desde cero.

| Pieza | Ubicación | Estado |
| - | - | - |
| Misiones orales (roleplay) | `lib/ai-practice/missions/` | Completo |
| State machine de misión | `missions/state-machine.ts` | Reusable |
| Persistencia de sesión | `missions/persistence.ts` + Dexie `missionSessions` | Reusable, índice `[userId+missionId]` |
| Cadencia en plan diario | `lib/practice/daily-plan/mission-cadence.ts` | L/M/V ya cableado |
| STT + captura de audio | `hooks/useSpeechRecognition.ts` | `MediaRecorder` ya graba blob local |
| Scoring **a nivel de fonema** | `lib/pronunciation/scoring.ts` + `phonemes.ts` | Ya alinea fonema a fonema |
| Chips verde/rojo por fonema | `components/lesson/PronunciationFeedback.tsx` | Ya pinta estados |
| Separación silábica | `lib/pronunciation/syllable-separation.ts` | `hyphen/en`, sin conexión al scoring |
| Contenido articulatorio ES | `lib/pronunciation/ipa-data.ts` (`IPA_EXTRA`) | `articulationEs`, `spanishTip`, `minimalPairs` |
| Guía articulatoria | `articulation-guide-data.ts` | `visualCueEs`, posición de lengua/labios |
| Remediación UI | `components/pronunciation-feedback/RemediationSequence.tsx` | Reusable |
| Comparación de audio | `components/pronunciation/SelfPlaybackAudioBar.tsx` | Nivel palabra, ampliable |
| Skill Profile (CEFR) | `lib/progress/queries.ts` (RPC) | Existe, no llega al coach |

**El hueco real** es el puente fonema → sílaba, que no existe.

## Arquitectura

### 1. Modelo de datos

`OralMission` pasa a ser una unión discriminada por `mode`. Lo común sube a
una base; las misiones actuales reciben `mode: 'conversational'` y no cambian
en nada más.

```ts
// lib/ai-practice/missions/types.ts
type OralMission = ConversationalMission | ScriptedMission

interface MissionBase {
  id: string
  category: MissionCategory
  recommendedCefr: CEFRLevel
  context: string
  communicativeGoal: string
  targets: OralMissionTarget[]
}

type ScriptOrigin = 'authored' | 'generated'

interface ScriptedMission extends MissionBase {
  mode: 'scripted'
  origin: ScriptOrigin
  script: ScriptLine[]
}

interface ScriptLine {
  id: string
  speaker: 'coach' | 'learner'
  text: string
  /** Solo en guiones autorados; ausente ⇒ TTS del navegador. */
  modelAudio?: AuthoredAudioRef
  targetId?: PronunciationTargetId
}
```

**Decisiones:**

- **Un solo array ordenado**, no listas paralelas por hablante. Un diálogo es
  una secuencia; separarlo obligaría a reconstruir el orden en cada consumidor.
- **`origin` resuelve la voz.** Un único `resolveModelAudio(line)` decide entre
  el OGG pregenerado y `speechSynthesis`. El componente de reproducción no
  conoce la diferencia. Mismo patrón que `lib/pronunciation/ipa-audio.ts`.

### 2. Guiones generados y su persistencia

Tabla Dexie nueva `generatedScripts`, índice `[userId+createdAt]`. Un guión
generado por Gemini se guarda una vez y después se lee como cualquier otro del
catálogo.

Consecuencias: repetir un guión generado **no** vuelve a llamar a la API,
funciona offline, y el guión de tema libre ("entrevista de backend") queda en
la biblioteca del usuario para repetirlo semanas después.

El registry de misiones se convierte en la unión de dos fuentes: el catálogo
estático autorado y los guiones generados del usuario leídos de Dexie.

### 3. Perfil del estudiante — `lib/ai-coach/learner-context.ts`

Módulo de **lectura pura, sin estado**. No crea tabla de perfil: consulta las
fuentes que ya son dueñas de esa verdad.

```ts
interface LearnerContext {
  cefr: CEFRLevel                        // Skill Profile RPC
  recentTopics: string[]                 // temas recientes
  weakTargets: PronunciationTargetId[]   // feedback/prioritize
  strugglingWords: string[]              // SRS: lapsos recientes
  srsDueWords: string[]                  // vocabulario en repaso (ver Mejora 1)
}
```

Alimenta el **prompt**, no la UI. Se inyecta desde `lib/ai-prompts.ts` (regla
del proyecto: ningún prompt fuera de ese archivo).

Sustituye a `buildCoachPrefill`, que queda como caso degradado. El coach
conversacional gana el mismo contexto — mejora colateral.

**Degradación:** usuario sin datos ⇒ `cefr` por defecto y arrays vacíos. La
generación sigue funcionando, solo menos personalizada. Nunca bloquea.

### 4. Entrada a la misión

Dos caminos, un solo runner. Ambos producen un `MissionLaunch` (tipo ya
existente); la diferencia queda registrada en `launchSource`.

**Sugerido (por defecto).** En días de cadencia, el plan diario ofrece un guión
ya elegido: nivel según Skill Profile, target según lo que más se falla. Se
muestra la razón — *"A2 · trabaja /ɪ/ vs /iː/"* — para que la sugerencia sea
legible, no mágica. Usa la reconciliación de pasos que ya existe.

**Elegido.** Desde `MissionLibrary`, filtrado por nivel y categoría. Incluye un
campo de **tema libre** que dispara generación con Gemini usando el
`LearnerContext` como base: el tema lo pone el usuario, el nivel lo pone el
perfil.

### 5. Feedback por sílaba — `lib/pronunciation/syllable-scoring.ts`

Módulo nuevo, **puro y testeable**, que hace el puente que falta.

- **Entrada:** el `PhonemeAlignment[]` que ya produce `analyzePhonemes`, más la
  palabra **ya dividida en sílabas** (string con separadores).
- **Salida:** `SyllableResult[]` — texto de la sílaba, sus fonemas, y estado.

La división la resuelve el llamador con `resolveSyllableWord`, que es asíncrona
(carga `hyphen/en` de forma diferida). El módulo de scoring recibe el resultado
ya resuelto y por tanto es **síncrono y puro** — esa es la condición que lo hace
testeable sin mocks.

**Regla de agregación:**

| Estado | Condición | Razón |
| - | - | - |
| **Rojo** | falla el fonema núcleo (vocal) | rompe la inteligibilidad — *ship* vs *sheep* |
| **Amarillo** | solo fallan consonantes de borde, o un `missing` aislado | se entiende, suena raro |
| **Verde** | todos correctos | — |

Distinguir núcleo de borde evita que el estudiante persiga errores
irrelevantes (una /p/ final mal aspirada no es un error de vocal).

**Por qué módulo aparte y no dentro de `scoring.ts`:** ese archivo ya carga
bastante y tiene caché; esto es una transformación de presentación sobre datos
que ya existen. Puro y aislado se testea con casos conocidos
(`comfortable` → `com·fort·a·ble`) sin montar el pipeline de STT.

**Honestidad del feedback.** `hyphen/en` es hifenación **ortográfica**, no
silabificación fonética; no siempre coinciden. Cuando el mapeo fonema→sílaba no
sea fiable, el módulo devuelve `null` y la UI **cae al feedback por fonema que
ya existe**. Nunca se pintan sílabas inventadas.

### 6. Remediación

Una sílaba amarilla o roja es expandible y muestra, para el fonema culpable:

- **Cómo se dice** — `articulationEs` + `visualCueEs`.
- **Pista para hispanohablantes** — `spanishTip`.
- **Ejemplos** — `minimalPairs` del fonema, reproducibles con `ipa-audio.ts`.

**Un solo fonema por sílaba**, no todos: primero el núcleo, si no el primer
error. Volcar cinco tarjetas articulatorias por línea es ruido.

Reusa `RemediationSequence`; no se construye UI nueva de feedback.

**No hace falta autorar contenido de sílabas.** La remediación cuelga siempre
del fonema, que ya tiene contenido. La sílaba solo *localiza* el error
visualmente; de ahí se baja al fonema.

### 7. Runner y puntuación

`ScriptedMissionRunner` avanza línea por línea:

1. **Turno del coach** — reproduce audio (pregenerado o TTS) con el texto
   visible. Repetible sin límite.
2. **Turno del estudiante** — graba y obtiene: transcripción, sílabas
   coloreadas, remediación del fonema culpable, y comparación audio IA ↔ propio.
   **Reintentos ilimitados.**
3. **Cierre** — puntuación del diálogo y comparación contra la mejor marca
   anterior del mismo guión.

**Puntuación:**

- El score del diálogo es **fonemas acertados sobre el total**, no el promedio
  de porcentajes por línea. Así una línea larga pesa más que un *"Yes, please"*.
- Cuenta el **mejor intento de cada línea**, no el primero. Se está practicando,
  no examinando: premiar la insistencia es lo correcto pedagógicamente. Los
  intentos fallidos sí se persisten como evidencia para SRS y remediación —
  simplemente no castigan el score.

**`SpokenAttempt`:** cada intento genera el suyo con su `outcome` honesto. Sin
micrófono o con STT caído ⇒ `unscored`/`failed`, nunca un 0. Se respeta la regla
existente de que solo `scored` afecta a precisión y mastery.

**Persistencia:** un `MissionSessionRecord` por sesión (tabla ya existente) con
score y desglose por línea. El índice `[userId+missionId]` da el histórico
"antes 68% → ahora 84%".

### 8. Control del ramificado por modo

Añadir un `mode` invita a `if`/`switch` largos, que `ENGINEERING_STANDARDS.md`
prohíbe.

**Mitigación:** un `missionRunnerRegistry` que mapea `mode` → runner, y un type
guard por variante. La state machine comparte las transiciones comunes
(briefing, result, cancel) y delega las específicas. Es el patrón de registry
que el proyecto ya exige para variantes.

## Mejoras de conexión con el aprendizaje

### Mejora 1 — Guiones sembrados con vocabulario del SRS

`srsDueWords` entra en el prompt de generación, de modo que el diálogo
**obliga a producir** vocabulario que hoy solo se reconoce pasivamente. Es el
salto de reconocimiento a producción, donde más gente se atasca.

Coste: un campo más en el prompt.

### Mejora 2 — El error hablado alimenta el SRS

Fallar un fonema en una misión ya persiste evidencia
(`persistPronunciationFeedbackEvidence`). Se añade que además **suba la
prioridad** de las palabras afectadas en la cola de repaso: hablar algo mal hace
que vuelva a aparecer.

> **Riesgo — la parte más delicada del proyecto.** Tocar la priorización del SRS
> puede degradar los repasos de vocabulario, que son el núcleo de la app.
>
> **Contención:** se implementa como una señal **acotada y reversible** — un
> ajuste de prioridad **con techo**, nunca una reescritura del scheduling. Va
> detrás de su propio módulo con tests dedicados, y debe poder desactivarse sin
> tocar el motor.

### Mejora 3 — Guión de repaso desde los fallos

Guión generado periódicamente, compuesto solo de líneas que ejercitan lo peor
pronunciado en las últimas semanas. Un "examen de recuperación" hablado,
construido enteramente sobre datos que ya se recogen.

Depende de tener historial acumulado: sin semanas de datos, degrada a
generación normal.

## Manejo de errores

| Situación | Comportamiento |
| - | - |
| Sin micrófono / permiso denegado | Misión en modo escucha; attempts `unscored`. No bloquea. |
| STT no soportado | `shouldOfferMission` ya lo filtra en el plan diario. En biblioteca, se avisa antes de entrar. |
| Gemini caído | El catálogo autorado sigue disponible. Generación falla con mensaje, sin romper la sesión. |
| Mapeo silábico no fiable | Fallback al feedback por fonema existente. |
| Sin voz TTS inglesa | Se muestra el texto; el turno del coach es legible aunque no suene. |
| Offline | Catálogo autorado + guiones ya generados funcionan. Solo se pierde generación nueva. |

## Testing

- **`syllable-scoring.ts`** — unitarios con palabras conocidas: núcleo fallado ⇒
  rojo, borde fallado ⇒ amarillo, mapeo ambiguo ⇒ `null`.
- **Puntuación** — mejor intento por línea; ponderación por fonemas; `unscored`
  excluido y no contado como 0.
- **State machine** — recorrido completo del guión, reintentos, cancelación.
- **`learner-context`** — degradación con perfil vacío.
- **Registry** — misiones conversacionales intactas tras introducir `mode`.
- **Mejora 2** — el ajuste de prioridad respeta el techo y es reversible.

## Restricciones del proyecto

- Prompts solo en `lib/ai-prompts.ts`; llamadas Gemini solo vía `/api/gemini/*`.
- Supabase solo desde `lib/*/queries.ts`.
- Componentes ≤250 líneas, ≤8 props, una responsabilidad. El runner se
  descompone en subcomponentes (línea del coach, turno del estudiante, feedback,
  resultado).
- Tailwind v4 con tokens; nada de `style={{}}` salvo valores en runtime.
- Offline debe seguir funcionando.

## Fuera de alcance (siguientes pasos)

- Persistir audio del usuario (requiere diseño de consentimiento/retención).
- Pipeline de generación de audio con Antigravity para el catálogo autorado —
  se especifica el formato de referencia (`AuthoredAudioRef`), pero el tooling
  de `/scripts` es trabajo aparte.
- Detección de prosodia/entonación a nivel de frase.
