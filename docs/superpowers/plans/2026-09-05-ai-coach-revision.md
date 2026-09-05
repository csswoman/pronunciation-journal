# Rediseño del AI Coach — guía de ejecución y revisión

Documento operativo. No es un plan de implementación: es cómo ejecutar los cuatro
planes con un agente externo (Antigravity) y cómo pedir la revisión después.

**Planes:**

| Fase | Archivo | Tasks | Depende de |
|---|---|---|---|
| 1 | `docs/superpowers/plans/2026-09-05-ai-coach-implicit-correction.md` | 8 | — |
| 2 | `docs/superpowers/plans/2026-09-05-ai-coach-unified-saving.md` | 7 | Fase 1 |
| 3 | `docs/superpowers/plans/2026-09-05-ai-coach-adaptive-starters.md` | 8 | Fase 1 |
| 4 | `docs/superpowers/plans/2026-09-05-ai-coach-session-close.md` | 5 | Fases 1 y 2 |

**Spec de referencia:** `docs/superpowers/specs/2026-09-05-ai-coach-adaptive-redesign-design.md`

Las fases 2 y 3 son independientes entre sí.

---

## Paso 0 — Antes de tocar nada

El working tree tenía ~35 archivos modificados sin commitear, varios de ellos en
`components/ai-coach/`, y `lib/ai-practice/conversation-title.ts` estaba untracked
aunque los planes lo dan por existente.

```bash
git status --short          # revisa qué hay
git add -A
git commit -m "wip: cambios previos al rediseño del coach"
pnpm test
pnpm type-check
pnpm lint
```

Anota qué falla **ya**, antes de que el agente toque nada. Sin esa línea base no
hay forma de saber después qué rompió él.

---

## Ejecución

Una rama por fase: `feat/coach-fase-1`, `feat/coach-fase-2`, etc.

Pásale a Antigravity **el archivo del plan completo**, no un resumen. Están
escritos asumiendo cero contexto del repo. Pídele **una task a la vez**, con
commit al final de cada una. Si le das las 8 juntas devuelve un diff imposible
de revisar.

### La compuerta de la fase 1

No encadenes las cuatro fases. La Task 8 de la fase 1 (test de integración con
`streamWithFallback`) decide si el resto tiene sentido: si Gemini flash-lite no
llama a `annotate_turn` de forma fiable *mientras escribe prosa*, las fases 2 y 4
se quedan sin fuente de datos.

Después del test automático, valida a mano en el navegador:

- 5 mensajes con errores típicos tuyos → debe corregir los 5
- 3 mensajes correctos y naturales → **no debe decir nada**

El segundo caso es el que más se rompe: el modelo tiende a "corregir" algo aunque
esté bien, para parecer útil. Si pasa, el remedio documentado es endurecer el
prompt primero, y solo después promover ese caso a `flash` — no rediseñar.

---

## Revisión

### Por fase (la que más pilla)

Al terminar cada fase, sesión nueva de Claude Code, sobre la rama de esa fase:

```
Revisa la rama actual contra docs/superpowers/plans/<archivo-del-plan>.md.

Haz `git diff dev...HEAD` y compara task por task. Dime:

1. Qué tasks no se implementaron, o se implementaron distinto a lo escrito
   (nombres de tipos, firmas, ubicación de archivos).
2. Qué reglas de CLAUDE.md se violaron.
3. Qué está mal a nivel de correctitud, aparte de lo anterior.

No arregles nada todavía. Solo repórtalo.
```

Esto funciona porque el plan es el contrato. Un agente ejecutor tiende a resolver
a su manera cuando una task le incomoda: se salta un test, renombra un tipo, mete
lógica en el componente en vez del lib.

### Puntos que hay que mirar con lupa en este rediseño

Independientes de lo genérico, y específicos de estos cuatro planes:

- **Ningún prompt fuera de `lib/ai-prompts.ts`.** Es la regla que más fácil se
  rompe al meter `annotate_turn` (fase 1) y los starters (fase 3).
- **`parseTurnCorrection` y `parseTurnSaveables` descartan, no lanzan.** Si el
  ejecutor les pone `throw`, un argumento malformado del modelo tumba el turno
  entero del usuario.
- **Fase 2: `load-state.ts` desenganchado ANTES de borrar `getAIWords`.** Importa
  el helper en las líneas ~66/74/83-86 para construir `vocabulary.savedWords`.
  El orden inverso rompe el build.
- **Fase 2: la migración Dexie v36 borra la tabla `aiWords` (`{ aiWords: null }`)
  y eso es intencional** — se decidió descartar ese contenido en vez de migrarlo.
  Lo que hay que verificar es que el ejecutor no se ponga creativo e invente una
  migración a `word_bank` que nadie pidió, y que el drop no deje referencias
  colgando en `lib/db/ai.ts` ni en `hooks/useSavedWords.ts`.
- **Fase 1 y 2 tocan `MessageBubble.tsx`, que ya está en 309 líneas** (ESLint
  avisa a 300, la convención es 250). Si crece más hay que decomponerlo, no
  añadirlo al allowlist.
- **Fase 3: el selector de starters.** El plan deja abierto a propósito si con
  usuario nuevo devuelve 2 elementos o rellena hasta 4 con atajos estáticos.
  Verifica que se eligió una y que el test correspondiente se ajustó, en vez de
  borrarlo.
- **`intentToToolConfig`** (fase 1, Task 3): confirma que `explanation_request`
  quedó en `{ toolChoice: "auto", allowedTools: ["annotate_turn"] }` y no en
  `none`. Si quedó en `none`, la corrección desaparece justo cuando el usuario
  pide una explicación — el turno donde más se equivoca.
- **Offline sigue funcionando.** Nada de lo nuevo puede requerir red para que el
  chat cargue su estado local.

### Al final: `/code-review ultra`

Una sola vez, sobre la rama integrada de las cuatro fases, antes del merge a
`dev`. Es multiagente y billable, así que no lo gastes por fase.

Lo lanza el usuario; Claude no puede dispararlo por su cuenta.
