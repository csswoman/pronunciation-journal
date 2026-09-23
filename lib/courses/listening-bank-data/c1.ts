import type { ListeningItem } from "@/lib/courses/listening-bank";

export const C1_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "c1:listening:talk",
    level: "c1",
    lessonSlug: "c1-listening-argument",
    audioKind: "Fragment of a talk / interview on a less concrete idea",
    lines: [
      { speaker: "A", text: "You argue that remote work boosts productivity. Isn't that a little optimistic?" },
      { speaker: "B", text: "I'd put it more carefully. The data suggests productivity holds up, but it doesn't prove it improves." },
      { speaker: "B", text: "What genuinely changes is autonomy, and that's what people value, even where output is flat." },
      { speaker: "A", text: "So your real claim is about autonomy, not raw output." },
    ],
    questions: [
      {
        id: "c1:listening:talk:main",
        focus: "main-idea",
        prompt: "What is the speaker's central claim?",
        options: ["Remote work clearly increases output", "Remote work mainly changes autonomy rather than proving higher output", "Remote work harms productivity"],
        answer: 1,
      },
      {
        id: "c1:listening:talk:detail",
        focus: "detail",
        prompt: "How does the speaker describe the productivity data?",
        options: ["It proves productivity rises", "It suggests productivity holds up but does not prove it improves", "It shows productivity falls sharply"],
        answer: 1,
      },
    ],
  },
  {
    id: "c1:listening:pilot-study",
    level: "c1",
    lessonSlug: "c1-listening-argument",
    audioKind: "Interview discussing evidence and a limitation in a pilot study",
    lines: [
      { speaker: "A", text: "The pilot reduced missed appointments by twelve percent, which sounds impressive." },
      { speaker: "B", text: "Only because reminders went to clinics that had already improved last year." },
      { speaker: "A", text: "So the comparison group matters more than the headline figure?" },
      { speaker: "B", text: "Exactly. Without a matched baseline, we can't attribute the change to the pilot." },
    ],
    questions: [
      {
        id: "c1:listening:pilot-study:main",
        focus: "main-idea",
        prompt: "What is the main criticism of the pilot's result?",
        options: ["The clinics may have been improving before the pilot", "The study included too many clinics", "The reminders were sent too late in the year"],
        answer: 0,
      },
      {
        id: "c1:listening:pilot-study:detail",
        focus: "detail",
        prompt: "Why is a matched baseline needed?",
        options: ["To show whether the pilot caused the change", "To make the headline figure larger", "To avoid contacting the clinics"],
        answer: 0,
      },
    ],
  },
  {
    id: "c1:listening:incomplete-report",
    level: "c1",
    lessonSlug: "c1-listening-argument",
    audioKind: "Discussion about publishing a report before all results are available",
    lines: [
      { speaker: "A", text: "We should publish the report now; the remaining results probably won't alter its conclusion." },
      { speaker: "B", text: "They may not, but they could change how confident we are in that conclusion." },
      { speaker: "A", text: "Would a short note about incomplete data be enough?" },
      { speaker: "B", text: "Only if readers can also see which results are still missing." },
    ],
    questions: [
      {
        id: "c1:listening:incomplete-report:main",
        focus: "main-idea",
        prompt: "What distinction does the second speaker make?",
        options: ["Missing results may affect confidence even if the conclusion stays the same", "The report is too short to publish", "The conclusion should be removed from the report"],
        answer: 0,
      },
      {
        id: "c1:listening:incomplete-report:detail",
        focus: "detail",
        prompt: "What should readers be able to see?",
        options: ["Which results are still missing", "The authors' private notes", "A different conclusion for each result"],
        answer: 0,
      },
    ],
  },
];
