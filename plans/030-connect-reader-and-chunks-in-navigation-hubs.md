# Plan 030: Mejorar el descubrimiento de Reader, Chunks y Drills

> **Executor instructions**: Revisa primero la navegación real y el hub de práctica. Ejecuta las verificaciones aplicables y actualiza `plans/README.md` al terminar.
>
> **Drift check (run first)**: compara `components/theme/sidebar/navConfig.ts`, `lib/practice/practice-modes.ts` y el componente que renderiza `PRACTICE_MODES` con el código vigente. No vuelvas a añadir destinos ya presentes.

## Status

- **Execution**: DONE — implementación y verificaciones completadas; verificación visual diferida por indicación del usuario.
- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: navigation / discovery
- **Planned at**: commit `87636eca`, 2026-09-22; diagnóstico actualizado

## Why this matters

Reader ya aparece como **Lectura** en `PRACTICE_MODES`, con enlace `/practice/reader`. No está huérfano ni exige crear otra tarjeta en el hub. Su acceso desde la barra lateral sigue siendo indirecto. Los destinos `/practice/chunks` y `/practice/ed-drills` sí faltan en `PRACTICE_MODES`. El objetivo es hacerlos visibles sin convertir la navegación principal en un inventario de todos los ejercicios.

## Current state

- `components/theme/sidebar/navConfig.ts`: `learnNav` ya ofrece Lectura junto a Vocabulario; `practiceNav` enlaza al hub, Mazos y Juegos.
- `components/practice/hub/PracticeOptionsGrid.tsx` compone tarjetas por categoría y no genera una lista desde `PRACTICE_MODES`. `ReaderCard` es su única tarjeta de Reader; `ReferenceSection` era el único acceso del hub a Chunks.
- `lib/practice/practice-modes.ts`: Reader ya estaba registrado; ahora también registra Chunks y `ed-drills`.
- Reader, Chunks y Drills tienen rutas propias. Verifica sus nombres y su disponibilidad actual antes de escribir texto o iconos.

## Scope and steps

1. Decide en el contexto de la jerarquía actual si Reader merece enlace lateral directo. Si lo añades, ubícalo junto a superficies consultivas de aprendizaje y comprueba que la barra lateral sigue siendo legible en móvil y escritorio. El hub ya permite llegar a Reader, así que el enlace lateral es una decisión de descubrimiento, no una reparación de ruta rota.
2. Añade Chunks y `ed-drills` a `PRACTICE_MODES` con etiquetas, descripciones e iconos que describan su práctica real. Reutiliza los iconos admitidos por el renderer. Mantén la prioridad de repaso y plan diario; añadir modos no debe elevarlos automáticamente a recomendación principal.
3. Comprueba enlaces, orden y duplicados en navegación y hub. Verifica en tema claro, oscuro y con otro hue si cambió la superficie visual. Usa tokens y primitivas vigentes.

## Done criteria

- [x] Reader conserva su entrada funcional en el hub; Lectura se añadió a Aprender porque es una superficie consultiva de vocabulario en contexto.
- [x] Chunks conserva un único acceso en el hub y `ed-drills` aparece una vez; ambos apuntan a rutas reales.
- [x] El resolver no se alteró y los tests mantienen la prioridad del repaso/plan.
- [x] Tests focalizados de `practice-modes`/navegación, `pnpm type-check` y `pnpm lint` pasan.
- [x] Verificación visual diferida por indicación del usuario; los estilos se cambiarán después y no fue necesaria para cerrar este plan.
- [x] `plans/README.md` refleja el resultado real y registra la aceptación visual pendiente.

## Ejecución

- La configuración `learnNav` es compartida por sidebar y menú móvil. Lectura quedó junto a Vocabulario; no se agregó Chunks al sidebar para mantener la navegación principal enfocada.
- El hub ya contenía un acceso a Chunks en `ReferenceSection`; se conservó y se añadió ahí el acceso a Escalera de -ed. Los modos nuevos no cambian la selección recomendada.
- Pasaron `pnpm vitest run lib/practice/__tests__/practice-modes.test.ts components/theme/sidebar/__tests__/navConfig.test.ts` (2 archivos, 11 tests), `pnpm type-check` y `pnpm lint`.
- Por indicación del usuario, la verificación visual en claro, oscuro y otro hue se difiere hasta el próximo trabajo de estilos. No se afirma aceptación visual en esta ejecución.

## STOP conditions

- Un destino está retirado, inaccesible o no tiene ejercicio utilizable.
- El renderer no reconoce el icono elegido o la nueva entrada rompe el orden del hub.
