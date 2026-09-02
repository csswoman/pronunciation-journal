import React from "react";
import ReactMarkdown from "react-markdown";

// Planned structure:
// <MiniLessonCardCallout>
//   <CardHeading />
//   <CardBody />
// </MiniLessonCardCallout>

interface MiniLessonCardCalloutProps {
  heading: string;
  body: string;
}

export default function MiniLessonCardCallout({ heading, body }: MiniLessonCardCalloutProps) {
  return (
    <article className="mini-lessons__card-callout">
      <h2 className="mini-lessons__card-callout-heading">{heading}</h2>
      <div className="mini-lessons__card-callout-body">
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    </article>
  );
}
