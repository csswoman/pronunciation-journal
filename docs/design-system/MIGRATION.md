# Migración al sistema de diseño — estado y alias temporales

Este documento registra qué vive dónde durante la migración, y qué nombres antiguos
se mantienen vivos como alias en vez de romperse de inmediato. Fuente de verdad de
valores: `docs/design-system/tokens.json`. Fuente de verdad de implementación:
`app/styles/tokens.css` (generado) + `app/styles/theme.css` (mapeo Tailwind v4).

## Estado real al iniciar esta fase (Paso 0)

`app/styles/tokens.css` ya tenía, desde una migración previa (16 sep 2026), los
valores OKLCH equivalentes a los hex de `tokens.json`: neutros, pasteles (sky/butter/
coral/lilac/mint + deep/soft), 9 acentos, `data-accent`, y los derivados
`--accent-text/-soft/-border` (idénticos a los de `bundle.css`). El selector de tema
(`useOKLCHTheme`, `data-theme`, `data-accent`, script anti-parpadeo, persistencia en
`localStorage`) ya implementaba exactamente el patrón que pide el Paso 3 de esta fase.
Lo que faltaba era más angosto de lo esperado: radios desalineados con `tokens.json`
y sin generador. Ver detalle abajo.

## Por qué OKLCH y no hex

`tokens.json` publica valores en hex (para lectura humana / herramientas de diseño).
Este proyecto expresa todo el sistema de color en OKLCH (mejor interpolación en
`color-mix()`, base de los derivados de acento). `scripts/build-tokens.ts` mantiene
una tabla `OKLCH_BY_HEX` con la conversión de cada hex de `tokens.json` (sRGB → lineal
→ OKLab → OKLCH, D65), calculada una vez y congelada — no se recalcula en cada
`npm run tokens` para evitar drift numérico entre corridas.

## Corrección aplicada en este Paso 1

- **Radios**: `tokens.css` tenía `sm:8 / md:12 / lg:14 / xl:20`, dos pasos por debajo
  de `tokens.json` (`sm:12 / md:14 / lg:20 / xl:28`). Se corrigió a los valores de
  `tokens.json`. `--radius-2xl` (24px) y `--radius-3xl` (28px) se eliminaron de
  `tokens.css`; en `theme.css` quedan como **alias hacia `--radius-xl` (28px)**, por
  decisión explícita, para no tocar los ~80 archivos que aún usan esas clases.
- **`--radius-full` vs `--radius-pill`**: `tokens.json` nombra el radio de píldora
  `radius-pill`; el código ya usaba `--radius-full` en ~80 archivos. Se mantiene
  `--radius-full` como nombre canónico y se agrega `--radius-pill` como alias, en
  vez de renombrar.
- **`scripts/build-tokens.ts`** ahora genera la sección de colores, espaciado, radios
  y tipografía de `tokens.css` directamente desde `tokens.json`. Corre con
  `npm run tokens`.

## Alias temporales que se conservan (no se rompen en este Paso 1)

Por decisión explícita: **se mantiene compatibilidad visual** en vez de romper los
~630 archivos que referencian nombres antiguos. Los alias apuntan a la primitiva
nueva más cercana; el nombre antiguo queda documentado aquí como deuda a retirar
componente por componente en una fase futura (no planificada todavía).

| Alias legacy | Apunta a | Nota |
|---|---|---|
| `--primary`, `--color-primary` | `--accent` | Sin diferencia semántica hoy |
| `--primary-hover` | `color-mix(var(--accent) 85%, black)` | Sin equivalente en tokens.json; se mantiene la fórmula anterior |
| `--primary-text`, `--primary-soft` | `--accent-text`, `--accent-soft` | Idénticos, doble nombre |
| `--on-primary` | `--on-accent` | Idéntico |
| `--text-primary` | `--text` | — |
| `--text-tertiary` | `--text-muted` | — |
| `--text-quaternary`, `--text-disabled` | `--text-faint` | Dos alias legacy al mismo token |
| `--text-placeholder` | `--text-muted` | — |
| `--border-subtle`, `--border-default` | `--border` | — |
| `--border-hover` | `--border-strong` | — |
| `--surface-base`, `--page-bg` | `--bg` | — |
| `--surface-sunken` | `--field` | tokens.json define `surface-sunken` con uso restringido (solo zonas/estados vacíos); el alias actual es más amplio, revisar en fase de componentes |
| `--surface-overlay` | valor fijo `oklch(.. / 0.96)` | Sin equivalente en tokens.json |
| `--surface-tooltip`, `--surface-code` | `--text-strong` / `--field` | Sin equivalente en tokens.json |
| `--card-bg` | `--surface-raised` | Sin equivalente en tokens.json |
| `--cta-bg`, `--cta-fg`, `--cta-bg-hover` | `--ink`/`--paper` (invertido en dark) | Sin equivalente en tokens.json — el sistema nuevo no tiene "CTA" como capa propia, usa `accent`/`ink` directo |
| `--success`, `--error`, `--warning`, `--info` (+ `-soft`) | `--feedback-correct/-wrong/-hint`, `--sky` | Nombres genéricos de estado que el sistema nuevo no define; se mantienen como alias de feedback |
| `--ej-sky`, `--ej-butter`, `--ej-coral`, `--ej-lilac`, `--ej-mint` (+ `-deep`/`-soft`) | pasteles homónimos sin prefijo | Duplicado histórico, candidato a eliminar cuando no quede ningún consumidor |
| `--radius-2xl` (24px), `--radius-3xl` (28px) | `--radius-xl` (28px) | Ver arriba — cambio visual: elementos en 2xl pasan de 24→28px |
| `--font-sans` | `--font-body` (`tokens.json`) | Nombre histórico del proyecto |
| `--font-ipa` | `--font-phonetic` (`tokens.json`) | Nombre histórico del proyecto |
| `--layout-*` (page-inline, header-gap, section-gap, stack-*, card-pad, canvas-max, session-max) | combinaciones de `--space-*` | Capa semántica propia del proyecto, sin equivalente en tokens.json — se conserva tal cual |
| `--dur-*`, `--ease-*` (motion) | — | tokens.json no define motion; se conserva sin cambios |

## Paso 3 — Tema y acento (verificado, no reconstruido)

El selector de tema/acento ya implementaba el patrón del brief casi exactamente:
`data-theme`/`data-accent` en `<html>`, script de anti-parpadeo inline y bloqueante
(`lib/theme/theme-init-script.ts`), persistencia en `localStorage`
(`theme-mode`, `theme-accent`), y 9 acentos válidos. Cambios de este paso:

- **`useAppearance()`** agregado en `hooks/useOKLCHTheme.ts` como envoltorio aditivo
  sobre `useOKLCHTheme()`, con la forma exacta del brief: `{ theme, accent, setTheme,
  setAccent }`. `theme` aquí es el modo resuelto claro/oscuro (`mode`), no la
  preferencia de tres estados ("light"/"dark"/"system"); componentes que necesiten
  la opción "usar el del sistema" siguen usando `useOKLCHTheme()`/`useTheme()`
  directamente. No se tocaron los 3 consumidores existentes del hook original.
- **Default de tema**: decisión explícita de mantener el comportamiento actual —
  sin elección guardada, el modo sigue `prefers-color-scheme` del sistema operativo
  (puede abrir en claro). "Dark por defecto" del brief se interpreta como el acento
  azul + oscuro preseleccionados en el selector de Ajustes, no como el modo real de
  arranque cuando el SO prefiere claro.
- Sin cambios en `theme-init-script.ts`, `accent-presets.ts` ni `resolve-theme-mode.ts`.

## Pendiente para fases posteriores (fuera de este Paso 1)

- Desactivar la paleta por defecto de Tailwind (`--color-*: initial`): no se hizo en
  este paso porque ~630 archivos aún dependen de nombres legacy no verificados 1:1
  contra el nuevo sistema; alto riesgo de romper algo fuera del mapa de arriba.
- Retirar los alias de esta tabla componente por componente y actualizar sus
  clases a los nombres de `tokens.json` directamente.
- Revisar los 10 archivos con `oklch()` propio fuera de `tokens.css`/`theme.css`
  (`animations.css`, `course-path.css`, `grammar-deck.css`, `lexicon-area.css`,
  `phoneme-practice.css`, `sound-lab.css`, `tracking.css`, `PracticeSession.tsx`,
  `WaveformVisualizer.tsx`, `lib/theme/hue-presets.ts`) — candidatos a consolidar
  en tokens.
- `docs/design-system/tokens.css` / `bundle.css` (la copia exportada del sistema de
  diseño, distinta de `app/styles/`) — verificar que no queden desactualizadas.
