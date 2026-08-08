# Fase 9 — Rollout personal de Essential Words

SHA inicial: `4bc146e574d57ce6e6af349f47b7b98c48f20d6d`.

Estado actual: **PERSONAL ON AUTORIZADO** para el único usuario del proyecto.

Sesiones shadow reales verificadas en esta entrega: **0**.

La activación final fue autorizada explícitamente como excepción personal; no declara que
el gate estadístico de shadow se haya cumplido ni modifica sus umbrales.

No se atribuyen sesiones reales a pruebas, fixtures o simulaciones. El estado solo puede
cambiar cuando el sink de 9.2 contenga evidencia de uso personal real y las comprobaciones
de integridad se hayan ejecutado sobre esos datos.

## Por qué existe este gate

El gate original está diseñado para rollout multiusuario. Este proyecto utiliza un gate
personal intencionalmente más ligero.

El requisito original de 14 días, 100 sesiones, 50 scheduled reviews y observación por
cohorte permanece documentado en el plan; no se considera cumplido ni se borra. Para un
único usuario se sustituye conscientemente por `personal-rollout-v1`, cuyo propósito es
detectar fallos operativos obvios, no demostrar validez estadística.

## Política `personal-rollout-v1`

- `minimumShadowSessions: 10`
- `maximumSkillErrors: 0`
- `requireZeroDoubleWrites: true`
- `requireZeroOrphanSkillWrites: true`
- `requireRollbackVerified: true`

Las diez sesiones deben proceder del uso real en shadow. No hay días mínimos, cohortes,
porcentajes, espera artificial ni promoción automática.

## Métricas observadas

El resumen consume exclusivamente las comparaciones agregadas de 9.2:

- sesiones shadow y errores separados de skill/sink;
- queue size legacy/skill: media y p95; diferencia: media y máximo absoluto;
- estimated seconds legacy/skill: media y p95; diferencia: media y máximo absoluto;
- sesiones en las que skill propone recovery;
- deferred mandatory: media y máximo.

No contiene word IDs, item IDs, respuestas, audio ni texto del usuario.

## Blockers

- menos de 10 sesiones shadow reales;
- cualquier excepción del skill engine;
- double-write u orphan skill write;
- rollback no verificado;
- valores negativos, NaN o infinitos;
- crecimiento repetido de queue size mayor que 4x legacy y al menos 20 elementos extra;
- estimated seconds repetidamente mayor que 4x legacy y al menos 900 segundos extra;
- deferred mandatory positivo, creciente y persistente en las últimas cinco sesiones;
- recovery en al menos 90% de las sesiones una vez alcanzado el mínimo.

Las reglas repetidas requieren al menos tres observaciones y aparecer en al menos la mitad
de las sesiones comparables. Son sanity checks deliberadamente simples; no recalibran ni
modifican el planner.

## Warnings

- fallo del sink de métricas;
- diferencias de queue size;
- diferencias de estimated seconds;
- alguna propuesta de recovery.

Una diferencia entre motores es esperable y por sí sola no bloquea el rollout.

## Runtime personal

La integración final conecta `useEssentialWordsSession` al router existente. En `on`, la
planificación, la evaluación y la persistencia SRS usan exclusivamente LearningItems,
AttemptLogs y SrsReviewEvents; `answer_history` se conserva como historial ortogonal. En
`off`, la experiencia vuelve íntegramente a SRSData legacy. `shadow` continúa mostrando y
persistiendo sólo legacy y ejecuta el cálculo skill sin escrituras.

Las funciones secundarias que exigirían nuevas decisiones de scheduling quedan limitadas
en `on`: “aprender más” reconstruye una sesión desde el planner (sin inyectar tarjetas), y
archivar, posponer o marcar dominada sólo omiten el ítem actual. “Ya la sé” sí usa el flujo
skill existente de verificación provisional.

Activación personal:

```dotenv
NEXT_PUBLIC_SKILL_MODEL_MODE=on
NEXT_PUBLIC_SKILL_MODEL_COHORT_PERCENT=100
NEXT_PUBLIC_SKILL_MODEL_COHORT_SALT=essential-words-personal-v1
```

El rollback cambia únicamente `NEXT_PUBLIC_SKILL_MODEL_MODE=off`; no elimina ni modifica
los datos skill acumulados.

## Integridad y rollback

Los tests Dexie verifican directamente:

- shadow persiste legacy y deja LearningItem, AttemptLog, SrsReviewEvent y outbox skill en cero;
- on persiste el bundle skill y no escribe SRSData `c1k:`;
- off persiste legacy y no persiste skill;
- ninguna interacción escribe ambos modelos.

El procedimiento de rollback es:

1. ejecutar en `shadow` y comprobar que legacy sigue siendo la ruta de escritura;
2. cambiar la configuración existente a `on`, sin migración destructiva;
3. cambiarla a `off` y comprobar que se recupera inmediatamente la ruta legacy;
4. verificar que los LearningItems creados en `on` siguen presentes: rollback significa
   dejar de usar skill, no borrar su estado.

## Interpretación de READY

`evaluatePersonalRolloutGate` devuelve `ready: true` solo si no existe ningún blocker.
Los warnings permanecen visibles para interpretación humana. `READY FOR PERSONAL ON` es
una señal de decisión, no una escritura del feature flag; la activación se realiza de forma
manual mediante la configuración existente.
