# Estilos inline: política y excepciones

Los componentes deben preferir utilidades Tailwind y tokens CSS compartidos.
Esta página define la política; no pretende ser un inventario estático de cada
uso existente de `style={{ ... }}`, porque ese inventario se desactualiza con
facilidad.

## Permitido

Un estilo inline es válido cuando el valor solo existe en tiempo de ejecución:

- Una dimensión o transformación calculada (`width`, `scaleX`, posición de un
  popover o `animationDelay`).
- Una propiedad CSS personalizada que transporta estado hacia CSS
  (`style={{ "--p": value }}`).
- Un color o gradiente construido desde datos que ya están semánticamente
  clasificados por el dominio.

El valor dinámico debe seguir usando un token cuando hay uno disponible. Por
ejemplo, un progreso puede calcular su ancho inline, pero su color debe venir de
`--primary` o de un token semántico, no de un hex nuevo.

## No permitido en trabajo nuevo

- Tipografía, espaciado, radio, sombra, color estático o borde que una utilidad
  o token ya representa.
- Valores que impidan el tema dinámico (`--hue`) o el modo oscuro.
- Un estilo inline para resolver una inconsistencia de componente que debe vivir
  en una primitiva compartida.

## Al cambiar un componente

1. Conserva los usos runtime que expliquen su valor calculado.
2. Mueve los valores estáticos a tokens, utilidades o CSS del dominio.
3. Verifica claro, oscuro y un hue alternativo cuando el estilo afecta color.
4. Si la excepción revela una necesidad recurrente, propone una primitiva o
   token; no copies el mismo objeto `style` en más de una superficie.

La autoridad general del sistema está en [README.md](README.md).
