import React from "react";
import ReactMarkdown from "react-markdown";

// Planned structure:
// <MiniLessonWordChips>
//   <SectionTitle />
//   <SectionDescription />
//   <ChipList>
//     <ChipBadge />
//   </ChipList>
// </MiniLessonWordChips>

interface MiniLessonWordChipsProps {
  heading: string;
  body: string;
  chips: string[];
}

export default function MiniLessonWordChips({
  heading,
  body,
  chips,
}: MiniLessonWordChipsProps) {
  return (
    <section className="mini-lessons__word-chips-section">
      <h2 className="mini-lessons__section-title">{heading}</h2>
      <div className="mini-lessons__section-body">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
      <div className="mini-lessons__chip-wrap">
        {chips.map((chip, idx) => (
          <span key={idx} className="mini-lessons__word-chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
