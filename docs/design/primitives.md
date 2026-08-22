# Primitivas actuales

Inventario alineado con el código tras unificar secondary, radios, Badge e IPA.
Si este archivo discrepa de un componente, gana el componente.

## Acciones

| Pieza | Archivo | Contrato vigente |
| --- | --- | --- |
| `Button` | `components/ui/Button.tsx` | `primary` = tinta `--cta-bg` (chrome/hub). `secondary` = raised + borde. `soft` / `ghost`. Semánticos solo para significado. Tamaños `sm` 32px / `md` 40px / `lg` 48px. Hit táctil 44px. |
| `PillButton` | `components/ui/PillButton.tsx` | `primary` = hue `--primary` (avance de sesión). `outline` / `quiet`. `rounded-full`. |
| `ListenButton` | `components/ui/ListenButton.tsx` | Audio sobre `PillButton`. No rehacer un play circular. |
| `Anchor` | `components/ui/Anchor.tsx` | URL externa, mailto o hash. Navegación interna: `next/link`. |

`.btn-primary` y `.btn-secondary` en `utilities.css` copian las recetas de `Button`. Trabajo nuevo usa el componente.

## Forma y señal

| Pieza | Radio | Notas |
| --- | --- | --- |
| `layout/Card` | `--radius-md` (12px) | Variantes `default`, `interactive`, `lesson`, `stat`, `compact`. Padding `--layout-card-pad`. |
| `Input`, `Select`, `AuthInput` | `--radius-sm` (8px) | Superficie sunken, borde default, focus `--border-focus`. |
| `Checkbox` | `--radius-xs` (4px) | Microcontrol. |
| `Badge` | full (`sm`) / md (`md`) | Variantes `default`, `success`, `info`, `warning`, `error`, `neutral`. Sin paleta Tailwind. |
| `PillButton` | `--radius-full` | Solo sesión. |

`--radius-xs` está definido en `tokens.css` y en `theme.css`.

## Tipo

| Utilidad | Familia | Uso |
| --- | --- | --- |
| `text-h*` / `font-body` / `font-label` | DM Sans | Chrome y lectura. |
| `.font-kicker` | DM Mono | Kickers y notación técnica. |
| `.font-ipa` / `.font-phoneme` / `.ipa` | Andika | IPA. No DM Mono. |

## Layout

`AppShell → PageLayout → PageHeader → contenido`.

| `archetype` | Ancho | Uso |
| --- | --- | --- |
| `dashboard` | `--layout-canvas-max` (80rem) | Home, Progress, Review. Opcional `banner` + `rail`. |
| `catalog` | 80rem | Grids y listas. |
| `session` | `--layout-session-max` (720px) | Diario, Essential Words, ejercicios. |
