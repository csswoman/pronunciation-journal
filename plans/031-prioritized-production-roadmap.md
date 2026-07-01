# Planeacion Priorizada para Produccion

Fecha: 2026-07-01
Base auditada: commit `11dee70`
Fuente principal: `TODO.md`

Esta planeacion ordena las tareas por riesgo real de produccion. El objetivo es corregir lo que puede romper datos, seguridad o disponibilidad, sin bloquear la app al publico salvo que exista un incidente activo que lo justifique.

## Reglas de Ejecucion

- No avanzar a una fase superior si la fase anterior tiene tareas `P0` abiertas.
- No apagar la app por defecto; solo aplicar bloqueo temporal si hay fuga activa de datos, corrupcion en curso o riesgo explotable inmediato.
- Cada tarea debe terminar con verificacion local y, cuando aplique, CI verde.
- Las tareas de seguridad y datos se revisan antes que mejoras UX o refactors esteticos.
- No mezclar refactors grandes con fixes de seguridad en el mismo PR.
- Si una tarea toca migraciones, revisar manualmente el SQL antes de ejecutarlo en cualquier entorno compartido.

## Fase 0 - Estabilizacion Critica

Objetivo: neutralizar el riesgo mas alto de datos y auth sin sacar la app del aire.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 1 | Corregir `components/auth/AuthPanel.tsx` para quitar el import directo de `@/lib/supabase/client`. | P0 | S | 2-4 h | - | `pnpm lint` vuelve a pasar. |
| 2 | Reparar los 3 tests fallidos actuales. | P0 | S | 2-6 h | 1 | `pnpm test` pasa completo. |
| 3 | Confirmar linea base verde de verificacion. | P0 | S | 1-2 h | 1-2 | `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm audit --prod` pasan. |
| 4 | Definir un mecanismo seguro de bootstrap de admin sin email personal hardcodeado y sin SQL irreversible. | P0 | S | 2-4 h | 3 | Admin se asigna por procedimiento operativo documentado. |
| 5 | Crear runbook minimo de produccion: rollback, backups, rotacion de secretos e incidentes. | P0 | M | 1-2 dias | 3 | Nadie despliega cambios de datos sin procedimiento. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm audit --prod
```

Criterio de salida: no queda ningun `P0` abierto y la app sigue accesible para publico mientras los riesgos criticos quedan neutralizados.

## Fase 1 - Seguridad Basica y Control de Costos

Objetivo: cerrar rutas de abuso, filtrar menos informacion interna y evitar que una instancia aislada sea el unico control.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 9 | Aplicar `requireSameOrigin(request)` a todos los POST autenticados por cookie, manteniendo exencion Bearer. | P1 | M | 1 dia | Fase 0 | Proteccion CSRF consistente en rutas mutantes/costosas. |
| 10 | Sustituir mensajes internos (`err.message`) por errores publicos normalizados. | P1 | S | 4-6 h | Fase 0 | El cliente no recibe detalles de proveedor, DB o stack interno. |
| 11 | Cambiar rate limiter en memoria por Redis/Upstash/Supabase RPC atomico. | P1 | M | 1-2 dias | Fase 0 | Limites funcionan en despliegues multi-instancia. |
| 12 | Anadir tests de guards para rutas POST: auth, same-origin, rate limit y validacion. | P1 | M | 1-2 dias | 9-11 | Regresiones de seguridad quedan bloqueadas por tests. |
| 13 | Ampliar escaneo de secretos en CI y precommit local. | P2 | S | 4 h | Fase 0 | El escaneo cubre scripts, supabase, docs y configuracion. |
| 14 | Definir CSP/headers globales para paginas, no solo APIs. | P2 | M | 1 dia | Fase 0 | Cabeceras de seguridad consistentes en la app completa. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Criterio de salida: rutas POST sensibles tienen tests que fallan si falta auth, same-origin o rate limit.

## Fase 2 - Datos, RLS y Migraciones

Objetivo: evitar que errores SQL o policies futuras comprometan datos de usuarios.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 15 | Crear checks de migraciones peligrosas: deletes masivos, emails hardcodeados, grants amplios, `DROP POLICY` sin reemplazo. | P1 | M | 1 dia | Fase 0 | CI bloquea SQL de alto riesgo. |
| 16 | Anadir pruebas o checks de RLS para tablas nuevas. | P1 | L | 2-4 dias | 15 | Cada tabla nueva prueba select/insert/update/delete esperado. |
| 17 | Regenerar tipos Supabase y eliminar casts `as any` por tablas faltantes. | P1 | M | 1 dia | Fase 0 | Query layer vuelve a estar tipado contra schema actual. |
| 18 | Revisar grants heredados a `anon` y default privileges. | P2 | M | 1-2 dias | 16 | Privilegios minimos compatibles con RLS. |
| 19 | Documentar o consolidar migraciones historicas que abren policy insegura y luego la corrigen. | P2 | M | 1 dia | 16 | Onboarding y despliegues parciales no reproducen ventanas inseguras. |

Comandos de salida:

```bash
pnpm type-check
pnpm test
```

Criterio de salida: cambios de schema tienen prueba o check automatizado antes de merge.

## Fase 3 - Escalabilidad Operativa

Objetivo: que la app sobreviva picos, retries, multiples instancias y fallos de proveedores.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 20 | Sacar enriquecimiento de palabras y cache writes de `void` en rutas HTTP; usar cola durable o tabla de jobs. | P1 | L | 2-4 dias | Fase 1 | Trabajos background tienen retry, estado e idempotencia. |
| 21 | Definir arquitectura de produccion multi-instancia: rate limit, jobs, observabilidad, variables por entorno. | P0/P1 | L | 3-5 dias | 11, 20 | Hay diseno operativo claro antes de escalar. |
| 22 | Anadir timeouts uniformes a llamadas Gemini. | P2 | M | 1 dia | Fase 1 | Ninguna request queda colgada por proveedor externo. |
| 23 | Unificar infraestructura Gemini: fallback, parseo, errores, limites y timeout. | P2 | M | 1-2 dias | 22 | Menos duplicacion y comportamiento uniforme entre endpoints. |
| 24 | Anadir health checks reales y readiness/liveness separados. | P2 | M | 1 dia | 21 | Monitoreo distingue app viva de dependencias degradadas. |
| 25 | Crear estrategia documentada de backups, restore y retencion Supabase. | P0/P1 | M | 1-2 dias | Fase 0 | Existe recuperacion practicable ante perdida de datos. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Criterio de salida: ninguna operacion critica depende de promesas fire-and-forget dentro de una request serverless.

## Fase 4 - UX Critica y Offline Real

Objetivo: que los flujos principales fallen de forma comprensible y no prometan capacidades que no cumplen.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 26 | Endurecer auth/reset/recovery: expiracion, sesion invalida, password policy y mensajes no filtradores. | P1 | M | 1-2 dias | Fase 0 | Login y recovery son robustos y testeados. |
| 27 | Anadir pruebas de interaccion y a11y para auth/recovery/reset. | P1 | M | 1-2 dias | 26 | Flujos de entrada no dependen solo de tests unitarios. |
| 28 | Disenar degradacion clara para Supabase/Gemini no disponibles. | P1 | M | 1-2 dias | Fase 3 | Usuarios entienden que se puede hacer y que queda pendiente. |
| 29 | Revisar persistencia offline real: Dexie/Supabase/outbox vs `localStorage/sessionStorage`. | P1 | L | 2-4 dias | Fase 3 | El estado critico se sincroniza o se documenta como local/temporal. |
| 30 | Anadir estados de retry/cola visibles para enriquecimiento y transcripcion. | P1 | M | 1-2 dias | 20 | El usuario no recibe OK falso cuando el trabajo puede fallar luego. |
| 31 | Auditar accesibilidad real con Playwright/axe en flujos criticos. | P2 | M | 1-2 dias | 27 | CI valida comportamiento accesible, no solo presencia de ARIA. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Criterio de salida: auth, practica basica, recovery y estados degradados tienen pruebas y UX definida.

## Fase 5 - Mantenibilidad y Calidad del Codigo

Objetivo: reducir coste de cambio una vez cerrado el riesgo de produccion.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 32 | Dividir componentes/hooks grandes y reducir excepciones de max-lines. | P2 | L | 3-5 dias | Fase 1 | Menos archivos fragiles y mas faciles de testear. |
| 33 | Eliminar estilos inline no runtime o formalizar excepciones. | P3 | M | 1 dia | 32 | Las reglas de diseno vuelven a coincidir con el codigo. |
| 34 | Separar scripts de tests: unit, integration, smoke/e2e. | P2 | M | 1 dia | Fase 0 | CI puede ejecutar capas segun coste y riesgo. |
| 35 | Anadir cobertura y umbrales por rutas criticas. | P2 | M | 1-2 dias | 34 | La cobertura protege zonas de alto riesgo, no vanity metrics. |
| 36 | Publicar artefactos de test/cobertura en CI. | P3 | S | 4 h | 35 | Fallos CI son diagnosticables sin reproducir localmente. |
| 37 | Mantener `plans/README.md` reconciliado con `TODO.md` y esta planeacion. | P2 | S | 4 h | - | No hay dos fuentes contradictorias de prioridad. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Criterio de salida: las reglas del repo se cumplen o tienen excepciones documentadas y justificadas.

## Fase 6 - Documentacion Operativa

Objetivo: que otra persona pueda operar, auditar y evolucionar el proyecto sin depender de memoria del autor.

| Orden | Tarea | Prioridad | Dificultad | Tiempo | Depende de | Resultado esperado |
|---:|---|---:|---:|---:|---|---|
| 38 | Actualizar README con prerequisitos, verificacion, variables, limitaciones offline y estado de produccion. | P1 | S | 4-6 h | Fase 0 | Onboarding realista y no engañoso. |
| 39 | Documentar threat model: auth, CSRF, RLS, audio, transcripts, service role, cache, logs. | P1 | M | 1 dia | Fase 1 | Riesgos principales tienen controles y owners. |
| 40 | Documentar arquitectura offline/sync: Dexie, Supabase, Zustand, localStorage y reconciliacion. | P1 | M | 1 dia | 29 | Cualquier cambio de estado sabe donde persistir. |
| 41 | Documentar matriz de entornos: local, preview, staging, production, secrets y migraciones permitidas. | P1 | S | 4-6 h | Fase 3 | Despliegues y previews son repetibles. |

Comandos de salida:

```bash
pnpm lint
pnpm type-check
```

Criterio de salida: documentacion cubre desarrollo, despliegue, seguridad y recuperacion.

## Camino Critico

Estas tareas no se deben paralelizar sin cuidado porque desbloquean todo lo demas:

1. Restaurar `pnpm lint`.
2. Restaurar `pnpm test`.
3. Same-origin/CSRF consistente.
4. Rate limit distribuido.
5. Jobs durables para trabajo background.
6. Checks de migraciones/RLS.
7. Runbook y backups.

## Paralelizacion Recomendada

Despues de Fase 0, se pueden abrir tres lineas de trabajo en paralelo:

- Linea A, seguridad API: tareas 9-14.
- Linea B, datos/migraciones: tareas 15-19.
- Linea C, docs operativas iniciales: tareas 38-41.

No paralelizar Fase 5 hasta que Fase 1 este cerrada; refactors grandes sobre codigo inseguro o con tests rojos multiplican el riesgo.

## Hitos

| Hito | Condicion | Estado esperado |
|---|---|---|
| H1 - Repo verificable | Fase 0 completa | CI local verde y sin SQL destructivo. |
| H2 - Seguridad minima | Fases 1 y 2 completas | API y DB protegidas por tests/checks. |
| H3 - Escala basica | Fase 3 completa | Multi-instancia y trabajos async definidos. |
| H4 - UX confiable | Fase 4 completa | Auth/offline/degradacion son comprensibles. |
| H5 - Mantenible | Fases 5 y 6 completas | Reglas, docs y CI sostienen el crecimiento. |

## No Hacer Todavia

- No optimizar micro-performance antes de resolver rate limit, jobs y CI rojo.
- No agregar features nuevas sobre auth/offline hasta que Fase 4 cierre.
- No migrar dependencias mayores como `eslint` 10 hasta tener CI verde estable.
- No hacer refactors masivos de componentes antes de cerrar seguridad API y migraciones.
