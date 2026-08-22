# AGENTS.md — English Journal

Instrucciones para agentes de código (Claude Code, Codex, Copilot, Gemini CLI).

**Jerarquía de autoridad** — si dos documentos discrepan, gana el de arriba:

1. Instrucción explícita del usuario en la conversación.
2. `CLAUDE.md` — reglas duras de arquitectura, styling, componentes y state model.
3. `ENGINEERING_STANDARDS.md` — dónde vive el código, ESLint, auditorías, inventarios.
4. Este documento — flujo de trabajo del agente y contrato de diseño.
5. El código y los tokens vivos (`app/styles/tokens.css`) — fuente de verdad final
   sobre cualquier documento de diseño.

Este archivo **no repite** las reglas de `CLAUDE.md`. Léelo junto con él.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase · Dexie.js ·
Gemini API · Zustand · Web Audio API · Vitest · pnpm.

## Comandos

```bash
pnpm dev                  # servidor de desarrollo
pnpm build                # build de producción
pnpm type-check           # TypeScript, sin emitir
pnpm lint                 # ESLint (incluye guardrails de imports y max-lines)
pnpm test                 # Vitest
pnpm test:watch           # Vitest en watch
pnpm audit:hard-rules     # auditorías de reglas duras (prompts, RLS, tokens, estado)
pnpm lint:design-tokens   # valores arbitrarios y colores crudos
pnpm prepush              # suite completa: lint + types + auditorías + tests
```

---

## Flujo de trabajo esperado

1. **Antes de escribir código**: identifica el dominio (`lib/<feature>/`) y busca el
   patrón existente en `ENGINEERING_STANDARDS.md § Referencias de implementación`.
   Copia el patrón vigente; no inventes uno nuevo.
2. **Antes de escribir un componente**: escribe el bloque de sub-componentes como
   comentario (`CLAUDE.md § Component rules`). Si no puedes listarlos, el componente
   es demasiado grande — divídelo antes de implementar.
3. **Cambios de UI**: lee primero el contexto obligatorio de diseño (abajo).
4. **Al terminar**: ejecuta las verificaciones y reporta la salida real. No afirmes
   que algo pasa sin haberlo corrido.

### Verificación antes de dar por terminada una tarea

Mínimo, siempre:

```bash
pnpm type-check && pnpm lint && pnpm test
```

Añade `pnpm audit:hard-rules` si tocaste prompts de Gemini, migraciones de Supabase,
tokens de diseño o stores de Zustand. Antes de un PR, `pnpm prepush` corre la cadena
completa (incluye `check:migrations`, `scan:secrets`, `audit:learning-loop` y
`validate:essential-words{,-generators}`).

Checklist de `CLAUDE.md § Before finishing any task`:

- [ ] Ningún archivo supera 250 líneas (ESLint avisa a 300)
- [ ] Cada componente nuevo tiene una responsabilidad única y nombrada
- [ ] Sin `style={{}}` salvo valores computados en runtime
- [ ] Sin colores, spacing o radios hardcodeados — solo tokens
- [ ] Sin prompts fuera de `lib/ai-prompts.ts`
- [ ] Sin llamadas a Supabase fuera de `lib/*/queries.ts`
- [ ] Tablas nuevas de Supabase con RLS habilitada
- [ ] El modo offline sigue funcionando

### Git

- Rama por defecto para PRs: `main`. Trabajo diario en `dev`.
- No hagas commit ni push salvo que el usuario lo pida.
- No uses `--no-verify` ni saltes hooks.
- Los agentes con `isolation: worktree` hacen checkout de `main`, no de `dev`:
  haz checkout del SHA objetivo antes de ejecutar.

---

## Contexto obligatorio para UI

Antes de analizar, criticar, rediseñar o editar una superficie visual, leer:

1. `PRODUCT.md` — qué resuelve el producto y para quién
2. `DESIGN.md` — sistema de diseño y tokens semánticos
3. `THEME_SYSTEM.md` — sistema OKLCH dinámico de 4 capas
4. `docs/design/visual-language.md` — proporción de color y personalidad
5. `docs/design/primitives.md` — APIs vigentes: botones, radios, Badge, Anchor

Aplica en particular a las tareas de Impeccable: `craft`, `shape`, `critique`,
`audit`, `polish`, `bolder`, `quieter`, `distill`, `colorize`, `typeset`, `layout`,
`delight`, `adapt` y `live`.

Si alguno de estos documentos cambia durante la tarea, vuelve a leerlo antes de
continuar con decisiones visuales.

> `CLAUDE_DESIGN.md` está retirado. No lo uses como referencia.

## Contrato de diseño

- **Tema dinámico**: los componentes consumen tokens semánticos y deben funcionar
  con cualquier `--hue` y con `.dark`. Nunca `prefers-color-scheme` en componentes.
- **Jerarquía**: el Home es la referencia — repaso accionable primero, plan diario
  como superficie principal, práctica sugerida subordinada.
- **Escala**: respeta la escala de `border-radius`, la proporción de color y las
  reglas de personalidad de `docs/design/visual-language.md`.
- **Tipografía**: DM Sans para UI, DM Mono para kickers y notación técnica, Andika
  vía `font-ipa` / `.font-phoneme` para IPA. Ninguna fuente decorativa adicional.
- **Acciones**: CTA de chrome → tinta (`Button` `primary`). Avance de sesión → hue
  (`PillButton` `primary`). Secondary → raised + borde. `Badge` solo con variantes
  semánticas.
- **Verificación visual**: comprueba en claro y oscuro, y con un hue distinto al
  inicial. No añadas colores, sombras, radios ni gradientes locales para forzar una
  apariencia.

---

## Errores frecuentes de agentes en este repo

| Antipatrón | Correcto |
|---|---|
| Prompt de Gemini inline en una ruta o componente | `lib/ai-prompts.ts` |
| `createClient()` de Supabase en un hook o componente | `lib/*/queries.ts` |
| `if`/`switch` largo para variantes de ejercicio | entrada en el registry |
| Estado de dominio duplicado en Zustand y Dexie | Dexie es la fuente; Zustand solo UI efímera |
| Colores o spacing hardcodeados para "que se vea bien" | token semántico existente |
| Lógica de negocio dentro de `app/**/page.tsx` | `lib/<feature>/`; la página compone |
| Crear un archivo nuevo en `lib/` root con dominio o I/O | `lib/<feature>/<name>.ts` |
| Tabla nueva sin RLS en la migración | `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` |
| `any` sin justificación | tipo real, o `any` con comentario del porqué |
| Declarar "listo" sin correr los checks | ejecuta y pega la salida |

## Decisiones ya cerradas — no reabrir

Dexie como capa offline · SM-2 en cliente · Gemini solo vía rutas `/api/gemini/*` ·
Tailwind v4 con tokens CSS · Vitest como runner.

---

## Comunicación

- Responde en español; el código, los identificadores y los mensajes de commit
  siguen la convención existente del repo.
- Referencia archivos como enlaces relativos clicables: `[Button.tsx](components/ui/Button.tsx)`.
- Reporta resultados con fidelidad: si un test falla, dilo con la salida; si saltaste
  un paso, dilo.
