# Enrutar dificultades de pronunciación

Estado: implementación inicial. Las señales de dificultad proponen solo chunks con relación autoral y presentan percepción antes de recuperación/producción. La ruta normaliza únicamente el prefijo histórico `core1k:` del fallback diario al namespace autorado `c1k:`; no infiere vínculos por texto. Cuando el target autorado es un contraste y su dataset está disponible, reutilizan un par mínimo real; después usan shadowing con grabación y fallback no puntuado. Falta calibrar la cadencia con evidencia del piloto.

Este brief transforma “Me cuesta pronunciarla” en una práctica auditiva y oral concreta.

## Objetivo

Llevar una palabra difícil hacia percepción, comparación y transferencia dentro de chunks útiles.

## Alcance

- Crear una cola de dificultad de pronunciación por target canónico
- Resolver palabras hacia chunks y sonidos autorales
- Aplicar la escalera escuchar, distinguir, repetir, grabar, comparar y transferir
- Mostrar por separado inteligibilidad, feedback derivado y análisis acústico
- Reutilizar el fallback de capacidad de habla existente

## Fuera de alcance

- Afirmar precisión fonética solo porque STT reconoció el texto
- Generar un score acústico sin evaluador acústico
- Guardar TTS automáticamente
- Obligar a grabar cuando falta capacidad o permiso

## Dependencias

Requiere los planes 10 y 13. Puede reutilizar la ruta de pronunciación y los drills existentes.

## Criterios de aceptación

- Marcar `achieved` como difícil propone un chunk que contiene esa forma
- El alumno escucha el contraste antes de la producción exigente
- La grabación puede compararse y repetirse sin afirmar un score inexistente
- El resultado actualiza pronunciación, no significado ni uso por accidente
- La dificultad reaparece según evidencia y no en cada sesión
- La experiencia tiene fallback no puntuado y offline cuando corresponda
