import React from "react";

// Planned structure:
// <MiniLessonVisualCallout>
//   <IconBadge />
//   <CalloutInfo>
//     <Heading />
//     <Description />
//   </CalloutInfo>
// </MiniLessonVisualCallout>

interface MiniLessonVisualCalloutProps {
  heading: string;
  body: string;
  icon?: string;
}

export default function MiniLessonVisualCallout({
  heading,
  body,
}: MiniLessonVisualCalloutProps) {
  return (
    <div className="mini-lessons__visual-callout">
      <div className="mini-lessons__visual-callout-icon-wrap" aria-hidden="true">
        <svg
          className="mini-lessons__visual-callout-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <div className="mini-lessons__visual-callout-content">
        <h3 className="mini-lessons__visual-callout-title">{heading}</h3>
        <p className="mini-lessons__visual-callout-text">{body}</p>
      </div>
    </div>
  );
}
