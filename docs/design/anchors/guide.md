# Anchor

Referencia actual para [`components/ui/Anchor.tsx`](../../../components/ui/Anchor.tsx).
Para las reglas del sistema, consulta [docs/design/README.md](../README.md).

## Elegir el elemento correcto

| Necesidad | Elemento |
| --- | --- |
| Navegación interna habitual | `next/link` |
| URL externa, `mailto:` o ancla de página | `Anchor` |
| Acción que muta estado | `Button` |

```tsx
<Link href="/lessons">Abrir lecciones</Link>
<Anchor href="https://example.com">Recurso externo</Anchor>
<Anchor href="mailto:hello@example.com">Enviar correo</Anchor>
<Button onClick={handleSave}>Guardar</Button>
```

## API

```tsx
interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: "primary" | "secondary" | "success" | "error" |
    "warning" | "info" | "unstyled";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}
```

`primary` es la variante predeterminada. `unstyled` conserva el color heredado
y quita el subrayado; úsala solo cuando el contexto ya deja claro que es un
enlace.

```tsx
<Anchor
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  icon={<ExternalLink size={14} />}
>
  Documentación externa
</Anchor>
```

## Estados y accesibilidad

- Salvo `unstyled`, las variantes muestran subrayado en reposo. En hover cambia
  el color y se retira el subrayado; el foco visible usa `focus-ring`.
- El texto debe describir el destino; evita «haz clic aquí».
- Para `target="_blank"`, usa `rel="noopener noreferrer"`.
- El color no puede ser la única señal de significado: en enlaces semánticos,
  el propio texto debe explicar la acción o el estado.

```tsx
<p>
  Lee la <Anchor href="/docs">documentación</Anchor> o
  <Anchor href="/tutorial"> empieza el tutorial</Anchor>.
</p>
```
