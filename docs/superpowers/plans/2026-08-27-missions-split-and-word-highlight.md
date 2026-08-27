# Separación de pestañas + resaltado por palabra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la pestaña **Misiones** solo con misiones habladas (guion), mover las conversacionales a **Chat**, y resaltar la palabra que el coach pronuncia mientras habla.

**Architecture:** Dos partes independientes que comparten el mismo runner de guion.

**Parte A (pestañas)** se apoya en el discriminante `mode` que ya existe: `listMissions()` sigue siendo la única fuente, y dos selectores nuevos (`listScriptedMissions` / `listConversationalMissions`) la filtran. `AICoachHome` ya recibe `activeTab`, así que la separación es elegir qué lista pasar a `MissionLibrary` — no hay routing nuevo. El punto delicado es que `activeMissionId` hoy fuerza `setActiveTab("missions")` para *cualquier* misión; pasa a decidir la pestaña por el `mode` de la misión.

**Parte B (resaltado)** parte de un hecho verificado del código: `lib/phoneme-practice/tts.ts` no expone `onboundary`, y `resolveModelAudio` puede devolver un OGG pregrabado sin timings por palabra. No hay forma fiable de saber en qué palabra va el audio. Por eso el resaltado se implementa como **estimación por duración** encapsulada en un hook, con una regla explícita: si no hay señal de progreso fiable, no se resalta nada (mismo criterio que ya usa `scoreSyllables`, que devuelve `null` en vez de inventar sílabas).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Vitest + Testing Library.

---

## Contexto verificado antes de escribir este plan

Hechos comprobados en el código actual. No los des por supuestos: si al ejecutar no coinciden, para y avisa.

1. `lib/ai-practice/missions/registry.ts:311` — `const ALL_MISSIONS = [...MISSIONS, ...SCRIPTED_MISSIONS]`. Las conversacionales van **primero**.
2. `lib/ai-practice/missions/launch.ts:68` — `missionForTarget()` hace `listMissions().find(...)`. Devuelve **la primera coincidencia**.
3. `lib/ai-practice/missions/scripted/catalog.ts:36` — `scripted.beach.plan` declara `contrastTargetId('/iː/', '/ɪ/')`, **el mismo id** que usan `roleplay.cafe` y otra conversacional (`registry.ts:73` y `:165`).

**Consecuencia crítica:** hay un bug *latente*. `missionForTarget` está a punto de devolver una misión con guion a consumidores que esperan el flujo conversacional (`lib/practice/daily-plan/composer.ts:386`, `components/pronunciation/PronunciationMissionLaunchButton.tsx:21`, `components/courses/pronunciation-path/PronunciationPathActiveUnit.tsx:40`). Hoy no ocurre solo porque el orden del array lo esconde. **La Tarea 1 lo arregla antes de tocar nada más**, porque cualquier reordenación de listas lo activaría.

---

## Estructura de archivos

**Parte A**
- Modificar `lib/ai-practice/missions/registry.ts` — añadir `listScriptedMissions()` y `listConversationalMissions()`.
- Modificar `lib/ai-practice/missions/launch.ts` — `missionForTarget` solo devuelve conversacionales.
- Modificar `components/ai-coach/AICoachHome.tsx` — cada pestaña recibe su lista.
- Modificar `components/ai-coach/AICoachPanel.tsx` — la pestaña destino depende del `mode`.
- Modificar `components/ai-coach/ChatTabs.tsx` — textos descriptivos.
- Modificar `components/ai-coach/missions/MissionLibrary.tsx` — quitar el sort por modo (deja de tener sentido con listas separadas).
- Modificar `components/ai-coach/missions/MissionCard.tsx` — quitar la insignia "Habla".

**Parte B**
- Crear `lib/speech/word-timings.ts` — reparto de duración por palabra (puro, testeable sin DOM).
- Crear `hooks/useSpokenWordHighlight.ts` — orquesta el índice activo durante la reproducción.
- Crear `components/ai-coach/missions/scripted/SpokenLine.tsx` — pinta la línea con una palabra resaltada.
- Modificar `components/ai-coach/missions/scripted/CoachLine.tsx` — conectar hook + componente.

Se separa `word-timings.ts` (lógica pura) del hook (efectos y temporizadores) a propósito: la lógica se testea con números exactos y sin fake timers, que es donde estos tests se vuelven frágiles.

---

## PARTE A — Separación de pestañas

### Task 1: `missionForTarget` solo devuelve misiones conversacionales

Arregla el bug latente descrito arriba. Va primero porque el resto de la Parte A reordena listas y lo activaría.

**Files:**
- Modify: `lib/ai-practice/missions/launch.ts:68-73`
- Test: `lib/ai-practice/missions/__tests__/launch.test.ts`

- [ ] **Step 1: Escribe el test que falla**

Añade este test dentro del mismo `describe` que contiene el test existente de `missionForTarget` (cerca de la línea 43):

```ts
  it('never hands a scripted mission to target-based launchers', () => {
    // `scripted.beach.plan` declara el mismo target de contraste que las
    // conversacionales. Los consumidores (daily plan, pronunciation path)
    // esperan el flujo de chat, asi que aqui solo pueden salir conversacionales.
    const SHARED_TARGET = 'contrast:/iː/~/ɪ/'
    const found = missionForTarget(SHARED_TARGET)
    expect(found).not.toBeNull()
    expect(found?.mode).toBe('conversational')
  })
```

Si el id literal `'contrast:/iː/~/ɪ/'` no coincide con lo que produce `contrastTargetId('/iː/', '/ɪ/')`, importa el helper y úsalo en su lugar:

```ts
import { contrastTargetId } from '@/lib/pronunciation/targets/registry'
// ...
const SHARED_TARGET = contrastTargetId('/iː/', '/ɪ/')
```

- [ ] **Step 2: Ejecuta el test y verifica que pasa por la razón equivocada**

Ejecuta: `pnpm test lib/ai-practice/missions/__tests__/launch.test.ts`

Esperado: **PASA**. Esto es correcto y esperado — el bug está latente, oculto por el orden del array. Confirma que la protección es real invirtiendo temporalmente el orden en `registry.ts:311`:

```ts
const ALL_MISSIONS: readonly OralMission[] = [...SCRIPTED_MISSIONS, ...MISSIONS]
```

Vuelve a ejecutar el test. Esperado ahora: **FALLA** con `expected 'scripted' to be 'conversational'`.

**Deshaz ese cambio de orden en `registry.ts` antes de continuar** — era solo para demostrar el fallo.

- [ ] **Step 3: Implementa el filtro**

En `lib/ai-practice/missions/launch.ts`, reemplaza la función completa:

```ts
/** Deterministic authored mission handoff for a canonical target. */
export function missionForTarget(targetId: string) {
  if (!getTarget(targetId).ok) return null
  return listMissions().find((mission) =>
    mission.targets.some((target) => target.targetId === targetId),
  ) ?? null
}
```

por:

```ts
/**
 * Deterministic authored mission handoff for a canonical target.
 *
 * Solo conversacionales: el daily plan y el pronunciation path lanzan esto
 * esperando el bucle de chat con correccion. Una mision con guion comparte
 * targets pero se practica hablando, y caeria en un runner que esos
 * consumidores no saben manejar.
 */
export function missionForTarget(targetId: string): ConversationalMission | null {
  if (!getTarget(targetId).ok) return null
  return listMissions().find((mission): mission is ConversationalMission =>
    isConversationalMission(mission) &&
    mission.targets.some((target) => target.targetId === targetId),
  ) ?? null
}
```

Añade el import necesario en la cabecera del archivo (junto a los imports existentes de `./registry`):

```ts
import { isConversationalMission, type ConversationalMission } from './types'
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test lib/ai-practice/missions/__tests__/launch.test.ts`
Esperado: PASS, todos.

Vuelve a invertir el orden en `registry.ts:311` una vez más y reejecuta: ahora debe **seguir en verde** (esa es la prueba de que el arreglo es real y no depende del orden). **Deshaz el cambio de orden.**

- [ ] **Step 5: Comprueba tipos**

Ejecuta: `pnpm type-check`
Esperado: sin errores. Si algún consumidor asumía `OralMission`, el tipo de retorno más estrecho es compatible — pero si aparece un error, arréglalo ahí y anótalo.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/missions/launch.ts lib/ai-practice/missions/__tests__/launch.test.ts
git commit -m "fix: keep scripted missions out of target-based launches"
```

---

### Task 2: Selectores por modo en el registry

**Files:**
- Modify: `lib/ai-practice/missions/registry.ts` (al final, junto a `listMissions`)
- Test: `lib/ai-practice/missions/__tests__/registry.test.ts`

- [ ] **Step 1: Escribe los tests que fallan**

Añade al final del archivo de test, como un `describe` nuevo:

```ts
describe('selectores por modo', () => {
  it('listScriptedMissions solo devuelve misiones con guion, y al menos una', () => {
    const scripted = listScriptedMissions()
    expect(scripted.length).toBeGreaterThan(0)
    expect(scripted.every((mission) => mission.mode === 'scripted')).toBe(true)
  })

  it('listConversationalMissions solo devuelve conversacionales, y al menos una', () => {
    const conversational = listConversationalMissions()
    expect(conversational.length).toBeGreaterThan(0)
    expect(conversational.every((mission) => mission.mode === 'conversational')).toBe(true)
  })

  it('las dos listas juntas cubren el catalogo entero sin solaparse', () => {
    // Si alguien anade un tercer modo, esta asercion falla y obliga a
    // decidir en que pestana vive — que es exactamente lo que queremos.
    const total = listScriptedMissions().length + listConversationalMissions().length
    expect(total).toBe(listMissions().length)
  })
})
```

Actualiza el import al principio del archivo de test para incluir los nombres nuevos:

```ts
import {
  listMissions,
  listScriptedMissions,
  listConversationalMissions,
  // ...lo que ya hubiera aqui
} from '../registry'
```

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test lib/ai-practice/missions/__tests__/registry.test.ts`
Esperado: FALLA con `listScriptedMissions is not a function`.

- [ ] **Step 3: Implementa los selectores**

En `lib/ai-practice/missions/registry.ts`, justo debajo de `listMissions()` (línea ~319):

```ts
/**
 * Las dos clases de mision se practican de forma distinta y viven en
 * pestanas distintas: con guion se habla, conversacional se escribe.
 * El filtrado vive aqui y no en la UI para que exista una sola fuente.
 */
export function listScriptedMissions(): readonly ScriptedMission[] {
  return ALL_MISSIONS.filter(isScriptedMission)
}

export function listConversationalMissions(): readonly ConversationalMission[] {
  return ALL_MISSIONS.filter(isConversationalMission)
}
```

Asegúrate de que los tipos `ScriptedMission` y `ConversationalMission` están importados desde `./types` en la cabecera del archivo (`isScriptedMission` e `isConversationalMission` ya lo están).

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test lib/ai-practice/missions/__tests__/registry.test.ts`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/registry.ts lib/ai-practice/missions/__tests__/registry.test.ts
git commit -m "feat: add per-mode mission selectors"
```

---

### Task 3: Cada pestaña muestra su lista

**Files:**
- Modify: `components/ai-coach/AICoachHome.tsx`
- Test: `components/ai-coach/__tests__/AICoachHome.test.tsx` (créalo si no existe)

- [ ] **Step 1: Escribe el test que falla**

Si el archivo no existe, créalo completo:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AICoachHome from '../AICoachHome'

const noop = () => undefined

function renderHome(activeTab: 'chat' | 'missions') {
  return render(
    <AICoachHome
      activeTab={activeTab}
      onSendMessage={noop}
      onSelectMission={noop}
      isStreaming={false}
    />,
  )
}

describe('AICoachHome', () => {
  it('la pestana de misiones solo ofrece misiones habladas', () => {
    renderHome('missions')
    // `scripted.cafe.order` es de guion; `roleplay.interview` es conversacional.
    expect(screen.getByText(/pedir en una cafeter/i)).toBeInTheDocument()
    expect(screen.queryByText(/entrevista de trabajo/i)).not.toBeInTheDocument()
  })
})
```

**Antes de ejecutar:** abre `lib/ai-practice/missions/scripted/catalog.ts` y `lib/ai-practice/missions/registry.ts` y sustituye las dos expresiones regulares por texto real de `communicativeGoal` o `context` — uno de una misión con guion, otro de una conversacional. No inventes los textos.

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test components/ai-coach/__tests__/AICoachHome.test.tsx`
Esperado: FALLA en el `queryByText(...).not.toBeInTheDocument()`, porque hoy la pestaña muestra `listMissions()` entera.

- [ ] **Step 3: Implementa**

En `components/ai-coach/AICoachHome.tsx`, cambia el import:

```tsx
import { listMissions } from "@/lib/ai-practice/missions/registry";
```

por:

```tsx
import { listScriptedMissions } from "@/lib/ai-practice/missions/registry";
```

y dentro del bloque `if (activeTab === "missions")`, cambia:

```tsx
        <MissionLibrary missions={listMissions()} onSelect={onSelectMission} />
```

por:

```tsx
        {/* Solo habladas: las conversacionales viven en Chat. */}
        <MissionLibrary missions={listScriptedMissions()} onSelect={onSelectMission} />
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test components/ai-coach/__tests__/AICoachHome.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/AICoachHome.tsx components/ai-coach/__tests__/AICoachHome.test.tsx
git commit -m "feat: limit the missions tab to spoken missions"
```

---

### Task 4: Las conversacionales aparecen en Chat

`ChatEmptyState` es la pantalla inicial de Chat. Las conversacionales se ofrecen ahí, debajo de las sugerencias existentes.

**Files:**
- Modify: `components/ai-coach/AICoachHome.tsx`
- Test: `components/ai-coach/__tests__/AICoachHome.test.tsx`

- [ ] **Step 1: Escribe el test que falla**

Añade al `describe` existente:

```tsx
  it('la pestana de chat ofrece las misiones conversacionales', () => {
    renderHome('chat')
    expect(screen.getByText(/entrevista de trabajo/i)).toBeInTheDocument()
  })

  it('al elegir una conversacional desde chat se avisa con su id', async () => {
    const onSelectMission = vi.fn()
    render(
      <AICoachHome
        activeTab="chat"
        onSendMessage={noop}
        onSelectMission={onSelectMission}
        isStreaming={false}
      />,
    )
    const buttons = screen.getAllByRole('button', { name: /empezar/i })
    buttons[0]?.click()
    expect(onSelectMission).toHaveBeenCalledWith(expect.stringMatching(/^roleplay\./))
  })
```

Usa el mismo texto real que fijaste en la Tarea 3.

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test components/ai-coach/__tests__/AICoachHome.test.tsx`
Esperado: FALLA — Chat hoy solo renderiza `ChatEmptyState`.

- [ ] **Step 3: Implementa**

En `components/ai-coach/AICoachHome.tsx`, añade el import:

```tsx
import { listConversationalMissions, listScriptedMissions } from "@/lib/ai-practice/missions/registry";
```

y reemplaza el `return` final (la rama de chat) por:

```tsx
  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
        <ChatEmptyState onSendMessage={(text) => onSendMessage(text, { hidden: true })} />

        {/* Las conversacionales se practican escribiendo: su sitio es Chat,
            no la pestana de audio. */}
        <div className="border-t border-border-subtle pt-3">
          <h2 className="m-0 px-3 pb-2 font-kicker text-fg-subtle">
            Misiones de conversación
          </h2>
          <MissionLibrary
            missions={listConversationalMissions()}
            onSelect={onSelectMission}
          />
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test components/ai-coach/__tests__/AICoachHome.test.tsx`
Esperado: PASS.

- [ ] **Step 5: Revisa el scroll a ojo**

Ejecuta `pnpm dev`, abre el coach, pestaña Chat. `MissionLibrary` tiene su propio `overflow-y-auto` y `h-full`, así que **hay riesgo real de scroll anidado**. Si ves dos barras o el filtro de categorías se queda pegado en mitad del panel, envuelve `MissionLibrary` en un contenedor de altura fija:

```tsx
          <div className="h-[26rem]">
```

Anota lo que hiciste en el mensaje del commit.

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/AICoachHome.tsx components/ai-coach/__tests__/AICoachHome.test.tsx
git commit -m "feat: offer conversational missions from the chat tab"
```

---

### Task 5: La pestaña destino depende del modo

Hoy `AICoachPanel.tsx` fuerza `setActiveTab("missions")` para cualquier `activeMissionId`. Con las listas separadas, empezar una conversacional desde Chat saltaría a Misiones — y la encontraría vacía de conversacionales.

**Files:**
- Modify: `components/ai-coach/AICoachPanel.tsx:70-72` (el `useEffect` de `activeMissionId`)
- Modify: `components/ai-coach/AICoachPanel.tsx:60-64` (el bloque `launch.mission`)

- [ ] **Step 1: Implementa el destino por modo**

En `components/ai-coach/AICoachPanel.tsx`, añade el import:

```tsx
import { getMission } from '@/lib/ai-practice/missions/registry'
import { isScriptedMission } from '@/lib/ai-practice/missions/types'
```

Añade este helper justo encima del componente `AICoachPanel`:

```tsx
/**
 * La pestana donde se practica una mision depende de como se practica:
 * con guion se habla (Misiones), conversacional se escribe (Chat).
 * Si el id no existe, Chat es el destino seguro: siempre sabe renderizar.
 */
function tabForMission(missionId: string): TabId {
  const mission = getMission(missionId);
  if (!mission) return "chat";
  return isScriptedMission(mission) ? "missions" : "chat";
}
```

Reemplaza el `useEffect`:

```tsx
  useEffect(() => {
    if (activeMissionId) setActiveTab("missions");
  }, [activeMissionId]);
```

por:

```tsx
  useEffect(() => {
    if (activeMissionId) setActiveTab(tabForMission(activeMissionId));
  }, [activeMissionId]);
```

Y dentro del bloque de `launch`, reemplaza:

```tsx
      if (launch.mission) {
        setMissionLaunch(launch.mission);
        setActiveTab('missions');
        void changeMode(`mission:${launch.mission.missionId}`);
      }
```

por:

```tsx
      if (launch.mission) {
        setMissionLaunch(launch.mission);
        setActiveTab(tabForMission(launch.mission.missionId));
        void changeMode(`mission:${launch.mission.missionId}`);
      }
```

- [ ] **Step 2: Renderiza el workspace conversacional dentro de Chat**

Problema: `MissionWorkspace` solo se monta dentro del div de la pestaña Misiones. Una conversacional activa en Chat no tendría dónde renderizarse.

En el div de la pestaña Chat, reemplaza la condición `!hasMessages ? ... : ...` por una que contemple la misión activa. Localiza la línea que empieza con `{!hasMessages` y cambia la estructura a:

```tsx
            {activeMissionId && tabForMission(activeMissionId) === "chat"
              ? <MissionWorkspace
                  missionId={activeMissionId}
                  launch={missionLaunch?.missionId === activeMissionId ? missionLaunch : null}
                  setMissionIntentHandler={setMissionIntentHandler}
                  messages={messages}
                  isStreaming={isStreaming}
                  isDisabled={quotaExhausted}
                  onSendMessage={sendMessage}
                  onSaveWord={openSaveWordModal}
                  onToolAnswer={answerToolCall}
                  onExitMission={() => { void changeMode("chat"); setActiveTab("chat"); }}
                />
              : !hasMessages
              ? <AICoachHome ... />   {/* deja el bloque existente tal cual */}
              : <> ... </>            {/* deja el bloque existente tal cual */}
            }
```

Mantén el contenido de las dos ramas existentes **sin tocar**: solo se antepone una rama nueva.

- [ ] **Step 3: Ajusta el destino de salida en la pestaña Misiones**

En el div de Misiones, el `onExitMission` actual hace `setActiveTab("missions")`, que ya es correcto para las guionadas. Déjalo.

- [ ] **Step 4: Comprueba tipos y lint**

Ejecuta: `pnpm type-check && pnpm lint`
Esperado: sin errores.

- [ ] **Step 5: Prueba manual de las cuatro rutas**

Ejecuta `pnpm dev` y verifica una por una:

1. Chat → elegir una conversacional → **se queda en Chat** y arranca el diálogo.
2. Misiones → elegir una con guion → **se queda en Misiones** y el coach habla solo.
3. Salir de una conversacional → vuelve a la home de Chat con la lista.
4. Salir de una con guion → vuelve a la biblioteca de Misiones.

Después comprueba un lanzamiento externo: ve a `/daily`, busca un paso de misión y lánzalo. Debe abrir el coach **en Chat** (los lanzamientos de `daily` son siempre conversacionales tras la Tarea 1).

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/AICoachPanel.tsx
git commit -m "feat: route each mission to the tab that matches its mode"
```

---

### Task 6: Limpiar la señalización que sobra

Con listas separadas, la insignia "Habla" y el sort por modo ya no distinguen nada — todas las tarjetas de cada lista son iguales.

**Files:**
- Modify: `components/ai-coach/missions/MissionCard.tsx`
- Modify: `components/ai-coach/missions/MissionLibrary.tsx`
- Modify: `components/ai-coach/ChatTabs.tsx`
- Test: `components/ai-coach/missions/__tests__/` (los que mencionen la insignia)

- [ ] **Step 1: Encuentra los tests que dependen de la insignia**

Ejecuta: `grep -rn "Habla" components/ai-coach/`

Cualquier test que afirme la presencia de "Habla" queda obsoleto: bórralo, y si comprobaba que dos clases de misión se distinguen, sustitúyelo por la aserción equivalente de la Tarea 3 (que la pestaña no muestra la otra clase).

- [ ] **Step 2: Quita la insignia de la tarjeta**

En `components/ai-coach/missions/MissionCard.tsx`, borra el bloque completo:

```tsx
        {isScriptedMission(mission) && (
          // Las dos clases de mision se practican distinto: una se habla
          // siguiendo un guion, la otra se escribe. Sin esta marca, las
          // tarjetas son indistinguibles y se empieza la que no se queria.
          <span className="rounded-full bg-primary-soft px-2 py-0.5 font-kicker text-primary">
            Habla
          </span>
        )}
```

y ajusta el import, que deja de necesitar el type guard:

```tsx
import type { OralMission } from '@/lib/ai-practice/missions/types'
```

- [ ] **Step 3: Quita el sort por modo**

En `components/ai-coach/missions/MissionLibrary.tsx`, borra:

```tsx
  // Las de guion primero: son las de audio, y al final de una lista larga
  // pasaban desapercibidas.
  const filteredMissions = [...visibleMissions].sort((a, b) =>
    Number(isScriptedMission(b)) - Number(isScriptedMission(a)))
```

y sustituye por:

```tsx
  const filteredMissions = visibleMissions
```

Ajusta el import quitando `isScriptedMission`:

```tsx
import { type MissionCategory, type OralMission } from '@/lib/ai-practice/missions/types'
```

- [ ] **Step 4: Actualiza los textos de las pestañas**

En `components/ai-coach/ChatTabs.tsx`, cambia las dos descripciones:

```tsx
  { id: "chat", label: "Chat", desc: "Pregunta o practica escribiendo", icon: MessageCircle },
  { id: "missions", label: "Misiones", desc: "Lee un guion en voz alta", icon: BriefcaseBusiness },
```

- [ ] **Step 5: Verifica todo**

Ejecuta: `pnpm type-check && pnpm lint && pnpm test components/ai-coach lib/ai-practice`
Esperado: sin errores, todo en verde.

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/
git commit -m "refactor: drop mode signposting made redundant by split tabs"
```

---

## PARTE B — Resaltado de la palabra hablada

### Task 7: Reparto de duración por palabra

Lógica pura, sin DOM ni temporizadores.

**Files:**
- Create: `lib/speech/word-timings.ts`
- Test: `lib/speech/__tests__/word-timings.test.ts`

- [ ] **Step 1: Escribe los tests que fallan**

Crea `lib/speech/__tests__/word-timings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { splitSpokenWords, estimateWordOffsets } from '../word-timings'

describe('splitSpokenWords', () => {
  it('conserva la puntuacion pegada a su palabra', () => {
    expect(splitSpokenWords('Hello, how are you?')).toEqual([
      'Hello,', 'how', 'are', 'you?',
    ])
  })

  it('devuelve lista vacia para texto en blanco', () => {
    expect(splitSpokenWords('   ')).toEqual([])
  })
})

describe('estimateWordOffsets', () => {
  it('reparte la duracion proporcionalmente a la longitud de cada palabra', () => {
    // "aa" y "bbbb": 2 y 4 caracteres sobre 6 totales, en 600ms.
    const offsets = estimateWordOffsets(['aa', 'bbbb'], 600)
    expect(offsets).toEqual([0, 200])
  })

  it('la primera palabra siempre empieza en 0', () => {
    const offsets = estimateWordOffsets(['one', 'two', 'three'], 900)
    expect(offsets[0]).toBe(0)
  })

  it('los offsets crecen de forma estrictamente creciente', () => {
    const offsets = estimateWordOffsets(['a', 'bb', 'ccc', 'dddd'], 1000)
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i]).toBeGreaterThan(offsets[i - 1] as number)
    }
  })

  it('devuelve vacio si la duracion no es utilizable', () => {
    // Sin duracion fiable no se estima nada: es preferible no resaltar
    // a resaltar la palabra equivocada.
    expect(estimateWordOffsets(['a', 'b'], 0)).toEqual([])
    expect(estimateWordOffsets(['a', 'b'], Number.NaN)).toEqual([])
  })

  it('devuelve vacio si no hay palabras', () => {
    expect(estimateWordOffsets([], 500)).toEqual([])
  })
})
```

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test lib/speech/__tests__/word-timings.test.ts`
Esperado: FALLA — `Cannot find module '../word-timings'`.

- [ ] **Step 3: Implementa**

Crea `lib/speech/word-timings.ts`:

```ts
/**
 * Reparto estimado de una locucion entre sus palabras.
 *
 * `speechSynthesis` expone un evento `boundary` con la posicion exacta, pero
 * no todos los motores lo emiten de forma fiable, y el audio pregrabado no
 * trae marcas de tiempo. Cuando no hay senal real se estima por longitud:
 * es aproximado, y por eso el consumidor solo lo usa como pista visual.
 *
 * Sin duracion utilizable no se estima nada — resaltar la palabra equivocada
 * es peor que no resaltar ninguna.
 */

/** Separa por espacios conservando la puntuacion junto a su palabra. */
export function splitSpokenWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0)
}

/** Milisegundo de inicio estimado de cada palabra, relativo al arranque. */
export function estimateWordOffsets(words: string[], durationMs: number): number[] {
  if (words.length === 0) return []
  if (!Number.isFinite(durationMs) || durationMs <= 0) return []

  const weights = words.map((word) => Math.max(1, word.length))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  const offsets: number[] = []
  let elapsed = 0
  for (const weight of weights) {
    offsets.push(Math.round(elapsed))
    elapsed += (weight / totalWeight) * durationMs
  }
  return offsets
}
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test lib/speech/__tests__/word-timings.test.ts`
Esperado: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/speech/word-timings.ts lib/speech/__tests__/word-timings.test.ts
git commit -m "feat: estimate per-word offsets for a spoken line"
```

---

### Task 8: `SpokenLine` — la línea con una palabra resaltada

**Files:**
- Create: `components/ai-coach/missions/scripted/SpokenLine.tsx`
- Test: `components/ai-coach/missions/scripted/__tests__/SpokenLine.test.tsx`

- [ ] **Step 1: Escribe los tests que fallan**

Crea `components/ai-coach/missions/scripted/__tests__/SpokenLine.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SpokenLine } from '../SpokenLine'

describe('SpokenLine', () => {
  it('marca solo la palabra en curso', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={2} />)
    expect(screen.getByText('are')).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('how')).toHaveAttribute('data-active', 'false')
  })

  it('no marca ninguna palabra cuando no hay indice activo', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={null} />)
    for (const word of ['Hello', 'how', 'are', 'you']) {
      expect(screen.getByText(word)).toHaveAttribute('data-active', 'false')
    }
  })

  it('ignora un indice fuera de rango sin romperse', () => {
    render(<SpokenLine text="Hello how" activeIndex={99} />)
    expect(screen.getByText('Hello')).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('how')).toHaveAttribute('data-active', 'false')
  })

  it('el texto completo sigue siendo legible como una frase', () => {
    render(<SpokenLine text="Hello how are you" activeIndex={1} />)
    expect(screen.getByTestId('spoken-script-line')).toHaveTextContent('Hello how are you')
  })
})
```

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test components/ai-coach/missions/scripted/__tests__/SpokenLine.test.tsx`
Esperado: FALLA — módulo no encontrado.

- [ ] **Step 3: Implementa**

Crea `components/ai-coach/missions/scripted/SpokenLine.tsx`:

```tsx
'use client'

// Planned structure:
// <SpokenLine>
//   <Word /> — un span por palabra, resaltado si es la que suena

import { cn } from '@/lib/cn'
import { splitSpokenWords } from '@/lib/speech/word-timings'

interface Props {
  text: string
  /** Indice de la palabra que suena ahora, o null si no suena nada. */
  activeIndex: number | null
}

/**
 * La linea del coach, palabra a palabra, con la actual resaltada.
 *
 * Seguir el texto mientras se escucha es justo lo que se practica aqui: la
 * frase tiene que seguir leyendose como una frase, asi que el resaltado usa
 * fondo y peso, nunca reflow (nada de cambiar tamano o fuente).
 */
export function SpokenLine({ text, activeIndex }: Props) {
  const words = splitSpokenWords(text)

  return (
    <span data-testid="spoken-script-line" className="inline">
      {words.map((word, index) => {
        const isActive = activeIndex === index
        return (
          <span key={`${word}-${index}`}>
            <span
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                'rounded-sm transition-colors duration-(--transition-fast) motion-reduce:transition-none',
                isActive && 'bg-primary-soft px-0.5 font-semibold text-fg',
              )}
            >
              {word}
            </span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </span>
  )
}
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test components/ai-coach/missions/scripted/__tests__/SpokenLine.test.tsx`
Esperado: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/missions/scripted/SpokenLine.tsx components/ai-coach/missions/scripted/__tests__/SpokenLine.test.tsx
git commit -m "feat: render a script line with the spoken word highlighted"
```

---

### Task 9: `useSpokenWordHighlight` — el índice activo en el tiempo

Prefiere el evento `boundary` real cuando el motor lo emite; si no llega, cae a la estimación.

**Files:**
- Create: `hooks/useSpokenWordHighlight.ts`
- Test: `hooks/__tests__/useSpokenWordHighlight.test.ts`

- [ ] **Step 1: Escribe los tests que fallan**

Crea `hooks/__tests__/useSpokenWordHighlight.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpokenWordHighlight } from '../useSpokenWordHighlight'

describe('useSpokenWordHighlight', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('no resalta nada antes de empezar', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    expect(result.current.activeIndex).toBeNull()
  })

  it('avanza de palabra segun pasa el tiempo estimado', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))

    act(() => { result.current.start(900) })
    expect(result.current.activeIndex).toBe(0)

    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(1)

    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(2)
  })

  it('stop limpia el resaltado', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(900) })
    act(() => { result.current.stop() })
    expect(result.current.activeIndex).toBeNull()
  })

  it('sin duracion fiable no resalta nada', () => {
    // Es el caso de `speechSynthesis` sin duracion conocida: preferimos
    // no resaltar a resaltar mal.
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(0) })
    expect(result.current.activeIndex).toBeNull()
  })

  it('una marca real de boundary manda sobre la estimacion', () => {
    const { result } = renderHook(() =>
      useSpokenWordHighlight({ text: 'one two three' }))
    act(() => { result.current.start(900) })
    act(() => { result.current.markWord(2) })
    expect(result.current.activeIndex).toBe(2)

    // Tras una marca real, la estimacion ya no pisa el valor.
    act(() => { vi.advanceTimersByTime(320) })
    expect(result.current.activeIndex).toBe(2)
  })
})
```

- [ ] **Step 2: Ejecuta y verifica que falla**

Ejecuta: `pnpm test hooks/__tests__/useSpokenWordHighlight.test.ts`
Esperado: FALLA — módulo no encontrado.

- [ ] **Step 3: Implementa**

Crea `hooks/useSpokenWordHighlight.ts`:

```ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateWordOffsets, splitSpokenWords } from '@/lib/speech/word-timings'

interface Options {
  text: string
}

interface SpokenWordHighlight {
  activeIndex: number | null
  /** Arranca el seguimiento estimado para una locucion de `durationMs`. */
  start: (durationMs: number) => void
  /** Marca una palabra concreta: gana a la estimacion. */
  markWord: (index: number) => void
  stop: () => void
}

/**
 * Sigue que palabra suena mientras se reproduce una linea.
 *
 * Dos fuentes, por orden de fiabilidad: si el motor emite `boundary`, esa
 * marca manda y se abandona la estimacion para siempre en esa locucion; si
 * no, se avanza con temporizadores repartidos por longitud de palabra.
 * Sin duracion fiable no se resalta nada.
 */
export function useSpokenWordHighlight({ text }: Options): SpokenWordHighlight {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasRealMarkRef = useRef(false)

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer)
    timersRef.current = []
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    hasRealMarkRef.current = false
    setActiveIndex(null)
  }, [clearTimers])

  const markWord = useCallback((index: number) => {
    // Una marca real invalida la estimacion: los temporizadores pendientes
    // pisarian el valor correcto unos milisegundos despues.
    hasRealMarkRef.current = true
    clearTimers()
    setActiveIndex(index)
  }, [clearTimers])

  const start = useCallback((durationMs: number) => {
    clearTimers()
    hasRealMarkRef.current = false

    const words = splitSpokenWords(text)
    const offsets = estimateWordOffsets(words, durationMs)
    if (offsets.length === 0) {
      setActiveIndex(null)
      return
    }

    setActiveIndex(0)
    offsets.forEach((offset, index) => {
      if (index === 0) return
      const timer = setTimeout(() => {
        if (hasRealMarkRef.current) return
        setActiveIndex(index)
      }, offset)
      timersRef.current.push(timer)
    })
  }, [clearTimers, text])

  useEffect(() => clearTimers, [clearTimers])

  return { activeIndex, start, markWord, stop }
}
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test hooks/__tests__/useSpokenWordHighlight.test.ts`
Esperado: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/useSpokenWordHighlight.ts hooks/__tests__/useSpokenWordHighlight.test.ts
git commit -m "feat: track which word of a line is being spoken"
```

---

### Task 10: Conectar el resaltado a `CoachLine`

**Files:**
- Modify: `components/ai-coach/missions/scripted/CoachLine.tsx`
- Modify: `lib/phoneme-practice/tts.ts` (añadir `onBoundary` a las opciones)
- Test: `components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx`

- [ ] **Step 1: Expón `boundary` en `speak()`**

En `lib/phoneme-practice/tts.ts`, añade `onBoundary` al tipo de opciones de `speak`, justo después de `onError`:

```ts
        onError?: () => void
        /** Posicion en caracteres de la palabra que empieza a sonar. */
        onBoundary?: (charIndex: number) => void
```

y engánchalo antes de `window.speechSynthesis.speak(utt)`:

```ts
  utt.onerror = options.onError ?? null
  // No todos los motores emiten `boundary` (Firefox es irregular). Quien
  // lo consuma debe funcionar igual si nunca llega.
  utt.onboundary = options.onBoundary
    ? (event) => options.onBoundary?.(event.charIndex)
    : null
```

- [ ] **Step 2: Escribe el test que falla**

Añade a `components/ai-coach/missions/scripted/__tests__/CoachLine.test.tsx`:

```tsx
  it('resalta la primera palabra en cuanto el coach empieza a hablar', () => {
    render(<CoachLine line={LINE} onContinue={() => undefined} />)
    // El autoplay ya arranco la locucion al montar.
    const words = screen.getByTestId('spoken-script-line')
    expect(words).toBeInTheDocument()
    const first = screen.getByText(LINE.text.split(' ')[0] as string)
    expect(first).toHaveAttribute('data-active', 'true')
  })
```

Usa la constante `LINE` que ya exista en ese archivo; si tiene otro nombre, ajústalo. Si la línea de prueba no tiene una duración conocida, añade `durationMs` al `modelAudio` del fixture o deja que el fallback de estimación use la longitud del texto (ver Step 3).

- [ ] **Step 3: Implementa la conexión**

En `components/ai-coach/missions/scripted/CoachLine.tsx`:

Añade los imports:

```tsx
import { useSpokenWordHighlight } from '@/hooks/useSpokenWordHighlight'
import { splitSpokenWords } from '@/lib/speech/word-timings'
import { SpokenLine } from './SpokenLine'
```

Dentro del componente, junto a los otros hooks:

```tsx
  const highlight = useSpokenWordHighlight({ text: line.text })
```

Añade este helper encima del componente:

```tsx
/**
 * Duracion estimada cuando el motor no la da: ~180ms por caracter hablado
 * es una aproximacion razonable a ritmo normal, y solo alimenta una pista
 * visual — si sale corta, el resaltado termina antes que el audio.
 */
const MS_PER_CHAR = 60

function estimatedDuration(text: string): number {
  return Math.max(600, text.length * MS_PER_CHAR)
}

/** Indice de la palabra que contiene una posicion en caracteres. */
function wordIndexAtChar(text: string, charIndex: number): number {
  const words = splitSpokenWords(text)
  let cursor = 0
  for (let index = 0; index < words.length; index += 1) {
    const found = text.indexOf(words[index] as string, cursor)
    if (found > charIndex) return Math.max(0, index - 1)
    cursor = found + (words[index] as string).length
  }
  return Math.max(0, words.length - 1)
}
```

Reemplaza `handleListen` por:

```tsx
  const handleListen = useCallback(() => {
    const source = resolveModelAudio(line)
    setIsPlaying(true)

    const finish = () => {
      setIsPlaying(false)
      highlight.stop()
    }

    if (source.kind === 'synthesized') {
      highlight.start(estimatedDuration(source.text))
      speak(source.text, {
        onEnd: finish,
        onError: finish,
        // Si el motor sí emite boundary, manda sobre la estimacion.
        onBoundary: (charIndex) =>
          highlight.markWord(wordIndexAtChar(source.text, charIndex)),
      })
      return
    }

    const audio = new Audio(source.path)
    // El OGG autorado puede traer duracion medida; si no, se estima.
    highlight.start(source.durationMs ?? estimatedDuration(line.text))
    audio.onended = finish
    audio.onerror = () => {
      // El OGG pregrabado puede faltar; la sintesis mantiene la linea audible.
      highlight.start(estimatedDuration(line.text))
      speak(line.text, { onEnd: finish, onError: finish })
    }
    void audio.play().catch(() => {
      highlight.start(estimatedDuration(line.text))
      speak(line.text, { onEnd: finish, onError: finish })
    })
  }, [line, highlight])
```

Y reemplaza el párrafo que pinta el texto:

```tsx
      <p className="m-0 max-w-[85%] rounded-xl bg-surface-raised px-3 py-2 text-body text-fg-muted">
        {line.text}
      </p>
```

por:

```tsx
      <p className="m-0 max-w-[85%] rounded-xl bg-surface-raised px-3 py-2 text-body text-fg-muted">
        <SpokenLine text={line.text} activeIndex={highlight.activeIndex} />
      </p>
```

- [ ] **Step 4: Verifica en verde**

Ejecuta: `pnpm test components/ai-coach/missions/scripted/`
Esperado: PASS. Si algún test antiguo buscaba el texto con `getByText('frase entera')`, ahora el texto está partido en spans — cámbialo por `toHaveTextContent` sobre `spoken-script-line`.

- [ ] **Step 5: Comprueba tipos y lint**

Ejecuta: `pnpm type-check && pnpm lint`
Esperado: sin errores.

- [ ] **Step 6: Prueba manual**

Ejecuta `pnpm dev`, entra en una misión con guion. Verifica:
1. El coach habla solo al llegar su turno y el resaltado **avanza** por la frase.
2. Al pulsar "Repetir", el resaltado vuelve a empezar desde la primera palabra.
3. Al terminar, **no queda ninguna palabra resaltada**.
4. El texto sigue leyéndose como una frase — sin saltos de línea raros ni palabras que cambien de tamaño.

Si el resaltado va notablemente desacompasado, ajusta `MS_PER_CHAR` (súbelo si va demasiado rápido) y anota el valor final.

- [ ] **Step 7: Commit**

```bash
git add components/ai-coach/missions/scripted/CoachLine.tsx lib/phoneme-practice/tts.ts components/ai-coach/missions/scripted/__tests__/
git commit -m "feat: follow the coach's speech word by word"
```

---

### Task 11: Verificación final

- [ ] **Step 1: Suite completa**

Ejecuta: `pnpm type-check && pnpm lint && pnpm test`

Esperado: sin errores de tipos ni de lint. En los tests hay **2 fallos preexistentes conocidos** por timeout en `lib/essential-words/simulation/` — no los causa este trabajo. Cualquier otro fallo sí es tuyo: arréglalo.

- [ ] **Step 2: Comprueba las reglas del proyecto**

```bash
wc -l components/ai-coach/AICoachPanel.tsx components/ai-coach/AICoachHome.tsx components/ai-coach/missions/scripted/CoachLine.tsx components/ai-coach/missions/scripted/SpokenLine.tsx
```

Ningún archivo debe pasar de 250 líneas. `AICoachPanel.tsx` es el que más crece en la Tarea 5: si se pasa, extrae los dos bloques de pestaña a `AICoachPanelTabs.tsx` y anótalo.

Verifica también que no se coló ningún color a mano:

```bash
grep -n "oklch\|#[0-9a-fA-F]\{6\}\|style={{" components/ai-coach/missions/scripted/SpokenLine.tsx hooks/useSpokenWordHighlight.ts
```

Esperado: sin resultados.

- [ ] **Step 3: Commit final si quedó algo suelto**

```bash
git add -A
git commit -m "chore: final checks for split tabs and word highlighting"
```

---

## Notas de riesgo

**Lo más frágil de este plan es la Tarea 5.** Toca el routing que comparten cuatro orígenes de lanzamiento (`route`, `daily`, `tracking`, `sound_lab`). La Tarea 1 lo blinda por delante — garantiza que los lanzamientos por target nunca traen una misión con guion — pero la prueba manual del Step 5 no es opcional.

**El resaltado es una estimación, no una sincronización.** Cuando el motor emite `boundary` es exacto; cuando no, es aproximado, y en frases largas se notará la deriva. Es una decisión consciente: la alternativa (audio pregenerado con marcas de tiempo por palabra) es un trabajo de contenido mucho mayor, y no lo cubre este plan. Si la deriva molesta en la prueba manual, dilo antes de intentar arreglarla con más constantes.
