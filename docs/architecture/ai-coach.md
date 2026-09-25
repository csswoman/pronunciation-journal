# AI Coach: turnos y coste de requests

El Coach genera la práctica en lotes para reservar las llamadas a Gemini para
decisiones que realmente necesitan al modelo. Cuando detecta una petición de
práctica, el servidor solicita cinco herramientas en un mismo turno: dos de
opción múltiple, dos de completar y una de producción oral.

## Flujo de una práctica

1. El cliente envía la petición de práctica: **1 request**.
2. La respuesta contiene las cinco llamadas de herramienta. `BubbleContent`
   las entrega juntas a `PracticeSession`.
3. `PracticeSession` avanza entre ejercicios con estado local. Cada acción
   **Siguiente** cuesta **0 requests**.
4. Al terminar, el cliente calcula aciertos y temas por revisar y muestra un
   resumen local: **0 requests**.
5. **Comentar con el Coach** es opcional y explícito. Solo ese botón envía una
   nueva petición: **1 request adicional**.

Por tanto, completar un set cuesta una request, frente a una por ejercicio y
otra por el resumen en el flujo anterior.

## Contexto enviado al modelo

Antes de construir el historial de Gemini, el servidor conserva como máximo
los últimos 16 mensajes. El corte comienza en un mensaje de usuario con texto
y no deja una respuesta de herramienta separada de su llamada. El objetivo y
las reglas de las misiones viven en el prompt de sistema, por lo que no dependen
de conservar todo el chat.

## Evitar repeticiones

Cada herramienta de ejercicio mostrada guarda en `coachSeenItems` un enunciado
normalizado, asociado a la cuenta y limitado a 80 caracteres. Antes del
siguiente turno, el cliente lee los 20 más recientes y los envía como
`recentStems`; el prompt pide no repetir esas oraciones ni variaciones mínimas.
La tabla es solo local y un fallo de IndexedDB no bloquea el chat.

Para cada petición de práctica, el cliente rota entre vida diaria, trabajo,
viajes, intereses del perfil y errores recientes. Los tres últimos ángulos se
guardan por cuenta en `practicePrefs`, de modo que tres peticiones consecutivas
no repiten escenario. También envía el orden exacto de los cinco formatos,
manteniendo siempre el reparto 2 opción múltiple, 2 huecos y 1 speaking.
