import type { ListeningItem } from "@/lib/courses/listening-bank";

export const C2_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "c2:listening:irony",
    level: "c2",
    lessonSlug: "c2-listening-implication",
    audioKind: "Natural dialogue with irony, ambiguity or a shift of register",
    lines: [
      { speaker: "A", text: "So the report I stayed up all night finishing — you moved the deadline to next month?" },
      { speaker: "B", text: "Well, priorities shifted. But I'm sure it was a wonderful use of your evening." },
      { speaker: "A", text: "Oh, marvellous. Nothing I love more than polishing something nobody needed yet." },
      { speaker: "B", text: "Noted. I'll flag these things earlier. Genuinely — that one's on me." },
    ],
    questions: [
      {
        id: "c2:listening:irony:main",
        focus: "main-idea",
        prompt: "What is really going on between the speakers?",
        options: ["They are sincerely praising each other's work", "The first speaker is using irony to express frustration at wasted effort", "They are planning the next report together"],
        answer: 1,
      },
      {
        id: "c2:listening:irony:detail",
        focus: "detail",
        prompt: "How does the second speaker's tone change by the end?",
        options: ["It shifts from sarcasm to a genuine admission of fault", "It stays mocking throughout", "It becomes angry and defensive"],
        answer: 0,
      },
    ],
  },
  {
    id: "c2:listening:deadline-negotiation",
    level: "c2",
    lessonSlug: "c2-listening-implication",
    audioKind: "Negotiation where speakers distinguish a flexible deadline from a fixed quality standard",
    lines: [
      { speaker: "A", text: "You called the schedule ambitious. Should I take that as a polite no?" },
      { speaker: "B", text: "Take it as a request to explain how we'll meet it without skipping review." },
      { speaker: "A", text: "The review is what gives us a defensible result in the first place." },
      { speaker: "B", text: "Agreed. Then the deadline is negotiable; the evidence standard isn't." },
    ],
    questions: [
      {
        id: "c2:listening:deadline-negotiation:main",
        focus: "main-idea",
        prompt: "What do the speakers ultimately agree on?",
        options: ["They can move the deadline, but must keep the review standard", "They should remove the review to meet the deadline", "They should cancel the result entirely"],
        answer: 0,
      },
      {
        id: "c2:listening:deadline-negotiation:detail",
        focus: "detail",
        prompt: "What does the second speaker mean by calling the schedule ambitious?",
        options: ["They want a plan for meeting it without skipping review", "They have already rejected the project", "They think the result is easy to defend"],
        answer: 0,
      },
    ],
  },
  {
    id: "c2:listening:film-review",
    level: "c2",
    lessonSlug: "c2-listening-implication",
    audioKind: "Conversation unpacking faint praise and the implication of a qualifier",
    lines: [
      { speaker: "A", text: "The review describes the film as surprisingly watchable for a sequel." },
      { speaker: "B", text: "That's praise with a small warning attached." },
      { speaker: "A", text: "You think surprisingly tells us more about expectations than quality?" },
      { speaker: "B", text: "Precisely. It measures how far it exceeded a low bar, not how high that bar was." },
    ],
    questions: [
      {
        id: "c2:listening:film-review:main",
        focus: "main-idea",
        prompt: "What is the second speaker's interpretation of the review?",
        options: ["The film exceeded low expectations, which is limited praise", "The film is the best sequel ever made", "The reviewer did not watch the film"],
        answer: 0,
      },
      {
        id: "c2:listening:film-review:detail",
        focus: "detail",
        prompt: "What does the word surprisingly mainly reveal?",
        options: ["The reviewer's expectations", "The film's length", "The sequel's release date"],
        answer: 0,
      },
    ],
  },
];
