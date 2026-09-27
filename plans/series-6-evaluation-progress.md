# Serie 6 — evaluación, persistencia y progreso honesto

Planes preparados el 2026-09-26 con skill improve, contra el checkout 70d98322. Continúan la numeración 001–043. Se consultó el índice vigente; no se modificó código ni se aplicaron migraciones.

La auditoría original se conserva en [audit-source.md](audit-source.md). Sus datos remotos son evidencia aportada por el usuario, no comprobación remota de esta preparación. Los extractos de los planes se contrastaron localmente; los casos aún deben reproducirse.

## Orden y estado
| Plan | Título | Prioridad | Esfuerzo | Dependencia | Estado |
|---|---|---|---|---|---|
| [044](044-preserve-evaluation-evidence.md) | Conservar el estado y la calidad real de cada respuesta | P0 | M | — | TODO |
| [045](045-recover-answer-sync.md) | Recuperar respuestas rechazadas y fallos transitorios de sincronización | P0 | M | 044 para validar elegibilidad; 046 fase A antes de reemitir efectos SRS | TODO |
| [046](046-attempt-identity-and-spaced-srs.md) | Hacer idempotentes los intentos y evitar avances SRS por repetición inmediata | P0 | L | 044; coordinar queries.ts con 045 y 050 | TODO |
| [047](047-honest-progress-metrics.md) | Calcular métricas completas y distinguir actividad, precisión y evidencia | P1 | L | 044; 045 para cobertura real de Essential Words; 046 para replay | TODO |
| [048](048-sound-mastery-state.md) | Separar EMA y presentación de maestría de sonidos sin perder actualizaciones | P1 | L | 046 fase A para identidad de eventos | TODO |
| [049](049-truthful-progress-ui.md) | Mostrar datos reales, estados vacíos y etiquetas fieles | P1 | M | — para fallbacks; 047 para nuevos estados de evidencia | TODO |
| [050](050-concepts-attribution-and-activity.md) | Separar evidencia de conceptos, finalización y actividad diaria | P1 | L | 044 y 046; coordinar métricas con 047 | TODO |
| [051](051-consistent-local-contractions.md) | Corregir contracciones equivalentes sin aceptar respuestas incorrectas | P2 | M | —; respetar Plan 043 y coordinar con 044 | TODO |

Orden sugerido: **044 → 046 A → 045 → 046 B → 047 A → 048 → 047 B → 050**.
049 puede empezar de forma independiente por los fallbacks y consumir después los estados de 047. 051 es independiente. No editar queries.ts en paralelo en 044/046/047/050; sync-manager.ts pertenece a 045.

Cada corrección incluye caracterización roja y arreglo verde en la misma entrega. No crear un gran commit de tests rojos ni ejecutar automáticamente los 943 archivos citados en el informe.

## Cobertura de la auditoría
- P0 Essential Words y Connected Speech: 045.
- P0 autoevaluación/errores y P1 pistas: 044.
- P0 espaciado; P1 idempotencia, Coach y reintentos fonemas: 046.
- P1 habilidad inflada; P2 denominador, errores y paginación; P3 precisión parcial: 047.
- P1 maestría de sonidos; riesgo de escritores incompatibles: 048.
- P1 cifras inventadas y todas las etiquetas de H: 049.
- P1 conceptos/completion; P2 atribución, daily duplicado, rachas; inconsistencias UTC/curso y seguimiento P3: 050.
- P2 contracciones y equivalencia en Coach: 051.

## Decisiones de producto explícitamente pendientes
Se pueden preparar tests, alternativas y código aislado sin activar estas políticas:
- Pistas: límites 3/1; reconocimiento/MC con máximo 4; crédito parcial por typo.
- Guarda de vencimiento, semántica de eventos offline y reparación de dominio histórico.
- Fórmula de habilidades, ventana, deduplicación de evidencia y mínimo suficiente.
- Estado EMA histórico, curva de decaimiento y compatibilidad de clientes.
- Vista/aprobada/mastered, acumulación de conceptos y desbloqueos.
- XP por saltar y definición global única de dominio (no necesaria para corregir los bugs).

La creación de planes no autoriza ejecución, commit, db push, backfill ni borrado. La autorización remota se solicita al terminar la preparación local revisable.

## Matices y propuestas descartadas
- Dos pestañas con el mismo contenido no son automáticamente el mismo intento. Evitar doble aplicación de un evento y evitar falso espaciado son problemas distintos.
- No convertir el ejemplo «una respuesta <40%» o vocabulario «35» en oráculo de tests: requieren una fórmula aceptada.
- No exigir monotonía absoluta a una métrica con olvido temporal.
- Completar un mazo al recorrerlo es un contrato ya admitido por Plan 006; revisar etiquetas y dominio, sin eliminar completion a ciegas.
- No duplicar planes 020–027: conservar sus contratos y caracterizar regresiones.
- No hay reconstrucción fiable de respuestas históricas solo desde sesiones.
- No se revisaron los doce motores completos, no se ejecutaron suites ni se accedió a Dexie de un navegador o Supabase en esta preparación.

## Cierre
Estados por fase: TODO / IN PROGRESS / DONE / BLOCKED / REJECTED con evidencia.
Un fix local con despliegue pendiente no cierra una incidencia remota. El ejecutor debe actualizar el índice del repositorio y conservar los resultados de validación.

