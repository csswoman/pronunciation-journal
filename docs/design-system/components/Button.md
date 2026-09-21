Botón en forma de píldora con cinco variantes; solo `primary` usa el color de tema del usuario.

| Variante | Clase | Dónde |
|---|---|---|
| Primario | `ej-btn ej-btn--primary` | La acción principal de una tarjeta o pantalla (Empezar, Registrar). Uno por tarjeta. Sigue a `--accent`. |
| Tinta | `ej-btn ej-btn--ink` | Acción principal SOBRE una tarjeta pastel cuando ya hay un primario en pantalla (Comenzar, Ver el día completo). |
| Contorno | `ej-btn ej-btn--outline` | Acciones secundarias sobre pastel (Guardar, Otra). |
| Neutro | `ej-btn ej-btn--neutral` | Acciones de cabecera sobre `bg` (Guía de la app). |
| Butter / Mint | `ej-btn--butter`, `ej-btn--mint` | Casos fijos: Guardar progreso (butter) y el flotante Coach (mint, con `shadow-float`). |

Tamaños: `--sm` 40px, por defecto 44px, `--lg` 54px (`control-*`). Icono de 18px a la derecha para avanzar (flecha), a la izquierda para acciones (marcador, recargar).

Reglas:
- Usa `<button>` o `<a>` reales; el anillo de foco usa `focus-ring`.
- Máximo un `primary` por tarjeta; si la pantalla ya tiene uno arriba, las demás tarjetas usan `ink`.
- Texto en infinitivo o imperativo corto: “Empezar · 4 min”, no “Haz clic aquí”.
