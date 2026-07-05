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

### Targets por archivo crítico (aplicados en CI desde Jul 2026)

Umbrales en `vitest.config.ts` bajo `coverage.thresholds["ruta/al/archivo.ts"]`.
Cada valor es ~5 puntos por debajo de la cobertura medida para evitar falsos
positivos mientras se añaden tests.

| Archivo | Lines | Functions | Justificación |
|---|---:|---:|---|
| `lib/api/guards.ts` | 48% | 45% | Seguridad — subir gradualmente hacia 80% |
| `lib/api/require-admin.ts` | 95% | 95% | Gate admin server-side |
| `lib/gemini/client.ts` | 88% | 80% | Timeout y fallback |
| `lib/gemini/fallback.ts` | 95% | 95% | Cadena de modelos |
| `lib/practice/queries.ts` | 62% | 60% | Persistencia de respuestas |
| `lib/sync/sync-manager.ts` | 72% | 95% | Outbox offline |

Para subir un umbral: medir con `pnpm test:coverage`, actualizar el valor en
`vitest.config.ts` y documentar aquí.

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
