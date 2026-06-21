# Documentación — Pronunciation Journal

Índice de la documentación del proyecto. El [README](../README.md) de la raíz cubre instalación rápida; aquí está el detalle por área.

## Arquitectura

| Documento | Descripción |
|-----------|-------------|
| [Sistemas SRS](architecture/srs.md) | Repetición espaciada (`word_bank`, lecciones, SM-2) |
| [Sistema de ejercicios](architecture/exercises.md) | Tipos de ejercicio, flujo de sesión y persistencia |
| [Performance](architecture/performance.md) | Baseline, presupuestos, reglas y método de medición |

## Despliegue y CI/CD

| Documento | Descripción |
|-----------|-------------|
| [Guía de despliegue](deployment/guide.md) | Pipelines, secretos, ramas y rollback |
| [Resumen CI/CD](deployment/ci-cd-summary.md) | Vista general de lo añadido al repo |
| [Configuración rápida](deployment/setup-guide.md) | Activar GitHub Actions y Vercel (≈5 min) |
| [Checklist de setup](deployment/setup-checklist.md) | Lista paso a paso para poner en marcha CI/CD |

## Diseño y componentes UI

### Botones

| Documento | Descripción |
|-----------|-------------|
| [Guía de Button](design/buttons/guide.md) | Variantes, props y ejemplos |
| [Referencia rápida](design/buttons/quick-reference.md) | Cheat sheet de una página |
| [Resumen de migración](design/buttons/migration-summary.md) | Antes/después del refactor |
| [Implementación completada](design/buttons/implementation-complete.md) | Notas del refactor (2026-05-28) |

### Enlaces (Anchor)

| Documento | Descripción |
|-----------|-------------|
| [Guía de Anchor](design/anchors/guide.md) | Componente de enlace del design system |
| [Referencia rápida](design/anchors/quick-reference.md) | Cheat sheet |

## Especificaciones y planes (Superpowers)

Documentos de diseño e implementación generados en flujos de trabajo asistidos:

- [`superpowers/specs/`](superpowers/specs/) — Especificaciones de funcionalidad
- [`superpowers/plans/`](superpowers/plans/) — Planes de implementación

## Estructura de carpetas

```
docs/
├── README.md                 ← este índice
├── architecture/             ← dominio de la app (SRS, ejercicios, performance)
├── deployment/               ← CI/CD, Vercel, Supabase
├── design/                   ← componentes UI
│   ├── buttons/
│   └── anchors/
└── superpowers/
    ├── specs/
    └── plans/
```
