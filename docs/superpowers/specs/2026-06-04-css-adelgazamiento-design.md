# CSS Adelgazamiento — Feature-Specific Files

**Fecha:** 2026-06-04  
**Estado:** Aprobado

## Objetivo

Reducir los 8 archivos CSS de dominio a solo lo que genuinamente no puede expresarse con Tailwind v4. Los componentes React no se tocan. El comportamiento visual no cambia.

## Archivos en scope

`sound-lab.css`, `course-path.css`, `grammar-deck.css`, `words-lexicon.css`, `ipa-chart.css`, `mini-lessons.css`, `lexicon-area.css`, `phoneme-practice.css`

## Criterio de eliminación

Se elimina cualquier declaración que sea CSS estructural puro sin tokens:

- Layout: `display`, `flex-direction`, `align-items`, `justify-content`, `flex`, `flex-wrap`, `flex-shrink`, `flex: none`, `gap`, `min-width`, `min-height`, `width`, `height` con valores literales
- Espaciado fijo: `margin`, `padding` con valores en px/rem literales
- Tipografía sin tokens: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `white-space`, `text-align`, `text-decoration`, `word-break` con valores literales
- Otros: `cursor`, `overflow`, `position: relative` simple, `inset: 0`, `border-radius` con valores literales sin tokens

## Criterio de conservación

Se conserva todo lo que necesita CSS:

- Cualquier `var(--...)` — tokens del sistema de diseño
- `color-mix()`, `conic-gradient()`, `radial-gradient()`, `linear-gradient()` con variables
- `@keyframes` y sus referencias (`animation:`)
- Selectores de estado cruzado: `.parent--state .child {}` y `.parent--state > .child {}`
- Pseudo-elementos: `::before`, `::after`, `::placeholder`, `::webkit-scrollbar`, `::webkit-details-marker`
- Media queries `@media`
- `clamp()`, `calc()` con variables CSS
- `transition` con `var(--transition-fast)` u otras variables
- `font-family` con `var(--font-...)` o stacks de fuentes editoriales (Georgia, serif)
- `font-optical-sizing`, `font-variant-numeric`, `will-change`, `-webkit-font-smoothing`
- `border-left: 3px solid var(--primary)` y similares con tokens
- `box-shadow` con tokens o `color-mix()`
- `opacity` en reglas de estado (`.disabled`, `.dim`)
- `appearance: none` y propiedades no estándar
- Propiedades de línea de texto: `-webkit-line-clamp`, `-webkit-box-orient`

## Bug a corregir

**Doble import de `phoneme-practice.css`:** `globals.css` ya lo importa directamente. Eliminar el `@import "./phoneme-practice.css"` de la línea 1 de `components.css`.

## Lo que NO cambia

- Ningún archivo `.tsx` se modifica
- `tokens.css`, `theme.css`, `base.css`, `utilities.css`, `animations.css`, `components.css` (salvo el bug) no se tocan
- `globals.css` no cambia
- `markdown.css` y `ChatTabs.module.css` fuera de scope

## Resultado esperado

Cada archivo CSS de dominio queda conteniendo solo declaraciones que justifican existir en CSS. Estimación: reducción del 60-70% de líneas por archivo.
