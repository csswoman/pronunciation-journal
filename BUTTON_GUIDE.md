# Button Component Guide

Refactorizado para alinearse con `DESIGN.md` y los design tokens del proyecto.

## ✅ Lo que cambió

| Antes | Después |
|-------|---------|
| `btn-primary` class | `variant="primary"` prop |
| `btn-secondary` class | `variant="secondary"` prop |
| Variables CSS genéricas (`--primary-500`, `--bg-secondary`) | Design tokens específicos (`--cta-bg`, `--surface-raised`) |
| Muchas variantes no usadas (dashed, segmented, etc.) | 8 variantes esenciales solo |
| `selected` prop (no se usaba) | Removido; usa estado en parent component |
| No había loading state | `isLoading` prop con spin animation |

---

## Variantes disponibles

### 🎯 **primary** (CTA principal)
Dark ink background + parchment text. La acción más importante en la pantalla.

```tsx
<Button variant="primary" size="md" icon={<Play />}>
  Start Practice
</Button>
```

**Cuándo usar:**
- Botón principal de formulario ("Submit", "Save", "Continue")
- Acción más importante en la pantalla ("Start today's plan")
- CTAs en hero sections

---

### 📋 **secondary** (Acción subordinada)
Surface-raised background + primary text + border. Para acciones secundarias.

```tsx
<Button variant="secondary" size="md">
  Cancel
</Button>
```

**Cuándo usar:**
- Alternativa a la acción principal ("Cancel", "Skip")
- Botones en modales/dialogs junto a primary
- Acciones menos críticas

---

### 💬 **soft** (Acción contextual en-brand)
Primary-soft background + primary text. Menos énfasis que primary, pero más que ghost.

```tsx
<Button variant="soft" size="md" icon={<Check />}>
  Confirm
</Button>
```

**Cuándo usar:**
- Acciones que refuerzan la marca pero no son CTAs globales
- "Mark as favorite", "Save for later", "Add to deck"
- Confirmaciones positivas

---

### 👻 **ghost** (Acción terciaria)
Transparent background, secondary text. Desaparece visualmente hasta hover.

```tsx
<Button variant="ghost" size="sm" icon={<ChevronRight />} iconPosition="right">
  More options
</Button>
```

**Cuándo usar:**
- Links que parecen botones ("Dismiss", "View all")
- Acciones inline o en listas
- Nav items o breadcrumbs

---

### ✅ **success** (Confirmación / acción positiva)
Green background + white text. Semantic color para "hecho", "aprobado", "correcto".

```tsx
<Button variant="success" size="md" icon={<Check />}>
  Complete exercise
</Button>
```

**Cuándo usar:**
- Confirmación de acciones positivas
- Finalizaciones ("Submit answer", "Mark complete")
- Feedback visual de éxito

---

### ⚠️ **warning** (Precaución / acciones riesgosas)
Amber background + white text. Para acciones que requieren confirmación extra.

```tsx
<Button variant="warning" size="md" icon={<AlertCircle />}>
  Reset progress
</Button>
```

**Cuándo usar:**
- Confirmación antes de deletear ("Confirm delete")
- Acciones que no se pueden deshacer
- Advertencias que requieren atención

---

### ❌ **error** (Acción destructiva)
Red background + white text. Para borrar, remover, cancelar permanentemente.

```tsx
<Button variant="error" size="md" icon={<Trash2 />}>
  Delete word
</Button>
```

**Cuándo usar:**
- Borrar / remover ("Delete", "Remove from deck")
- Acciones destructivas sin recuperación
- Danger zone actions

---

### ℹ️ **info** (Información / exploración)
Blue background + white text. Para acciones informativas o de aprendizaje.

```tsx
<Button variant="info" size="md" icon={<Info />}>
  Learn more
</Button>
```

**Cuándo usar:**
- "Learn more", "See details", "Help"
- Links a documentación
- Acciones informativas

---

## Tamaños

| Tamaño | Padding | Font size | Height | Uso |
|--------|---------|-----------|--------|-----|
| **sm** | px-3 py-1.5 | text-xs | h-8 | Inline actions, tags, secondary buttons pequeños |
| **md** | px-5 py-2.5 | text-sm | h-10 | Default, form buttons, standard CTAs |
| **lg** | px-6 py-3 | text-base | h-12 | Hero CTAs, prominent primary actions |

---

## Props

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "soft" | "ghost" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  // ... plus all native button props
}
```

### Prop Details

- **variant**: Define el estilo visual (default: "primary")
- **size**: Define el tamaño (default: "md")
- **icon**: ReactNode to render (Lucide icon, SVG, etc.)
- **iconPosition**: Lado del icon respecto al texto (default: "left")
- **fullWidth**: Stretch to 100% width
- **isLoading**: Anima el icon con spin y disables el button
- **disabled**: Estándar HTML disabled

---

## Ejemplos prácticos

### Formulario simple
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <input type="text" placeholder="Enter name" />
  <div className="flex gap-2">
    <Button variant="primary" size="lg" fullWidth type="submit">
      Save
    </Button>
    <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
      Cancel
    </Button>
  </div>
</form>
```

### Acción con loading
```tsx
const [isLoading, setIsLoading] = useState(false);

async function handleSave() {
  setIsLoading(true);
  await saveData();
  setIsLoading(false);
}

<Button 
  variant="primary" 
  onClick={handleSave} 
  isLoading={isLoading}
  icon={<Save />}
>
  {isLoading ? "Saving..." : "Save"}
</Button>
```

### Grupo de acciones (modal)
```tsx
<div className="flex gap-2 justify-end">
  <Button variant="ghost" onClick={onClose}>
    Dismiss
  </Button>
  <Button variant="warning" icon={<AlertCircle />} onClick={onConfirmDelete}>
    Confirm delete
  </Button>
</div>
```

### Inline actions en lista
```tsx
<div className="flex items-center justify-between p-4">
  <span>Word: "pronunciation"</span>
  <div className="flex gap-1">
    <Button variant="ghost" size="sm" icon={<Play />}>
      Hear
    </Button>
    <Button variant="ghost" size="sm" icon={<Edit />}>
      Edit
    </Button>
    <Button variant="error" size="sm" icon={<Trash2 />}>
      Delete
    </Button>
  </div>
</div>
```

---

## Design System Alignment

El Button ahora usa **design tokens CSS** definidos en `globals.css`:

- `--cta-bg` / `--cta-fg`: CTA button (dark on light)
- `--primary` / `--primary-soft`: Primary interactive
- `--surface-raised` / `--surface-sunken`: Backgrounds
- `--success` / `--warning` / `--error` / `--info`: Semantic colors
- `--fg-primary` / `--fg-secondary`: Text colors

Todos estos tokens respetan el color scheme (light/dark) automáticamente.

---

## Transiciones

- Duration: 150ms
- Easing: ease-out-quart (exponential curve)
- Animaciones: no bounce, no elastic
- Hover: cambio de background + text color
- Active: translate-y para tactile feedback

---

## Accesibilidad

✅ Focus ring visible (outline-2, outline-offset-2)
✅ Contraste de color meets WCAG AA
✅ Icon + text en botones (no solo icon)
✅ Loading state desabilita el button para evitar double-submit
✅ Tamaño mínimo de hit area: h-8 (32px, recomendado 44px+)

---

## Migración de código antiguo

Si tienes código usando `btn-primary` o `btn-secondary` classes:

**Antes:**
```tsx
<button className="btn-primary inline-flex items-center gap-2 px-4 py-2">
  Start
</button>
```

**Después:**
```tsx
<Button variant="primary" size="md">
  Start
</Button>
```

Busca `btn-primary`, `btn-secondary` en tu codebase y reemplaza con el Button component.

---

## Testing

Todas las variantes están disponibles en `/components/ui/ButtonShowcase.tsx`. Aimport y usa en una ruta dev para ver visualmente todas las opciones.

```tsx
import ButtonShowcase from "@/components/ui/ButtonShowcase";

export default function DevPage() {
  return <ButtonShowcase />;
}
```

---

## Preguntas frecuentes

**¿Cómo hago un button que se ve como un link?**
Usa `variant="ghost"` sin icon, o `variant="primary"` con underline className custom.

**¿Puedo cambiar el radio de los corners?**
El radius está fijo en el design system (`rounded-sm`, `rounded-md`). Si necesitas algo diferente, abre una discusión en el proyecto.

**¿Cómo animo el icon?**
Usa `isLoading={true}` para spin automático. Para otras animaciones, pasa un className custom via el `icon` prop.

**¿El button es responsive?**
Sí, el height es fijo pero el padding es coherente. En pantallas muy pequeñas (< 320px), los botones se apilan bien.
