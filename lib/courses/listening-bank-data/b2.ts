import type { ListeningItem } from "@/lib/courses/listening-bank";

export const B2_LISTENING_ITEMS: ListeningItem[] = [
  {
    id: "b2:listening:workplace",
    level: "b2",
    lessonSlug: "b2-listening-workplace",
    audioKind: "Workplace conversation / discussion on a familiar topic",
    lines: [
      { speaker: "A", text: "I think we should switch to a four-day week. People would be far less burned out." },
      { speaker: "B", text: "I get the appeal, but I'm not convinced. Our clients expect coverage five days a week." },
      { speaker: "A", text: "We could stagger the days off, so someone is always available." },
      { speaker: "B", text: "That could work, actually. My real worry was coverage, not the shorter week itself." },
    ],
    questions: [
      {
        id: "b2:listening:workplace:main",
        focus: "main-idea",
        prompt: "What is the main point of disagreement between them?",
        options: ["Whether staff are burned out", "Whether a four-day week would leave clients uncovered", "Whether clients are worth keeping"],
        answer: 1,
      },
      {
        id: "b2:listening:workplace:detail",
        focus: "detail",
        prompt: "What compromise does the first speaker propose?",
        options: ["Hiring more staff", "Staggering the days off so someone is always available", "Dropping the idea entirely"],
        answer: 1,
      },
    ],
  },
  {
    id: "b2:listening:bike-lanes",
    level: "b2",
    lessonSlug: "b2-listening-workplace",
    audioKind: "Discussion balancing transport policy with local business concerns",
    lines: [
      { speaker: "A", text: "The new bike lanes have reduced traffic near the office." },
      { speaker: "B", text: "They have, but the shops say fewer drivers are stopping." },
      { speaker: "A", text: "We could add short-term loading spaces on side streets." },
      { speaker: "B", text: "That might address deliveries without removing the lanes." },
    ],
    questions: [
      {
        id: "b2:listening:bike-lanes:main",
        focus: "main-idea",
        prompt: "What concern does the second speaker raise?",
        options: ["Nearby shops may be losing customers who drive", "The bike lanes are too expensive to paint", "Office workers cannot find bicycles"],
        answer: 0,
      },
      {
        id: "b2:listening:bike-lanes:detail",
        focus: "detail",
        prompt: "What solution is proposed for deliveries?",
        options: ["Remove the bike lanes", "Add temporary loading spaces on side streets", "Close the shops to traffic"],
        answer: 1,
      },
    ],
  },
  {
    id: "b2:listening:train-connection",
    level: "b2",
    lessonSlug: "b2-listening-workplace",
    audioKind: "Travel conversation weighing the cost of a delayed train connection",
    lines: [
      { speaker: "A", text: "Our train is delayed again, so we'll miss the connection in Bristol." },
      { speaker: "B", text: "If we take the six-twenty train, we'll reach Cardiff only twenty minutes later." },
      { speaker: "A", text: "That gives us just enough time to check into the hotel before dinner." },
      { speaker: "B", text: "Then let's change the tickets now; the app still shows seats." },
    ],
    questions: [
      {
        id: "b2:listening:train-connection:main",
        focus: "main-idea",
        prompt: "What problem are the speakers dealing with?",
        options: ["A train delay has made them miss a connection", "Their hotel has cancelled their booking", "The ticket app has stopped working"],
        answer: 0,
      },
      {
        id: "b2:listening:train-connection:detail",
        focus: "detail",
        prompt: "Why do they choose the six-twenty train?",
        options: ["It gets them there only twenty minutes later", "It is the only train with a restaurant", "It arrives before the original train"],
        answer: 0,
      },
    ],
  },
];
