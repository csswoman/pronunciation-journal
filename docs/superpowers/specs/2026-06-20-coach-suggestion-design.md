# Sugerencia de AI Coach al terminar (diaria / hub) — Diseño

**Fecha:** 2026-06-20
**Estado:** Aprobado, pendiente de plan de implementación
**Relacionado:** [Hub de práctica libre](./2026-06-20-practice-hub-design.md)

## Problema

El AI coach ya existe (chat de roleplay, entrevista por voz, modo pronunciation
vía `aiCoachStore.openCoach({ tab, prefill })`), pero **nunca se sugiere** desde
el plan diario ni el de repaso. El usuario termina la sesión y el coach queda
invisible, aunque sería el siguiente paso natural para producir lenguaje.

## Solución

Ofrecer el AI coach como **sugerencia opcional al terminar** (no como paso
obligatorio del plan), sembrada con el contexto de la sesión. Una pieza
reutilizable que aparece en dos lugares:

1. **Recap de la diaria** ([SessionRecapCard.tsx](../../../components/daily/SessionRecapCard.tsx)),
   bajo los CTAs actuales.
2. **Hub de práctica** (`/practice`), como bloque propio bajo la rejilla.

### Componente: `SpeakWithCoachCard`

Tarjeta con dos acciones, ambas usando el `aiCoachStore` global (sin navegación,
sin rutas nuevas):

- **"Conversa sobre esto"** → `openCoach({ tab: 'chat', prefill })`
- **"Entrevista por voz"** → `openCoach({ tab: 'interview', prefill })`

Props: `{ arc: SessionArc | undefined }`.

### Siembra del prefill: `buildCoachPrefill(arc)`

Función pura en `lib/ai-practice/` (no en el componente — regla de prompts del
proyecto). Prioridad:

1. `arc.sessionWords` no vacío → `"Let's practice using today's words: w1, w2, w3.
   Ask me questions that make me use them."` (máx. 6 palabras).
2. Solo `arc.topicLabel` → `"Let's have a conversation about <topicLabel>."`
3. Sin arc / sin contenido → cadena vacía (coach abre normal; tarjeta genérica).

Mismo prefill para `chat` e `interview`; cada tab decide cómo usarlo (ya lo
consume vía `consumeLaunch()`).

### Flujo de datos

- Recap: ya recibe `arc` como prop → directo.
- Hub: ya lee el `arc` cacheado vía `loadCachedDailyPlan(userId)?.arc` → directo.

### Edge cases

- `arc` ausente o `sessionWords` vacío → prefill vacío, copy genérico
  ("Practica hablando con el coach").
- La tarjeta solo dispara el store global; la disponibilidad real del coach
  (online/permiso de micro) la maneja el panel existente.
- Offline: `openCoach` solo abre UI; no rompe modo offline.

### Encaje con el hub de práctica

El AI coach **no es una ruta** (abre panel), así que no entra en el registro
`PRACTICE_MODES` (que asume `href`). Va como bloque `SpeakWithCoachCard`
independiente bajo `PracticeOptionsGrid`.

### Testing

- `buildCoachPrefill`: con palabras, solo tema, sin nada.
- `SpeakWithCoachCard`: al hacer clic dispara `openCoach` con tab + prefill
  correctos (mock del store).

## No incluido (YAGNI)

- Paso obligatorio de coach dentro del plan diario.
- Coach contextual durante ejercicios (sugerir al fallar).
- Modo pronunciation como sugerencia (descartado: solo chat + entrevista).
