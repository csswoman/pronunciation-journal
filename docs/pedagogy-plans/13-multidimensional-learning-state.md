# Separar conocimiento, escucha, uso y pronunciación

Estado: implementada localmente. La señal se conserva offline; la sincronización entre dispositivos se añadirá cuando exista su contrato remoto.

Este brief reemplaza el estado binario “conocido” por señales que representan capacidades distintas.

## Objetivo

Permitir que el alumno declare familiaridad o dificultad sin producir una afirmación falsa de dominio.

## Alcance

- Modelar significado, escucha, uso y pronunciación como dimensiones independientes
- Conservar autodeclaración, evidencia objetiva y mastery como señales separadas
- Redefinir “Ya la conozco” como familiaridad seguida por verificación
- Añadir “Me cuesta pronunciarla” sin reiniciar significado o uso
- Definir migración y fallback para estados anteriores

## Fuera de alcance

- Convertir una autodeclaración en mastery
- Pausar todos los modos de una palabra conocida
- Crear una puntuación global que mezcle modalidades
- Duplicar estado persistente entre Dexie y Zustand

## Dependencias

Puede comenzar después de acordar la identidad del plan 10. El plan 14 consume la dimensión de pronunciación.

## Criterios de aceptación

- “Ya la conozco” reduce repetición de significado y programa una verificación
- Fallar la verificación devuelve el objetivo al flujo adecuado
- “Me cuesta pronunciarla” conserva las demás dimensiones
- Cada respuesta actualiza solo la modalidad que evaluó
- Progreso muestra estados independientes sin inventar dominio general
- La reconciliación offline es idempotente
