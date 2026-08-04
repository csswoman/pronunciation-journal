import { Check } from '@/components/icons'

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
}

/** Theme-aware checkbox used by product controls. */
export function Checkbox({ checked, onCheckedChange, label }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 font-body-sm text-fg-subtle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-xs border border-border-default bg-surface-raised text-on-primary transition-colors duration-150 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-(--focus-ring)"
        aria-hidden
      >
        {checked ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      {label}
    </label>
  )
}
