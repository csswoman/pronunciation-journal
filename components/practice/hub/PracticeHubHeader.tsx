// Planned structure:
// <PracticeHubHeader>  — title + subtitle, contextual on `fromDaily`
interface Props {
  fromDaily: boolean
}

export default function PracticeHubHeader({ fromDaily }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <h1
        className="text-3xl font-medium text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        {fromDaily ? 'Nicely done — keep going' : 'Free practice'}
      </h1>
      <p className="font-body-sm text-[var(--text-secondary)]">
        {fromDaily
          ? "You just finished today's daily. Choose what to reinforce next."
          : 'Choose what you want to reinforce.'}
      </p>
    </header>
  )
}
