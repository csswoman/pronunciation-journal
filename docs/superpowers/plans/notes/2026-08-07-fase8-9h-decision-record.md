# Fase 8 — Task 8.9h: decision record (C8/capacitySafeNewWords y baja stability/C11)

Fecha: 2026-08-07

Estado: **AMBAS DECISIONES APROBADAS en Task 8.9i (2026-08-07).** Ver
[`2026-08-07-fase8-9i-report.md`](2026-08-07-fase8-9i-report.md) para la
implementación, los tests y el reporte final C1–C11. `8.10` sigue
**bloqueada** — la aprobación de spec en 8.9i no la desbloquea por sí sola;
8.10 requiere su propia autorización explícita. No se implementó
`MaturityPolicy`. No se cambió `desiredRetention` (sigue 0.90). No se
modificaron perfiles. No se activó Fase 9+.

Ver `2026-08-07-fase8-9h-c8-c9-spec-review.md` para la evidencia y los tests
que sustentan este ADR (Parte A y Parte B).

## Regla de independencia

Estas dos decisiones se resuelven por separado. **Ninguna decisión puede
usarse para justificar o descartar la otra**:

- Decisión 1 (C8/`capacitySafeNewWords`) no depende de si C11 mejora o no.
- Decisión 2 (baja `stability`/C11) no depende de si C8 se relaja o no.
- Un "sí" en una no implica nada sobre la otra; un "no" en una tampoco.

---

## Decisión 1 — semántica final de C8 respecto a `capacitySafeNewWords`

### Contexto

C8 (`newWordLiveness`) hoy exige >=60% de `targetNewWords` (6/10) en toda
sesión elegible de presión baja, sin mirar si el forecast de capacidad
(`capacitySafeNewWords`) permite admitir esas 6 palabras. 8.9f demostró que
esa demanda cuesta >=474s/sesión y que el headroom maduro (66–205s) es
insuficiente en los 5 perfiles — la incompatibilidad es estructural, no un
bug.

### Opciones

1. **(Propuesta formalizada, Parte A.2)** Redefinir C8 como liveness
   condicionada a capacidad: `capacitySafeNewWords>=umbral` exige el 60%;
   `capacitySafeNewWords` positivo pero bajo el umbral exige solo
   no-starvation; `capacitySafeNewWords=0` exime por completo.
   Implementación de referencia: `newWordLivenessCapacityConditioned`
   (spec-candidate, no wireado a `criteria/index.ts`).
2. Subir el presupuesto por sesión (900s → algo que cubra 474s+mandatory)
   — no evaluado en 8.9h; requeriría su propia decisión de producto/negocio
   sobre tiempo de sesión objetivo.
3. Bajar `targetNewWords` y/o el share mínimo de C8 directamente (p.ej.
   target=5, share=60%=3) — reduce el costo mínimo pero cambia la promesa de
   producto de "10 palabras nuevas" sin pasar por el mecanismo de capacidad.
4. Relajar C9 (`maxWaitSessions`>8) para amortizar activaciones base en más
   sesiones — 8.9h mantiene C9 sin cambios (ver §Parte A.3); esta opción no
   se evaluó y se descarta explícitamente para no mezclar ambas garantías.
5. No cambiar nada (mantener C8 tal cual) — deja la incompatibilidad de
   8.9f sin resolver indefinidamente; los 5 perfiles seguirían en rojo por
   diseño en cualquier acceptance run futura, no por un bug a corregir.

### Evidencia (tests)

`spec-8.9h-c8-capacity-conditioned.test.ts`, 6 casos verdes, demuestran que
la opción 1: (a) sigue exigiendo el 60% cuando el forecast dice que es
alcanzable; (b) nunca falla por no admitir trabajo que el forecast ya probó
imposible; (c) sí falla por starvation genuina (capacidad positiva y cero
progreso sostenido); (d) nunca sustituye a C9 — un escenario que pasa la
opción 1 y falla C9 existe y debe seguir fallando la aceptación global.

### Recomendación (no aprobada automáticamente)

La opción 1 es la única evaluada con tests explícitos en 8.9h y es
compatible con el hallazgo de 8.9f sin requerir cambiar presupuesto,
`targetNewWords` o C9. Se recomienda como base de discusión, **no** como
decisión ya tomada — falta decidir explícitamente:

- el valor del umbral de starvation (8.9h usa 8, igual a C9, por
  simplicidad de tener un solo reloj; podría ser otro valor);
- si `targetNewWords` deja de comunicarse como "10 nuevas garantizadas" en
  cualquier superficie de producto/UX que lo implique hoy (fuera de alcance
  de este ADR, que es solo de spec de simulación/aceptación).

### Estado

**APROBADA en Task 8.9i, tal como está formulada (opción 1), con el umbral
de starvation en 8 sesiones (igual a C9).** `newWordLiveness` en
`lib/essential-words/simulation/criteria/progress.ts` implementa
directamente esta semántica desde 8.9i — el spec-candidate
(`progress-capacity-conditioned.ts`) se integró y se eliminó como archivo
separado. `criteria/index.ts` y `acceptance.test.ts` ya usan la nueva
`newWordLiveness` como C8 canónico. Bajo la configuración de
`acceptance.test.ts` (budget 900s, target 10, corpus 1000, 180 días, seed
42), `steady` (único perfil con `isC8Applicable`) pasa: 19 sesiones de alta
capacidad, 11 de baja, 145 de capacidad cero, 0 rachas de starvation. La
pregunta de comunicación de producto sobre "10 nuevas garantizadas" sigue
fuera de alcance de este ADR.

---

## Decisión 2 — política para baja `stability` (C11 en perfiles con lapsos)

### Contexto

8.9g demostró que C11 sigue correctamente a `retrievability` (no hay bug),
pero perfiles con `accuracyByModality` baja acumulan una fracción grande de
ítems en `stability` baja, y el redondeo a día entero del scheduler FSRS
compartido deprime la `retrievability` en el momento del due para esos
ítems — manteniendo a `beginner`/`intermittent`/`bursty` fuera de
[0.85, 0.95] incluso con reviews a tiempo.

### Opciones

1. **Conservar el scheduler actual y aceptar un C11 menor** en perfiles con
   muchos lapsos reales, documentando que el objetivo de retención uniforme
   (0.85–0.95 para todos los perfiles) no es alcanzable con el scheduler
   actual bajo ningún forecast/admission correcto — es una propiedad del
   modelo FSRS + perfil de precisión, no de la capa de aceptación.
2. **Añadir relearning sub-día** (evaluado formalmente en 8.9h, Parte B)
   para ítems de `stability` baja antes de volver a "Review". Evidencia
   (5 perfiles, backlog-cero, seed 42):
   - Mejora C11 en los 5 perfiles (+0.004 a +0.035), sin manipular
     artificialmente el criterio (la mejora coincide con la mejora de
     `avgRetrievability`, diferencia <=0.003).
   - **No alcanza el rango objetivo** en el perfil más afectado
     (`beginner`: 0.664→0.688, sigue a 0.162 del borde inferior 0.85).
   - Costo no uniforme: +16.1% scheduled-reviews en `beginner`, entre −1.8%
     y +8.7% en el resto; `learning/relearning` baja en 3 de 5 perfiles.
   - **No se descalifica** por ninguno de los 4 criterios de exclusión
     explícitos (no multiplica sin límite, no está medido contra
     presupuesto real pero el patrón no sugiere explosión, no genera loops,
     no manipula C11 artificialmente) — pero tampoco se puede llamar
     "solución" con la evidencia disponible.
   - **Falta**: medir el costo bajo presupuesto real (900s, no
     backlog-cero) antes de considerar esta opción seria; el sandbox actual
     (`sub-day-relearning.ts`) es deliberadamente aislado y no se integró
     con `admission-envelope-v1`/`daily-budget.ts`.
3. **Revisar `desiredRetention`/parámetros FSRS por defecto** — opción NO
   preferida (marcada explícitamente como tal por el usuario). No evaluada
   en 8.9h; cambiaría el contrato de retención para todo el sistema SRS
   compartido (no solo essential-words), con impacto fuera del alcance de
   esta tarea.

### Estado

**APROBADA en Task 8.9i — ni la opción 1 ni la opción 2 tal como estaban
planteadas.** La resolución real fue una tercera vía, explícita en 8.9i:
separar calibración de recall (C11) de calidad de scheduling (métrica
nueva), en vez de aceptar un C11 objetivo distinto por perfil (opción 1) o
integrar el relearning sub-día en producción (opción 2, que queda
**EXPERIMENTAL**, sin integrar, exactamente como estaba en 8.9h — no
resolvió `beginner` y no se midió su costo bajo presupuesto real).

C11 ahora es `retentionCalibrationWithinExpected` (calibración vía z-test,
`|z| <= 3`, contra `expectedRetention = mean(retrievability)` de las mismas
reviews elegibles, no contra `desiredRetention`). `lib/srs/fsrs-schedule.ts`
no cambió. `desiredRetention` sigue en 0.90. Con esta redefinición, los 5
perfiles pasan C11 bajo la configuración de acceptance (z entre −0.91 y
+1.98, todos dentro de ±3) — ver
[`2026-08-07-fase8-9i-report.md`](2026-08-07-fase8-9i-report.md) para el
detalle numérico y `meanRetrievabilityAtReview` (que sí sigue mostrando
segmentos `low-stability-post-lapse` lejos de 0.90 en varios perfiles,
como se espera).

---

## Gate

Ambas condiciones de este gate quedaron satisfechas en Task 8.9i:

1. ✅ Decisión 1 resuelta — opción 1 aprobada tal como está formulada.
2. ✅ Decisión 2 resuelta — no se aprobó ninguna de las 3 opciones listadas
   originalmente; se aprobó la separación calibración/scheduling descrita
   arriba, que no depende de integrar sub-day relearning ni de cambiar
   `desiredRetention`.

**`8.10` sigue bloqueada de todas formas** — la resolución de este ADR de
spec no es, por sí misma, autorización para iniciar 8.10. 8.10 requiere su
propio pedido explícito del usuario.
