/**
 * Button Component Variants Guide
 *
 * Alineado con DESIGN.md: "Buttons"
 * Usa design tokens CSS (--primary, --cta-bg, --surface-raised, etc.)
 *
 * ## Variantes disponibles:
 *
 * ### primary
 * - Acción principal (CTAs)
 * - Dark ink background (--cta-bg), parchment text (--cta-fg)
 * - Hover: ligeramente más claro
 * - Uso: "Start today's plan", "Save", "Continue"
 *
 * ### secondary
 * - Acción subordinada
 * - Surface-raised background, primary text
 * - Hover: sunken background
 * - Uso: "Cancel", "Skip", "Learn more"
 *
 * ### soft
 * - Acción contextual en-brand pero no dominante
 * - Primary-soft background, primary text
 * - Hover: más oscuro
 * - Uso: "Confirm", "Add to deck", "Mark as done"
 *
 * ### ghost
 * - Acción terciaria sin énfasis
 * - Transparent, secondary text
 * - Hover: surface-raised background
 * - Uso: "Dismiss", "More options", nav items
 *
 * ### success
 * - Confirmación positiva
 * - Green background (--success), white text
 * - Semantic color para "correcto" / "hecho"
 * - Uso: "Complete exercise", "Submit"
 *
 * ### error
 * - Acción destructiva / alerta
 * - Red background (--error), white text
 * - Semantic color para "error" / "eliminar"
 * - Uso: "Delete", "Remove", "Cancel permanently"
 *
 * ### warning
 * - Acción que requiere atención
 * - Amber background (--warning), white text
 * - Semantic color para "precaución"
 * - Uso: "Confirm delete", "Reset progress"
 *
 * ### info
 * - Acción informativa / exploración
 * - Blue background (--info), white text
 * - Semantic color para "información"
 * - Uso: "Learn more", "Show details", "Help"
 *
 * ## Tamaños disponibles:
 *
 * ### sm (Small)
 * - px-3 py-1.5, text-xs, h-8
 * - Uso: inline actions, tags, secondary buttons en toolbars
 *
 * ### md (Medium, default)
 * - px-5 py-2.5, text-sm, h-10
 * - Uso: form submissions, modal actions, standard CTAs
 *
 * ### lg (Large)
 * - px-6 py-3, text-base, h-12
 * - Uso: hero CTAs, primary call-to-action, prominent interactions
 *
 * ## Props opcionales:
 *
 * - `icon`: ReactNode a renderizar (left o right)
 * - `iconPosition`: "left" | "right" (default: "left")
 * - `fullWidth`: boolean para 100% width
 * - `isLoading`: boolean para animar icon + disable button
 * - `disabled`: boolean (nativo)
 *
 * ## Ejemplos de uso:
 *
 * // CTA primaria con icon
 * <Button variant="primary" size="lg" icon={<PlayIcon />}>
 *   Start Practice
 * </Button>
 *
 * // Acción secundaria
 * <Button variant="secondary" size="md">
 *   Cancel
 * </Button>
 *
 * // Ghost button en nav
 * <Button variant="ghost" size="sm" icon={<ChevronRight />} iconPosition="right">
 *   More
 * </Button>
 *
 * // Acción destructiva
 * <Button variant="error" size="md">
 *   Delete this word
 * </Button>
 *
 * // Button loading
 * <Button variant="primary" isLoading={true} icon={<Loader />}>
 *   Saving...
 * </Button>
 *
 * // Full-width form button
 * <Button variant="primary" size="lg" fullWidth>
 *   Submit
 * </Button>
 */

// Este archivo es solo documentación. El componente Button.tsx
// implementa todas estas variantes automáticamente.
