# Anchor Quick Reference

## Link vs Anchor vs Button

```
Link (Next)  → next/link para navegación interna (/lessons)
Anchor       → <a href="..."> enlaces de texto (externos, mailto, #)
Button       → <button> acciones interactivas (onClick)
```

---

## Quick Usage

### External link
```tsx
import Anchor from "@/components/ui/Anchor";

<Anchor href="https://example.com" target="_blank">
  Visit site
</Anchor>
```

### Mailto
```tsx
<Anchor href="mailto:hello@example.com">
  Send email
</Anchor>
```

### Anchor within page
```tsx
<Anchor href="#section">
  Jump to section
</Anchor>
```

### With icon
```tsx
<Anchor
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  icon={<ExternalLink size={14} />}
>
  External resource
</Anchor>
```

### Different color
```tsx
<Anchor color="success" href="/success">
  Approved
</Anchor>

<Anchor color="error" href="/delete">
  Delete
</Anchor>
```

---

## 6 Colors

```tsx
<Anchor color="primary">Primary (default)</Anchor>
<Anchor color="secondary">Secondary</Anchor>
<Anchor color="success">Success (green)</Anchor>
<Anchor color="error">Error (red)</Anchor>
<Anchor color="warning">Warning (amber)</Anchor>
<Anchor color="info">Info (blue)</Anchor>
```

---

## All Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| color | string | "primary" | 6 colors |
| icon | ReactNode | — | Lucide icon |
| iconPosition | string | "left" | left or right |
| href | string | — | Link URL |
| target | string | — | _blank, _self |
| rel | string | — | noopener, noreferrer |
| className | string | — | Extra classes |

Plus all native `<a>` attributes.

---

## Accessibility

✅ Focus ring visible
✅ Use `rel="noopener noreferrer"` for `target="_blank"`
✅ Icon + text (never icon-only)
✅ Descriptive text ("Learn more" not "click here")

```tsx
<Anchor
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
  icon={<ExternalLink size={14} />}
>
  External documentation
</Anchor>
```

---

## Common Patterns

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

### Within text
```tsx
<p>
  Read <Anchor href="/docs">documentation</Anchor> or 
  <Anchor href="/tutorial">start a tutorial</Anchor>
</p>
```

---

## Key Differences

| When | Use | Renders |
|------|-----|---------|
| Internal route | `<Link href="/lessons">` | next/link wrapper |
| External URL | `<Anchor href="https://...">` | `<a>` text link |
| Action/onClick | `<Button onClick={}>` | `<button>` |

---

## Remember

- **Anchor** = `<a>` elemento nativo, siempre texto con subrayado
- **Link** = Next.js para navegación interna
- **Button** = `<button>` para acciones
- Color default = primary
- Color cambia en hover + quita subrayado
