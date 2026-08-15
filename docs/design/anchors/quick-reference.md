# Anchor: referencia rápida

API actual: [`components/ui/Anchor.tsx`](../../../components/ui/Anchor.tsx).
Guía completa: [guide.md](guide.md).

```text
Link (Next) → navegación interna
Anchor      → URL externa, mailto o hash
Button      → acción que cambia estado
```

```tsx
<Anchor href="https://example.com" target="_blank" rel="noopener noreferrer">
  Visitar sitio
</Anchor>

<Anchor href="mailto:hello@example.com">Enviar correo</Anchor>
<Anchor color="info" href="/help">Ver ayuda</Anchor>
```

| Prop | Por defecto | Nota |
| --- | --- | --- |
| `color` | `primary` | `primary`, `secondary`, semánticos o `unstyled`. |
| `icon` / `iconPosition` | — / `left` | Icono opcional. |
| `href` | — | Destino nativo del enlace. |

Mantén texto descriptivo. Para `target="_blank"`, añade siempre
`rel="noopener noreferrer"`.
