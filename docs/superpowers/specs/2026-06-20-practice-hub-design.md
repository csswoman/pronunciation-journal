# Hub de Práctica Libre (`/practice`) — Diseño

**Fecha:** 2026-06-20
**Estado:** Aprobado, pendiente de plan de implementación

## Problema

Al terminar la diaria, el botón "Free practice" del recap
([SessionRecapCard.tsx:101](../../../components/daily/SessionRecapCard.tsx#L101))
manda directo a `/practice/sounds`. Esto se siente "seco" por dos razones:

1. **Destino pobre:** aterriza en un solo modo de práctica (sonidos), ignorando
   los demás (Essential Words, Decks, Review, Courses).
2. **Transición brusca:** salto sin contexto, sin explicar a dónde vas ni por qué.

Hoy `app/practice/page.tsx` solo hace `redirect('/daily')` — no hay hub real.

## Solución

Reemplazar el redirect por un **hub de práctica** con una **tarjeta destacada de
recomendación** (Opción C) y header contextual según el origen.

### Arquitectura

```
<PracticeHubPage>              (Server Component — lee searchParams)
  <PracticeHubClient>          (Client — Dexie reads: arc reciente, último modo)
    <PracticeHubHeader />      (contextual: from=daily vs neutro)
    <RecommendedPracticeCard /> (tarjeta destacada)
    <PracticeOptionsGrid />     (resto de modos)
```

El recap cambia su botón: `/practice/sounds` → `/practice?from=daily`.

### Recomendación destacada (resolución por prioridad)

Función pura que decide la tarjeta destacada:

1. **`from=daily`** → usa el `SessionArc` recién terminado:
   - si `soundIpa` → "Sigue con /æ/" → Sound Lab (`/practice/sounds`)
   - si no → Essential Words (`/practice/core-1000`)
2. **Sin `from=daily`** → "Última práctica": leer último modo desde Dexie →
   "Continúa donde lo dejaste".
3. **Sin arc ni último modo** (primer uso) → fallback a Essential Words.

### Persistencia del "último modo"

- Tabla Dexie mínima key/value: `{ key: 'lastPracticeMode', value, updatedAt }`.
  Reutilizar tabla key/value existente si la hay; si no, crear una mínima.
- Se escribe al entrar a cualquier modo de práctica (Sound Lab, Essential Words,
  Decks, Review) vía un helper único, **no** en componentes sueltos.
- Offline-safe (Dexie). No rompe modo offline.

### Modos en la rejilla

Sound Lab, Essential Words, Decks, Review, Courses → rutas ya existentes. El modo
elegido como "destacado" no se duplica en la rejilla.

### Header contextual

- `?from=daily`: "Acabas de terminar tu diaria — sigue reforzando" + subtítulo.
- Neutro (menú lateral): "Práctica libre · elige qué reforzar".

### Errores / edge cases

- `SessionArc` ausente (Dexie vacío) → no romper; caer al fallback.
- Dexie no disponible → header neutro + rejilla sin destacada.
- `from=daily` pero arc ausente (recarga) → tratar como neutro.

### Testing

- Resolución de la recomendación (función pura): arc con sonido, arc sin sonido,
  sin arc + último modo, sin nada.
- Render del hub: header contextual según searchParam.
- Helper de escritura del "último modo".

## No incluido (YAGNI)

- Recomendación basada en analítica/SRS compleja.
- Reordenar la rejilla dinámicamente más allá de excluir el destacado.
