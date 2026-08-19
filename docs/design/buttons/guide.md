# Button

Referencia actual para [`components/ui/Button.tsx`](../../../components/ui/Button.tsx).
Para las reglas transversales, empieza en [docs/design/README.md](../README.md).

## Cuándo usarlo

`Button` representa una acción que cambia estado, inicia una práctica o confirma
una decisión. Para navegar por una ruta usa `next/link`; para un enlace de texto
usa `Anchor`.

## Variantes canónicas

| Variante | Cuándo usarla |
| --- | --- |
| `primary` | La acción principal de una zona de chrome o hub. Usa `--cta-bg` y `--cta-fg` (tinta sobre pergamino). |
| `secondary` | Alternativa subordinada, con superficie elevada y borde. |
| `soft` | Acción contextual con `--primary-soft`; no sirve como decoración. |
| `ghost` | Acción terciaria en listas, cabeceras o grupos compactos. |
| `success` | Confirmación cuyo significado es positivo. |
| `warning` | Acción que exige cautela. |
| `error` | Acción destructiva. |
| `info` | Ayuda o información contextual. |

Las variantes semánticas son para significado, no para variar la apariencia de
un CTA. Acompáñalas siempre de texto o icono.

```tsx
<Button variant="primary" icon={<Play />}>
  Empezar práctica
</Button>

<Button variant="secondary" onClick={onCancel}>
  Cancelar
</Button>

<Button variant="error" icon={<Trash2 />} onClick={onRemove}>
  Eliminar palabra
</Button>
```

## Tamaños y accesibilidad

| Tamaño | Altura | Uso |
| --- | ---: | --- |
| `sm` | 32px visual; 44px con modo táctil | Acciones compactas. |
| `md` | 40px | Valor por defecto y formularios. |
| `lg` | 48px | Acción principal con mayor presencia. |
| `icon`, `icon-sm`, `iconLg`, `icon-lg` | 44px o más | Compatibilidad; requieren nombre accesible. |

Un botón solo con icono necesita `aria-label`. No uses color como única señal
para éxito, advertencia o error.

## API

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "soft" | "ghost" |
    "success" | "error" | "warning" | "info" |
    "outline" | "danger" | "ghost-danger";
  size?: "sm" | "md" | "lg" | "icon" | "iconLg" | "icon-sm" | "icon-lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  isLoading?: boolean;
}
```

`outline`, `danger` y `ghost-danger` son alias de compatibilidad. No los
introduzcas en código nuevo.

```tsx
<Button
  variant="primary"
  isLoading={isSaving}
  icon={<Save />}
  onClick={handleSave}
>
  {isSaving ? "Guardando…" : "Guardar"}
</Button>

<Button variant="ghost" size="icon" aria-label="Cerrar" icon={<X />} />
```

## Estados y tokens

- `focus-ring` proporciona el foco visible.
- `isLoading` deshabilita el botón y muestra el indicador de carga.
- `primary` consume `--cta-bg` / `--cta-fg` en chrome y hubs. El avance dentro de una sesión usa `PillButton` `primary` (`--primary` / `--on-primary`).
- `secondary` usa superficie raised y borde; no es un outline de CTA. Las clases `.btn-secondary` deben coincidir con esta receta; el trabajo nuevo usa el componente.
- `soft` usa `--primary-soft` / `--primary`.
- `success`, `warning`, `error` e `info` consumen los tokens semánticos fijos.
- Los cambios de estado duran 150ms y las sombras aparecen como respuesta a
  interacción, no como decoración permanente.

Comprueba las variantes en modo claro, oscuro y con otro `--hue` antes de
considerar un cambio visual terminado.
