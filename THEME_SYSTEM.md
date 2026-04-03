# OKLCH Dynamic Theme System

## Overview
We've implemented a Fuwari-inspired theme system where a single hue value (0-360) controls the entire accent color palette using OKLCH color space.

## Architecture

### 1. Core Hook: `useOKLCHTheme.ts`
Manages all theme logic:
- **Hue State** (0-360): Controls accent color
- **Mode State** (light/dark): Controls color scheme
- **Persistence**: Stores in localStorage as `theme-hue` and `theme-mode`
- **Initialization**: Reads from localStorage on client-side mount, falls back to system preference

### 2. CSS Variable System: `globals.css`
```css
:root {
  --hue: 250; /* Default hue */
  
  /* Light mode */
  --bg: oklch(0.98 0.01 var(--hue));
  --fg: oklch(0.2 0.02 var(--hue));
  --primary: oklch(0.65 0.15 var(--hue));
  --primary-soft: oklch(0.9 0.08 var(--hue));
  /* ... more variables */
}

.dark {
  --bg: oklch(0.12 0.02 var(--hue));
  --fg: oklch(0.95 0.01 var(--hue));
  --primary: oklch(0.7 0.14 var(--hue));
  /* ... dark mode adjustments */
}
```

### 3. UI Component: `ThemeColorController.tsx`
Located in the sidebar with:
- **Hue Slider** (0-360) with rainbow gradient background
- **Color Preview**: Shows accent color in both light and dark modes
- **Dark Mode Toggle**: Sun/moon icon button
- **Reset Button**: Returns hue to default (250)
- **Responsive Display**: 
  - Expanded (sidebar open): Full controls
  - Collapsed (sidebar closed): Just color dot indicator

### 4. Theme Initialization: `layout.tsx`
Inline script runs before React hydration:
```javascript
// Set dark mode from localStorage before page renders
document.documentElement.classList.toggle(
  'dark',
  localStorage.getItem('theme-mode') === 'dark' || 
  (!localStorage.getItem('theme-mode') && window.matchMedia(...).matches)
);

// Set hue before page renders
const savedHue = localStorage.getItem('theme-hue');
if (savedHue) {
  document.documentElement.style.setProperty('--hue', savedHue);
}
```

## Usage

### For Users
1. Open the app (theme loads from localStorage automatically)
2. Expand the sidebar
3. Use the hue slider to change the accent color (real-time update)
4. Click the sun/moon icon to toggle dark mode
5. Click the refresh icon to reset to default hue (250)

### For Developers
```typescript
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";

export default function MyComponent() {
  const { hue, setHue, resetHue, mode, toggleMode } = useOKLCHTheme();
  
  // Use in your component
  return (
    <div>
      <p>Current hue: {hue}°</p>
      <p>Mode: {mode}</p>
    </div>
  );
}
```

## CSS Variables Available

### Color Variables
- `--bg`: Background color
- `--fg`: Foreground color  
- `--bg-secondary`, `--bg-tertiary`: Secondary backgrounds
- `--primary`: Main accent color
- `--primary-foreground`: Text on primary
- `--primary-hover`: Hover state accent
- `--primary-soft`: Soft background with accent tint
- `--text-primary`, `--text-secondary`, `--text-tertiary`: Text colors
- `--border`, `--border-hover`: Border colors

### Layout Variables
- `--sidebar-width`: Sidebar width (256px or 80px)

### Backward Compatibility
- `--color-accent`: Same as `--primary`
- `--color-accent-soft`: Same as `--primary-soft`
- `--accent-rgb`: RGB values for rgba fallback

## Smooth Transitions
All color transitions animate smoothly (0.2s ease) thanks to global CSS:
```css
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

## Customization

### Change Default Hue
Edit `useOKLCHTheme.ts`:
```typescript
const DEFAULT_HUE = 250; // Change this value
```

### Adjust Chroma/Lightness
Edit `globals.css` OKLCH values. Examples:
```css
/* More saturated */
--primary: oklch(0.65 0.20 var(--hue)); /* was 0.15 */

/* Brighter */
--primary: oklch(0.75 0.15 var(--hue)); /* was 0.65 */
```

### Storage Keys
- `theme-hue`: Stores hue value (0-360)
- `theme-mode`: Stores mode ("light" or "dark")

## Browser Compatibility
- ✅ OKLCH color space: Chrome 111+, Firefox 113+, Safari 16.4+
- ✅ CSS variables: All modern browsers
- ✅ LocalStorage: All modern browsers
- ✅ Fallback: CSS variable support required (no fallback colors needed in this setup)

## Performance
- **No Libraries**: Pure React + CSS
- **Client-Side**: All color calculations done via CSS, zero JS runtime overhead
- **Persistence**: Single localStorage call on mount
- **Smooth**: 60fps transitions via CSS

## Known Limitations
- Hue must be 0-360 (no saturation/lightness customization in UI)
- OKLCH requires modern browser support
- Theme persists per device (no cloud sync)
