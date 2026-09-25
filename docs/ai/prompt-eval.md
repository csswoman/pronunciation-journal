# Evaluación de prompts JSON

`scripts/prompt-eval/cases/` contiene 12 entradas fijas: seis para producción
escrita y seis para corrección del Diario. El ejecutor usa los prompts de
`lib/ai-prompts.ts`, los mismos esquemas Zod de las rutas y `callWithFallback`
directamente; no llama a las rutas por HTTP ni necesita una sesión de usuario.

## Ejecutar

En PowerShell, desde la raíz del repositorio:

```powershell
$env:NODE_OPTIONS='--conditions=react-server'
pnpm tsx scripts/prompt-eval/run.ts
```

Node necesita la condición `react-server` para importar el presupuesto de IA.
El script lee `GEMINI_API_KEY` desde el entorno o `.env.local`, usa por defecto
el primer modelo de `QUALITY_FALLBACK_MODELS` y ejecuta **como máximo una llamada
por caso (12 en total)**. Espera 4,5 segundos entre llamadas. La reserva de cuota
compartida sigue activa; los errores del proveedor detienen la corrida y no
permiten actualizar la línea base. Los casos sintéticos no contienen datos de
usuarios.

Para aislar un caso: `pnpm tsx scripts/prompt-eval/run.ts --case=grade-a1-article`.
`--model=<id>` acepta solo modelos de texto de las cadenas gratuitas verificadas.
`--legacy` desactiva el esquema nativo y sirve para contrastar el comportamiento
anterior. Ninguna de estas opciones modifica `baseline.json` en una corrida
parcial.

## Línea base y cambios

`scripts/prompt-eval/baseline.json` registra la evaluación previa al Plan 036:
**8/12 casos, cero errores de parseo**, con `gemini-3.5-flash-lite`. Tras añadir
esquemas y ajustar los prompts, una corrida completa con el mismo modelo obtuvo
**11/12 y cero errores de parseo**. El caso restante produjo flags coherentes
pero un `correct` contradictorio; la ruta deriva `correct` de esos flags.
El esquema nativo respondió en pruebas aisladas con `gemini-3.5-flash-lite`,
`gemini-3.1-flash-lite` y `gemini-2.5-flash-lite`. Dos intentos con el modelo
de respaldo `gemini-3.8-flash` terminaron en 503 y timeout, respectivamente;
su aceptación del esquema no quedó comprobada en vivo.

Después de cambiar un prompt, corre los 12 casos y compara el total con la
línea base. Revisa las respuestas y los fallos concretos antes de aceptar una
mejora: superar el número no prueba por sí solo la calidad pedagógica. Actualiza
`baseline.json` solo con una corrida completa, sin fallos de proveedor ni parseo,
y conserva el registro anterior al modificarla. Los avisos de telemetría
indican el estado de la migración de Supabase; no equivalen a un fallo de la
respuesta del modelo.
