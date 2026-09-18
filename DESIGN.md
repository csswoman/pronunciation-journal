# Sistema de Diseño — English Journal

## 1. Visión y Principios
English Journal es un entorno personal de práctica de inglés para hablantes de español. La interfaz transmite calma, legibilidad y sobriedad:
- **Tres capas de color bien definidas**: Neutros responsivos a la apariencia, pasteles de contenido fijos y un único color de acento personalizable.
- **Sin colores sueltos**: Todo color, radio, fuente y espaciado proviene estrictamente de los tokens semánticos del sistema.
- **Tipografía con propósito**: Bricolage Grotesque (display 800) para números y títulos principales; Figtree para UI y lectura; Noto Sans exclusivamente para transcripciones fonéticas IPA.
- **Contraste garantizado**: Contraste mínimo de 4.5:1 en todo texto (3:1 en texto ≥24px e iconos de controles) tanto en tema claro como oscuro.

---

## 2. Arquitectura de Color: Tres Capas

La aplicación de color se controla mediante atributos en la etiqueta `<html>`:
```html
<html data-theme="dark" data-accent="blue">
```

### Capas y comportamiento
| Capa | ¿Cambia con el acento de tema? | ¿Cambia con claro/oscuro (`data-theme`)? |
|---|---|---|
| **Neutros** | No | **Sí** |
| **Pastel de contenido + Tinta** | No | No |
| **Acento** | **Sí** | No |

---

### 2.1 Capa 1: Neutros (Tokens responsivos a `data-theme`)

| Token | `data-theme="dark"` | `data-theme="light"` | Uso |
|---|---|---|---|
| `--bg` | `#0d1018` | `#f6f4ef` | Fondo principal de la página |
| `--bg-sidebar` | `#11151f` | `#efebe3` | Fondo de la barra lateral |
| `--surface` | `#141925` | `#ffffff` | Tarjetas planas, paneles base |
| `--surface-raised` | `#1b2130` | `#f1eee7` | Tarjetas elevadas, modales, menús |
| `--field` | `#1a1f2c` | `#ebe7de` | Campos de entrada, recuadros insets |
| `--border` | `#262d3d` | `#e2ddd2` | Bordes sutiles y divisores |
| `--border-strong` | `#2f3749` | `#b9b2a4` | Bordes de énfasis y controles |
| `--text-strong` | `#ffffff` | `#0a0c11` | Títulos principales y máxima jerarquía |
| `--text` | `#eef1f7` | `#12151c` | Texto del cuerpo principal |
| `--text-secondary` | `#c9cfdb` | `#2c3445` | Subtítulos y texto descriptivo |
| `--text-muted` | `#aab2c4` | `#4a5263` | Metadatos y etiquetas secundarias |
| `--text-faint` | `#7c8499` | `#636a78` | Deshabilitados y leyendas tenues |

---

### 2.2 Capa 2: Fijos y Pasteles de Contenido (Iguales en ambos temas)

#### Fijos (Tinta y Papel)
* `ink`: `#12151c` (Tinta principal)
* `ink-secondary`: `#2c3445` (Tinta secundaria)
* `ink-muted`: `#4a5263` (Tinta atenuada)
* `paper`: `#ffffff` (Papel blanco puro)
* `on-accent`: `#ffffff` (Texto sobre botón de acento)

#### Pastel de contenido
| Nombre | Base | Deep | Soft | Uso asignado |
|---|---|---|---|---|
| **sky** | `#b9d3fb` | `#9ec0f6` | `#eaf2fe` | Sesión de hoy, cursos, rutas, lecciones guiadas |
| **butter** | `#f8e08e` | `#efd06a` | `#fdf3cf` | Frases, expresiones, lecciones teóricas, hitos |
| **coral** | `#f7b7a6` | `#ee9f8b` | `#fde4dc` | Vocabulario, palabras, pronunciación |
| **lilac** | `#cbbcf5` | `#b1a0ea` | `#ece6fd` | Progreso, mazos, gramática |
| **mint** | `#a8e6c9` | `#86d6b0` | `#e3f6ec` | Inmersión, práctica, registro, racha, Coach |

#### Reglas estrictas dentro de `PastelCard`:
Componente/clase `PastelCard` con `data-tone="sky|butter|coral|lilac|mint"` redefine en su scope:
* `--text` y `--text-strong` → `ink`
* `--text-secondary` → `ink-secondary`
* `--text-muted` y `--text-faint` → `ink-muted`
* `--border` → `rgb(18 21 28 / 0.15)`

Superficies internas por capas relativas:
* `pastel-card-inset` (caja de ejemplo / muestra): `rgb(255 255 255 / 0.55)`
* `pastel-card-panel` (panel blanco interior): `rgb(255 255 255 / 0.90)`
* `pastel-card-chip` (chips, pistas de audio): `rgb(18 21 28 / 0.08)`
* `pastel-card-row-active` (fila activa en panel): `color-mix(in oklch, var(--card) 40%, white)`

Prohibido dentro de `PastelCard`: opacidad o alfa en texto, tokens neutros sin remapear o capas translúcidas anidadas.

---

### 2.3 Capa 3: Acento (`data-accent`)

El acento es dinámico y seleccionable por el usuario entre 9 valores predefinidos (todos con contraste ≥ 4.5:1 sobre texto blanco):
1. `red`: `#dc2626`
2. `orange`: `#c2410c`
3. `amber`: `#b45309`
4. `green`: `#15803d`
5. `emerald`: `#047857`
6. `teal`: `#0e7490`
7. **`blue`: `#2563eb` (predeterminado)**
8. `purple`: `#7c3aed`
9. `pink`: `#be185d`

**Uso exclusivo del acento:**
- Botón primario (`Button` `variant="primary"`).
- Ítem de navegación activo.
- Tab/segmento activo.
- Número del paso actual en flujos/steppers.
- Chip de estado "En curso".
- Barras de progreso sobre fondo neutro.
- Anillo de foco (`outline: 3px solid var(--accent)`).
- Swatch de tema seleccionado.

*Nunca usar el acento como fondo de tarjeta ni como texto pequeño sobre fondo oscuro.*

---

### 2.4 Feedback (Alias de Pasteles)
El feedback de ejercicios utiliza la paleta pastel y **NUNCA** tonos verdes o rojos oscuros saturados:
* `feedback-correct`: mint (`#a8e6c9`) · `feedback-correct-soft`: mint-soft (`#e3f6ec`)
* `feedback-wrong`: coral (`#f7b7a6`) · `feedback-wrong-soft`: coral-soft (`#fde4dc`)
* `feedback-hint`: butter (`#f8e08e`) · `feedback-hint-soft`: butter-soft (`#fdf3cf`)

---

## 3. Tipografía (Google Fonts)

* **Bricolage Grotesque 800** → `--font-display` (cifras y títulos principales)
* **Figtree 400/500/600/700** → `--font-body` (interfaz y lectura general)
* **Noto Sans 400/500/700** → `--font-phonetic` (EXCLUSIVO para símbolos IPA: `ɪ ə ð ː ˈ`)

| Estilo | Familia | Tamaño / LineHeight | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| `font-hero` | display | 60px / 60px | 800 | -0.03em | Heroes de puntuación / grandes hitos |
| `font-display` | display | 46px / 48px | 800 | -0.02em | Títulos de gran tamaño |
| `font-headline` | display | 36px / 37px | 800 | -0.025em | Encabezados principales de página |
| `font-numeral` | display | 34px / 36px | 800 | -0.02em | Números destacados y contadores |
| `font-title` | body | 19px / 24px | 700 | Normal | Títulos de tarjetas y secciones |
| `font-body-lg` | body | 17px / 26px | 500 | Normal | Texto de lectura destacado |
| `font-body` | body | 15px / 22px | 400 | Normal | Texto de cuerpo por defecto |
| `font-body-sm` | body | 14px / 20px | 400 | Normal | Subtítulos y texto descriptivo |
| `font-caption` | body | 13px / 18px | 600 | Normal | Etiquetas de UI y metadatos |
| `font-overline` | body | 12px / 16px | 700 | 0.14em, MAYÚSCULAS | Kickers de sección y super-etiquetas |
| `font-ipa-lg` | phonetic | 20px / 28px | 400 | Normal | Transcripción IPA destacada |
| `font-ipa` | phonetic | 18px / 26px | 400 | Normal | Transcripción IPA estándar |

---

## 4. Escala de Espaciado, Forma y Tamaños

### Espaciado
Escala basada en cuadrícula de 4px:
`4px` · `8px` · `12px` · `16px` · `20px` · **`22px` (gap de cuadrícula)** · **`24px` (padding de tarjeta)** · `28px` (tarjeta principal) · `40px` (margen de página)

### Radios de Borde
* `6px` (`rounded-xs`): teclas KBD y etiquetas de código.
* `12px` (`rounded-md`): navegación y campos de formulario.
* `14px` (`rounded-lg`): filas de lista y tiles.
* `20px` (`rounded-xl`): recuadros insets.
* **`28px` (`rounded-3xl`)**: tarjetas contenedoras principales.
* `999px` (`rounded-full`): botones y chips.

### Variante Compacta
Para todo elemento secundario: padding 18–20px, radio 24px, botones 40–44px, título 17–18px. La escala grande (padding 24–28px, radio 28px) se reserva para la tarjeta principal de cada pantalla.

### Tamaños de Controles
* `40px`: control pequeño / secundario.
* `44px`: mínimo táctil accesible (md).
* `54px`: botón CTA de avance principal (lg).
* `58px`: botón de audio principal.

### Sombras
Las sombras se reservan **únicamente para elementos flotantes** (desplegables, menús, modales, hojas emergentes). Las tarjetas resting no llevan sombra ni bordes de color laterales.

---

## 5. Componentes y Tabla de Estados

### Componentes Base
* **`Button`**: `primary` (acento), `ink` (sobre pastel), `outline` (1.5px ink), `neutral`, `butter`, `mint`. Máximo un CTA `primary` por zona.
* **`IconButton`**: `audio` 58px (ink + icono sky), `audio-sm` 34px, `neutral` 48px. `aria-label` en español.
* **`Chip` / `Badge`**: `ink` (sección), `outline` (contador), `status` (`accent`, "En curso"), tono `-deep` por tarjeta, `neutral`. Radios a 999px.
* **`PastelCard`**: Tarjeta pastel contenedora con scoping estricto `data-tone`.
* **`Feedback`**: Componente de veredicto con menta/coral/amarillo, estructura con icono + veredicto + respuesta esperada + explicación. ARIA `status`/`alert`.
* **`SoundTile`**: Tarjeta de sonido con IPA a 42px en `font-phonetic` 700, color por familia (vocales lila, consonantes azul, sonido del día amarillo), chip de estado y 2 píldoras de muestra.
* **`Stepper`**: Discos numerados (actual en acento, completado en ink con check, futuro en surface-raised) y barra proporcional.

---

### Tabla Oficial de Estados
| Estado | Sobre fondo pastel | Sobre fondo neutro |
|---|---|---|
| **Reposo** | Transparente + borde 1.5px `ink` | Surface + borde `border-strong` |
| **Hover** | `rgb(18 21 28 / 0.08)` | Surface-raised |
| **Pulsado** | `rgb(18 21 28 / 0.14)` | Surface-raised + borde `border-strong` |
| **Foco** | `outline: 3px solid var(--accent); outline-offset: 2px` | Igual |
| **Seleccionado / Activado** | Relleno `ink` (o pastel de categoría) + `aria-pressed` + icono relleno | Igual |
| **Deshabilitado** | `rgb(18 21 28 / 0.10)` + texto `ink-muted` + `cursor: not-allowed` | Surface-raised + text-muted |

---

## 6. Voz e Idioma

* **Español con tuteo**: Toda la interfaz de usuario utiliza español claro, frases cortas y verbos de acción al inicio (`Empezar`, `Practicar`, `Explorar`).
* **Inglés para contenido de estudio**: Solamente las palabras, frases e IPA de estudio se muestran en inglés, acompañadas de su fonética en `font-phonetic` y su traducción en `ink-muted`.
* **Formatos limpios**: Símbolos IPA presentados sin barras ni corchetes duplicados.
