import { ChevronDown } from '@/components/icons'

interface JournalRailSectionProps {
  heading: string
  children: React.ReactNode
  collapsible?: boolean
}

export function JournalRailSection({
  heading,
  children,
  collapsible = false,
}: JournalRailSectionProps) {
  if (collapsible) {
    return (
      <details className="group border-t border-border-subtle pt-4">
        <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center gap-2 font-body-sm font-semibold text-fg">
          <ChevronDown
            size={14}
            className="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
            aria-hidden
          />
          {heading}
        </summary>
        <div className="pt-3">{children}</div>
      </details>
    )
  }

  return (
    <section className="border-t border-border-subtle pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-body-sm font-semibold text-fg">{heading}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}
