Progreso por pasos de una ruta larga: discos numerados unidos por una barra que se rellena con el avance real.

- El paso actual va en `accent` con texto blanco; los siguientes en `surface-raised` con borde `border-strong`; los terminados en `ink` con un check.
- Bajo cada disco, nombre del paso y una línea con lo que contiene (“3 de 9”, “2 unidades”). Sin esa línea el stepper no informa de nada.
- La barra entre dos discos se rellena en proporción a las unidades hechas de ese paso, no a saltos.
- Va en una tarjeta `neutral` a ancho completo, encima del contenido del paso actual; nunca dentro de una tarjeta pastel.
- Cinco pasos como máximo en horizontal. Con más, pásalo a vertical en la barra lateral.
- Marca el paso actual con `aria-current="step"` y usa una lista ordenada.
