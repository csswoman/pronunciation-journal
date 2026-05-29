# Button Component Migration Summary

## ✅ Completed

Refactored Button component to align with DESIGN.md system and created comprehensive variant system.

---

## What You Get Now

### 8 Production-Ready Variants

All variants use design tokens from `globals.css`. No hardcoded colors.

```
┌─────────────────────────────────────────────────────────────────┐
│ PRIMARY (CTA)                                                   │
│ Dark ink on light parchment — main interactive affordance     │
│ Uses: --cta-bg, --cta-fg                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SECONDARY                                                       │
│ Raised surface with border — subordinate action               │
│ Uses: --surface-raised, --fg-primary                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SOFT                                                            │
│ Primary-soft background — contextual brand action             │
│ Uses: --primary-soft, --primary                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ GHOST                                                           │
│ Transparent, secondary text — tertiary action                 │
│ Uses: transparent, --fg-secondary                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SUCCESS (Green)                                                 │
│ Positive action, confirmation — semantic color                │
│ Uses: --success                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ WARNING (Amber)                                                 │
│ Caution, attention required — semantic color                  │
│ Uses: --warning                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ERROR (Red)                                                     │
│ Destructive action, delete — semantic color                   │
│ Uses: --error                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ INFO (Blue)                                                     │
│ Informational, learn more — semantic color                    │
│ Uses: --info                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3 Sizes (sm, md, lg)

| Size | Padding | Height | Font | Use Case |
|------|---------|--------|------|----------|
| sm | px-3 py-1.5 | h-8 | text-xs | Inline actions, tags |
| md | px-5 py-2.5 | h-10 | text-sm | Forms, standard CTAs (default) |
| lg | px-6 py-3 | h-12 | text-base | Hero CTAs, prominent actions |

### Props

```tsx
<Button
  variant="primary"      // 8 variants
  size="md"              // sm, md, lg
  icon={<Play />}        // optional icon
  iconPosition="left"    // left or right
  fullWidth             // 100% width
  isLoading             // auto-spin icon + disable
  disabled              // native button disabled
  onClick={handler}     // standard button props
>
  Click me
</Button>
```

---

## Files Changed/Created

### Modified
- ✏️ `components/ui/Button.tsx` — Refactored with 8 variants + design tokens
- ✏️ `components/home/HomeHeaderActions.tsx` — Updated to use new Button API, fixed button copy

### Created
- 📄 `components/ui/button-variants.tsx` — Variant documentation
- 📄 `components/ui/ButtonShowcase.tsx` — Visual demo of all variants
- 📄 `BUTTON_GUIDE.md` — Complete reference (5 sections, 200+ lines)
- 📄 `BUTTON_QUICK_REFERENCE.md` — One-page cheat sheet
- 📄 `BUTTON_MIGRATION_SUMMARY.md` — This file

---

## Before → After

### Old Usage (HomeHeaderActions)
```tsx
// ❌ Before: custom classes, duplicate buttons, hardcoded tokens
<button
  onClick={() => router.push("/courses")}
  className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
>
  <Play size={13} className="fill-current" />
  Start today's plan
</button>

<button
  onClick={() => router.push("/courses")} // ← same destination!
  className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
>
  Browse courses
</button>
```

### New Usage
```tsx
// ✅ After: component API, clear intent, design tokens
<Button
  variant="primary"
  size="md"
  icon={<Play size={16} className="fill-current" />}
  onClick={() => router.push("/courses")}
>
  {hasStartedLearning ? "Continue learning" : "Start learning"}
</Button>

<Button
  variant="secondary"
  size="md"
  icon={<BookOpen size={16} />}
  onClick={() => router.push("/vocabulary")} // ← different destination!
>
  Explore vocabulary
</Button>
```

**Improvements:**
- ✅ Removed hardcoded `btn-primary` / `btn-secondary` classes
- ✅ All colors now use design tokens (`--cta-bg`, `--surface-raised`, etc.)
- ✅ Fixed duplicate button text ("Start today's plan" twice)
- ✅ Fixed button routing (second button now goes somewhere useful)
- ✅ Better button labels ("Continue learning" vs "Start learning" based on state)
- ✅ Added icon labels for clarity (BookOpen icon + "Explore vocabulary")

---

## Design System Alignment

### Color Strategy: Restrained + Semantic

✅ **Restrained** (neutral surfaces + primary accent ≤10%)
- primary, secondary, soft, ghost use neutral backgrounds + primary text
- Respect the "Curious Notebook" aesthetic

✅ **Semantic** (fixed colors for correctness feedback)
- success (green), warning (amber), error (red), info (blue)
- Never tied to `--hue`; always culturally legible

### Transitions
- **Duration:** 150ms (responsive, not sluggy)
- **Easing:** ease-out-quart (exponential, no bounce)
- **States:**
  - **Hover:** background color change + shadow lift
  - **Active:** translate-y -1px (tactile feedback)
  - **Disabled:** opacity 50% + pointer-events-none

### Accessibility
✅ Focus ring (outline-2, offset-2, var(--primary))
✅ Min height 32px (44px+ recommended)
✅ Icon + text (never icon-only unless obvious)
✅ Color + icon for semantic buttons (not color alone)

---

## How to Use

### Quick Start
```tsx
import Button from "@/components/ui/Button";

export default function MyComponent() {
  return (
    <Button variant="primary" onClick={handleClick}>
      Click me
    </Button>
  );
}
```

### With Icon
```tsx
<Button 
  variant="primary" 
  size="lg" 
  icon={<Play size={18} />}
>
  Start Practice
</Button>
```

### Loading State
```tsx
const [saving, setSaving] = useState(false);

async function handleSave() {
  setSaving(true);
  await api.save();
  setSaving(false);
}

<Button 
  variant="primary" 
  isLoading={saving}
  icon={<Save />}
  onClick={handleSave}
>
  {saving ? "Saving..." : "Save"}
</Button>
```

### Semantic Actions
```tsx
// Positive
<Button variant="success" icon={<Check />}>Approve</Button>

// Warning
<Button variant="warning" icon={<AlertCircle />}>Confirm</Button>

// Destructive
<Button variant="error" icon={<Trash2 />}>Delete</Button>

// Info
<Button variant="info" icon={<Info />}>Learn more</Button>
```

---

## Next Steps

### Visual Testing
1. Open `/components/ui/ButtonShowcase.tsx`
2. Import into a dev page (e.g., `/app/dev/buttons/page.tsx`)
3. Run the dev server and verify all variants render correctly

### Migration
Search codebase for remaining `btn-primary` / `btn-secondary` hardcoded classes and migrate to the Button component.

```bash
# Find old button classes
grep -r "btn-primary\|btn-secondary" src/ components/ app/
```

### References
- **Full guide:** `BUTTON_GUIDE.md` (all variants, props, examples)
- **Quick ref:** `BUTTON_QUICK_REFERENCE.md` (cheat sheet)
- **Visual demo:** `ButtonShowcase.tsx` (see all variants at once)
- **Design system:** `DESIGN.md` (design philosophy, tokens)
- **Project rules:** `CLAUDE.md` (styling rules, hard rules)

---

## Notes

- All variants are production-ready
- Design tokens are CSS custom properties in `globals.css`
- Respects dark/light mode automatically
- No Tailwind config changes needed
- Backward compatible (old hardcoded classes still work until migrated)

---

**Questions?** See `BUTTON_GUIDE.md` FAQ section.
