# Plan 058: Desplegar y poblar el banco de contenido pregenerado

> **Executor instructions**: Sigue las fases en orden. La fase A es de
> infraestructura (Vercel + GitHub Actions) y requiere acceso humano a paneles
> externos; el ejecutor documenta los pasos exactos pero no puede completarla
> sin que el operador teclee credenciales. No marques DONE sin confirmar, con
> una consulta SQL real contra el proyecto Supabase de producción, que
> `content_bank_items` tiene filas para cada nivel A1–C1.
>
> **Drift check (run first)**:
> `git log --oneline -5 -- app/api/jobs/fill-content-bank .github/workflows/fill-content-bank.yml lib/content-bank`
> Si el job, el workflow o el esquema de `content_bank_items` cambiaron desde
> el commit "Planned at" de abajo, STOP y reconcilia el plan.

## Status

- **Priority**: P1
- **Effort**: S (infra) + S (backfill script) — la fase A depende de acceso a
  paneles externos que el ejecutor automatizado no tiene
- **Risk**: LOW (no toca esquema ni código de producto; solo despliegue,
  configuración y una corrida manual del job existente)
- **Depends on**: Plan 041 (banco de contenido, ya implementado en `dev`,
  nunca desplegado a `main`)
- **Category**: infra / content
- **Planned at**: commit `26c05b4f`, 2026-09-29

## Why this matters

Plan 041 construyó el banco de ejercicios pregenerados (tablas, RLS, job de
generación, workflow de GitHub Actions) pero **nunca se desplegó**:
`.github/workflows/fill-content-bank.yml` no existe en `main`, no hay proyecto
Vercel enlazado (`docs/deployment/environments.md` línea 53 ya lo documenta
como pendiente) y la variable de repo `CONTENT_BANK_FILL_URL` no está
configurada (`gh variable list` solo muestra `ENRICHMENT_DRAIN_URL` y
`PRODUCTION_HEALTH_URL`). Resultado verificado por SQL directo: la tabla
`content_bank_items` del proyecto Supabase de producción
(`enpxrijfnkcgvkyrjxod`) tiene **0 filas**.

Esto bloquea en silencio dos superficies que dependen del banco:
1. El panel "Ejercicios del Coach" (`components/offline/OfflineCoachPack.tsx`)
   siempre descarga 0 ejercicios, para cualquier nivel.
2. El recurso opcional Coach de los paquetes CEFR offline (Plan 057,
   `downloadOptionalCoachResource`) siempre registra `coachCount: 0`.

Ninguno de los dos falla de forma visible: ambos tratan el banco vacío como
"sin ejercicios disponibles todavía", que es el comportamiento correcto ante
una tabla vacía — pero nadie decidió que debía quedarse vacía.

## Product contract

- El job de generación sigue siendo exclusivamente nocturno/cron para el
  estado estable (Plan 041, regla del 60%: nunca compite con cuota
  interactiva). Este plan no cambia esa regla.
- Un backfill manual inicial puede invocar el mismo endpoint varias veces en
  un solo día para poblar más rápido que "4 objetivos/día", pero debe
  respetar exactamente la misma comprobación de cuota (`isModelOverQuotaThreshold`)
  que ya tiene el endpoint — no se añade un modo "sin límite".
- No se crea un segundo camino de generación. El backfill reutiliza
  `GET /api/jobs/fill-content-bank` sin modificarlo, solo lo invoca más veces.

## Scope

**In scope**:

- `.github/workflows/fill-content-bank.yml` → mergear a `main` (ya existe en
  `dev`, commit `530623f5`).
- Vinculación de un proyecto Vercel a este repo (paso manual, documentado).
- Variable de repo `CONTENT_BANK_FILL_URL` (GitHub Actions) apuntando al
  dominio de producción.
- `CRON_SECRET` en Vercel (production env) — debe coincidir con el secreto ya
  existente en GitHub Actions (`gh secret list` confirma que ya existe ahí).
- `scripts/backfill-content-bank.mjs` (create) — invoca el endpoint desplegado
  en un bucle respetando la cuota, para no depender de 41 días de cron diario
  con 4 objetivos/día (162 pares nivel×tema ÷ 4 = ~41 días para una sola
  pasada).
- `docs/deployment/environments.md` — marcar el punto pendiente (línea 53)
  como resuelto una vez enlazado Vercel.
- `docs/architecture/content-bank.md` — nota sobre el backfill manual inicial.

**Out of scope**:

- Cambiar la regla del 60%, el modelo (`gemini-3.1-flash-lite`), o el límite
  diario de solicitudes.
- Tocar `content_bank_items`, su RLS o `generateBankSet`/`pickNextGenerationTargets`.
- Migrar otras funciones de Plan 041 (`useCoachBankSet`, selección banco→IA)
  — ya están implementadas y no dependen de este plan salvo por datos.
- Resolver el resto de deuda de "Plan 035 fase A: migraciones pendientes"
  (memoria `improve-plans-001-ci-gating`) — es un tema aparte, aunque
  comparte el mismo síntoma raíz ("`dev` acumula trabajo sin desplegar").

## Steps

### Fase A: Desplegar el job (requiere acceso humano a Vercel/GitHub)

1. Enlazar un proyecto Vercel a este repo (`vercel link` o el dashboard),
   producción apuntando a `main`.
2. En Vercel → Settings → Environment Variables (Production): confirmar que
   `CRON_SECRET` tiene el mismo valor que el secreto de GitHub Actions
   (`gh secret list` ya lo tiene; el valor en sí no es legible por CLI —
   copiarlo manualmente o rotarlo y actualizar ambos lados).
3. `gh variable set CONTENT_BANK_FILL_URL --body "https://<dominio-prod>/api/jobs/fill-content-bank"`.
4. Mergear `.github/workflows/fill-content-bank.yml` (y el resto de Plan 041
   si `main` no lo tiene ya) a `main` mediante PR normal — no push directo.
5. `gh workflow run fill-content-bank.yml` manual una vez desplegado, y
   `gh run watch` para confirmar que el step "Trigger content bank fill"
   devuelve `itemsInserted > 0`.

**Verify**: `gh run list --workflow=fill-content-bank.yml --limit 1` muestra
`completed`/`success`; la consulta SQL
`select count(*) from content_bank_items;` sobre el proyecto de producción
sube de 0.

### Fase B: Backfill acelerado

El cron diario cubre 4 pares (nivel, tema) por día — a 162 pares totales,
una primera pasada completa tardaría ~41 días. Un backfill manual acelera
esto respetando la misma cuota que ya protege al job.

Crea `scripts/backfill-content-bank.mjs`:
- Llama a `GET <CONTENT_BANK_FILL_URL>` con el header `Authorization: Bearer $CRON_SECRET`
  repetidamente (p. ej. cada 30–60s) hasta que una respuesta traiga
  `processedSets: 0` (el endpoint ya se detiene solo si el modelo supera el
  60% de cuota del día — el script solo deja de invocar cuando eso ocurre,
  nunca fuerza una invocación adicional).
- Imprime `itemsInserted` acumulado y se detiene también si recibe un 401/429.
- No usa credenciales de servicio nuevas: reutiliza `CRON_SECRET` desde el
  entorno local (`.env.local` o variable exportada), nunca hardcodeado.

**Verify**: tras correr el script un día, la consulta
`select level, count(*) from content_bank_items where quality_flags < 3 group by level order by level;`
muestra filas para A1–C1 (C2 es aceptable en 0 dado que no hay pack C2, pero
no debe bloquear). Repetir el script en días sucesivos si la cuota del primer
día no alcanza a cubrir los 162 pares.

### Fase C: Confirmar el flujo completo de extremo a extremo

1. Con el banco poblado, abre `/offline`, descarga el paquete de un nivel con
   datos (p. ej. A1) y confirma `coachCount > 0` en el mensaje de éxito
   (`hooks/useOfflineResourcePacks.ts`).
2. Abre el panel "Ejercicios del Coach" suelto
   (`components/offline/OfflineCoachPack.tsx`) para el mismo nivel y confirma
   que "Descargar hasta 100" trae ejercicios reales.
3. Actualiza `docs/deployment/environments.md` quitando la nota de "pendiente"
   en `CRON_SECRET`/Vercel si Fase A quedó resuelta.

**Verify**: captura de los dos mensajes de éxito (paquete + panel Coach) con
conteo > 0.

## Test plan

- No hay lógica de producto nueva que testear con Vitest — este plan es
  despliegue + un script de backfill de un solo uso.
- `scripts/backfill-content-bank.mjs` se prueba manualmente contra el
  endpoint ya desplegado (no tiene sentido mockearlo: su único trabajo es
  invocar HTTP repetidamente).

## Done criteria

- [ ] `.github/workflows/fill-content-bank.yml` vive en `main` y corrió al
      menos una vez con éxito (`gh run list` lo confirma).
- [ ] `CONTENT_BANK_FILL_URL` configurado como variable de repo.
- [ ] `CRON_SECRET` coincide entre Vercel production y GitHub Actions.
- [ ] `content_bank_items` en el proyecto Supabase de producción tiene filas
      para A1, A2, B1, B2 y C1 (verificado por SQL, no por inspección de
      código).
- [ ] El paquete offline de al menos un nivel descarga `coachCount > 0`.
- [ ] El panel "Ejercicios del Coach" suelto descarga ejercicios reales para
      al menos un nivel.
- [ ] `docs/deployment/environments.md` y `docs/architecture/content-bank.md`
      actualizados.

## STOP conditions

- No hay forma de obtener o rotar `CRON_SECRET`/acceso a Vercel sin
  intervención del operador — Fase A no puede automatizarse más allá de
  documentar los pasos exactos.
- El job desplegado devuelve `itemsInserted: 0` de forma consistente aunque
  la cuota no esté agotada (indicaría un bug distinto en `generateBankSet` o
  en las credenciales de Gemini, no un problema de despliegue).
- La regla del 60% bloquea el backfill antes de cubrir ni un nivel completo
  en varios días seguidos — en ese caso, reportar y decidir si se ajusta el
  ritmo del backfill (no la regla de cuota en sí).

## Maintenance notes

Una vez poblado, el cron diario de 4 objetivos/día mantiene el banco al
mismo ritmo que Plan 041 diseñó — el backfill de la Fase B es una operación
de un solo uso para el arranque, no un reemplazo del cron permanente.
