// Planned structure:
// <QuietSpeakFeedback>
//   <Accuracy />
//   <Message />
// </QuietSpeakFeedback>

interface Props {
  accuracy: number
  message: string
}

/** Restrained post-speak summary — score + short message, no XP/emoji. */
export function QuietSpeakFeedback({ accuracy, message }: Props) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 text-center">
      <p className="m-0 text-3xl font-semibold tabular-nums tracking-tight text-fg">
        {accuracy}%
      </p>
      <p className="m-0 text-sm text-fg-muted">{message}</p>
    </div>
  )
}
