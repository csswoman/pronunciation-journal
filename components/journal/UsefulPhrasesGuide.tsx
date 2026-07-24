import { USEFUL_PHRASES_GUIDE } from '@/lib/journal/writing-guide-content'

export function UsefulPhrasesGuide() {
  return (
    <div className="flex flex-col gap-4">
      {USEFUL_PHRASES_GUIDE.map((group) => (
        <div key={group.purpose} className="flex flex-col gap-1.5">
          <h4 className="font-body-sm font-semibold text-fg">{group.purpose}</h4>
          <ul className="flex flex-wrap gap-1.5">
            {group.phrases.map((phrase) => (
              <li
                key={phrase}
                className="rounded-[var(--radius-sm)] bg-surface-sunken px-2 py-1 font-body-sm text-fg-muted"
              >
                {phrase}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
