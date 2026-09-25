# Documentación

Índice de la documentación del proyecto. El [README](../README.md) de la raíz
cubre instalación y comandos; aquí se documentan arquitectura, despliegue,
diseño y planes de producto.

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Ciclo integrado de aprendizaje](architecture/integrated-learning-loop.md) | Conexión canónica entre contenido, targets, ejercicios, Plan diario, Repaso y Progreso |
| [Aprendizaje basado en chunks](architecture/chunk-first-learning.md) | Contrato 70/30 para frases, palabras, escucha, habla y dificultad CEFR |
| [Sistemas SRS](architecture/srs.md) | Repetición espaciada, Baúl SRS (snooze / mastered) y reglas de revisión |
| [Cuotas y fallback de IA](architecture/ai-quota-and-fallback.md) | Cadenas gratuitas, cooldown, presupuesto diario y límites por usuario |
| [Inventario de modelos Gemini](ai/model-inventory.md) | IDs habilitados, tier y picos/límites del panel del proyecto |
| [Evaluación de prompts JSON](ai/prompt-eval.md) | Doce casos fijos, ejecución con cuota acotada y línea base de calidad |
| [Sistema de ejercicios](architecture/exercises.md) | Tipos de ejercicio, flujo de sesión y persistencia |
| [Progress telemetry](architecture/progress.md) | Contrato de sesiones, answers y almacenamiento de actividad |
| [Performance](architecture/performance.md) | Baseline, presupuestos, reglas y método de medición |
| [Offline y sync](architecture/offline-sync.md) | Persistencia local, outbox, Supabase y reglas de reconciliación |
| [Feedback de pronunciación](architecture/pronunciation-feedback.md) | Señales honestas (`stt_intelligibility`), priorización y remediación |
| [ADR 064 — evaluación acústica](architecture/adr-064-acoustic-pronunciation-assessment.md) | Por qué no se muestra evaluación acústica todavía y qué benchmark debe pasar |

## Despliegue y CI/CD

| Documento | Descripción |
|-----------|-------------|
| [Guía de despliegue](deployment/guide.md) | Estado real de CI, variables y pasos manuales de despliegue |
| [Configuración rápida](deployment/setup-guide.md) | Checklist breve para preparar CI y producción |
| [Checklist de setup](deployment/setup-checklist.md) | Lista operativa de puesta en marcha |
| [Resumen CI/CD](deployment/ci-cd-summary.md) | Resumen del estado actual y pendientes del pipeline |
| [Matriz de entornos](deployment/environments.md) | Variables, secretos y reglas para local, preview, staging y producción |
| [Backups y restore](deployment/backups.md) | Retención, preparación de migraciones y validación post-restore |
| [Registro de riesgos de migraciones](database/migration-risk-register.md) | Ventanas históricas inseguras y acciones de auditoría |
| [Revisión de grants anon](database/anon-grants-review.md) | Grants heredados a `anon`, corrección y reglas futuras |

## Seguridad

| Documento | Descripción |
|-----------|-------------|
| [Threat model](security/threat-model.md) | Riesgos principales, controles actuales y owners operativos |

## Diseño y componentes UI

La referencia vigente es [DESIGN.md](../DESIGN.md): toma el Home como patrón de
jerarquía, composición y tono. [THEME_SYSTEM.md](../THEME_SYSTEM.md) documenta
los tokens que lo hacen adaptable. Las notas de migración debajo conservan
contexto histórico y no reemplazan esas dos fuentes.

| Documento | Descripción |
|-----------|-------------|
| [Lenguaje visual](design/visual-language.md) | Proporción de color, border radius, tipografía y reglas de personalidad |

### Botones

| Documento | Descripción |
|-----------|-------------|
| [Guía de Button](design/buttons/guide.md) | Variantes, props y ejemplos |
| [Referencia rápida](design/buttons/quick-reference.md) | Cheat sheet de una página |
| [Resumen de migración](design/buttons/migration-summary.md) | Contexto histórico del refactor |
| [Implementación completada](design/buttons/implementation-complete.md) | Registro histórico del refactor de 2026-05-28 |
| [Excepciones de estilos inline](design/inline-style-exceptions.md) | Casos runtime permitidos para `style={{ ... }}` |

### Enlaces (Anchor)

| Documento | Descripción |
|-----------|-------------|
| [Guía de Anchor](design/anchors/guide.md) | Componente de enlace del design system |
| [Referencia rápida](design/anchors/quick-reference.md) | Cheat sheet |

## Pedagogía y roadmap de aprendizaje

| Documento | Descripción |
|-----------|-------------|
| [Planes pedagógicos](pedagogy-plans/README.md) | Índice de propuestas para nuevas superficies y secuencias de aprendizaje |
| [Roadmap chunk-first](pedagogy-plans/README.md#roadmap-chunk-first) | Seis tareas separadas para llevar el contrato pedagógico al producto |
| [Phoneme redesign plan](phoneme-redesign-plan.md) | Plan de rediseño para la experiencia fonética |

## Planes de implementación

[`plans/README.md`](../plans/README.md) es el índice de planes ejecutables (estado, orden y dependencias).
La serie 5 (035–042, 2026-09-23) cubre el uso de la IA gratuita, el AI Coach y los ejercicios:

| Plan | Tema |
|------|------|
| [035](../plans/035-resilient-free-ai-quotas-and-voice.md) | Cuotas gratuitas de Gemini: modelos Lite primero, cooldown, presupuesto diario, caché |
| [036](../plans/036-structured-output-and-level-aware-prompts.md) | Salida JSON estructurada y prompts ajustados al nivel CEFR |
| [037](../plans/037-coach-and-exercises-fewer-faster-ai-calls.md) | AI Coach con sets de ejercicios y corrección local primero |
| [038](../plans/038-elsa-style-phoneme-feedback-on-device.md) | Feedback por sonido en el dispositivo, validado con L2-ARCTIC |
| [039](../plans/039-local-multi-voice-tts-and-hvpt.md) | Voces locales (Kokoro) y entrenamiento de percepción con muchas voces |
| [040](../plans/040-coach-corrections-feed-error-recurrence.md) | Las correcciones del AI Coach entran a la cola de errores repetidos |
| [041](../plans/041-pregenerated-content-bank-from-leftover-quota.md) | Banco de ejercicios pregenerados con la cuota diaria que sobra |
| [042](../plans/042-report-wrong-ai-feedback.md) | Botón "Esta corrección está mal" y casos de evaluación reales |

Estos planes describen trabajo **pendiente**. Cada plan tiene un paso final de documentación que actualiza
este índice, `README.md`, `CLAUDE.md` y `docs/architecture/` cuando se ejecuta.

## Especificaciones y planes

Documentos de diseño e implementación generados en flujos de trabajo asistidos:

- [`superpowers/specs/`](superpowers/specs/) para especificaciones funcionales
- [`superpowers/plans/`](superpowers/plans/) para planes de implementación

## Notas de uso

- Los documentos de `deployment/` describen el estado del repo, incluyendo
  diferencias entre lo ya implementado y lo que sigue pendiente.
- Los documentos bajo `superpowers/` son material de diseño y planificación, no
  siempre reflejan código ya integrado.

## Estructura

```text
docs/
├── README.md
├── architecture/
├── deployment/
├── security/
├── design/
├── pedagogy-plans/
├── superpowers/
└── phoneme-redesign-plan.md
```
