# Sistemas SRS — English Journal

Dos sistemas de repetición espaciada conviven en la app. Cada uno tiene un dominio distinto y no se solapan.

---

## 1. `word_bank` — Vocabulario user-owned

**Propósito:** Tarjetas de vocabulario que el usuario agrega explícitamente desde cualquier contexto (lexicón, práctica, diario).

**Tabla:** `word_bank`

**Algoritmo:** SM-2 implementado en el cliente (`lib/srs/computeSM2.ts`). Los campos `ease_factor` e `interval_days` se actualizan tras cada revisión.

**Campos clave:**

| Campo | Rol |
|---|---|
| `ease_factor` | Factor de facilidad SM-2 (inicia en 2.5) |
| `interval_days` | Días hasta la próxima revisión |
| `next_review_at` | Fecha calculada de próxima revisión |
| `difficulty` | Dificultad intrínseca de la palabra (0–1) |
| `status` | Estado de audio: `pending`, `ready`, `error` |

**Sincronización:** Dexie ⇄ Supabase vía `lib/sync/`.

**Punto de entrada futuro:** Cuando lexicón necesite marcar palabras como "learned", lo hará insertando en `word_bank` (Tarea 12). No se necesita una tabla separada de progreso.

---

## 2. `user_sound_progress` — Fonemas

**Propósito:** Rastrea el dominio de fonemas individuales por usuario. Alimenta el perfil de habilidades fonemáticas.

**Tabla:** `user_sound_progress`

**Algoritmo:** SM-2 simplificado, evaluado tras ejercicios de pronunciación.

**Campos clave:**

| Campo | Rol |
|---|---|
| `sound_id` | Referencia a `sounds.id` |
| `level` | Nivel de dominio actual |
| `next_review_at` | Próxima revisión programada |
| `last_practiced_at` | Última vez practicado |

**Queries:** `lib/practice/queries.ts`

---

## Tabla eliminada: `user_word_progress`

Esta tabla (eliminada 2026-05-21) era un tercer sistema SRS para rastrear progreso por palabra en el lexicón. Se eliminó porque:

- No tenía datos reales de usuarios.
- Duplicaba responsabilidad con `word_bank`.
- `word_bank` cubre el mismo caso de uso con mayor riqueza de datos.

Migración de baja: `supabase/migrations/20260521000000_drop_user_word_progress.sql`
