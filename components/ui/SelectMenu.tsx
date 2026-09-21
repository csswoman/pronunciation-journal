'use client'

// Planned structure:
// <SelectMenu>
//   <SelectTrigger />
//   <SelectDesktopDropdown />
//   <SelectMobileSheet />
// </SelectMenu>

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, X } from '@/components/icons'
import { cn } from '@/lib/cn'

export interface SelectMenuOption<T extends string = string> {
  value: T
  label: string
  description?: string
  badge?: string
  disabled?: boolean
}

export interface SelectMenuGroup<T extends string = string> {
  label: string
  options: SelectMenuOption<T>[]
}

export interface SelectMenuProps<T extends string = string> {
  value: T
  onChange: (value: T) => void
  options?: SelectMenuOption<T>[]
  groups?: SelectMenuGroup<T>[]
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  menuClassName?: string
  align?: 'left' | 'right'
  id?: string
  'aria-label'?: string
}

export function SelectMenu<T extends string = string>({
  value,
  onChange,
  options,
  groups,
  label,
  placeholder = 'Selecciona una opción',
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  align = 'left',
  id,
  'aria-label': ariaLabel,
}: SelectMenuProps<T>) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const flatOptions = useMemo(() => {
    if (groups) {
      return groups.flatMap((g) => g.options)
    }
    return options ?? []
  }, [groups, options])

  const selectedOption = useMemo(
    () => flatOptions.find((o) => o.value === value),
    [flatOptions, value],
  )

  const handleSelect = useCallback(
    (optValue: T) => {
      onChange(optValue)
      setOpen(false)
    },
    [onChange],
  )

  // Click outside to close desktop dropdown
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const renderOptionItem = (opt: SelectMenuOption<T>) => {
    const isSelected = opt.value === value
    return (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={opt.disabled}
        onClick={() => handleSelect(opt.value)}
        className={cn(
          'flex w-full min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors',
          'focus-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
          isSelected
            ? 'bg-surface-sunken text-fg font-semibold'
            : 'text-fg hover:bg-surface-sunken hover:text-fg font-normal',
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold leading-snug text-fg">{opt.label}</span>
            {opt.badge ? (
              <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-tiny font-medium text-fg-muted shrink-0">
                {opt.badge}
              </span>
            ) : null}
          </div>
          {opt.description ? (
            <span className="text-caption text-fg-muted font-normal leading-relaxed">{opt.description}</span>
          ) : null}
        </div>
        {isSelected ? <Check size={16} className="shrink-0 text-primary stroke-[2.5]" aria-hidden /> : null}
      </button>
    )
  }

  const renderGroupList = () => {
    if (groups) {
      return groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-1 py-1">
          <span className="px-3 pt-2 pb-1 text-tiny font-bold tracking-wider text-fg-muted uppercase">
            {g.label}
          </span>
          <div className="flex flex-col gap-0.5">{g.options.map(renderOptionItem)}</div>
        </div>
      ))
    }
    return <div className="flex flex-col gap-0.5 py-1">{flatOptions.map(renderOptionItem)}</div>
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label ? (
        <label htmlFor={selectId} className="mb-1 block text-caption font-medium text-fg-muted">
          {label}
        </label>
      ) : null}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-border-default',
          'bg-surface-sunken px-3 py-2 text-caption font-medium text-fg transition-colors duration-150 ease-out-quart',
          'hover:border-border-strong hover:bg-surface-raised focus-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          open && 'border-primary bg-surface-raised',
          triggerClassName,
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-fg-muted transition-transform duration-150 ease-out-quart',
            open && 'rotate-180 text-primary',
          )}
          aria-hidden
        />
      </button>

      {/* Desktop Dropdown Popover */}
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? label ?? 'Opciones'}
          className={cn(
            'hidden sm:block absolute top-[calc(100%+6px)] z-50 max-h-80 min-w-[280px] sm:min-w-[320px] max-w-[380px] overflow-y-auto',
            'rounded-2xl border border-border-default bg-surface-raised p-2 shadow-xl animate-fade-in',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {renderGroupList()}
        </div>
      ) : null}

      {/* Mobile Bottom Sheet Modal */}
      {open ? (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar opciones"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-page-bg/60 backdrop-blur-sm animate-fade-in"
          />
          <div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? label ?? 'Opciones'}
            className={cn(
              'relative z-10 flex max-h-[75dvh] w-full flex-col rounded-t-2xl border-t border-border-subtle',
              'bg-surface-raised p-4 shadow-2xl animate-sheet-up',
            )}
          >
            <header className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-body-md font-semibold text-fg">
                {label ?? 'Selecciona una opción'}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex size-9 items-center justify-center rounded-full text-fg-subtle hover:bg-surface-sunken hover:text-fg focus-ring"
              >
                <X size={18} aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto pt-2 pb-[calc(var(--layout-card-pad)+env(safe-area-inset-bottom,0px))]">
              {renderGroupList()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
