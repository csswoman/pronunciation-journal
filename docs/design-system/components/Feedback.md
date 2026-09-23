Avisos de acierto, error y pista para los ejercicios: un bloque en pastel con tinta, nunca verde o rojo saturados.

Tres estados, cada uno con su color de contenido:

| Estado | Fondo | Cuándo | Icono |
|---|---|---|---|
| Acierto | `feedback-correct` (menta) | La respuesta es correcta | check |
| Error | `feedback-wrong` (coral) | La respuesta es incorrecta | cruz |
| Pista | `feedback-hint` (amarillo) | Media respuesta, aviso o ayuda antes de responder | bombilla |

Reglas:
- Todo el texto dentro del bloque es `ink`; el detalle secundario, `ink-muted`. Los rojos y verdes puros sobre fondo oscuro no llegan a 4.5:1 y rompen la paleta.
- El color nunca va solo: el bloque lleva icono y una frase que dice qué pasó. Así funciona para quien no distingue los tonos.
- Estructura: veredicto en una línea (“¡Correcto!”, “No es esa forma”) → la respuesta esperada en negrita cuando falló → una frase de explicación como máximo.
- En preguntas de opción múltiple, el mismo código de color va en las opciones: la correcta en menta con check, la elegida por error en coral con cruz, y las demás sin color y atenuadas.
- El bloque aparece DESPUÉS de comprobar y no desplaza el contenido de golpe: reserva su alto o anímalo con un fundido corto.
- Anunciar con `role="status"` (acierto y pista) o `role="alert"` (error) para lectores de pantalla.
- Debajo del bloque van las acciones: “Intentar de nuevo” en contorno y “Continuar” en el color de tema, con el atajo `Enter` visible.
