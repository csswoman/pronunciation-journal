# AI Coach — Starters adaptativos (Fase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los cuatro botones de inicio del chat dejen de ser texto fijo y se construyan a partir del estado real del alumno y de sus intereses declarados, de forma que dos sesiones nunca arranquen igual y el cuarto botón sea una conversación libre que inicia el usuario.

**Architecture:** Un registry de starters con predicado y builder por entrada, y un selector puro `selectStarters()` que elige tres dinámicos (`review` / `learn` / `world`) más `free`, rotando por semilla y excluyendo los usados recientemente. Los prompts pasan de constantes a funciones que reciben contexto. `ChatEmptyState` se parte en tres componentes y deja de conocer el estado de aprendizaje. La titulación de conversaciones migra de "mapear el texto del prompt" a un `starterId` explícito.

**Tech Stack:** Next.js 16 App Router · TypeScript · Vitest · Dexie (`useLiveQuery`)

**Spec:** `docs/superpowers/specs/2026-09-05-ai-coach-adaptive-redesign-design.md`
**Depende de:** Fase 1 (`buildSystemPrompt` con objeto de opciones). No depende de la fase 2.

---

## Contexto para quien implementa

**Cómo arranca hoy una conversación.** `ChatEmptyState` pinta 4 filas y 4 chips. Cada uno
manda un **mensaje de usuario oculto** (`onSendMessage(prompt, { hidden: true })`) cuyo
texto es una constante de `AI_COACH_EMPTY_STATE_PROMPTS` en `lib/ai-prompts.ts:156-204`.
El modelo lo recibe como si el usuario lo hubiera escrito, y el system prompt va aparte.

**El acoplamiento que hay que romper.** `lib/ai-practice/conversation-title.ts` titula la
conversación **comparando el texto del prompt** contra un mapa
(`PROMPT_TO_TITLE_MAP`, líneas 5-14) y, si falla, buscando frases sueltas dentro del texto
(`titleFromStarterPrompt`, líneas 35-50). En cuanto los prompts sean dinámicos, ese mapa
deja de acertar y las conversaciones pierden el título. **Migrarlo es parte obligatoria de
esta fase, no opcional.**

**De dónde sale el estado del alumno.** `getUserLearningState(userId)` en
`lib/ai-practice/load-state.ts` (cliente, con caché de 30 s) devuelve un
`UserLearningState`. Lo relevante para los starters:

| Campo | Qué es | Alimenta |
| - | - | - |
| `level.cefrEstimate` | Nivel estimado (A1…C2) | `learn` |
| `errorRecurrence` | Cola de patrones de error programados | `review` |
| `grammar.weakTopics[]` | `{ topic, errorRate, lastCoveredAt }` | `review` |
| `lastSessions[]` | Temas recientes | `learn` (para excluir) |
| `domainProfile.domains[]` | Áreas derivadas del word_bank | `world` (secundario) |

Los **intereses declarados** (los 12 de `lib/users/interests.ts`) vienen aparte, de
`getCachedUserInterests(userId)` en `lib/db/index.ts:1218` — cacheados en Dexie por
`hooks/useUserPreferences.ts`, así que funcionan offline.

**Dónde guardar el historial de starters.** `db.practicePrefs` es una tabla clave/valor
(`practicePrefs: "key"`). **No hace falta subir la versión de Dexie**: basta con una clave
nueva, siguiendo el patrón de `cacheUserInterests` (líneas 1208-1227).

> Nota: `CLAUDE.md` menciona una carpeta `store/` para bindings de `useLiveQuery`. **Esa
> carpeta no existe** en el repositorio. Los hooks con `useLiveQuery` viven hoy en
> `hooks/` (por ejemplo `hooks/useTracking.ts`); sigue esa convención real.

### Reglas del proyecto que aplican aquí

- **Ningún prompt fuera de `lib/ai-prompts.ts`** (hay audit: `pnpm audit:ai-prompts`).
- Componentes ≤250 líneas; ESLint avisa a 300.
- Muchas variantes → registry + type guard, no cadenas de `if`/`switch`.
- Estado persistente → Dexie. Zustand solo para UI efímera.
- El modo offline debe seguir funcionando.

### Comandos

```bash
pnpm test <ruta>       # Vitest, un archivo
pnpm type-check
pnpm lint
pnpm audit:hard-rules
```

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
| - | - | - |
| `lib/ai-practice/starters/types.ts` | `CoachStarter`, `StarterContext`, `StarterId` | **Crear** |
| `lib/ai-practice/starters/registry.ts` | Las 4 entradas con `isAvailable` + `build` | **Crear** |
| `lib/ai-practice/starters/select.ts` | Selector puro con semilla y anti-repetición | **Crear** |
| `lib/ai-practice/starters/history.ts` | Leer/escribir los últimos starters en Dexie | **Crear** |
| `lib/ai-prompts.ts` | Builders de prompt en vez de constantes | Modificar |
| `hooks/useCoachStarters.ts` | Orquestación: Dexie + estado → `CoachStarter[]` | **Crear** |
| `components/ai-coach/starters/CoachGreeting.tsx` | Orbe + saludo | **Crear** |
| `components/ai-coach/starters/CoachStarterList.tsx` | Las 4 filas dinámicas | **Crear** |
| `components/ai-coach/starters/CoachShortcutRail.tsx` | Los chips estáticos | **Crear** |
| `components/ai-coach/ChatEmptyState.tsx` | Composición pura | Modificar |
| `components/ai-coach/AICoachHome.tsx` | Pasa los starters hacia abajo | Modificar |
| `components/ai-coach/AICoachPanel.tsx` | Llama a `useCoachStarters` | Modificar |
| `hooks/useStreamingChat.ts` | `sendMessage` acepta `starterId` | Modificar |
| `lib/ai-practice/conversation-title.ts` | Titular por `starterId`, no por texto | Modificar |

---

## Task 1: Tipos y contexto de los starters

**Files:**
- Create: `lib/ai-practice/starters/types.ts`

- [ ] **Step 1: Escribir el archivo**

Crea `lib/ai-practice/starters/types.ts`:

```ts
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { Interest } from "@/lib/users/interests";

/** The four slots the chat home offers. `free` is always the fallback. */
export type StarterId = "review" | "learn" | "world" | "free";

/** Everything a starter needs to decide whether it applies and what to say. */
export interface StarterContext {
  state: UserLearningState | null;
  interests: readonly Interest[];
  /** Deterministic per render so tests can pin the chosen angle. */
  seed: number;
  /** Starter ids used in recent sessions, newest first. */
  recentIds: readonly StarterId[];
  /** Opening angles already used recently, so the model avoids repeating them. */
  recentAngles: readonly string[];
  now: number;
}

/** A starter resolved for this particular user, right now. */
export interface ResolvedStarter {
  id: StarterId;
  /** Button label, in Spanish. */
  title: string;
  /** The line under the title carrying the data that justifies it. */
  subtitle: string;
  /** The hidden user message sent to the model. */
  prompt: string;
  /** The angle this render picked, recorded so the next one avoids it. */
  angle: string;
}

/** A registry entry: can it apply, and how does it build itself. */
export interface CoachStarter {
  id: StarterId;
  isAvailable: (ctx: StarterContext) => boolean;
  build: (ctx: StarterContext) => ResolvedStarter;
}
```

- [ ] **Step 2: Verificar que compila**

```bash
pnpm type-check
```

Esperado: limpio.

- [ ] **Step 3: Commit**

```bash
git add lib/ai-practice/starters/types.ts
git commit -m "feat(ai-coach): add starter types"
```

---

## Task 2: Los builders de prompt

Los prompts viven en `lib/ai-prompts.ts` por regla dura del proyecto. Aquí dejan de ser
constantes y pasan a ser funciones.

**Files:**
- Modify: `lib/ai-prompts.ts`
- Test: `lib/__tests__/ai-prompts-starters.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crea `lib/__tests__/ai-prompts-starters.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildReviewStarterPrompt,
  buildLearnStarterPrompt,
  buildWorldStarterPrompt,
  buildFreeStarterPrompt,
  STARTER_ANGLES,
} from "@/lib/ai-prompts";

describe("buildFreeStarterPrompt", () => {
  it("tells the model the student picks the topic", () => {
    const prompt = buildFreeStarterPrompt();
    expect(prompt).toMatch(/THEY choose the topic/i);
  });

  it("forbids proposing a topic or a warm-up question", () => {
    const prompt = buildFreeStarterPrompt();
    expect(prompt).toMatch(/Do NOT propose a topic/i);
    expect(prompt).toMatch(/Do NOT ask a warm-up question/i);
  });

  it("asks for a one-sentence greeting", () => {
    expect(buildFreeStarterPrompt()).toMatch(/ONE short sentence/i);
  });
});

describe("buildReviewStarterPrompt", () => {
  it("names the concrete thing the student got wrong", () => {
    const prompt = buildReviewStarterPrompt({
      focus: "Pasado simple irregular",
      failCount: 3,
    });
    expect(prompt).toContain("Pasado simple irregular");
    expect(prompt).toContain("3");
  });

  it("asks for practice, not a lecture", () => {
    const prompt = buildReviewStarterPrompt({ focus: "articles", failCount: 2 });
    expect(prompt).toMatch(/exercise|practice/i);
  });
});

describe("buildLearnStarterPrompt", () => {
  it("states the student's level", () => {
    const prompt = buildLearnStarterPrompt({
      level: "B1",
      avoidTopics: ["present perfect"],
      angle: "a phrasal verb they will actually use",
    });
    expect(prompt).toContain("B1");
  });

  it("tells the model which topics to avoid", () => {
    const prompt = buildLearnStarterPrompt({
      level: "B1",
      avoidTopics: ["present perfect", "modals"],
      angle: "an idiom",
    });
    expect(prompt).toContain("present perfect, modals");
  });

  it("carries the chosen angle", () => {
    const prompt = buildLearnStarterPrompt({
      level: "A2",
      avoidTopics: [],
      angle: "a false friend for Spanish speakers",
    });
    expect(prompt).toContain("a false friend for Spanish speakers");
  });

  it("does not mention avoided topics when there are none", () => {
    const prompt = buildLearnStarterPrompt({ level: "A2", avoidTopics: [], angle: "x" });
    expect(prompt).not.toMatch(/Avoid these topics/i);
  });
});

describe("buildWorldStarterPrompt", () => {
  it("centres the conversation on the chosen interest", () => {
    const prompt = buildWorldStarterPrompt({
      interest: "gaming",
      knownWords: ["level", "player"],
      angle: "a real situation",
    });
    expect(prompt).toContain("gaming");
  });

  it("lists words the student already knows so they are not re-taught", () => {
    const prompt = buildWorldStarterPrompt({
      interest: "food",
      knownWords: ["recipe", "spicy"],
      angle: "ordering something",
    });
    expect(prompt).toContain("recipe, spicy");
  });
});

describe("STARTER_ANGLES", () => {
  it("gives learn and world enough angles to rotate without repeating soon", () => {
    expect(STARTER_ANGLES.learn.length).toBeGreaterThanOrEqual(5);
    expect(STARTER_ANGLES.world.length).toBeGreaterThanOrEqual(5);
  });

  it("has no duplicate angles within a starter", () => {
    for (const angles of Object.values(STARTER_ANGLES)) {
      expect(new Set(angles).size).toBe(angles.length);
    }
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/__tests__/ai-prompts-starters.test.ts
```

Esperado: FAIL — ninguna de esas funciones existe.

- [ ] **Step 3: Implementar**

En `lib/ai-prompts.ts`, **sustituye** el bloque `AI_COACH_EMPTY_STATE_PROMPTS`
(líneas 156-204) por:

```ts
/**
 * Opening angles each starter rotates through. The seed picks one, excluding
 * the ones used recently — this is the cheapest of the four anti-repetition
 * mechanisms and the only one that works for a brand-new user with no state.
 */
export const STARTER_ANGLES = {
  learn: [
    "a phrasal verb they will actually use this week",
    "a false friend that trips up Spanish speakers",
    "two words they probably confuse with each other",
    "a small grammar pattern that makes them sound more fluent",
    "an everyday expression that is not in textbooks",
    "a connector that makes their sentences flow better",
  ],
  world: [
    "a real situation they would face",
    "an opinion question with no easy answer",
    "vocabulary they would read in an article about it",
    "a short roleplay where you play the other person",
    "something surprising about it in English-speaking countries",
    "the words natives use that learners rarely know",
  ],
  review: [
    "through a short exercise",
    "by having them use it in a sentence about their own life",
    "by contrasting it with the form they keep reaching for",
  ],
} as const;

export function buildReviewStarterPrompt(input: {
  focus: string;
  failCount: number;
}): string {
  return `The student has struggled with "${input.focus}" — ${input.failCount} recent mistakes.
Open by naming it plainly in ONE sentence (in Spanish is fine for that sentence),
then go straight into practice: give them a short exercise on it via the exercise tools.
Do not lecture. Do not list rules up front — let the mistakes surface the rule.
After they answer, explain only what they got wrong.`;
}

export function buildLearnStarterPrompt(input: {
  level: string;
  avoidTopics: readonly string[];
  angle: string;
}): string {
  const avoid = input.avoidTopics.length
    ? `\nAvoid these topics — they were covered recently: ${input.avoidTopics.join(", ")}.`
    : "";
  return `Teach this ${input.level} student ONE new thing right now: ${input.angle}.
Structure: name it, explain it in at most three lines, give two examples, then
immediately check they got it with one exercise via the exercise tools.
Pick something genuinely useful at ${input.level} — not trivia, not something
far above their level.${avoid}`;
}

export function buildWorldStarterPrompt(input: {
  interest: string;
  knownWords: readonly string[];
  angle: string;
}): string {
  const known = input.knownWords.length
    ? `\nThey already know these words — do not teach them again: ${input.knownWords.join(", ")}.`
    : "";
  return `Practice English around ${input.interest}, which the student told us they care about.
Approach it through ${input.angle}.
Keep it conversational: one thing at a time, and let them do most of the talking.
Introduce 1-2 useful words naturally as you go, and offer them via annotate_turn
saveables rather than stopping to define them.${known}`;
}

export function buildFreeStarterPrompt(): string {
  return `The student picked "free conversation" — THEY choose the topic, not you.
Greet them in ONE short sentence and ask what they feel like talking about.
Do NOT propose a topic. Do NOT ask a warm-up question about their day.
Wait for them to set the direction, then follow it.
The FEEDBACK DISCIPLINE in your system prompt still applies to every turn.`;
}
```

**Deja intactos** los cuatro prompts de atajo (`newYorkTrip`, `jobInterview`,
`discussArticle`, `pronunciation`): siguen siendo constantes y los usa el rail de chips.
Muévelos a su propia constante:

```ts
export const AI_COACH_SHORTCUT_PROMPTS = {
  newYorkTrip: `...`,      // sin cambios
  jobInterview: `...`,     // sin cambios
  discussArticle: `...`,   // sin cambios
  pronunciation: `...`,    // sin cambios
} as const;
```

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/__tests__/ai-prompts-starters.test.ts && pnpm audit:ai-prompts
```

Esperado: PASS y exit 0. `pnpm type-check` fallará todavía en
`conversation-title.ts` y `ChatEmptyState.tsx`, que aún importan
`AI_COACH_EMPTY_STATE_PROMPTS` — se arreglan en las tasks 6 y 7.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/__tests__/ai-prompts-starters.test.ts
git commit -m "feat(ai-coach): turn starter prompts into context-aware builders"
```

---

## Task 3: El registry de starters

**Files:**
- Create: `lib/ai-practice/starters/registry.ts`
- Test: `lib/ai-practice/starters/__tests__/registry.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crea `lib/ai-practice/starters/__tests__/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { STARTERS, getStarter } from "../registry";
import type { StarterContext } from "../types";
import { createEmptyState } from "@/lib/ai-practice/learning-state";

const NOW = Date.parse("2026-09-05T12:00:00Z");

function ctx(overrides: Partial<StarterContext> = {}): StarterContext {
  return {
    state: null,
    interests: [],
    seed: 0,
    recentIds: [],
    recentAngles: [],
    now: NOW,
    ...overrides,
  };
}

function stateWithWeakTopic(topic: string, errorRate: number) {
  const s = createEmptyState("u1", "d1");
  return {
    ...s,
    grammar: {
      weakTopics: [
        { topic, errorRate, sampleCount: 5, lastCoveredAt: new Date(NOW - 86_400_000).toISOString() },
      ],
    },
  };
}

describe("free starter", () => {
  it("is always available, even with no state at all", () => {
    expect(getStarter("free").isAvailable(ctx())).toBe(true);
  });

  it("builds a prompt that hands the topic to the student", () => {
    const built = getStarter("free").build(ctx());
    expect(built.id).toBe("free");
    expect(built.prompt).toMatch(/THEY choose the topic/i);
  });
});

describe("learn starter", () => {
  it("is always available", () => {
    expect(getStarter("learn").isAvailable(ctx())).toBe(true);
  });

  it("defaults to B1 when there is no state", () => {
    expect(getStarter("learn").build(ctx()).prompt).toContain("B1");
  });

  it("uses the student's estimated level when there is state", () => {
    const state = { ...createEmptyState("u1", "d1"), level: { cefrEstimate: "A2" as const, confidence: 0.4 } };
    expect(getStarter("learn").build(ctx({ state })).prompt).toContain("A2");
  });

  it("picks a different angle for a different seed", () => {
    const a = getStarter("learn").build(ctx({ seed: 0 })).angle;
    const b = getStarter("learn").build(ctx({ seed: 1 })).angle;
    expect(a).not.toBe(b);
  });

  it("avoids an angle used recently", () => {
    const first = getStarter("learn").build(ctx({ seed: 0 })).angle;
    const second = getStarter("learn").build(ctx({ seed: 0, recentAngles: [first] })).angle;
    expect(second).not.toBe(first);
  });
});

describe("review starter", () => {
  it("is unavailable with no state", () => {
    expect(getStarter("review").isAvailable(ctx())).toBe(false);
  });

  it("is unavailable when every weak topic is below the error threshold", () => {
    const state = stateWithWeakTopic("articles", 0.2);
    expect(getStarter("review").isAvailable(ctx({ state }))).toBe(false);
  });

  it("becomes available once a topic passes the threshold", () => {
    const state = stateWithWeakTopic("past-simple", 0.62);
    expect(getStarter("review").isAvailable(ctx({ state }))).toBe(true);
  });

  it("names the weakest topic in its subtitle and prompt", () => {
    const state = stateWithWeakTopic("past-simple", 0.62);
    const built = getStarter("review").build(ctx({ state }));
    expect(built.prompt).toContain("past-simple");
    expect(built.subtitle).toContain("past-simple");
  });
});

describe("world starter", () => {
  it("is unavailable with neither interests nor a domain profile", () => {
    expect(getStarter("world").isAvailable(ctx())).toBe(false);
  });

  it("is available with declared interests alone", () => {
    expect(getStarter("world").isAvailable(ctx({ interests: ["gaming"] }))).toBe(true);
  });

  it("rotates between declared interests by seed", () => {
    const base = { interests: ["gaming", "food", "travel"] as const };
    const first = getStarter("world").build(ctx({ ...base, seed: 0 })).title;
    const second = getStarter("world").build(ctx({ ...base, seed: 1 })).title;
    expect(first).not.toBe(second);
  });

  it("falls back to the domain profile when no interests are declared", () => {
    const state = {
      ...createEmptyState("u1", "d1"),
      domainProfile: { domains: [{ id: "eng", label: "ingeniería", weight: 1 }] },
    } as never;
    expect(getStarter("world").isAvailable(ctx({ state }))).toBe(true);
  });
});

describe("STARTERS registry", () => {
  it("holds exactly the four known starters", () => {
    expect(STARTERS.map((s) => s.id).sort()).toEqual(["free", "learn", "review", "world"]);
  });

  it("gives every starter a non-empty title, subtitle and prompt", () => {
    const state = stateWithWeakTopic("past-simple", 0.7);
    const c = ctx({ state, interests: ["books"] });
    for (const starter of STARTERS) {
      const built = starter.build(c);
      expect(built.title, starter.id).toBeTruthy();
      expect(built.subtitle, starter.id).toBeTruthy();
      expect(built.prompt, starter.id).toBeTruthy();
    }
  });
});
```

Antes de escribir el código, comprueba la forma real de `DomainProfile` en
`lib/lexicon/domain-profile.ts` y ajusta el objeto del penúltimo test si no coincide.

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/starters/__tests__/registry.test.ts
```

Esperado: FAIL con "Failed to resolve import ../registry".

- [ ] **Step 3: Implementar**

Crea `lib/ai-practice/starters/registry.ts`:

```ts
import {
  STARTER_ANGLES,
  buildFreeStarterPrompt,
  buildLearnStarterPrompt,
  buildReviewStarterPrompt,
  buildWorldStarterPrompt,
} from "@/lib/ai-prompts";
import { INTEREST_LABELS_ES } from "@/lib/users/interests";
import type { CoachStarter, StarterContext, StarterId } from "./types";

/** A weak topic below this error rate is not worth interrupting the user for. */
const REVIEW_ERROR_THRESHOLD = 0.4;

/**
 * Picks one item from a pool by seed, skipping anything used recently.
 * Falls back to the plain seeded pick when everything has been used.
 */
function pickBySeed<T extends string>(pool: readonly T[], seed: number, recent: readonly string[]): T {
  const fresh = pool.filter((item) => !recent.includes(item));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.abs(seed) % from.length];
}

function weakestTopic(ctx: StarterContext) {
  const topics = ctx.state?.grammar.weakTopics ?? [];
  const eligible = topics.filter((t) => t.errorRate >= REVIEW_ERROR_THRESHOLD);
  if (eligible.length === 0) return null;
  return eligible.reduce((a, b) => (a.errorRate >= b.errorRate ? a : b));
}

function worldSubject(ctx: StarterContext): { key: string; label: string } | null {
  if (ctx.interests.length > 0) {
    const key = pickBySeed(
      ctx.interests.map(String),
      ctx.seed,
      // Interests rotate on their own; recentAngles holds angles, not subjects.
      [],
    );
    return { key, label: INTEREST_LABELS_ES[key as keyof typeof INTEREST_LABELS_ES] ?? key };
  }
  const domain = ctx.state?.domainProfile?.domains?.[0];
  if (domain) return { key: domain.label, label: domain.label };
  return null;
}

const freeStarter: CoachStarter = {
  id: "free",
  isAvailable: () => true,
  build: () => ({
    id: "free",
    title: "Habla de lo que quieras",
    subtitle: "Tú empiezas",
    prompt: buildFreeStarterPrompt(),
    angle: "free",
  }),
};

const learnStarter: CoachStarter = {
  id: "learn",
  isAvailable: () => true,
  build: (ctx) => {
    const level = ctx.state?.level.cefrEstimate ?? "B1";
    const avoidTopics = (ctx.state?.lastSessions ?? []).slice(0, 2).map((s) => s.topic);
    const angle = pickBySeed(STARTER_ANGLES.learn, ctx.seed, ctx.recentAngles);
    return {
      id: "learn",
      title: "Enséñame algo nuevo",
      subtitle: `Nivel ${level} · no visto aún`,
      prompt: buildLearnStarterPrompt({ level, avoidTopics, angle }),
      angle,
    };
  },
};

const reviewStarter: CoachStarter = {
  id: "review",
  isAvailable: (ctx) => weakestTopic(ctx) !== null,
  build: (ctx) => {
    const topic = weakestTopic(ctx);
    const focus = topic?.topic ?? "lo que fallaste";
    const failCount = topic ? Math.round(topic.errorRate * topic.sampleCount) : 0;
    const angle = pickBySeed(STARTER_ANGLES.review, ctx.seed, ctx.recentAngles);
    return {
      id: "review",
      title: "Repasa lo que fallaste",
      subtitle: `${focus} · ${failCount} errores`,
      prompt: `${buildReviewStarterPrompt({ focus, failCount })}\nApproach it ${angle}.`,
      angle,
    };
  },
};

const worldStarter: CoachStarter = {
  id: "world",
  isAvailable: (ctx) => worldSubject(ctx) !== null,
  build: (ctx) => {
    const subject = worldSubject(ctx);
    const key = subject?.key ?? "everyday life";
    const label = subject?.label ?? "tu día a día";
    const knownWords = (ctx.state?.vocabulary.savedWords ?? []).slice(0, 5).map((w) => w.word);
    const angle = pickBySeed(STARTER_ANGLES.world, ctx.seed, ctx.recentAngles);
    return {
      id: "world",
      title: `Inglés de ${label}`,
      subtitle: "Tu área · conversación",
      prompt: buildWorldStarterPrompt({ interest: key, knownWords, angle }),
      angle,
    };
  },
};

export const STARTERS: readonly CoachStarter[] = [
  reviewStarter,
  learnStarter,
  worldStarter,
  freeStarter,
];

export function getStarter(id: StarterId): CoachStarter {
  const found = STARTERS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown starter: ${id}`);
  return found;
}
```

- [ ] **Step 4: Añadir las etiquetas de intereses en español**

Los 12 intereses están en inglés (`technology`, `films`…) pero el botón es español. Añade a
`lib/users/interests.ts`:

```ts
export const INTEREST_LABELS_ES: Record<Interest, string> = {
  technology: "tecnología",
  travel: "viajes",
  work: "trabajo",
  food: "comida",
  music: "música",
  films: "películas",
  books: "libros",
  sports: "deportes",
  health: "salud",
  science: "ciencia",
  business: "negocios",
  gaming: "videojuegos",
};
```

- [ ] **Step 5: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-practice/starters/__tests__/registry.test.ts
```

Esperado: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/starters/ lib/users/interests.ts
git commit -m "feat(ai-coach): add the starter registry with seeded angle rotation"
```

---

## Task 4: El selector

**Files:**
- Create: `lib/ai-practice/starters/select.ts`
- Test: `lib/ai-practice/starters/__tests__/select.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crea `lib/ai-practice/starters/__tests__/select.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { selectStarters } from "../select";
import type { StarterContext } from "../types";
import { createEmptyState } from "@/lib/ai-practice/learning-state";

const NOW = Date.parse("2026-09-05T12:00:00Z");

function ctx(overrides: Partial<StarterContext> = {}): StarterContext {
  return { state: null, interests: [], seed: 0, recentIds: [], recentAngles: [], now: NOW, ...overrides };
}

function weakState(errorRate = 0.7) {
  const s = createEmptyState("u1", "d1");
  return {
    ...s,
    grammar: {
      weakTopics: [
        { topic: "past-simple", errorRate, sampleCount: 5, lastCoveredAt: new Date(NOW).toISOString() },
      ],
    },
  };
}

describe("selectStarters", () => {
  it("always returns exactly four starters", () => {
    expect(selectStarters(ctx())).toHaveLength(4);
    expect(selectStarters(ctx({ state: weakState(), interests: ["gaming"] }))).toHaveLength(4);
  });

  it("gives a brand-new user learn plus free, with no broken promises", () => {
    const ids = selectStarters(ctx()).map((s) => s.id);
    expect(ids).toContain("learn");
    expect(ids).toContain("free");
    expect(ids).not.toContain("review");
  });

  it("never repeats a starter id within one selection", () => {
    const ids = selectStarters(ctx({ state: weakState(), interests: ["gaming"] })).map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("always ends with the free starter", () => {
    const ids = selectStarters(ctx({ state: weakState(), interests: ["gaming"] })).map((s) => s.id);
    expect(ids[ids.length - 1]).toBe("free");
  });

  it("includes review once a topic is weak enough", () => {
    const ids = selectStarters(ctx({ state: weakState() })).map((s) => s.id);
    expect(ids).toContain("review");
  });

  it("includes world once interests are declared", () => {
    const ids = selectStarters(ctx({ interests: ["books"] })).map((s) => s.id);
    expect(ids).toContain("world");
  });

  it("pads with static shortcuts when fewer than three dynamic starters apply", () => {
    const starters = selectStarters(ctx());
    // learn + free are the only dynamic ones available; the rest are padding.
    expect(starters.filter((s) => s.id === "free")).toHaveLength(1);
    expect(starters).toHaveLength(4);
  });

  it("produces different angles across seeds for the same user", () => {
    const state = weakState();
    const a = selectStarters(ctx({ state, seed: 0 })).map((s) => s.angle).join("|");
    const b = selectStarters(ctx({ state, seed: 3 })).map((s) => s.angle).join("|");
    expect(a).not.toBe(b);
  });

  it("is deterministic for the same seed and context", () => {
    const state = weakState();
    const a = selectStarters(ctx({ state, seed: 7 })).map((s) => s.prompt);
    const b = selectStarters(ctx({ state, seed: 7 })).map((s) => s.prompt);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/starters/__tests__/select.test.ts
```

Esperado: FAIL con "Failed to resolve import ../select".

- [ ] **Step 3: Implementar**

Crea `lib/ai-practice/starters/select.ts`:

```ts
import { STARTERS } from "./registry";
import type { ResolvedStarter, StarterContext } from "./types";

/** The chat home shows four rows; free always occupies the last one. */
const SLOTS = 4;

/**
 * Resolves the starters to offer right now.
 *
 * Dynamic starters that do not apply are simply left out — a card promising a
 * review the user has not earned is worse than no card. `free` always closes
 * the list, and fills any slot the dynamic ones could not.
 */
export function selectStarters(ctx: StarterContext): ResolvedStarter[] {
  const dynamic = STARTERS
    .filter((starter) => starter.id !== "free")
    .filter((starter) => starter.isAvailable(ctx))
    .slice(0, SLOTS - 1)
    .map((starter) => starter.build(ctx));

  const free = STARTERS.find((s) => s.id === "free")!.build(ctx);

  return [...dynamic, free];
}
```

Nota sobre el test "pads with static shortcuts": con esta implementación, un usuario nuevo
recibe `learn` + `free` = 2 elementos, no 4. **Ese test fallará.** Es intencionado que lo
descubras aquí: decide entre las dos opciones y ajusta test o código en consecuencia.

La opción recomendada es **rellenar con atajos estáticos** para que la pantalla no quede
medio vacía. Si eliges esa, añade al final de `selectStarters`:

```ts
  const chosen = [...dynamic, free];
  if (chosen.length >= SLOTS) return chosen.slice(0, SLOTS);

  // Not enough signal yet: pad with static shortcuts so the panel still reads
  // as a full set of options rather than a half-empty screen.
  const padding = STATIC_PADDING.slice(0, SLOTS - chosen.length);
  return [...dynamic, ...padding, free];
```

con, arriba del archivo:

```ts
import { AI_COACH_SHORTCUT_PROMPTS } from "@/lib/ai-prompts";

const STATIC_PADDING: ResolvedStarter[] = [
  {
    id: "learn",
    title: "Entrevista de trabajo",
    subtitle: "Simulacro guiado",
    prompt: AI_COACH_SHORTCUT_PROMPTS.jobInterview,
    angle: "static:jobInterview",
  },
  {
    id: "learn",
    title: "Pronunciación",
    subtitle: "Sonidos difíciles en español",
    prompt: AI_COACH_SHORTCUT_PROMPTS.pronunciation,
    angle: "static:pronunciation",
  },
];
```

Si eliges esta opción, ajusta también el test "never repeats a starter id within one
selection" — el padding reutiliza el id `learn`. Cámbialo para que compruebe títulos
únicos en lugar de ids únicos, y añade un test que confirme que un usuario nuevo recibe 4
elementos.

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-practice/starters/__tests__/select.test.ts && pnpm type-check
```

Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/starters/select.ts lib/ai-practice/starters/__tests__/select.test.ts
git commit -m "feat(ai-coach): add the pure starter selector"
```

---

## Task 5: Historial de starters en Dexie

**Files:**
- Create: `lib/ai-practice/starters/history.ts`
- Test: `lib/ai-practice/starters/__tests__/history.test.ts`

Sigue el patrón de `cacheUserInterests` en `lib/db/index.ts:1208-1227`: clave/valor sobre
`db.practicePrefs`. **No subas la versión de Dexie** — no hace falta store nuevo.

- [ ] **Step 1: Escribir el test que falla**

Crea `lib/ai-practice/starters/__tests__/history.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const put = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { practicePrefs: { get: (...a: unknown[]) => get(...a), put: (...a: unknown[]) => put(...a) } },
}));

const { readStarterHistory, recordStarterUse, MAX_STARTER_HISTORY } = await import("../history");

beforeEach(() => {
  get.mockReset();
  put.mockReset();
});

describe("readStarterHistory", () => {
  it("returns empty history when nothing was stored yet", async () => {
    get.mockResolvedValue(undefined);
    expect(await readStarterHistory("u1")).toEqual({ ids: [], angles: [] });
  });

  it("returns empty history when the stored value is corrupt", async () => {
    get.mockResolvedValue({ value: "not json" });
    expect(await readStarterHistory("u1")).toEqual({ ids: [], angles: [] });
  });

  it("reads back what was stored", async () => {
    get.mockResolvedValue({ value: JSON.stringify({ ids: ["learn"], angles: ["an idiom"] }) });
    expect(await readStarterHistory("u1")).toEqual({ ids: ["learn"], angles: ["an idiom"] });
  });
});

describe("recordStarterUse", () => {
  it("prepends the newest use", async () => {
    get.mockResolvedValue({ value: JSON.stringify({ ids: ["free"], angles: ["free"] }) });
    await recordStarterUse("u1", "learn", "an idiom");
    const stored = JSON.parse(put.mock.calls[0][0].value);
    expect(stored.ids[0]).toBe("learn");
    expect(stored.angles[0]).toBe("an idiom");
  });

  it("caps the history so it cannot grow forever", async () => {
    const ids = Array.from({ length: MAX_STARTER_HISTORY }, () => "learn");
    get.mockResolvedValue({ value: JSON.stringify({ ids, angles: ids }) });
    await recordStarterUse("u1", "review", "an angle");
    const stored = JSON.parse(put.mock.calls[0][0].value);
    expect(stored.ids).toHaveLength(MAX_STARTER_HISTORY);
    expect(stored.angles).toHaveLength(MAX_STARTER_HISTORY);
  });

  it("scopes the key to the user", async () => {
    get.mockResolvedValue(undefined);
    await recordStarterUse("u42", "free", "free");
    expect(put.mock.calls[0][0].key).toContain("u42");
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/starters/__tests__/history.test.ts
```

Esperado: FAIL con "Failed to resolve import ../history".

- [ ] **Step 3: Implementar**

Crea `lib/ai-practice/starters/history.ts`:

```ts
import { db } from "@/lib/db";
import type { StarterId } from "./types";

/** How many past uses feed the anti-repetition filter. */
export const MAX_STARTER_HISTORY = 10;

const KEY_PREFIX = "coachStarters:";

export interface StarterHistory {
  ids: StarterId[];
  angles: string[];
}

const EMPTY: StarterHistory = { ids: [], angles: [] };

export async function readStarterHistory(userId: string): Promise<StarterHistory> {
  const row = await db.practicePrefs.get(`${KEY_PREFIX}${userId}`);
  if (!row) return EMPTY;
  try {
    const value: unknown = JSON.parse(row.value);
    if (!value || typeof value !== "object") return EMPTY;
    const o = value as { ids?: unknown; angles?: unknown };
    return {
      ids: Array.isArray(o.ids) ? (o.ids.filter((i) => typeof i === "string") as StarterId[]) : [],
      angles: Array.isArray(o.angles) ? o.angles.filter((a): a is string => typeof a === "string") : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function recordStarterUse(
  userId: string,
  id: StarterId,
  angle: string,
): Promise<void> {
  const current = await readStarterHistory(userId);
  const next: StarterHistory = {
    ids: [id, ...current.ids].slice(0, MAX_STARTER_HISTORY),
    angles: [angle, ...current.angles].slice(0, MAX_STARTER_HISTORY),
  };
  await db.practicePrefs.put({
    key: `${KEY_PREFIX}${userId}`,
    value: JSON.stringify(next),
    updatedAt: new Date().toISOString(),
  });
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-practice/starters/__tests__/history.test.ts
```

Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/starters/history.ts lib/ai-practice/starters/__tests__/history.test.ts
git commit -m "feat(ai-coach): persist starter history for anti-repetition"
```

---

## Task 6: El hook de orquestación

**Files:**
- Create: `hooks/useCoachStarters.ts`

- [ ] **Step 1: Implementar**

Crea `hooks/useCoachStarters.ts`:

```ts
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { getCachedUserInterests } from "@/lib/db";
import { normalizeInterests } from "@/lib/users/interests";
import { selectStarters } from "@/lib/ai-practice/starters/select";
import { readStarterHistory, recordStarterUse } from "@/lib/ai-practice/starters/history";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";

/**
 * Resolves the starters shown on the chat home.
 *
 * The seed is fixed for the lifetime of one mount so the buttons do not
 * reshuffle under the user's finger; a fresh mount (reopening the panel) picks
 * a new one.
 */
export function useCoachStarters() {
  const { user } = useAuth();
  const [starters, setStarters] = useState<ResolvedStarter[] | null>(null);
  const seed = useMemo(() => Math.floor(Math.random() * 1_000_000), []);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id;
    if (!userId) {
      setStarters(selectStarters({
        state: null, interests: [], seed, recentIds: [], recentAngles: [], now: Date.now(),
      }));
      return;
    }

    void (async () => {
      const [state, cachedInterests, history] = await Promise.all([
        getUserLearningState(userId).catch(() => null),
        getCachedUserInterests(userId).catch(() => null),
        readStarterHistory(userId).catch(() => ({ ids: [], angles: [] })),
      ]);
      if (cancelled) return;
      setStarters(selectStarters({
        state,
        interests: normalizeInterests(cachedInterests ?? []),
        seed,
        recentIds: history.ids,
        recentAngles: history.angles,
        now: Date.now(),
      }));
    })();

    return () => { cancelled = true; };
  }, [user?.id, seed]);

  const noteUse = useCallback(
    (id: StarterId, angle: string) => {
      if (!user?.id) return;
      void recordStarterUse(user.id, id, angle).catch(() => undefined);
    },
    [user?.id],
  );

  return { starters, loading: starters === null, noteUse };
}
```

Comprueba la ruta real de `useAuth` antes de commitear — mira cómo lo importa
`hooks/useTracking.ts`.

- [ ] **Step 2: Verificar**

```bash
pnpm type-check && pnpm lint hooks/useCoachStarters.ts
```

Esperado: limpio.

- [ ] **Step 3: Commit**

```bash
git add hooks/useCoachStarters.ts
git commit -m "feat(ai-coach): add useCoachStarters orchestration hook"
```

---

## Task 7: Partir `ChatEmptyState`

`ChatEmptyState.tsx` tiene hoy 187 líneas. Con starters dinámicos superaría 250, así que se
parte **antes** de crecer.

**Files:**
- Create: `components/ai-coach/starters/CoachGreeting.tsx`
- Create: `components/ai-coach/starters/CoachStarterList.tsx`
- Create: `components/ai-coach/starters/CoachShortcutRail.tsx`
- Modify: `components/ai-coach/ChatEmptyState.tsx`
- Test: `components/ai-coach/starters/__tests__/CoachStarterList.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Crea `components/ai-coach/starters/__tests__/CoachStarterList.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoachStarterList from "../CoachStarterList";
import type { ResolvedStarter } from "@/lib/ai-practice/starters/types";

const STARTERS: ResolvedStarter[] = [
  { id: "review", title: "Repasa lo que fallaste", subtitle: "past-simple · 3 errores", prompt: "p1", angle: "a1" },
  { id: "free", title: "Habla de lo que quieras", subtitle: "Tú empiezas", prompt: "p2", angle: "free" },
];

describe("CoachStarterList", () => {
  it("renders a row per starter with its title and subtitle", () => {
    render(<CoachStarterList starters={STARTERS} loading={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Repasa lo que fallaste")).toBeInTheDocument();
    expect(screen.getByText("past-simple · 3 errores")).toBeInTheDocument();
  });

  it("reports the whole starter when a row is tapped", async () => {
    const onSelect = vi.fn();
    render(<CoachStarterList starters={STARTERS} loading={false} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /Repasa lo que fallaste/ }));
    expect(onSelect).toHaveBeenCalledWith(STARTERS[0]);
  });

  it("shows skeleton rows while loading, with no subtitles", () => {
    render(<CoachStarterList starters={null} loading onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.queryByText("past-simple · 3 errores")).not.toBeInTheDocument();
  });

  it("does not fire onSelect while loading", async () => {
    const onSelect = vi.fn();
    render(<CoachStarterList starters={null} loading onSelect={onSelect} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test components/ai-coach/starters/__tests__/CoachStarterList.test.tsx
```

Esperado: FAIL — no existe el componente.

- [ ] **Step 3: Extraer `CoachGreeting`**

Crea `components/ai-coach/starters/CoachGreeting.tsx` con el `<header>` que hoy está en
`ChatEmptyState.tsx` (el bloque del orbe y los dos textos), **copiado tal cual**:

```tsx
"use client";

import LiquidOrb from "../LiquidOrb";

export default function CoachGreeting() {
  return (
    <header className="mb-5 flex flex-col items-center gap-3 text-center @[22rem]:mb-6">
      <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-primary-soft p-1.5 shadow-sm border border-primary/20">
        <LiquidOrb size={76} intensity="idle" />
      </div>
      <div className="layout-stack-tight max-w-prose">
        <h2 className="m-0 flex items-center justify-center gap-2 text-balance text-h3 text-fg font-semibold tracking-tight">
          ¡Hola! ¿De qué te gustaría hablar hoy?
        </h2>
        <p className="m-0 text-pretty text-caption leading-relaxed text-fg-muted">
          Elige una opción para romper el hielo o escribe tu mensaje abajo.
        </p>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Crear `CoachStarterList`**

Crea `components/ai-coach/starters/CoachStarterList.tsx`. Reutiliza **exactamente** las
clases de la fila que hoy tiene `ChatEmptyState` (`layout-card-pad-compact`, el cuadro de
color del icono, el `ArrowUpRight`), y añade el subtítulo:

```tsx
"use client";

import {
  ArrowUpRight, MessageCircle, RotateCcw, Sparkles, Globe,
} from "@/components/icons";
import type { ResolvedStarter, StarterId } from "@/lib/ai-practice/starters/types";
import { cn } from "@/lib/cn";

const ICONS: Record<StarterId, { Icon: typeof MessageCircle; colorVar: string }> = {
  review: { Icon: RotateCcw, colorVar: "var(--warning)" },
  learn: { Icon: Sparkles, colorVar: "var(--primary)" },
  world: { Icon: Globe, colorVar: "var(--success)" },
  free: { Icon: MessageCircle, colorVar: "var(--fg-subtle)" },
};

const SKELETON_IDS: StarterId[] = ["review", "learn", "world", "free"];

interface CoachStarterListProps {
  starters: ResolvedStarter[] | null;
  loading: boolean;
  onSelect: (starter: ResolvedStarter) => void;
}

export default function CoachStarterList({ starters, loading, onSelect }: CoachStarterListProps) {
  const rows = loading || !starters
    ? SKELETON_IDS.map((id) => ({ id, title: "", subtitle: "", prompt: "", angle: "" }))
    : starters;

  return (
    <section aria-label="Modos de práctica" className="layout-stack-tight w-full">
      {rows.map((starter, index) => {
        const { Icon, colorVar } = ICONS[starter.id];
        return (
          <button
            key={`${starter.id}-${index}`}
            type="button"
            disabled={loading}
            onClick={() => !loading && onSelect(starter as ResolvedStarter)}
            className={cn(
              "group layout-card-pad-compact flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md",
              "border border-border-subtle bg-surface-raised text-left",
              "transition-[border-color,background-color,transform] duration-150 ease-out",
              "hover:border-border-default hover:bg-surface-base",
              "focus-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
              loading && "animate-pulse cursor-default",
            )}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor: `color-mix(in oklch, ${colorVar} 14%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${colorVar} 18%, transparent)`,
                color: colorVar,
              }}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
            </span>

            <span className="layout-stack-tight min-w-0 flex-1">
              <span className="block text-body-sm font-semibold leading-snug text-fg">
                {starter.title || " "}
              </span>
              {starter.subtitle && (
                <span className="block text-pretty text-caption leading-snug text-fg-subtle">
                  {starter.subtitle}
                </span>
              )}
            </span>

            <ArrowUpRight
              size={16}
              strokeWidth={2}
              className="shrink-0 text-fg-subtle transition-colors duration-150 group-hover:text-fg-muted motion-reduce:transition-none"
              aria-hidden
            />
          </button>
        );
      })}
    </section>
  );
}
```

El `style={{}}` del icono está permitido: los valores se calculan en runtime a partir de
`colorVar` (ya era así en el código original). Comprueba que `RotateCcw` y `Globe` están en
`components/icons/index.ts`; si no, añádelos.

- [ ] **Step 5: Extraer `CoachShortcutRail`**

Crea `components/ai-coach/starters/CoachShortcutRail.tsx` con la `<section>` de "Atajos
populares" que hoy está en `ChatEmptyState.tsx`, copiada tal cual, con
`SUGGESTION_CHIPS` movido aquí y apuntando a `AI_COACH_SHORTCUT_PROMPTS` (la constante que
creó la Task 2). Recibe `onSendMessage: (prompt: string) => void`.

- [ ] **Step 6: Reducir `ChatEmptyState` a composición**

Sustituye `components/ai-coach/ChatEmptyState.tsx` por:

```tsx
"use client";

import type { ResolvedStarter } from "@/lib/ai-practice/starters/types";
import CoachGreeting from "./starters/CoachGreeting";
import CoachStarterList from "./starters/CoachStarterList";
import CoachShortcutRail from "./starters/CoachShortcutRail";

// Planned structure:
// <ChatEmptyState>
//   <CoachGreeting />
//   <CoachStarterList />
//   <CoachShortcutRail />
// </ChatEmptyState>

interface ChatEmptyStateProps {
  starters: ResolvedStarter[] | null;
  loading: boolean;
  onSelectStarter: (starter: ResolvedStarter) => void;
  onSendMessage: (text: string) => void;
}

export default function ChatEmptyState({
  starters,
  loading,
  onSelectStarter,
  onSendMessage,
}: ChatEmptyStateProps) {
  return (
    <div className="@container relative flex min-h-full flex-1 flex-col justify-center chat-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-3 py-6 @[22rem]:px-4 @[22rem]:py-8">
        <CoachGreeting />
        <CoachStarterList starters={starters} loading={loading} onSelect={onSelectStarter} />
        <CoachShortcutRail onSendMessage={onSendMessage} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verificar tamaños y tests**

```bash
pnpm test components/ai-coach && wc -l components/ai-coach/ChatEmptyState.tsx components/ai-coach/starters/*.tsx
```

Esperado: PASS, y ningún archivo por encima de 250 líneas.

- [ ] **Step 8: Commit**

```bash
git add components/ai-coach/
git commit -m "refactor(ai-coach): split ChatEmptyState into greeting, starters and shortcuts"
```

---

## Task 8: Cablear el panel y titular por `starterId`

Esta task es la que **rompe el acoplamiento peligroso**: `conversation-title.ts` deja de
adivinar el título a partir del texto del prompt.

**Files:**
- Modify: `hooks/useStreamingChat.ts`
- Modify: `lib/ai-practice/conversation-title.ts`
- Modify: `components/ai-coach/AICoachHome.tsx`
- Modify: `components/ai-coach/AICoachPanel.tsx`
- Test: `lib/ai-practice/__tests__/conversation-title.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade a `lib/ai-practice/__tests__/conversation-title.test.ts`:

```ts
import { titleForStarter, getInitialTitleForModeAndMessage } from "../conversation-title";

describe("titleForStarter", () => {
  it("names each of the four starters", () => {
    expect(titleForStarter("review")).toBe("Repaso de errores");
    expect(titleForStarter("learn")).toBe("Algo nuevo");
    expect(titleForStarter("world")).toBe("Tus intereses");
    expect(titleForStarter("free")).toBe("Conversación libre");
  });

  it("returns null for anything that is not a starter id", () => {
    expect(titleForStarter("banana")).toBeNull();
    expect(titleForStarter(undefined)).toBeNull();
  });
});

describe("getInitialTitleForModeAndMessage with a starter id", () => {
  it("prefers the starter id over the message text", () => {
    const title = getInitialTitleForModeAndMessage("chat", "You are a warm coach...", "review");
    expect(title).toBe("Repaso de errores");
  });

  it("still titles a plain typed message by its text", () => {
    const title = getInitialTitleForModeAndMessage("chat", "I want to talk about films");
    expect(title).toBe("I want to talk about films");
  });

  it("does not title a conversation with raw prompt text when the starter id is missing", () => {
    const title = getInitialTitleForModeAndMessage("chat", "You are a warm, encouraging English conversation coach.");
    expect(title).not.toContain("You are a warm");
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/conversation-title.test.ts
```

Esperado: FAIL. Además verás fallar tests existentes que dependen de
`AI_COACH_EMPTY_STATE_PROMPTS`, que ya no existe — eso confirma el acoplamiento que
estamos rompiendo.

- [ ] **Step 3: Migrar `conversation-title.ts`**

En `lib/ai-practice/conversation-title.ts`:

- **Borra** `PROMPT_TO_TITLE_MAP` (líneas 5-14), el import de
  `AI_COACH_EMPTY_STATE_PROMPTS`, y la función `titleFromStarterPrompt` entera (líneas
  34-50) con su cadena de `if (trimmed.includes(...))`.
- Añade:

```ts
import type { StarterId } from "@/lib/ai-practice/starters/types";

const STARTER_TITLES: Record<StarterId, string> = {
  review: "Repaso de errores",
  learn: "Algo nuevo",
  world: "Tus intereses",
  free: "Conversación libre",
};

/**
 * Titles a conversation by the starter that opened it.
 *
 * This replaced matching against the prompt text: starter prompts are now
 * built per user and per session, so no fixed string could identify them.
 */
export function titleForStarter(id: string | undefined): string | null {
  if (!id) return null;
  return STARTER_TITLES[id as StarterId] ?? null;
}
```

- Cambia la firma de `getInitialTitleForModeAndMessage` para aceptar el id y darle
  prioridad:

```ts
export function getInitialTitleForModeAndMessage(
  mode: AIConversationMode,
  text?: string,
  starterId?: string,
): string {
  if (mode?.startsWith("mission:")) {
    const missionId = mode.slice("mission:".length);
    const mission = getMission(missionId);
    if (mission?.communicativeGoal) return mission.communicativeGoal;
    return "Misión";
  }

  const starterTitle = titleForStarter(starterId);
  if (starterTitle) return starterTitle;

  if (text && !isSystemPromptText(text)) {
    return text.trim().slice(0, 60);
  }

  if (mode === "pronunciation") return "Práctica de pronunciación";
  if (mode === "lesson") return "Lección";
  return "Conversación libre";
}
```

`isSystemPromptText` se queda: sigue protegiendo de titular con texto de prompt cuando el
`starterId` no llegó (conversaciones antiguas). Quítale del cuerpo la comprobación
`if (PROMPT_TO_TITLE_MAP[trimmed]) return true;`, que ya no compila.

- [ ] **Step 4: Llevar el `starterId` hasta el título**

En `hooks/useStreamingChat.ts`, amplía las opciones de `sendMessage` (línea 75):

```ts
  const sendMessage = useCallback(async (
    text: string,
    options?: { hidden?: boolean; voice?: VoiceMetadata; starterId?: string },
  ) => {
```

y pásalo a la llamada de `getInitialTitleForModeAndMessage` que exista dentro del hook (o
en `switchMode`/`updateConversation`, según dónde se titule). Búscalo con:

```bash
grep -rn "getInitialTitleForModeAndMessage" --include=*.ts --include=*.tsx hooks lib components
```

- [ ] **Step 5: Cablear el panel**

En `components/ai-coach/AICoachHome.tsx`, añade las props y pásalas:

```tsx
interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string, options?: { hidden?: boolean; starterId?: string }) => void;
  onSelectMission: (missionId: string) => void;
  isStreaming: boolean;
  starters: ResolvedStarter[] | null;
  startersLoading: boolean;
  onStarterUsed: (id: StarterId, angle: string) => void;
  prefill?: string;
  onPrefillConsumed?: () => void;
}
```

Y en el `return` del tab de chat:

```tsx
        <ChatEmptyState
          starters={starters}
          loading={startersLoading}
          onSelectStarter={(starter) => {
            onStarterUsed(starter.id, starter.angle);
            onSendMessage(starter.prompt, { hidden: true, starterId: starter.id });
          }}
          onSendMessage={(text) => onSendMessage(text, { hidden: true })}
        />
```

> `AICoachHomeProps` llega a 8 props, el máximo que permite `CLAUDE.md`. No añadas más:
> si hiciera falta otra, agrupa `starters` + `startersLoading` + `onStarterUsed` en un solo
> objeto `starters`.

En `components/ai-coach/AICoachPanel.tsx`, llama al hook y pasa lo que devuelve a
`renderHome` (línea 136):

```tsx
  const { starters, loading: startersLoading, noteUse } = useCoachStarters();
```

- [ ] **Step 6: Verificar todo**

```bash
pnpm test && pnpm type-check && pnpm lint && pnpm audit:hard-rules
```

Esperado: todo verde. Si `conversation-title.test.ts` tiene tests viejos que comprobaban el
mapeo por texto, **bórralos**: comprobaban un comportamiento que acabamos de eliminar a
propósito.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(ai-coach): wire adaptive starters and title conversations by starterId"
```

---

## Verificación final de la fase

- [ ] **Step 1: Comprobación manual**

```bash
pnpm dev
```

1. Abre el coach con una cuenta nueva → ves 4 filas, ninguna promete un repaso inexistente.
2. Cierra y reabre el panel varias veces → los subtítulos y los ángulos cambian.
3. Con intereses puestos en el perfil → aparece "Inglés de \<tu interés\>", y rota entre
   ellos al reabrir.
4. Falla varias veces un mismo tema en Práctica, vuelve al coach → aparece "Repasa lo que
   fallaste" con el tema y el número de errores reales.
5. Pulsa "Habla de lo que quieras" → el coach saluda en **una** línea y pregunta de qué
   quieres hablar, **sin proponer tema**.
6. Mira el historial de conversaciones → cada una tiene su título correcto ("Repaso de
   errores", "Algo nuevo"…), no texto de prompt en inglés.
7. Con DevTools en Offline, reabre el panel → los starters siguen apareciendo (Dexie).

- [ ] **Step 2: Commit de cierre si hubo ajustes**

```bash
git add -A && git commit -m "chore(ai-coach): phase 3 verification fixes"
```

---

## Qué queda fuera de esta fase

- El botón "Terminar" y el resumen de sesión (fase 4).
- Los planes con `dueAt`: el starter `review` se alimenta de `grammar.weakTopics`, no de
  planes programados.
- El rail de atajos sigue siendo estático a propósito: son escenarios concretos que no
  dependen del estado del alumno.
