# Inline Style Exceptions

Fecha: 2026-07-03

Los componentes deben preferir utilidades Tailwind y tokens CSS compartidos.
`style={{ ... }}` queda reservado para valores que se calculan en runtime y no
pueden expresarse como una clase estatica sin perder comportamiento.

## Excepciones Permitidas

| Superficie | Archivo | Motivo |
|---|---|---|
| Login rotating hue | `components/auth/AuthPanel.tsx` | El panel sincroniza `--primary-100`, `--primary-500` y `--primary-600` con la imagen activa. Los valores dependen de `imageIndex`, por lo que son estado runtime. |

## Regla De Cambio

- No agregar estilos inline para tipografia, espaciado, color estatico, sombras o bordes.
- Si un nuevo inline style es inevitable, debe declarar variables CSS o valores derivados de estado runtime y quedar registrado aqui.
