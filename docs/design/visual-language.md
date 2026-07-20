# Lenguaje visual: proporción y personalidad

Esta guía explica cómo dar personalidad a English Journal sin romper el tema
dinámico ni convertir una superficie de práctica en una landing page. Complementa
[DESIGN.md](../../DESIGN.md): si hay conflicto, `DESIGN.md` y los tokens vivos
en `app/styles/tokens.css` prevalecen.

## Escena de uso

Una persona abre la app en casa, durante un descanso o en el trayecto. Quiere
empezar una práctica o retomar un repaso, no admirar una marca. La interfaz debe
sentirse como un escritorio personal: calma para concentrarse, señales claras
cuando algo merece atención y curiosidad en los detalles fonéticos.

## Proporción de color

La estrategia es restringida. Estos rangos son una brújula de composición, no
una fórmula que deba medirse en píxeles ni un permiso para añadir color.

| Rol visual | Proporción orientativa | Tokens y uso |
|---|---:|---|
| Superficies neutrales | 82–90% | `surface-base`, `surface-raised`, `surface-sunken`; establecen el campo de trabajo. |
| Tema personal | 8–12% | `primary`, `primary-soft` y focus. Señala selección, avance y una acción directa. |
| Estados semánticos | 0–8% | `success`, `warning`, `error`, `info`. Solo aparecen cuando existe ese estado. |
| Acentos de actividad | Puntual | `stage-pairs` y `stage-dictation`, solo dentro de la práctica a la que pertenecen. |

- Consume siempre tokens semánticos o utilidades Tailwind mapeadas a ellos. Nunca derives un color a partir de un número de hue local.
- `--hue` y `.dark` cambian el tema completo. Ningún ejemplo, mockup o componente puede asumir que el color inicial será violeta.
- El color primario no rellena paneles grandes ni decora el fondo. En Home, la prioridad se expresa con posición, texto y contraste antes que con saturación.
- El progreso puede usar una barra compacta con el color del tema. El resultado correcto, una advertencia o un error usan colores semánticos fijos, acompañados de texto o icono.

## Border radius: una escala con significado

El radio comunica el nivel de contención. Usa los tokens existentes, no valores
arbitrarios.

| Radio | Uso permitido | Evitar |
|---|---|---|
| `--radius-xs` (4px) | Microelementos internos, si una pieza realmente necesita una esquina visible. | Tarjetas, botones o campos. |
| `--radius-sm` (8px) | Inputs, selección de navegación, botones pequeños. | Convertirlo en el radio universal. |
| `--radius-md` (12px) | Botones estándar, tarjetas interactivas y bloques de tarea. Es el radio de trabajo. | Mezclarlo con un radio distinto dentro del mismo control. |
| `--radius-lg` (16px) | Contenedores de sesión, bloques de aprendizaje con más presencia. | Apilar varios contenedores grandes. |
| `--radius-xl` (20px) | Tarjetas compactas del aside y superficies que deben sentirse como una pieza tranquila. | Cada tarjeta de una cuadrícula. |
| `--radius-2xl` y superiores | Overlay, diálogo o una pieza excepcional que se eleva de verdad. | Decoración rutinaria. |
| `--radius-full` | Pills de filtros, tags y controles de sesión ya definidos. | Tarjetas, botones principales o navegación general. |

Una fila, tarjeta o control mantiene un solo radio en todos sus estados. No uses
un radio mayor como sustituto de jerarquía: primero cambia estructura, espacio o
énfasis de la acción.

## Tipografía y el detalle distintivo

La app no usa una tipografía decorativa adicional para títulos, botones o
etiquetas. En una UI de práctica eso competiría con el contenido y haría que la
experiencia se sintiera menos personal, no más.

La personalidad tipográfica proviene de tres voces con tareas separadas:

| Voz | Uso | Personalidad |
|---|---|---|
| DM Sans | Lectura, navegación, títulos y acciones. | Cercana y clara. |
| DM Mono | Kickers, notación técnica y pequeños metadatos. | Precisión y curiosidad. |
| Andika (`font-ipa`) | IPA y transcripción fonética. | El detalle propio del aprendizaje de pronunciación. |

- Un fonema puede crecer hasta ser el foco de una tarjeta. No necesita una serif ornamental ni un color de marca para llamar la atención.
- Los kickers solo clasifican. Deben ser breves y no reemplazan un título comprensible.
- No introducir una cuarta fuente para "dar personalidad". Si se necesita un momento expresivo, usa el contenido real, por ejemplo `/ʃ/`, una pareja mínima o una palabra, y la escala tipográfica existente.
- Mantén cuerpo de lectura entre 65 y 75ch. En listas, controles y datos se prioriza la densidad funcional.

## Textura, profundidad y movimiento

- La base es plana. La profundidad viene de las tres superficies y de un borde sutil, no de sombras permanentes.
- Una tarjeta interactiva puede elevarse ligeramente en hover o active. Una tarjeta estática no debe fingir ser clicable.
- Usa iconos solo si cambian la capacidad de escaneo, no para repetir un título.
- El movimiento dura 150–250ms y comunica estado, carga, avance o confirmación. Respeta `prefers-reduced-motion`.

## Lista de control antes de añadir una superficie

1. ¿La jerarquía se entiende en escala de grises? Si no, corrige estructura y copy antes de añadir color.
2. ¿El componente funciona con cualquier `--hue` y en modo oscuro? Si no, sustituye valores locales por tokens.
3. ¿El radio identifica el tipo de superficie y coincide con sus estados? Si no, vuelve a la escala.
4. ¿La personalidad viene de una señal lingüística real o de decoración? Conserva solo la primera.
5. ¿La nueva tarjeta tiene una tarea o un destino claro? Si no, intégrala en la superficie que ya cumple esa tarea.
