// Planned structure:
// <ChatContextDivider />   — leaf, no sub-components

/**
 * A centered event marker in the thread: "something happened here", not
 * "someone said this".
 *
 * Exercise completion sends a hidden message on the learner's behalf. Rendering
 * that as a user bubble put words in their mouth and repeated the score the
 * result card already showed. This marks the same beat without a false bubble,
 * and the typing indicator follows it so the wait reads as deliberate.
 */
export function ChatContextDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-2" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="text-xxs font-medium text-fg-subtle whitespace-nowrap">{label}</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
