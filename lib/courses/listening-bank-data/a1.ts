import type { ListeningItem } from "@/lib/courses/listening-bank";

export const A1_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "a1:listening:cafe",
    level: "a1",
    lessonSlug: "a1-listening-daily-life",
    audioKind: "Short shop/café exchange, spoken slowly and clearly",
    lines: [
      { speaker: "A", text: "Hi. A small coffee, please. How much is it?" },
      { speaker: "B", text: "Two euros. Would you like anything else?" },
      { speaker: "A", text: "No, thank you. Just the coffee." },
      { speaker: "B", text: "Okay. It opens at eight, so you are early today." },
    ],
    questions: [
      {
        id: "a1:listening:cafe:main",
        focus: "main-idea",
        prompt: "What does the customer want to do?",
        options: ["Buy a coffee", "Return a coffee", "Ask for the time"],
        answer: 0,
      },
      {
        id: "a1:listening:cafe:detail",
        focus: "detail",
        prompt: "How much does the coffee cost?",
        options: ["One euro", "Two euros", "Eight euros"],
        answer: 1,
      },
    ],
  },
  {
    id: "a1:listening:bus-stop",
    level: "a1",
    lessonSlug: "a1-listening-daily-life",
    audioKind: "Short exchange asking for directions on public transport",
    lines: [
      { speaker: "A", text: "Excuse me, is this the bus to the station?" },
      { speaker: "B", text: "Yes. Get off at the next stop." },
      { speaker: "A", text: "Thank you. How long does it take?" },
      { speaker: "B", text: "About ten minutes." },
    ],
    questions: [
      {
        id: "a1:listening:bus-stop:main",
        focus: "main-idea",
        prompt: "What does the first speaker want to know?",
        options: ["Which bus goes to the station", "Where to buy a ticket", "When the station closes"],
        answer: 0,
      },
      {
        id: "a1:listening:bus-stop:detail",
        focus: "detail",
        prompt: "Where should the first speaker get off?",
        options: ["At the station before this one", "At the next stop", "At the last stop"],
        answer: 1,
      },
    ],
  },
  {
    id: "a1:listening:breakfast",
    level: "a1",
    lessonSlug: "a1-listening-daily-life",
    audioKind: "Simple café order for breakfast",
    lines: [
      { speaker: "A", text: "Can I have some orange juice, please?" },
      { speaker: "B", text: "Of course. Would you like toast too?" },
      { speaker: "A", text: "Yes, with butter, please." },
      { speaker: "B", text: "Here you are." },
    ],
    questions: [
      {
        id: "a1:listening:breakfast:main",
        focus: "main-idea",
        prompt: "What is the customer ordering?",
        options: ["Orange juice and toast", "Coffee and a sandwich", "Tea and eggs"],
        answer: 0,
      },
      {
        id: "a1:listening:breakfast:detail",
        focus: "detail",
        prompt: "What does the customer want on the toast?",
        options: ["Jam", "Cheese", "Butter"],
        answer: 2,
      },
    ],
  },
];
