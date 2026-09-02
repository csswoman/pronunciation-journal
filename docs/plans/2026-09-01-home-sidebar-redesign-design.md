# Diseño: Remodelación de Home y Sidebar Derecho

**Fecha**: 2026-09-01  
**Estado**: Aprobado  

## Resumen

Esta remodelación ajusta la distribución del Home para alinearlo con el diseño de referencia y traslada la "Frase del día" (Chunk) y "Palabra del día" al sidebar derecho.

---

## Estructura de Componentes

### 1. Columna Principal (Izquierda)

- **`HomeHeader.tsx`**:
  - Saludo dinámico: "Buenos días / tardes / noches, [Nombre]"
  - Subtítulo: "Plan de hoy"
  - Insignias superiores (top-right): `🔥 [racha] racha` y `[minutaje] / 24 min hoy`

- **`DailyPlanCard.tsx` / `HomeDailyCard.tsx`**:
  - Barra de progreso por pasos dividida en segmentos: "Paso X de Y · [N] min en total"
  - Desglose interactivo con el paso 1 enfocado y pasos posteriores contraídos
  - Botón primario de acción CTA de ancho completo: `Continuar · [Título del paso]`
  - Enlace secundario "quiet" inferior: `¿Prefieres ajustar la ruta? Prueba de nivel · Diagnóstico oral`

- **`HomeStatsRow.tsx`**:
  - Tira de 2 columnas debajo de la tarjeta del plan:
    - Left: `Palabras esenciales · [Nivel]` (`[Aprendidas] de [Total]`)
    - Right: `En repaso` (`[Count]`, subtexto "Empiezan tras tus primeras palabras")

- **`HomeImmersionCard.tsx`**:
  - Tarjeta de registro de inmersión real:
    - Título: 📺 `Registrar inmersión`
    - Subtítulo: *¿Viste algo en inglés hoy? Cuenta para tu exposición real.*
    - Filtros: `[Video]` `[Serie]` `[Podcast]` `[Lectura]`
    - Input/Selector de minutos y botón `Registrar`

- **`HomeExtraExercisesAccordion.tsx`**:
  - Acordeón colapsable bloqueado al final de la columna principal:
    - 🔒 `Ejercicios extra` (*Se abren al terminar el plan de hoy*)

---

### 2. Sidebar Derecha (`HomeRightSidebar.tsx`)

- **`HomeChunkOfDayCard.tsx`**: Frase/Chunk del día estilizada para ancho de sidebar (360px).
- **`HomeWordOfDayCard.tsx`**: Palabra del día con IPA y significado para ancho de sidebar (360px).
- **`Te tocan hoy`**: Sección de chips de repaso rápido.

---

## Reglas de Arquitectura

- Límite estricto de máximo 250 líneas de código por archivo.
- Uso exclusivo de tokens semánticos CSS (`tokens.css`) y Tailwind v4.
- `app/(authenticated)/page.tsx` administra la carga asíncrona mediante `Promise.allSettled`.
