# English Journal

Sistema de diseño de English Journal, una app para aprender inglés desde el español. Pantallas oscuras (o claras) con tarjetas pastel tipo bento, tipografía gruesa y expresiva, formas suaves en píldora e ilustraciones dibujadas a mano.

## Principios

1. **El color dice qué tipo de contenido es.** Cada tipo de tarjeta tiene su pastel fijo: quien usa la app aprende que amarillo es “frase”, coral es “palabra”. Ver la tabla en Card.
2. **El usuario elige un solo color: el acento.** Su tema cambia `accent` y nada más. Pastel, tinta y neutros se quedan igual.
3. **Tinta sobre pastel.** Todo lo que va encima de una tarjeta pastel usa `ink`: texto, iconos, bordes, botones oscuros e ilustraciones. Así las ilustraciones a mano encajan siempre.
4. **Suave y grande.** Radios de 28px en tarjetas, píldoras en botones y chips, discos para audio. Sin sombras salvo lo flotante.
5. **Inglés con sonido.** Toda palabra o frase en inglés lleva IPA en `ipa` (Noto Sans), traducción y un botón de audio.

## Color

Tres capas con reglas distintas:

| Capa | Tokens | ¿Cambia con el tema del usuario? | ¿Cambia con claro/oscuro? |
|---|---|---|---|
| Neutros | `bg`, `bg-sidebar`, `surface`, `surface-raised`, `field`, `border*`, `text*` | No | Sí |
| Pastel de contenido | `sky`, `butter`, `coral`, `lilac`, `mint` y sus `-deep` / `-soft`; `ink*`, `paper` | No | No |
| Acento | `accent` → uno de `accent-red … accent-pink` | **Sí** | No |

Dónde va `accent` (y solo ahí): botón primario, item de navegación activo, número del paso actual, chip “En curso”, barra de progreso neutra, anillo de foco. Nunca como fondo de tarjeta ni como texto pequeño sobre `bg` oscuro.

Implementación: `<html data-theme="dark" data-accent="teal">`. `bundle.css` traduce `data-accent` a `--accent`. En Tailwind v4, expón los tokens en `@theme` (`--color-accent: var(--accent)`, `--color-sky: var(--sky)`…) y cambia solo los atributos de `<html>`.

Por qué los acentos son tonos 600 y no los claros del selector original: los nueve pasan 4.5:1 con texto blanco, así cualquier elección del usuario deja legibles los botones.

## Tipografía

- **Bricolage Grotesque** (800) para display: `hero` (palabra del día), `display` (títulos de página), `headline` (frases), `numeral` (cifras). Espaciado negativo.
- **Figtree** para todo el texto de interfaz: `title`, `body-lg`, `body`, `body-sm`, `caption`, `overline`.
- **Noto Sans** solo para IPA (`ipa`, `ipa-lg`): cubre ɪ ə ð ː ˈ.

Las tres se cargan desde Google Fonts (`bundle.css` las importa).

## Espaciado y forma

Grid bento con `space-gap` (22px) entre tarjetas; padding de tarjeta `space-6` (24px), la principal `space-7` (28px); margen del contenido `space-8` (40px). Radios: `radius-xl` tarjetas, `radius-lg` insets, `radius-md` filas, `radius-sm` navegación y campos, `radius-pill` botones y chips. Controles de 44px mínimo (`control-md`).

## Iconografía

Iconos de interfaz: **Lucide** (`lucide-react`). Rejilla de 24, trazo 1.8 en navegación y 2–2.2 en botones, extremos redondeados, color `currentColor`. Tamaños: 16 (en chips e insets), 18–19 (botones, nav), 24 (audio). Nunca emoji.

Iconos usados en la app: `house`, `calendar`, `notebook`, `book-open`, `target`, `mic`, `layers`, `table`, `sparkles`, `circle-dot`, `gallery-vertical`, `trophy`, `book-text`, `bookmark`, `refresh-cw`, `trending-up`, `search`, `bell`, `volume-2`, `arrow-right`, `chevron-right`, `chevron-down`, `video`, `headphones`, `file-text`, `settings`, `panel-left`.

## Ilustraciones

Estilo **Original** de Koboyo (dibujo a mano, línea negra, rellenos blancos). Reglas completas y búsquedas sugeridas en el grupo de assets *Illustrations*. Resumen:

- Solo sobre pastel o `paper`. Sobre neutros oscuros, dentro de un disco `ej-illo-plate` en el `-deep` de la sección.
- Una por tarjeta como máximo, alineada al borde derecho o inferior; nunca dentro de botones.
- No las recolorees: su negro coincide con `ink`.

## Voz

Tuteo, frases cortas, verbos al inicio (“Empezar”, “Registrar”, “Practica el sonido…”). Duraciones siempre visibles (“· 4 min”). El inglés va en inglés y la traducción debajo, en `ink-muted`.
