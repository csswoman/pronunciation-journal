# Plan 053: Corregir Journal con Gemini y convertir errores en práctica

## Status

- **Priority**: P1 product
- **Effort**: M
- **Risk**: MED
- **Depends on**: 049, 052
- **Category**: direction
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

Guardar texto no crea un loop de aprendizaje. La corrección debe devolver feedback estructurado, persistirlo idempotentemente y programar los topics errados sin añadir palabras al banco sin consentimiento.

## Current state and target

- `grade-production/route.ts` es el patrón: same-origin, auth, rate limit, Zod y `respondWithGeminiJson`.
- Todos los prompts viven en `lib/ai-prompts.ts`.
- `enqueueTopicSRSUpdate` ya escribe `topic_srs` por outbox.
- `quickAddWord` existe, pero las palabras sugeridas se mantienen opt-in para Plan 054.

## Scope

**In scope**: prompts/builders, `app/api/gemini/journal-correct/route.ts`, schema de respuesta, cliente, `lib/journal/apply-feedback.ts`, actualización de entry y topics, tests.

**Out of scope**: UI, guardado automático de `new_words`, generación remota del prompt diario, analítica semanal.

## Steps

1. Definir schema estricto: `correctedContent`, errores `{ quote, correction, type, explanationEs, topic }`, `newWords`; límites de cantidad y longitud.
2. Añadir prompt y builder con lista de topics conocidos e intereses del Plan 049. Exigir JSON y feedback en español; no aceptar topics fuera de allowlist sin normalizarlos a `grammar:other`.
3. Implementar ruta autenticada, same-origin, límite aproximado 10/min y body `{ entryId, content<=4000 }`. Verificar que la entry pertenece al usuario y está submitted antes de corregir.
4. Crear cliente con errores públicos/offline siguiendo `grade-production-client.ts`.
5. Implementar `applyJournalFeedback`: transacción lógica que marca corrected una sola vez, persiste feedback y encola grade 2 para topics únicos. Repetir la misma respuesta no duplica scheduling.
6. Mantener `newWords` como candidatos almacenados; no llamar `quickAddWord` aquí.
7. Probar guards, Zod, JSON inválido, ownership, idempotencia, normalización y degradación de red.

## Verification

| Command | Expected |
|---|---|
| `pnpm test -- app/api/gemini/journal-correct lib/journal lib/ai-prompts` | tests verdes |
| `pnpm type-check && pnpm lint` | exit 0 |
| `pnpm test` | suite verde |

## Done criteria

- [ ] Una entry propia submitted pasa a corrected con feedback validado.
- [ ] Retry no duplica corrección ni updates topic_srs.
- [ ] Entry ajena, draft o ya corrected falla de forma pública y segura.
- [ ] Palabras nuevas requieren acción posterior del usuario.
- [ ] No se registran contenido ni feedback completos en logs.

## STOP conditions

- La idempotencia no puede garantizarse con el contrato de Plan 052.
- Los topics del proyecto no tienen vocabulario canónico suficiente; crear inventario antes de dejar texto libre entrar a `topic_srs`.

## Git workflow and maintenance

- Branch: `codex/053-journal-correction`; commit: `feat(journal): correct entries and schedule review`.
- Revisar límites, schema y redacción del prompt conjuntamente; cambios de feedback deben conservar idempotencia y privacidad de logs.
