# GitHub Actions Setup Guide

Esta guía cubre la configuración real que necesita el repositorio hoy para que
el workflow de CI funcione correctamente.

## Quick setup

### 1. Configura los secrets mínimos

En GitHub, ve a `Settings -> Secrets and variables -> Actions` y crea:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Son los únicos secrets consumidos por el workflow actual de `.github/workflows/ci.yml`.

### 2. Configura branch protection para `main`

Recomendado:

- Require a pull request before merging
- Require status checks to pass
- Require at least 1 review
- Require branches to be up to date

### 3. Ejecuta una prueba

```bash
git commit --allow-empty -m "test: trigger CI"
git push origin <tu-rama>
```

Luego verifica el resultado en la pestaña `Actions`.

## Qué valida el CI actual

El pipeline ejecuta:

- lint
- type-check
- tests
- lint de design tokens
- audit de dependencias
- chequeo básico de secretos hardcodeados
- build de Next.js
- auditoría básica de a11y y calidad visual

## Script opcional

Existe `scripts/setup-deployment.sh`, pero fue escrito para una estrategia de
deploy más amplia que hoy no está completa en el repo. Úsalo solo si también
vas a continuar con esa infraestructura fuera de este repositorio.

## Qué no está automatizado todavía

- deploy desde GitHub Actions
- rollback automático
- smoke tests post-deploy
- release tagging automático

## Comandos locales recomendados

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm build
```

## Referencias

- [guide.md](guide.md)
- [setup-checklist.md](setup-checklist.md)
- [ci-cd-summary.md](ci-cd-summary.md)
