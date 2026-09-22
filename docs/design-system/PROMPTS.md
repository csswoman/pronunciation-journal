# Prompts para el agente

Copia esta carpeta en el repo como `docs/design-system/`. Lanza una fase por conversación y revisa antes de seguir.

---

## Fase 1 — Fundamentos: documentación, tokens, tipografía y tema

Vamos a adoptar el sistema de diseño de English Journal. Esta fase es SOLO la base: no toques pantallas ni componentes todavía.

**Fuente de verdad:** `docs/design-system/`. Léela entera antes de cambiar nada, en este orden: `README.md` (principios), `tokens.json`, `tokens.css`, `bundle.css`, `components/*.md`, `illustrations.md`, `screens/INDEX.md`. Si una maqueta de `screens/` contradice `tokens.json`, gana `tokens.json`.

**Stack:** Next.js (App Router), TypeScript, Tailwind v4, Turbopack. Ya existe un sistema de color semántico en OKLCH con selector de tema, y un sistema de sonidos y movimiento de UI que debe seguir funcionando igual.

### Paso 0 — Auditoría (antes de editar)
Entrégame un informe corto con:
1. Dónde viven hoy los colores, fuentes, radios y espaciados (archivos y variables).
2. Cómo funciona el selector de tema actual (qué atributo/clase usa, dónde se guarda, cómo evita el parpadeo).
3. Una tabla de equivalencias: token actual → token nuevo, marcando los que no tienen equivalente.
4. Lista de hex, `oklch()` y valores arbitrarios de Tailwind (`[#...]`, `[13px]`) repartidos por componentes.
Espera mi OK antes del paso 1.

### Paso 1 — Tokens
- Copia `tokens.css` a `src/styles/tokens.css` e impórtalo en `globals.css` antes que nada. No lo edites a mano: si hay que cambiar un valor, se cambia `tokens.json` y se regenera. Crea `scripts/build-tokens.ts` que genere `tokens.css` desde `tokens.json` (misma salida que el archivo actual) y un script `npm run tokens`.
- De `bundle.css` porta SOLO el bloque de acento (`[data-accent=...]` y los derivados `--accent-text`, `--accent-soft`, `--accent-border` por tema) a `src/styles/theme.css`. Las clases `.ej-*` NO se importan: son la especificación de referencia para los componentes de la fase 2.
- Expón los tokens a Tailwind v4 con `@theme inline` apuntando a las variables (nunca copiando valores): colores (`--color-bg: var(--bg)`, `--color-surface`, `--color-ink`, `--color-sky`, `--color-sky-deep`, `--color-sky-soft`… `--color-accent`, `--color-accent-text`, `--color-feedback-correct`…), fuentes (`--font-display`, `--font-body`, `--font-phonetic`), escalas tipográficas (`--text-hero`, `--text-display`, `--text-headline`, `--text-numeral`, `--text-title`, `--text-body-lg`, `--text-body`, `--text-body-sm`, `--text-caption`, `--text-overline`, `--text-ipa`, `--text-ipa-lg`, con line-height, peso y tracking), radios (`--radius-xs … --radius-xl`, `pill`), espaciado nombrado (`gap` = 22px, `space-1 … space-8`) y sombra `float`.
- Desactiva la paleta por defecto de Tailwind (`--color-*: initial;`) para que `bg-blue-500` y similares dejen de existir. Si eso rompe muchas pantallas, dímelo y lo hacemos al final de la fase 3.
- Retira el sistema OKLCH anterior solo cuando todo lo que lo usaba apunte a los tokens nuevos. Deja un alias temporal si hace falta y anótalo en `docs/design-system/MIGRATION.md`.

### Paso 2 — Tipografía
- Carga con `next/font/google`: Bricolage Grotesque (600, 700, 800, eje `opsz`), Figtree (400–700) y Noto Sans (400, 500, con los subconjuntos que cubran IPA: `latin`, `latin-ext`, y comprueba que ɪ ə ð θ ʃ ʒ ŋ ː ˈ se ven en Noto Sans y no en una fuente de reserva).
- Conecta las variables de `next/font` con `--font-display`, `--font-body` y `--font-phonetic`. Quita `@import` de Google Fonts si existe y elimina las fuentes que ya no se usan (Fraunces, Inter, Fragment Mono u otras).
- `body` usa `font-body`, color `text` y fondo `bg`.

### Paso 3 — Tema claro/oscuro y color de acento
- `<html data-theme="dark|light" data-accent="red|orange|amber|green|emerald|teal|blue|purple|pink">`. Por defecto `dark` y `blue`.
- Un script inline en `<head>` aplica la elección guardada antes de la hidratación (sin parpadeo) y respeta `prefers-color-scheme` si el usuario no eligió.
- Un hook `useAppearance()` expone `theme`, `accent`, `setTheme`, `setAccent`, guarda en `localStorage` (y en el perfil si ya existe esa preferencia en backend).
- Migra el selector actual a este modelo: el usuario solo cambia `accent`; pastel, tinta y neutros no cambian nunca con su elección.

### Paso 4 — Reglas para el equipo y para agentes
Crea `docs/design-system/RULES.md` (y enlázalo desde el `AGENTS.md` o `.cursorrules`/reglas de Antigravity del repo) con reglas concretas y verificables:
- Prohibido hex, `rgb()`, `oklch()` y valores arbitrarios de Tailwind en componentes y páginas. Solo utilidades generadas desde tokens.
- `accent` solo en: botón primario, nav activo, paso actual, chip “En curso”, barra de progreso neutra, anillo de foco, swatch seleccionado. Como texto sobre fondo neutro se usa `accent-text`, nunca `accent`.
- El color de una tarjeta lo decide el TIPO de contenido (tabla de `components/Card.md`), nunca el tema.
- Sobre pastel todo es `ink` / `ink-secondary` / `ink-muted`. Nada de `text` ni `accent` encima de pastel.
- Máximo un botón `primary` por tarjeta; si ya hay uno arriba en la pantalla, las tarjetas usan `ink`.
- Toda palabra o frase en inglés lleva IPA (fuente `phonetic`), traducción y botón de audio.
- Iconos: `lucide-react`, trazo 1.8 en navegación y 2–2.2 en botones. Nunca emoji.
- Sin sombras en tarjetas; `shadow-float` solo en flotantes.
- Controles de 44px mínimo, foco visible de 3px con `focus-ring`, estado nunca codificado solo con color.
- Textos de UI: tuteo, verbo al inicio, duraciones visibles (“Empezar · 4 min”).
- Antes de crear un componente nuevo, busca en `src/components/ui`. Si no existe, se documenta en `docs/design-system/components/` antes de usarlo en una pantalla.
- Añade un script `npm run lint:design` que falle si encuentra hex/`oklch(`/valores arbitrarios fuera de `src/styles/`.

### Entrega de la fase 1
Resumen de archivos creados y modificados, capturas de una página cualquiera en oscuro y claro con dos acentos distintos, y lista de lo que quedó con alias temporal.

---

## Fase 2 — Componentes reutilizables

Con la base de la fase 1, crea la librería en `src/components/ui/`, una carpeta por componente (`Button/Button.tsx`, `index.ts`). Especificación exacta: `docs/design-system/components/<Nombre>.md` + las reglas `.ej-*` de `bundle.css` (tamaños, radios, bordes, estados). Réplica fiel con utilidades de Tailwind basadas en tokens; no importes `bundle.css`.

Componentes: `Button`, `IconButton`, `Card` + `CardInset` (el inset toma el tono `-soft` de su tarjeta vía contexto), `Chip`, `NavItem` + `NavLabel`, `ProgressBar`, `Stepper`, `ActivityRow` + `ActivityList`, `Feedback`, `SoundTile`, `ThemePicker`, más `Ipa` (texto fonético) e `IllustrationPlate`.

Reglas de API:
- Variantes tipadas con uniones de los nombres del sistema (`tone: 'sky' | 'butter' | 'coral' | 'lilac' | 'mint' | 'neutral'`), no strings libres. Usa `cva` + `tailwind-merge` (o lo que ya use el repo).
- `Button` e `IconButton` renderizan `<button>` o `<Link>` (`asChild` o `href`); `IconButton` exige `aria-label` en el tipo.
- `Card` pasa su tono por contexto para que `Chip`, `CardInset`, `ProgressBar` e `IconButton` dentro de ella elijan solos su `-deep`/`-soft`/`ink`.
- `Feedback` usa `role="status"` o `role="alert"` según el estado y reserva su alto.
- Si hoy los botones disparan sonidos o animaciones del sistema de UI, `Button` debe conservar ese comportamiento (prop o hook existente), no reimplementarlo.
- Accesibilidad según cada `.md` (`aria-current`, `radiogroup` en `ThemePicker`, etc.).

Crea `/dev/design-system` (solo en desarrollo) que muestre cada componente con todas sus variantes y estados, con controles para cambiar tema y acento. Compárala con `screens/Estados.dc.html`, `screens/Estilos.dc.html` y `screens/Acentos.dc.html` y lístame las diferencias que veas.

No migres pantallas todavía.

---

## Fase 3 — Pantallas (una por conversación)

Migra la pantalla `<ruta>` usando `docs/design-system/screens/<Archivo>.dc.html` como referencia visual y SOLO componentes de `src/components/ui`. Si falta un componente, detente y propónmelo documentado antes de crearlo. Mantén la lógica y los datos actuales; solo cambia la presentación. Al terminar, `npm run lint:design` debe pasar para los archivos tocados.

Orden sugerido: Navegación (sidebar) → Inicio (`Correcciones.dc.html`) → Práctica y Ejercicios → Sound Lab → Mazos / Palabras esenciales → resto.
