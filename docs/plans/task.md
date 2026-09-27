# Tarea activa — Plan 052: Ampliación de juegos de práctica

| # | Paso | Estado |
|---|------|--------|
| 0 | Fase 0: Infraestructura común (registry `skill`, `GameActivitySource`, `scoring.ts`) | ✅ |
| 1 | Fase 1: Phoneme Invaders (juego de discriminación auditiva y pares mínimos) | ✅ |
| 2 | Fase 2: Weak Form Catcher (juego de listening y formas reducidas) | ✅ |
| 3 | Fase 3: Chunk Duel (juego de colocaciones y bloques frecuentes) | ✅ |
| 4 | Fase 4: Memory Match (juego de memoria con palabras/audio/IPA) | ✅ |
| 5 | Fase 5: Falsos Amigos «¿Trampa?» (swipe de vocabulario y trampa) | ✅ |
| 6 | Fase 6: Registro en el hub, agrupaciones por skill y verificación final | ✅ |

Cierre Plan 052: 5 nuevos juegos creados e integrados en `/practice/games` y en sus rutas individuales (`/practice/phoneme-invaders`, `/practice/weak-form-catcher`, `/practice/chunk-duel`, `/practice/memory-match`, `/practice/false-friends-swipe`). Todos 100% offline y sin llamadas a Gemini. Títulos usando la fuente Bricolage (`font-heading`). Se quitó la etiqueta "Próximamente" de estos 5 juegos (solo conservando `Word Chain`). Pruebas unitarias de reductor y tokenizador en verde. `type-check` y `lint` limpios sin errores.
