| Task | Status | Description |
|---|---|---|
| Fase 0: Medición fidedigna y baseline | Done | Script de medición reproducible en build de producción y reporte de línea base |
| Fase 1: Essential Words | Pending | Índice compacto build-time generado; pendiente completar conexión de carga granular en runtime-engine/session-loader |
| Fase 2: Auth y Daily Plan | Done | Bootstrap único, dedupe in-flight, evitar re-hidrataciones remotas (userIdChanged) y optimizar composición del plan |
| Fase 3: Carga diferida y code splitting | Done | SearchModal diferido, SoundLab modular y carga compacta, Daily/Review session runners diferidos |
| Fase 4: Servidor y Progress | Done | Reutilizar server user en layout/pages y queries separadas originales restauradas para /progress |
| Fase 5: CLS, Fuentes y Base de Datos | Done | Eliminar CLS en /daily, afinar preloads/fuentes y migración SQL corregida (sin índices duplicados, DROP POLICY exactos) |
| Verificación final e informe de resultados | Pending | Pendiente generar performance-after.json fidedigno con sesión iniciada y suite completa |
