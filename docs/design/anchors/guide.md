# Anchor Component Guide

Componente para enlaces `<a />` de texto — color + subrayado + hover.

**Nota:** Se llama **Anchor** (no Link) para evitar confusión con `next/link`.

---

## Cuándo usar cada uno

### `<Link />` (Next.js)
Para navegación interna (rutas del app):

```tsx
import Link from "next/link";
<Link href="/lessons">Go to lessons</Link>
```

### `<Anchor />` (Este componente)
Para enlaces de texto simples:

```tsx
import Anchor from "@/components/ui/Anchor";
<Anchor href="https://example.com">External site</Anchor>
<Anchor href="mailto:hello@example.com">Send email</Anchor>
<Anchor href="#section">Jump to section</Anchor>
```

### `<Button />`
Para acciones interactivas:

```tsx
import Button from "@/components/ui/Button";
<Button onClick={handler}>Click me</Button>
```

---

## Variantes de color

6 colores semánticos:

```tsx
<Anchor color="primary" href="#">Primary link (default)</Anchor>
<Anchor color="secondary" href="#">Secondary link</Anchor>
<Anchor color="success" href="#">Success link (green)</Anchor>
<Anchor color="error" href="#">Error link (red)</Anchor>
<Anchor color="warning" href="#">Warning link (amber)</Anchor>
<Anchor color="info" href="#">Info link (blue)</Anchor>
```

**Default:** `color="primary"` (color primary del tema)

---

## Props

```tsx
interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  // ... plus all native <a> props (href, target, rel, etc.)
}
```

### Prop Details

- **color**: Color del texto (default: "primary")
- **icon**: ReactNode (Lucide icon, SVG, etc.)
- **iconPosition**: Posición del icon (default: "left")
- **href**: URL (requerido)
- **target**: `_blank`, `_self`, etc.
- **rel**: `noopener`, `noreferrer`, etc.
- **className**: Clases adicionales

---

## Estilos

El Anchor renderiza un link de **texto puro** con:

- **Color:** Según el prop `color` (primario, secundario, o semántico)
- **Subrayado:** Siempre visible
- **Hover:** Cambia color + quita subrayado
- **Focus:** Outline visible en keyboard navigation

---

## Ejemplos

### Enlaces externos

```tsx
<Anchor href="https://github.com" target="_blank" rel="noopener noreferrer">
  Visit GitHub
</Anchor>
```

### Mailto

```tsx
<Anchor href="mailto:hello@example.com">
  Send email
</Anchor>
```

### Anchor dentro de página

```tsx
<Anchor href="#pricing" color="secondary">
  Go to pricing
</Anchor>
```

### Con icon

```tsx
import { ExternalLink } from "lucide-react";

<Anchor
  href="https://docs.example.com"
  target="_blank"
  rel="noopener noreferrer"
  icon={<ExternalLink size={14} />}
>
  Documentation
</Anchor>
```

### Icon a la derecha

```tsx
import { ArrowRight } from "lucide-react";

<Anchor
  href="/course"
  icon={<ArrowRight size={14} />}
  iconPosition="right"
>
  Next lesson
</Anchor>
```

### Colores semánticos

```tsx
<Anchor color="success" href="/success">
  Approved
</Anchor>

<Anchor color="error" href="/delete">
  Delete account
</Anchor>

<Anchor color="info" href="/help">
  Need help?
</Anchor>
```

---

## Accesibilidad

✅ Focus ring visible en keyboard navigation
✅ Color + icon (no solo color)
✅ Usa `rel="noopener noreferrer"` para `target="_blank"`
✅ Texto descriptivo (no "click here")
✅ Contraste WCAG AA

```tsx
<Anchor
  href="https://docs.example.com"
  target="_blank"
  rel="noopener noreferrer"
  icon={<ExternalLink size={14} />}
>
  Read full documentation
</Anchor>
```

---

## Design System

El color usa design tokens de `globals.css`:

- **primary:** `--primary`
- **secondary:** `--fg-secondary`
- **success:** `--success`
- **error:** `--error`
- **warning:** `--warning`
- **info:** `--info`

Respeta light/dark mode automáticamente.

---

## Transiciones

- **Duration:** 150ms
- **Easing:** ease-out-quart (exponencial, sin bounce)
- **Efecto:** Color change + underline toggle en hover

---

## Patrones comunes

### Footer links

```tsx
<div className="flex gap-4 text-sm">
  <Anchor href="/privacy">Privacy</Anchor>
  <Anchor href="/terms">Terms</Anchor>
  <Anchor href="/contact">Contact</Anchor>
</div>
```

### Navigation

```tsx
<nav className="flex gap-3">
  <Anchor href="/about">About</Anchor>
  <Anchor href="/blog">Blog</Anchor>
  <Anchor href="/contact">Contact</Anchor>
</nav>
```

### Con separadores

```tsx
<p>
  Read <Anchor href="/docs">documentation</Anchor> or <Anchor href="/tutorial">start a tutorial</Anchor>
</p>
```

---

## Diferencias clave

| Elemento | Tipo | Color | Subrayado | Padding | Cuando usar |
|----------|------|-------|-----------|---------|------------|
| **Anchor** | `<a />` | Sí | Sí | No | Enlaces de texto |
| **Link** | next/link | No | No | No | Navegación interna |
| **Button** | `<button>` | No | No | Sí | Acciones (onClick) |

---

## Preguntas frecuentes

**¿Puedo usar Anchor para navegación interna?**
Técnicamente sí, pero `<Link>` de Next.js es mejor para SEO y prefetch.

**¿Cómo cambio el color del hover?**
El hover automáticamente oscurece/ilumina el color según el tema. No se personaliza por componente.

**¿Debo usar `rel` para externos?**
Sí, usa `rel="noopener noreferrer"` con `target="_blank"` para seguridad.

**¿Puede el Anchor tener padding o parecer un botón?**
No, Anchor es siempre texto. Para botones, usa el componente `Button`.

---

## Notas

- Renderiza un `<a />` nativo (semántico)
- Color por defecto: primary (primario del tema)
- Siempre con subrayado (indicador visual de link)
- Soporta todos los props nativos de `<a />`
- No interfiere con Next.js Link
