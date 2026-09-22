# Reglas del sistema de diseño

Fuente de verdad de valores: [`tokens.json`](./tokens.json). Fuente de verdad de
implementación: [`app/styles/tokens.css`](../../app/styles/tokens.css) +
[`app/styles/theme.css`](../../app/styles/theme.css). Estado de la migración y
alias temporales: [`MIGRATION.md`](./MIGRATION.md).

## Color

1. **Prohibidos `hex`, `rgb()`/`rgba()`, `hsl()`/`hsla()` y `oklch()` como literales
   fuera de `app/styles/`** — ni en JS/TS (objetos, strings, template literals) ni
   dentro de un valor arbitrario de Tailwind (`bg-[#fff]`, `border-[oklch(...)]`).
   Usa siempre `var(--token)`. Enforced por `npm run lint:design`
   (`scripts/lint-design-tokens.mjs`); excepciones documentadas en
   `RAW_COLOR_ALLOWLIST` dentro del script (branding de terceros, paletas de datos
   como `DOT_COLORS`, no color de UI).
2. **`accent` solo va en**: botón primario, item de navegación activo, número del
   paso actual, chip "En curso", barra de progreso neutra, anillo de foco, swatch
   seleccionado. Como texto o icono sobre `bg`/`surface`, usa `accent-text`
   (nunca `accent` sólido — no llega a 4.5:1 como texto pequeño sobre oscuro).
3. **El color de una tarjeta lo decide el tipo de contenido**, nunca el tema del
   usuario — ver la tabla en [`components/Card.md`](./components/Card.md). Cambiar
   `accent` no debe recolorear ninguna tarjeta pastel.
4. **Sobre pastel, todo en `ink` / `ink-secondary` / `ink-muted`**: texto, iconos,
   bordes, botones oscuros e ilustraciones. Nunca `text`/`text-muted` (esos son
   para `bg`/`surface`, cambian con el tema claro/oscuro; `ink*` no cambia nunca).

## Tarjetas y jerarquía

5. **Un `primary` como máximo por tarjeta.** Si la pantalla ya tiene un botón
   primario arriba, las tarjetas siguientes usan `ej-btn--ink` (ver
   [`components/Button.md`](./components/Button.md)).
6. **Sin sombras en tarjetas.** `shadow-float` es solo para elementos flotantes
   (el Coach). Las tarjetas se distinguen por color y radio, no por elevación.

## Inglés y sonido

7. **Todo inglés (palabra o frase) lleva IPA, traducción y audio.** El IPA va en
   `font-phonetic` (Noto Sans) — nunca en `font-display`, Bricolage no cubre todo
   el IPA. La traducción va en `ink-muted`, debajo del inglés.

## Iconografía

8. **Iconos de `lucide-react`, nunca emoji.** Rejilla de 24, trazo 1.8 en
   navegación y 2–2.2 en botones, `currentColor`. Ver lista de iconos usados en
   [`README.md`](./README.md#iconografía).

## Accesibilidad e interacción

9. **Controles ≥44px** (`control-md` = 44px es el mínimo táctil).
10. **Foco de 3px** con `focus-ring` (`outline: 3px solid var(--focus-ring)`,
    `outline-offset: 2px`) — nunca elimines el `outline` sin reemplazarlo.
11. **Ningún estado se codifica solo con color.** Acierto/error/pista llevan
    siempre icono + frase, no solo un fondo de color (ver
    [`components/Feedback.md`](./components/Feedback.md)); "En curso" lleva chip,
    no solo un cambio de tono.

## Voz

12. **Tuteo, verbo al inicio** ("Empezar", "Registrar", "Practica el sonido…").
    Nunca "Haz clic aquí" ni imperativos de usted.
13. **Duraciones siempre visibles** en las acciones que toman tiempo:
    "Empezar · 4 min", no "Empezar" a secas.

## Componentes

14. **Antes de crear un componente, busca en `src/components/ui`** (o
    `components/ui/` en este repo). Si no existe algo equivalente, documéntalo en
    `docs/design-system/components/` antes de usarlo en una pantalla — no
    inventes variantes ad hoc dentro de una pantalla.

## Enforcement

`npm run lint:design` (alias de `npm run lint:design-tokens`,
`scripts/lint-design-tokens.mjs`) falla el build si encuentra:

- hex, `rgb()`/`hsl()`/`oklch()` literales fuera de `app/styles/` — incluso dentro
  de un valor arbitrario de Tailwind (`bg-[oklch(...)]`, `border-[rgb(...)]`).
- `text-[Npx]` fuera de la lista de excepciones documentada en el script.
- Espaciado arbitrario (`p-`, `m-`, `gap-`, `w-`, `h-`, …) fuera de la grilla de
  4px.
- `rounded-[Npx]` fuera de la lista de radios documentados.

Corre automáticamente en `npm run build` (antes de `next build`) y en
`npm run audit:hard-rules`. No hay una fase de "advertencia": cualquier violación
nueva bloquea el build el mismo día que se introduce.
