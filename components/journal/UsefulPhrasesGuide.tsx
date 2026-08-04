import { USEFUL_PHRASES_GUIDE } from '@/lib/journal/writing-guide-content'

export function UsefulPhrasesGuide() {
  return (
    <div className="flex flex-col gap-5">
      {USEFUL_PHRASES_GUIDE.map((group) => (
        <section key={group.purpose} className="flex flex-col gap-2">
          <h4 className="font-body-sm font-semibold text-fg">{group.purpose}</h4>
          <ul className="flex flex-col gap-1">
            {group.phrases.map((phrase) => (
              <li key={phrase} className="font-body-sm text-fg">
                {phrase}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
