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

## Campo errorPattern en annotate_turn

La herramienta `annotate_turn` incluye el campo opcional `errorPattern` en el
objeto `correction`. Cuando el modelo produce `kind:"error"`, debe rellenar
`errorPattern` con el id del `ErrorPatternId` que mejor describe el fallo.
Si ningún id encaja, lo omite. El campo **no va en `required`** para que
correcciones sin etiqueta sigan siendo válidas.

El campo viaja en el `enum` del schema de la herramienta (ver
`lib/ai-practice/tools/declarations.ts`) por lo que el modelo conoce la
taxonomía cerrada de 16 ids sin listarlos en el prompt.

### Validación en el cliente

`parseTurnCorrection` (`lib/ai-practice/tools/registry.ts`) conserva
`errorPattern` solo si se cumplen ambas condiciones:

1. `isErrorPatternId(value)` — el id está en `ERROR_PATTERN_IDS`.
2. `kind === "error"` — las correcciones `unnatural` no tienen patrón.

Ids inventados o `errorPattern` en correcciones `unnatural` se descartan
silenciosamente; la corrección sigue siendo válida.

### Registro en la cola de reincidencia

El hook `useCoachErrorRecurrence` (`hooks/useCoachErrorRecurrence.ts`) llama a
`recordPracticeErrorRecurrence` cuando recibe un turno en vivo con corrección
válida. Garantías:

- **Una vez por patrón por conversación**: al restaurar el historial, se hidrata
  el conjunto desde las correcciones visibles ya guardadas. Los mensajes antiguos
  sin estado de guardado se consideran registrados; los que guardan estado
  `failed` permiten reintentar.
- **Solo camino vivo**: cargar historial (`loadMessages`) no escribe en la cola;
  solo recupera la deduplicación. Los turnos ocultos/automatizados no se guardan.
- **Aviso fiel al guardado**: “Lo repasarás en tu práctica” aparece cuando la
  escritura local en Dexie tuvo éxito. Si falla, el Coach lo indica y permite
  reintentar; en modo invitado solo muestra el patrón detectado.
- **Sin requests extra**: el campo viaja en la llamada `annotate_turn` ya
  existente; no hay nuevas peticiones a `/api/gemini/*`.
