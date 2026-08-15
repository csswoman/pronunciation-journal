'use client'

import type { StudyCardModel } from '@/lib/practice/study-card/model'
import { MarkedText } from './StudyCardMarkup'
import { StudyListenButton } from './StudyCardListen'
import { restatesRule, spanishList } from './study-card-copy'

// Planned structure:
// <StudyContent>
//   <TranslationBlock />
//   <PronunciationDetails />
//   <UsageRuleAndContrasts />
//   <Examples />
// </StudyContent>

interface Props {
  model: NonNullable<StudyCardModel['study']>
  word: string
  onListenText?: (text: string) => void
}

export function StudyContent({ model, word, onListenText }: Props) {
  const play = (text: string) => onListenText?.(text)
  const showPronunciation = model.pronunciation && (model.pronunciation.soundAnchors.length > 0 || model.pronunciation.variants.length > 0)
  const showDefinition = Boolean(model.definitionEs) && !restatesRule(model.definitionEs, model.usageRuleEs)
  const hasRuleOrContrast = Boolean(model.usageRuleEs || model.contrasts)

  return (
    <div className="flex w-full flex-col gap-layout-stack border-t border-border-subtle pt-layout-stack text-left">
      {(model.translation || model.translationNote || showDefinition) && (
        <div className="flex flex-col gap-1 text-center">
          {model.translation ? <p className="m-0 text-body-sm font-medium text-fg-muted">{spanishList(model.translation)}</p> : null}
          {model.translationNote ? <p className="m-0 text-body-sm text-fg-muted">{model.translationNote}</p> : null}
          {showDefinition ? <p className="m-0 text-body-sm text-fg-muted">{model.definitionEs}</p> : null}
          {model.spellingVariants?.map((variant) => (
            <p key={variant.spelling} className="m-0 text-caption text-fg-muted">
              También: <span className="font-medium text-fg">{variant.spelling}</span> ({variant.localeEs})
            </p>
          ))}
        </div>
      )}

      {showPronunciation ? (
        <details className="group w-full">
          <summary className="cursor-pointer text-label text-fg marker:text-fg-subtle focus-ring">
            Cómo suena
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {model.pronunciation?.soundAnchors.map((anchor) => (
              <p key={anchor.id} className="m-0 text-body-sm text-fg-muted">
                <span className="font-ipa font-semibold text-fg">{anchor.ipa}</span>{' · '}{anchor.explanationEs}
              </p>
            ))}
            {model.pronunciation?.variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-3">
                <StudyListenButton onPlay={() => play(variant.ttsText)} label={`Escuchar ${variant.labelEs.toLowerCase()}`} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-label text-fg">{variant.labelEs}</p>
                  <p className="m-0 text-body-sm text-fg-muted"><MarkedText value={variant.spokenExample} targetWord={word} /> <span className="font-ipa text-caption">{variant.ipa}</span></p>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {hasRuleOrContrast ? (
        <section className="mt-2 flex flex-col gap-3" aria-label={model.contrasts?.titleEs ?? 'Regla'}>
          {model.usageRuleEs ? (
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-label text-fg">Cuándo se usa</h3>
              <p className="m-0 text-body-md font-medium text-fg">{model.usageRuleEs}</p>
            </div>
          ) : null}
          {model.contrasts?.pairs.map((pair, index) => (
            <div key={index} className="flex items-start gap-3 rounded-md bg-surface-base px-3 py-3">
              <StudyListenButton className="mt-0.5" onPlay={() => play(pair.ttsText)} label="Escuchar ejemplo en inglés" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-body-sm text-fg-muted"><MarkedText value={pair.spanish} /></p>
                <p className="m-0 text-body-md text-fg"><MarkedText value={pair.english} targetWord={word} /></p>
                {pair.pattern === 'omission' ? <p className="m-0 mt-1 text-caption text-fg-muted">Aquí no va “{word}”.</p> : null}
                {pair.explanationEs ? <p className="m-0 mt-1 text-caption text-fg-muted">{pair.explanationEs}</p> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {model.examples?.length ? (
        <section className="flex flex-col gap-2" aria-label="Ejemplos">
          <h3 className="m-0 text-label text-fg">Ejemplos</h3>
          {model.examples.map((example, index) => (
            <div key={index} className="flex items-start gap-2">
              <StudyListenButton onPlay={() => play(example.ttsText)} label="Escuchar oración" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-body-md text-fg"><MarkedText value={example.english} targetWord={word} /></p>
                <p className="m-0 text-body-sm text-fg-muted">{example.translationEs}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
