# Button Quick Reference

## 8 Variantes

```
primary    → Dark ink on light (main CTA)
secondary  → Raised surface + border (subordinate)
soft       → Primary-soft bg (contextual)
ghost      → Transparent (tertiary)
success    → Green (positive action)
warning    → Amber (caution)
error      → Red (destructive)
info       → Blue (informational)
```

## 3 Tamaños

```
sm  →  h-8  (inline, tags)
md  →  h-10 (default, forms)
lg  →  h-12 (hero, prominent)
```

## Usage Cheat Sheet

### Primary CTA
```tsx
<Button variant="primary" size="md" icon={<Play />}>
  Start Practice
</Button>
```

### Cancel / Skip
```tsx
<Button variant="secondary">
  Cancel
</Button>
```

### Confirm action
```tsx
<Button variant="soft" icon={<Check />}>
  Confirm
</Button>
```

### Dismiss / Subtle
```tsx
<Button variant="ghost">
  Dismiss
</Button>
```

### Positive (Done / Accept)
```tsx
<Button variant="success" icon={<Check />}>
  Complete
</Button>
```

### Needs attention
```tsx
<Button variant="warning" icon={<AlertCircle />}>
  Confirm delete
</Button>
```

### Destructive
```tsx
<Button variant="error" icon={<Trash2 />}>
  Delete
</Button>
```

### Info / Learn more
```tsx
<Button variant="info" icon={<Info />}>
  Learn more
</Button>
```

### Loading
```tsx
<Button isLoading icon={<Loader />}>
  Saving...
</Button>
```

### Full width (modal, form)
```tsx
<Button fullWidth variant="primary">
  Submit
</Button>
```

### Icon on right
```tsx
<Button icon={<ChevronRight />} iconPosition="right">
  Next step
</Button>
```

## All Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| variant | string | "primary" | See 8 variants above |
| size | string | "md" | sm, md, lg |
| icon | ReactNode | — | Lucide icon, SVG, etc. |
| iconPosition | string | "left" | left or right |
| fullWidth | boolean | false | 100% width |
| isLoading | boolean | false | Spins icon + disables |
| disabled | boolean | false | Native button disabled |

Plus all standard HTML button attributes (onClick, type, className, etc.)

## Design Token Mapping

```
primary        → --cta-bg + --cta-fg (dark ink)
secondary      → --surface-raised + border
soft           → --primary-soft + --primary
ghost          → transparent + --fg-secondary
success        → --success + white
warning        → --warning + white
error          → --error + white
info           → --info + white
```

All tokens are CSS custom properties in `globals.css`.

## Quick Styling Notes

- ✅ Shadows: only on hover/active
- ✅ Transitions: 150ms ease-out-quart
- ✅ No nested buttons
- ✅ Icon + text for accessibility
- ✅ Min hit area: 32px tall (44px+ recommended)
- ✅ Focus ring always visible

## Showcase

See all variants visually in `/components/ui/ButtonShowcase.tsx`.

Import and render in a dev page to preview.
