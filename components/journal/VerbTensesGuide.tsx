import { VERB_TENSE_GUIDE } from '@/lib/journal/writing-guide-content'

export function VerbTensesGuide() {
  return (
    <div className="flex flex-col gap-4">
      {VERB_TENSE_GUIDE.map((group) => (
        <div key={group.tense} className="flex flex-col gap-1.5">
          <h4 className="font-body-sm font-semibold text-fg">{group.label}</h4>
          <ul className="flex flex-col gap-1">
            {group.examples.map((example) => (
              <li key={example.english} className="font-body-sm text-fg-muted">
                <span className="text-fg">{example.english}</span>
                <span className="text-fg-subtle"> — {example.spanish}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
