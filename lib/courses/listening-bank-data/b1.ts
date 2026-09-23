import type { ListeningItem } from "@/lib/courses/listening-bank";

export const B1_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "b1:listening:story",
    level: "b1",
    lessonSlug: "b1-listening-experience",
    audioKind: "Short anecdote / simple interview about an experience",
    lines: [
      { speaker: "A", text: "So how did your first week at the new job go?" },
      { speaker: "B", text: "Honestly, it started badly. I missed my train, so I arrived late." },
      { speaker: "B", text: "But my manager was really kind, and by Friday I felt part of the team." },
      { speaker: "A", text: "That's a relief. So the rough start didn't really matter in the end." },
    ],
    questions: [
      {
        id: "b1:listening:story:main",
        focus: "main-idea",
        prompt: "How does the speaker feel about the week overall?",
        options: ["It ended well despite a bad start", "It was bad from start to finish", "It was perfect from the beginning"],
        answer: 0,
      },
      {
        id: "b1:listening:story:detail",
        focus: "detail",
        prompt: "Why did the speaker arrive late on the first day?",
        options: ["They overslept", "They missed their train", "The office moved"],
        answer: 1,
      },
    ],
  },
  {
    id: "b1:listening:lost-wallet",
    level: "b1",
    lessonSlug: "b1-listening-experience",
    audioKind: "Short anecdote about losing and recovering a wallet",
    lines: [
      { speaker: "A", text: "You look worried. What's happened?" },
      { speaker: "B", text: "I left my wallet on the bus this morning, and I only noticed at work." },
      { speaker: "A", text: "Did you call the bus company?" },
      { speaker: "B", text: "Yes. The driver found it, so I'll collect it after work." },
    ],
    questions: [
      {
        id: "b1:listening:lost-wallet:main",
        focus: "main-idea",
        prompt: "How is the situation likely to end?",
        options: ["The speaker will get the wallet back", "The speaker will buy a new bus", "The speaker will miss work"],
        answer: 0,
      },
      {
        id: "b1:listening:lost-wallet:detail",
        focus: "detail",
        prompt: "When did the speaker notice the wallet was missing?",
        options: ["On the bus", "At work", "After collecting it"],
        answer: 1,
      },
    ],
  },
  {
    id: "b1:listening:community-garden",
    level: "b1",
    lessonSlug: "b1-listening-experience",
    audioKind: "Conversation about a first afternoon volunteering in a garden",
    lines: [
      { speaker: "A", text: "How was your first afternoon at the community garden?" },
      { speaker: "B", text: "Busy, but everyone showed me what to do." },
      { speaker: "A", text: "Did you plant the herbs near the entrance?" },
      { speaker: "B", text: "No, we moved them beside the kitchen because they need more sun." },
    ],
    questions: [
      {
        id: "b1:listening:community-garden:main",
        focus: "main-idea",
        prompt: "How did the volunteer's first afternoon go?",
        options: ["It was busy, and the others helped", "It was quiet, and nobody spoke", "It was cancelled because of the weather"],
        answer: 0,
      },
      {
        id: "b1:listening:community-garden:detail",
        focus: "detail",
        prompt: "Why were the herbs moved beside the kitchen?",
        options: ["They need more sunlight", "The entrance was closed", "The kitchen needed more space"],
        answer: 0,
      },
    ],
  },
];
