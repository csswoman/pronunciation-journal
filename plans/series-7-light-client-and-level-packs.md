# Serie 7 — cliente ligero y paquetes offline por nivel

Planes preparados el 2026-09-28 con `improve`, contra el checkout `26c05b4f`.
No se modificó código de producto ni se ejecutaron builds o tests durante la
preparación. La evidencia de tamaños del build más reciente fue aportada por el
usuario; el `.next` local correspondía a otro build y se usó solo para confirmar
grafos e importaciones, no para atribuir hashes exactos.

## Orden y estado

| Plan | Título | Prioridad | Esfuerzo | Dependencia | Estado |
|---|---|---|---|---|---|
| [055](055-measure-real-client-payloads.md) | Presupuestar JavaScript descargado en navegaciones reales | P0 | M | — | DONE |
| [056](056-thin-online-offline-client-boundaries.md) | Cargar cada runtime cliente solo cuando se necesita | P1 | M | 055 | DONE — /offline −71.7%, /tracking −22.4%; el +650 KB de /daily era baseline sin `.env.local` |
| [057](057-downloadable-cefr-resource-packs.md) | Descargar un paquete offline del nivel real del usuario | P1 | L | 056 | IN PROGRESS (pasos 1–5 y 7; falta aceptación navegador, paso 6) |

Orden recomendado: **055 → 056 → 057**.

## Dependency notes

- 055 establece el baseline que permite demostrar ahorro real y evita optimizar
  contra el inventario total de chunks.
- 056 separa el shell offline de Daily/Auth y mantiene runtimes pesados fuera de
  la entrada; 057 construye el gestor de packs sobre ese límite ya limpio.
- 057 conserva Dexie/outbox como contratos existentes y añade solo recibos de
  recursos por dispositivo.

## Decisiones fijadas por el usuario

- Algunas capacidades pueden requerir internet.
- El dispositivo debe poder descargar solo recursos del nivel del usuario.
- No se descarga todo el catálogo por defecto.
- La UI debe distinguir recursos incluidos, descargados y conectados.

## Findings considered and rejected

- **Subir `publishedChunksGzipKB` para desbloquear CI**: no reduce ninguna
  descarga y oculta el crecimiento; 055 reemplaza el gate por evidencia real.
- **Descargar los chunks actuales de Essential Words que contengan el nivel**:
  A1 y A2 aparecen en los 28 chunks, por lo que descargaría prácticamente todo.
  057 genera packs CEFR exclusivos.
- **Guardar progreso dentro del recibo del pack**: duplicaría fuentes de verdad.
  El progreso sigue en Dexie/outbox/Supabase según los contratos existentes.
- **Borrar el pack anterior cuando cambia el nivel**: puede eliminar material
  que la persona eligió conservar y hace frágil una actualización. Se conserva
  hasta que el usuario lo quite.
- **Prometer TTS del sistema sin conexión**: depende del navegador y de voces
  instaladas; se etiqueta como capacidad no garantizada.

## Cierre

055 puede cerrarse con medición reproducible. 056 necesita build y navegación
fría. 057 exige aceptación autenticada online/offline/reload/reconnect; tests y
un recibo Dexie aislado no bastan para declararlo DONE.
