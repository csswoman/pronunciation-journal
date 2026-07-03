# Estrategia de Testing

Fecha: 2026-07-03

## Capas de Tests

| Capa | Comando | Config | Cuándo corre |
|---|---|---|---|
| **Unit** | `pnpm test` | `vitest.config.ts` | En cada CI push/PR |
| **Coverage** | `pnpm test:coverage` | `vitest.config.ts` (con `coverage`) | En cada CI push/PR |
| **Integration** | `pnpm test:integration` | `vitest.integration.config.ts` | Manual / pipeline staging |

Los tests de integración requieren credenciales reales (Supabase, Gemini) y están
excluidos del `pnpm test` por defecto para mantener CI rápido.

## Umbrales de Cobertura

### Actuales (Jul 2026)

Los umbrales globales son conservadores y solo protegen contra pérdida catastrófica
de tests. No son métricas de vanidad — el objetivo es que suban gradualmente.

| Métrica | Umbral actual | Baseline medido |
|---|---|---|
| Lines | 50% | ~55% |
| Functions | 45% | ~54% |
| Statements | 50% | ~55% |

### Targets por archivo crítico (a alcanzar, no aplicados en CI todavía)

| Archivo | Target lines | Target functions | Justificación |
|---|---|---|---|
| `lib/api/guards.ts` | 80% | 80% | Seguridad — cualquier regresión es un riesgo |
| `lib/gemini/fallback.ts` | 90% | 90% | Fallback incorrecto = fallo silencioso en AI |
| `lib/gemini/client.ts` | 70% | 70% | Timeout y retry deben ser correctos |
| `lib/practice/srs.ts` | 80% | 80% | Correctitud del SRS afecta aprendizaje |
| `lib/api/guards.ts` — `redactError` | 90% | 90% | PII leak si falla |

Para aplicar umbrales per-archivo, añadirlos en `vitest.config.ts` bajo
`coverage.thresholds["ruta/al/archivo.ts"]` cuando los tests existan.

## Archivos con Baja Cobertura Conocida

- `lib/api/guards.ts` (41% líneas): muchas ramas son paths de error difíciles de
  alcanzar con mocks; priorizar tests de integración sobre unitarios aquí.
- `lib/gemini/client.ts` (nuevo): aún sin tests directos; la cobertura llega
  indirectamente por las rutas Gemini.

## Convenciones

- Archivos de test: `__tests__/nombre.test.ts` junto al código.
- Tests de integración: `nombre.integration.test.ts`.
- Ambiente DOM: declarar `// @vitest-environment jsdom` al inicio del archivo.
- Mocks de Supabase: usar el patrón de `vi.mock('@/lib/supabase/server')` establecido.
- No usar snapshots para respuestas de AI — los prompts cambian frecuentemente.
