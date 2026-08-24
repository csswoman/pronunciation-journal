// Planned structure:
// <UsefulPhrasesGuide>
//   <section group>*
//     <h4 purpose />
//     <ul phraseButtons />
//   </section>
// </UsefulPhrasesGuide>

import { USEFUL_PHRASES_GUIDE } from '@/lib/journal/writing-guide-content'

interface UsefulPhrasesGuideProps {
  onSelectPhrase?: (phrase: string) => void
}

export function UsefulPhrasesGuide({ onSelectPhrase }: UsefulPhrasesGuideProps) {
  return (
    <div className="flex flex-col gap-5">
      {USEFUL_PHRASES_GUIDE.map((group) => (
        <section key={group.purpose} className="flex flex-col gap-2">
          <h4 className="font-caption font-semibold uppercase tracking-wider text-fg-muted">
            {group.purpose}
          </h4>
          <ul className="flex flex-col gap-1.5">
            {group.phrases.map((phrase) => (
              <li key={phrase}>
                {onSelectPhrase ? (
                  <button
                    type="button"
                    onClick={() => onSelectPhrase(phrase)}
                    className="focus-ring w-full text-left rounded-md px-2.5 py-1.5 font-body-sm text-fg transition-colors hover:bg-surface-sunken hover:text-primary active:scale-[0.99]"
                    title="Insertar en el borrador"
                  >
                    {phrase}
                  </button>
                ) : (
                  <span className="block px-2.5 py-1 font-body-sm text-fg">{phrase}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
