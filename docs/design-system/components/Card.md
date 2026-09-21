Tarjeta bento de 28px de radio; su color pastel lo decide el TIPO de contenido, nunca el tema del usuario.

| Contenido | Variante |
|---|---|
| Sesión de hoy, ruta, lecciones guiadas | `ej-card--sky` |
| Frase del día, expresiones | `ej-card--butter` |
| Palabra del día, vocabulario, diccionario | `ej-card--coral` |
| Progreso, mazos, Palabras esenciales | `ej-card--lilac` |
| Inmersión, registro, Coach | `ej-card--mint` |
| Formularios, listas largas, contenido denso | `ej-card--neutral` |

Anatomía: cabecera (chip o icono + título + chip de categoría) → contenido principal (`headline` o `hero`, IPA en `ipa`, traducción) → `ej-inset` para ejemplos (toma el tono `-soft` automáticamente) → acciones al pie.

Reglas:
- Dentro de una tarjeta pastel todo es `ink`: texto, iconos, bordes, ilustraciones.
- Deja al menos una tarjeta neutra por pantalla para que el color respire.
- Sin sombras ni bordes de color laterales. Padding `space-6` (principal: `space-7`).
- Una ilustración como máximo por tarjeta.
