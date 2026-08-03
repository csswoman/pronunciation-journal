import { VERB_TENSE_GUIDE } from '@/lib/journal/writing-guide-content'

export function VerbTensesGuide() {
  return (
    <div className="flex flex-col gap-5">
      {VERB_TENSE_GUIDE.map((group) => (
        <section key={group.tense} className="flex flex-col gap-2">
          <div>
            <h4 className="font-body-sm font-semibold text-fg">{group.label}</h4>
            <p className="font-body-xs text-fg-muted">{TENSE_CONTEXT[group.tense]}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {group.examples.map((example) => (
              <li key={example.english} className="flex flex-col gap-0.5 font-body-sm">
                <span className="text-fg">{example.english}</span>
                <span className="text-fg-muted">{example.spanish}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const TENSE_CONTEXT = {
  present: 'Hábitos y cosas que pasan ahora.',
  past: 'Algo que ya ocurrió.',
  future: 'Planes o cosas que pasarán.',
} as const
