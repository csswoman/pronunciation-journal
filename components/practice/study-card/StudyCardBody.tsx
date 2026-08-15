'use client'

import type { StudyCardModel } from '@/lib/practice/study-card/model'
import { cn } from '@/lib/cn'
import { Chip } from './StudyCardMarkup'
import { StudyContent } from './StudyContent'
import {
  ImmersiveListenGroup,
  PronRow,
  SentenceBlock,
} from './StudyCardListen'
import type { ListenTarget } from './listen-target'

// Planned structure:
// <StudyCardBody>
//   <ChipRow />
//   <WordHeading />
//   <StudyContent /> | <LegacyMeaningAndListen />
// </StudyCardBody>

interface Props {
  model: StudyCardModel
  onListen: (target: ListenTarget) => void
  onListenText?: (text: string) => void
  immersive: boolean
}

export function StudyCardBody({
  model,
  onListen,
  onListenText,
  immersive,
}: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-layout-stack text-center">
      {(model.levelBadge || (model.chips && model.chips.length > 0)) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {model.levelBadge ? <Chip accent>{model.levelBadge}</Chip> : null}
          {model.chips?.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
      )}

      <h2 className="m-0 text-balance text-display-word font-semibold tracking-tight text-fg">
        {model.word}
      </h2>

      {model.study ? <StudyContent model={model.study} word={model.word} onListenText={onListenText} /> : <>

      {(model.meaning || model.translation) && (
        <div className="flex max-w-[40ch] flex-col items-center gap-1 text-pretty">
          {immersive ? (
            <>
              {model.translation ? (
                <p className="m-0 text-body-md text-fg">{model.translation}</p>
              ) : null}
              {model.meaning ? (
                <p className="m-0 text-body-sm text-fg-muted">{model.meaning}</p>
              ) : null}
            </>
          ) : (
            <>
              {model.meaning ? <p className="m-0 text-body-md leading-relaxed text-fg">{model.meaning}</p> : null}
              {model.translation ? (
                <p className="m-0 text-body-sm text-fg-subtle">{model.translation}</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {(model.ipa || model.weakForm || model.sentence) && (
        <div
          className={cn(
            'flex w-full flex-col',
            immersive ? 'border-t border-border-subtle pt-layout-stack' : 'items-center gap-[var(--layout-stack-loose)] border-t border-border-subtle pt-[var(--layout-stack-loose)]',
          )}
        >
          {immersive ? (
            <ImmersiveListenGroup>
              {model.weakForm ? (
                <PronRow label="natural" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} immersive />
              ) : null}
              {model.ipa ? (
                <PronRow
                  label="completa"
                  ipa={model.ipa}
                  onPlay={() => onListen('word')}
                  immersive
                />
              ) : null}
              {model.sentence ? (
                <SentenceBlock
                  sentence={model.sentence}
                  word={model.word}
                  onListen={() => onListen('sentence')}
                  highlightPrimary
                  immersive
                />
              ) : null}
            </ImmersiveListenGroup>
          ) : (
            <>
              <div className="w-full">
                {model.ipa ? (
                  <PronRow
                    label="Completa"
                    ipa={model.ipa}
                    onPlay={() => onListen('word')}
                  />
                ) : null}
                {model.weakForm ? (
                  <PronRow label="Natural" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} />
                ) : null}
              </div>
              {model.sentence ? (
                <>
                  <SentenceBlock
                    sentence={model.sentence}
                    word={model.word}
                    onListen={() => onListen('sentence')}
                  />
                  {model.sentenceIpa ? (
                    <p className="ipa m-0 max-w-[36ch] text-center text-body-lg leading-relaxed text-fg-muted">
                      {model.sentenceIpa}
                    </p>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      )}
      </>}
    </div>
  )
}
