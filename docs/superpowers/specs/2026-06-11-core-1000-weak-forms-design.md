# Core 1000 con weak forms — Design Spec

**Fecha:** 2026-06-11
**Estado:** Aprobado en brainstorming

## Objetivo

Un deck de las 1000 palabras más frecuentes del inglés (General American), con las
weak forms de las function words como ciudadanas de primera clase, conectado al
SM-2 existente y evaluado por **producción hablada** sobre oraciones de ejemplo.

## Decisiones tomadas

| Decisión | Resultado |
| --- | --- |
| Qué evalúa la repetición | Producción hablada (SpeechInputAdapter → accuracy → SM-2). El IPA es contenido visible, no ejercicio. |
| Modelado de weak forms | Campo opcional `ipa_weak` en la misma entrada; **una** tarjeta SM-2 por palabra. |
| Fuente del dataset | Ranking NGSL top 1000; IPA validado contra CMUdict (ARPAbet→IPA, GA). |
| Dosificación | Modelo Anki: todas las vencidas + cupo de 10 nuevas/día por rank. |
| Arquitectura de contenido | JSON versionado en `public/core-1000/` (10 chunks de 100), Zod + loader server-only, espejo de `lib/courses/grammar-deck/decks.ts`. |
| Estado SRS | Tabla Dexie `srsData` existente, `wordId = "c1k:" + word` (namespaced para no colisionar con palabras de lecciones). |

## 1. Esquema de datos

Archivos `public/core-1000/words-001.json` … `words-010.json`, 100 entradas cada
uno, ordenadas por rank (rank 1–100 en el chunk 001, etc.).

```jsonc
{
  "version": 1,
  "entries": [
    {
      "rank": 4,                               // 1–1000, único y contiguo
      "word": "to",
      "pos": "preposition",
      "ipa_strong": "/tuː/",
      "ipa_weak": "/tə/",                      // opcional (~70 function words)
      "example_sentence": "I want to go home.",
      "sentence_ipa": "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/", // opcional; OBLIGATORIO si hay ipa_weak
      "cefr_level": "A1"                       // A1 | A2 | B1 | B2 | C1
    }
  ]
}
```

Reglas del esquema:

- **No existe `has_reduction`**: derivable de `ipa_weak != null`. Helper
  `hasReduction(entry)` en `lib/core-1000/types.ts`.
- **Zod `refine`**: si `ipa_weak` está presente, `sentence_ipa` es obligatorio
  (la weak form solo tiene sentido en contexto de oración).
- `example_sentence` debe contener la palabra (validado por script).
- IPA en notación General American (consistente con los fixes de accent recientes).

Archivos nuevos:

- `lib/core-1000/schema.ts` — Zod schema (entrada + chunk).
- `lib/core-1000/types.ts` — tipos TS + `hasReduction()`.
- `lib/core-1000/data.ts` — loader server-only (usa `fs`): valida cada chunk,
  verifica ranks únicos/contiguos 1–1000, throw en dev / log+fallback en prod.
  Mismo contrato que `lib/courses/grammar-deck/decks.ts`.

Doble vía de acceso, mismo archivo fuente: el loader server-only sirve a tests/CI
y a cualquier superficie server-rendered (p.ej. contadores en `/practice`); la
sesión cliente hace fetch de los mismos JSON como assets estáticos (sección 3).
El schema Zod es compartido por ambas vías.

## 2. Pipeline de curación

- **Lista canónica**: NGSL top 1000 como CSV en `scripts/core-1000/data/ngsl-1000.csv`.
  El rank viene de ahí; no se inventa.
- **Generación**: el agente genera los chunks de 100 (pos, CEFR, weak forms,
  oraciones, IPA) uno por iteración; cada chunk pasa el validador antes de
  empezar el siguiente.
- **Validador** `scripts/core-1000/validate.ts` (corre con `npm run validate:core1000`):
  - Convierte CMUdict (ARPAbet, General American) → IPA y compara cada
    `ipa_strong`. Las discrepancias son **señal para revisión manual**, no veto
    automático (CMUdict no distingue algunos contrastes que un diccionario
    moderno sí).
  - Solo se versiona un CMUdict recortado a las ~1000 palabras
    (`scripts/core-1000/data/cmudict-core.json`), no los 3.7 MB completos.
  - Checks: weak forms solo dentro de una whitelist cerrada de function words;
    `example_sentence` contiene la palabra; `sentence_ipa` presente si hay
    `ipa_weak`; ranks únicos y contiguos.
- **Test Vitest** que carga el dataset completo y lo valida contra el schema —
  rompe el CI si un JSON queda mal.

## 3. Deck + sesión SM-2

Hook `useCore1000Session` (en `/hooks`):

1. **Vencidas**: `srsData` con prefijo `c1k:` y `nextReview <= now`. Todas entran.
2. **Nuevas**: cupo `NEW_CARDS_PER_DAY = 10` (constante; configurable después si
   hace falta — YAGNI). Se introducen en orden de `rank`. El conteo de
   nuevas-introducidas-hoy se persiste en Dexie (`dailyProgress`) para que
   recargar no resetee el cupo.
3. **Orden**: vencidas primero, nuevas al final — la sesión rinde aunque se
   corte a la mitad.

Ciclos:

- **Tarjeta nueva**: `WordStudyCard` (estudio) → ejercicio hablado →
  `createSRSEntry` + primera evaluación.
- **Repaso**: directo al ejercicio hablado.

**Ejercicio hablado**: el prompt es siempre la `example_sentence` (ahí vive la
weak form y es más natural que la palabra aislada). Flujo:
`SpeechInputAdapter` → `useScoring` → `accuracyToQuality()` → `updateSRS()`.
Taxonomía: `{ domain: 'vocabulary', mode: 'speak', variant: 'sentence' }` —
ya existe, cero cambios a `lib/exercises/taxonomy.ts`.

**Fallback self-grade**: sin micrófono o sin red para scoring, botones
Otra vez / Difícil / Bien / Fácil → quality 1/3/4/5 directo a `updateSRS()`.
Esto mantiene la regla dura de offline: dataset = assets estáticos cacheables,
SRS 100 % en Dexie, sesión degrada a auto-evaluación.

**Entrega de datos al cliente**: la sesión hace fetch de los chunks
(`/core-1000/words-00N.json`, ~25 KB c/u, HTTP-cacheables) y carga solo los que
necesita; no se pasan 1000 entradas como props del Server Component.

## 4. UI

```tsx
// Planned structure:
// app/practice/core-1000/page.tsx        (ruta, compose only)
// <Core1000Session>                      (client, orquesta cola + estados)
//   <DeckProgressHeader />               (x/1000 aprendidas, vencidas hoy, nuevas hoy)
//   <WordStudyCard />                    (tarjeta nueva: strong vs weak)
//   <SpeakReviewCard />                  (prompt oración + recorder + feedback)
//   <SelfGradeBar />                     (fallback sin mic)
//   <SessionSummary />                   (reusar el de practice/session si encaja)
```

Componentes en `components/practice/core-1000/`. Reglas: ≤250 líneas, ≤8 props,
tokens CSS, `cn()` para condicionales, sin estilos inline.

**`WordStudyCard`** (corazón de A4): palabra grande + chip de pos + chip CEFR.
Dos filas de pronunciación:

- **Strong** `/tuː/` + botón TTS de la palabra aislada.
- **Weak** `/tə/` + botón TTS que reproduce **la oración completa** (la weak
  form aislada no se pronuncia), con la palabra resaltada en la oración y
  `sentence_ipa` debajo.

Sin `ipa_weak` → una sola fila; mismo componente, layout condicional. Lenguaje
visual de las phoneme cards existentes. TTS vía `lib/phoneme-practice/tts.ts`;
nunca se guarda audio TTS (regla del repo).

**Entry points**: card en `/practice` + entrada en
`components/sidebar/navConfig.ts`.

## 5. Errores y degradación

| Falla | Comportamiento |
| --- | --- |
| JSON malformado | Dev: throw. Prod: log + empty state en la página (contrato de `decks.ts`). |
| Mic denegado / sin scoring | `SelfGradeBar` automáticamente. |
| TTS no disponible | Botones de audio deshabilitados; IPA siempre visible. |
| Offline | Chunks cacheados + Dexie + self-grade: la sesión funciona completa. |

## 6. Testing

- Unit: queue builder (cupo diario, orden vencidas→nuevas, persistencia del
  conteo en `dailyProgress`, prefijo `c1k:`).
- Schema: dataset completo contra Zod (Vitest, corre en CI).
- Validador: casos con discrepancia ARPAbet→IPA, weak form fuera de whitelist,
  oración sin la palabra.
- Component: flujo de sesión (patrón `PracticeSession.test.tsx`) — nueva →
  estudio → speak → summary; fallback self-grade.

## Fuera de alcance

- Sincronización del progreso Core 1000 a Supabase más allá de lo que `srsData`
  ya sincroniza hoy.
- Cupo de nuevas configurable por el usuario (constante por ahora).
- Ejercicios de reconocimiento de IPA (multiple choice) — el IPA es contenido,
  no ejercicio, en esta versión.
- Audio humano grabado; todo es TTS bajo demanda.
