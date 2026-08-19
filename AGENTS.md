# Instrucciones de diseño

## Contexto obligatorio para UI

Antes de analizar, criticar, rediseñar o editar una superficie visual, leer:

1. `PRODUCT.md`
2. `DESIGN.md`
3. `THEME_SYSTEM.md`
4. `docs/design/visual-language.md`
5. `docs/design/primitives.md` (APIs vigentes: botones, radios, Badge)

Esto aplica en particular a las tareas de Impeccable: `craft`, `shape`,
`critique`, `audit`, `polish`, `bolder`, `quieter`, `distill`, `colorize`,
`typeset`, `layout`, `delight`, `adapt` y `live`.

## Contrato de diseño

- Mantener el tema personal dinámico: los componentes consumen tokens
  semánticos y deben funcionar con cualquier `--hue` y con `.dark`.
- Tomar el Home como referencia para jerarquía: repaso accionable, plan diario
  como superficie principal y práctica sugerida subordinada.
- Respetar la escala de `border-radius`, la proporción de color y las reglas de
  personalidad de `docs/design/visual-language.md`.
- Usar DM Sans para la UI, DM Mono para kickers y notación técnica, y Andika
  mediante `font-ipa` / `.font-phoneme` para IPA. No introducir una fuente
  decorativa adicional.
- CTA de chrome: tinta (`Button` `primary`). Avance de sesión: hue
  (`PillButton` `primary`). Secondary: raised + borde. `Badge` solo variantes
  semánticas.
- Verificar cambios visuales en modo claro y oscuro, y con un hue distinto al
  inicial. No añadir colores, sombras, radios o gradientes locales para forzar
  una apariencia.

Si alguno de estos documentos cambia durante la tarea, volver a leerlo antes de
continuar con decisiones visuales.
