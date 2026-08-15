# Sistema de diseño

Esta carpeta documenta cómo aplicar el sistema visual existente de English
Journal. No define una identidad nueva: el código es la fuente de verdad para
los tokens, el tema y las APIs de componentes.

## Orden de autoridad

1. `app/styles/tokens.css`: valores vivos de color, espaciado, radio,
   tipografía, movimiento y superficies; incluye las variantes claro y oscuro.
2. `app/styles/theme.css`: nombres de utilidades Tailwind que exponen esos
   tokens.
3. `app/styles/utilities.css`: primitivas de composición y comportamiento
   compartido.
4. Los componentes en `components/ui` y `components/layout`: su API y sus
   estados reales.
5. `DESIGN.md`, `THEME_SYSTEM.md` y `visual-language.md`: intención,
   restricciones y reglas de aplicación.

Si una guía de esta carpeta discrepa de una de las cuatro primeras fuentes,
actualiza la guía; no cambies el token o el componente para hacerla coincidir.

## Contratos que no se negocian

- Conserva el tema personal: usa tokens semánticos y verifica en claro, oscuro
  y con un `--hue` distinto. No fijes un color de marca en un componente.
- Conserva las familias existentes: DM Sans para UI, DM Mono para kickers y
  notación técnica, y Andika mediante `font-ipa` para IPA.
- Mantén el shell canónico: `AppShell → PageLayout → PageHeader → contenido`.
  El arquetipo `dashboard`, `catalog` o `session` determina el ancho y la
  estructura de la ruta.
- El color primario expresa interacción; éxito, advertencia, error e
  información usan semántica fija y además texto o icono.
- Las superficies están planas en reposo. La elevación y el movimiento
  comunican interacción, no decoración.

## Mapa de referencias

| Necesidad | Referencia |
| --- | --- |
| Lenguaje, proporción y checklist visual | [visual-language.md](visual-language.md) |
| Tema dinámico y capas de tokens | [THEME_SYSTEM.md](../../THEME_SYSTEM.md) |
| Botones | [buttons/guide.md](buttons/guide.md) |
| Enlaces de texto | [anchors/guide.md](anchors/guide.md) |
| Excepciones a `style={{ ... }}` | [inline-style-exceptions.md](inline-style-exceptions.md) |

Los archivos `implementation-complete.md` y `migration-summary.md` son
contexto histórico de una migración anterior; no son una especificación actual.
