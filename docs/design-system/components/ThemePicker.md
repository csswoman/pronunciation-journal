Selector del color de tema: nueve discos que cambian solo `--accent`; las tarjetas pastel, la tinta y los neutros no cambian.

Guarda la elección y aplícala como `data-accent` en `<html>` (`red`, `orange`, `amber`, `green`, `emerald`, `teal`, `blue`, `purple`, `pink`). La apariencia claro/oscuro va aparte, en `data-theme`.

```html
<html data-theme="dark" data-accent="teal">
```

- Grupo con `role="radiogroup"`; cada disco `role="radio"`, `aria-checked` y `aria-label` con el nombre (“Azul”).
- Seleccionado: anillo doble (`bg` + `text`) y check blanco; el nombre del color se muestra encima.
- Los nueve acentos pasan 4.5:1 con texto blanco, así que cualquier elección es segura en botones, nav activo y chips de estado.
