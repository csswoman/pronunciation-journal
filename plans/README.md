# Plan de optimización de peso y carga

Generado el 2026-09-14 sobre `7c788c6a`. Ejecutar en orden, con una rama por
plan y sin mezclar cambios de producto con los cortes de bundle.

| Plan | Objetivo | Prioridad | Esfuerzo | Depende de | Estado |
|---|---|---|---|---|---|
| 001 | Hacer fiable la medición de chunks diferidos | P1 | M | — | DONE |
| 002 | Aislar preferencias UI del esquema Dexie | P1 | M | 001 | DONE |
| 003 | Mantener el constructor diario fuera del hub inicial | P1 | M | 001 | DONE |
| 004 | Reducir Review según atribución de módulos | P2 | M | 001 | DONE |

## Dependencias

- El plan 001 define qué significa “carga inicial”; los demás no deben cambiar
  presupuestos a ciegas.
- El plan 002 permite cortar imports de `lib/db` sin alterar evidencia de
  aprendizaje ni sincronización offline.
- El plan 003 conserva el contrato de caché diaria y sólo cambia cuándo llega
  el constructor pesado al navegador.

## Hallazgos descartados

- Aumentar `bundle-budget.json` no es una optimización; sólo es válido tras una
  medición de navegación y una decisión explícita de producto.
- Excluir chunks por nombre hash no es estable con Turbopack.
