# Fase 8 — calibración detenida por fallo de diseño

Fecha: 2026-08-06

Estado: **detenida por la regla de parada de la Task 8.5**

Decisión: no fijar ni versionar los ocho grupos mientras la aceptación sea
estructuralmente inalcanzable.

## Configuración reproducible

- semilla: `42`;
- horizonte: `180` días;
- inicio: `2026-08-01T00:00:00.000Z`;
- corpus: `1.000` palabras;
- presupuesto: `900 s` por sesión activa;
- objetivo: `10` palabras nuevas por sesión elegible;
- aceptación: objetivo de retención `0,90 ± 0,05`, espera base máxima `8`
  sesiones y espera de atrasados máxima `12` sesiones.

Comando de baseline:

```powershell
pnpm exec vitest run lib/essential-words/simulation/__tests__/acceptance.test.ts --maxWorkers=1
```

Resultado: `33/43` tests verdes y `10/43` rojos. Los diez motores
adversariales permanecen verdes (`10/10`). Ningún perfil normal produjo una
serie trivial.

## Valores provisionales evaluados

| Grupo | Valor de baseline | Resultado de 8.5 |
|---|---|---|
| Madurez | `provisional-1`: estabilidad 21 d, 3 éxitos, máximo 1 lapse en 5 reviews | sin tocar; la carga no quedó estable |
| Activación base | 2 por sesión; 1 por ítem | insuficiente para el flujo de 10 palabras nuevas |
| Activación `usage` | 1 por sesión | no es el cuello; cuota máxima ≤ 0,30 |
| Inferido → provisional | `band-v1`, 8 por día | amplifica la cola avanzada; no es el bloqueo universal |
| Ventanas provisionales | easy 14–30 d; good 14–21 d; inference 7–21 d | sin tocar; no hubo picos sincronizados |
| Costes | recognition 12 s, production 25 s, listening 20 s, pronunciation 30 s, introducción 10 s | sin evidencia real para reemplazarlos |
| Recovery | entrada 2,00×; salida 0,75× presupuesto | baseline cumple salida/retorno formal |
| Latencia | 8/25/30/20 s por modalidad | sin tocar; no se usa para esconder carga o corrección |

## Once criterios por perfil

`✓` y `✗` indican el resultado diagnóstico al ejecutar los once criterios en
cada perfil. La aceptación formal solo aplica C4 a constante, C5 a ráfagas y
C8 a constante; la tabla completa permite ver efectos colaterales.

| Perfil | C1 presupuesto ≥0,90 | C2 p95 ≤1.350 s | C3 sale recovery | C4 pendiente ≤0; final ≤1.800 s | C5 retorno ≤14 | C6 usage ≤0,30 | C7 picos =0 | C8 nuevas ≥0,60 | C9 espera ≤8 | C10 atrasados ≤12 | C11 retención 0,85–0,95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| constante | ✓ 1,000 | ✓ 899 | ✓ no entró | ✗ +0,881; 591 | ✓ n/a | ✓ 0,222 | ✓ 0 | ✗ 0,177 | ✗ 173 | ✓ 2 | ✓ 0,866 |
| intermitente | ✓ 1,000 | ✓ 899 | ✓ 1 | ✓ −7,045; 1.178 | ✓ n/a | ✓ 0,100 | ✓ 0 | ✗ 0,410 | ✗ 94 | ✓ 5 | ✗ 0,822 |
| ráfagas | ✓ 1,000 | ✓ 899 | ✓ 1 | ✗ +11,738; 568 | ✓ 7 | ✓ 0,200 | ✓ 0 | ✗ 0,581 | ✗ 61 | ✓ 6 | ✗ 0,816 |
| principiante | ✓ 1,000 | ✓ 900 | ✓ no entró | ✗ +3,082; 1.223 | ✓ n/a | ✓ 0,167 | ✓ 0 | ✗ 0,318 | ✗ 155 | ✓ 9 | ✗ 0,603 |
| avanzada | ✓ 1,000 | ✓ 900 | ✓ 1 | ✓ −5,012; 655 | ✓ n/a | ✓ 0,300 | ✓ 0 | ✗ 0,289 | ✗ 167 | ✓ 3 | ✓ 0,944 |

## Series operativas por perfil

La espera informa número de ítems observados y `p50 / p95 / máximo` en
sesiones activas con presupuesto acumulado.

| Perfil | Sesiones | Carga máx./p95 (s) | Backlog pendiente/final (s) | Nuevas/meaning/base/usage | Placement/provisional due | Espera listening | Espera production | Edad máx. atrasado | Retención (muestra) | Picos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| constante | 180 | 900 / 899 | +0,881 / 591 | 305 / 305 / 147 / 58 | 0 / 271 | 305; 152 / 172 / 173 | 74; 1 / 7 / 16 | 2 | 0,866 (9.531/11.005) | 0 |
| intermitente | 96 | 900 / 899 | −7,045 / 1.178 | 164 / 164 / 39 / 17 | 0 / 300 | 164; 85 / 94 / 94 | 20; 1 / 12 / 14 | 5 | 0,822 (4.532/5.516) | 0 |
| ráfagas | 63 | 900 / 899 | +11,738 / 568 | 157 / 157 / 42 / 20 | 0 / 609 | 157; 52 / 61 / 61 | 22; 1 / 15 / 15 | 4 | 0,816 (3.011/3.689) | 0 |
| principiante | 156 | 900 / 900 | +3,082 / 1.223 | 89 / 89 / 27 / 10 | 0 / 56 | 89; 151 / 155 / 155 | 14; 1 / 139 / 139 | 5 | 0,603 (5.769/9.573) | 0 |
| avanzada | 167 | 900 / 900 | −5,012 / 655 | 346 / 346 / 145 / 66 | 230 / 779 | 571; 147 / 163 / 167 | 73; 1 / 8 / 167 | 3 | 0,944 (9.368/9.925) | 0 |

## Ajuste seguro ensayado

No hay sobrecarga de C1/C2 en baseline, por lo que reducir base, `usage`,
placement o costes no está motivado y agravaría C8/C9. Se ensayó el cambio
mínimo que ataca el déficit de servicio: elevar temporalmente el límite base
de `2` a `20`, sin modificar ningún umbral de aceptación.

| Perfil | C8 baseline → prueba | C9 baseline → prueba | Otros efectos rojos |
|---|---:|---:|---|
| constante | 0,177 → 0,104 | 173 → 45 | C11 0,866 → 0,825 |
| intermitente | 0,410 → 0,197 | 94 → 55 | C11 0,822 → 0,749 |
| ráfagas | 0,581 → 0,338 | 61 → 37 | C3 y C5 pasan a rojo; C11 0,816 → 0,743 |
| principiante | 0,318 → 0,072 | 155 → 150 | C11 0,603 → 0,554 |
| avanzada | 0,289 → 0,076 | 167 → 139 | sin rojo nuevo formal |

La prueba deja `31/43` criterios formales verdes; los adversariales siguen
`10/10`. El valor temporal se revirtió. El orden actual sirve activaciones base
antes que palabras nuevas: aumentar capacidad consume el presupuesto residual,
reduce admisiones y aun así no logra una espera ≤8.

## Bloqueos de diseño

### C11 es inalcanzable para principiante

`observedRetentionWithinTarget` mide `assessment.correct` en revisiones
programadas. El perfil principiante responde con probabilidades fijas por
modalidad: recognition `0,68`, production `0,52`, listening `0,50` y
pronunciation `0,48`. Cualquier mezcla conserva una esperanza ≤`0,68`, por
debajo del límite inferior `0,85`. Ninguno de los ocho grupos permitidos cambia
esas probabilidades; latencia solo decide `Easy/Good` y no puede usarse para
ocultar este fallo.

### C8 y C9 compiten sin control de admisión

Diez palabras nuevas crean diez `listening` y, después, diez `production` por
sesión: hasta veinte activaciones base nuevas frente a un servicio de dos. Subir
el límite no basta porque base precede a nuevas palabras en el planificador.
Hace falta relacionar admisión con capacidad pendiente, no elegir una constante
aislada.

### Placement amplifica avanzada; usage no es la raíz

La avanzada convierte 230 inferencias y acumula 571 ítems listening observados;
placement amplifica C9. `usage`, en cambio, respeta C6 en todos los perfiles y
no coincide con picos provisionales, por lo que reducirlo no resolvería el
bloqueo universal.

## Revisión de spec abierta

Antes de reanudar la calibración hay que decidir y probar:

1. qué representa C11: precisión bruta del perfil o retención programada por
   FSRS; el simulador no puede usar una probabilidad fija menor que el umbral y
   exigir simultáneamente el umbral global;
2. un control de admisión que limite palabras nuevas según las habilidades base
   pendientes y la capacidad real de las próximas sesiones;
3. si placement debe reservar capacidad propia antes de volver elegibles en
   bloque las habilidades listening/production;
4. qué fuente real y versionada aporta `interactionDurationMs` y `latencyMs`;
   la simulación sintética no es evidencia de producción para fijar costes o
   umbrales.

Hasta resolver esos puntos, se conservan los comentarios y versiones
provisionales. No hay cambios de schedule ni migración de historial.

## Revisión contractual posterior

La spec y el plan incorporan la resolución del bloqueo como Tasks 8.5–8.12:

- C11 usa retrievability únicamente para scheduled Review;
- admisión y placement comparten un ledger de ocho sesiones activas;
- costes y latencia exigen 200 muestras empíricas por modalidad;
- recalibración estructural, madurez y latencia quedan secuenciadas;
- detenerse no cierra Fase 8 y Fase 9 continúa bloqueada.

Esta revisión no implementa la recalibración. Permanecen rojos C4 constante,
C8 constante, C9 en los cinco perfiles y C11 en intermitente, ráfagas y
principiante. Los límites de C1–C11 no cambiaron.
