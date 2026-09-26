import type { ListeningItem } from "@/lib/courses/listening-bank";

export const A2_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "a2:listening:plans",
    level: "a2",
    lessonSlug: "a2-listening-plans",
    audioKind: "Voice note coordinating plans / simple change of time",
    lines: [
      { speaker: "A", text: "Hey, it's about the cinema tonight." },
      { speaker: "A", text: "The film now starts at nine, not eight, so let's meet at half past eight." },
      { speaker: "B", text: "Half past eight works. Should I buy the tickets online?" },
      { speaker: "A", text: "Yes, please. I'll pay you back tomorrow." },
    ],
    questions: [
      {
        id: "a2:listening:plans:main",
        focus: "main-idea",
        prompt: "Why is the first speaker calling?",
        options: ["To cancel the cinema plan", "To change the meeting time for the cinema", "To complain about the tickets"],
        answer: 1,
      },
      {
        id: "a2:listening:plans:detail",
        focus: "detail",
        prompt: "What time will they meet now?",
        options: ["At eight", "At half past eight", "At nine"],
        answer: 1,
      },
    ],
  },
  {
    id: "a2:listening:meeting-time",
    level: "a2",
    lessonSlug: "a2-listening-plans",
    audioKind: "Short message changing a meeting time and describing clothing",
    lines: [
      { speaker: "A", text: "Hi, Sam. Are we still meeting at the café at six?" },
      { speaker: "B", text: "Could we make it half past six? My class ends late." },
      { speaker: "A", text: "Sure. I'll wait by the front door." },
      { speaker: "B", text: "Thanks. I'll be wearing a green jacket." },
    ],
    questions: [
      {
        id: "a2:listening:meeting-time:main",
        focus: "main-idea",
        prompt: "Why are the speakers changing their plan?",
        options: ["One person's class ends late", "The café is closed", "They want to meet on another day"],
        answer: 0,
      },
      {
        id: "a2:listening:meeting-time:detail",
        focus: "detail",
        prompt: "What time will they meet?",
        options: ["At six", "At half past six", "At seven"],
        answer: 1,
      },
    ],
  },
  {
    id: "a2:listening:weekend-plan",
    level: "a2",
    lessonSlug: "a2-listening-plans",
    audioKind: "Weekend plan changed because of the weather",
    lines: [
      { speaker: "A", text: "Do you want to go hiking on Sunday?" },
      { speaker: "B", text: "I'd like to, but the weather may be rainy." },
      { speaker: "A", text: "We could visit the museum instead." },
      { speaker: "B", text: "Good idea. It closes at five, so let's go after lunch." },
    ],
    questions: [
      {
        id: "a2:listening:weekend-plan:main",
        focus: "main-idea",
        prompt: "What do the speakers decide to do?",
        options: ["Go hiking in the rain", "Visit a museum", "Stay home all day"],
        answer: 1,
      },
      {
        id: "a2:listening:weekend-plan:detail",
        focus: "detail",
        prompt: "Why do they plan to go after lunch?",
        options: ["The museum closes at five", "The museum opens after lunch", "They have lunch at the museum"],
        answer: 0,
      },
    ],
  },
];
