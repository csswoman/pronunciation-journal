# Button: referencia rápida

API actual: [`components/ui/Button.tsx`](../../../components/ui/Button.tsx).
Guía completa: [guide.md](guide.md).

## Variante

```text
primary  → CTA de una zona
secondary → alternativa subordinada
soft     → acción contextual
ghost    → acción terciaria
success / warning / error / info → significado semántico real
```

## Tamaño

```text
sm → compacto (32px visual / 44px táctil)
md → por defecto (40px)
lg → destacado (48px)
```

## Uso

```tsx
<Button variant="primary" icon={<Play />}>Empezar práctica</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="soft" icon={<Bookmark />}>Guardar para después</Button>
<Button variant="ghost" size="icon" aria-label="Cerrar" icon={<X />} />
<Button variant="error" icon={<Trash2 />}>Eliminar</Button>
```

## Props

| Prop | Por defecto | Nota |
| --- | --- | --- |
| `variant` | `primary` | Ocho variantes canónicas. |
| `size` | `md` | También hay tamaños de icono por compatibilidad. |
| `icon` / `iconPosition` | — / `left` | Icono opcional a izquierda o derecha. |
| `fullWidth` | `false` | Ocupa el ancho disponible. |
| `isLoading` | `false` | Muestra carga y deshabilita. |

`outline`, `danger` y `ghost-danger` son alias legacy: no los uses en código
nuevo. Un botón sin texto visible necesita `aria-label`.
