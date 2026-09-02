import React from "react";
import { CategoryIcon } from "./CategoryIcon";
import type { LessonCategory } from "@/lib/content/schemas";
import { MINI_LESSON_CATEGORY_LABELS } from "@/lib/content/mini-lesson-labels";

// Planned structure:
// <MiniLessonHeader>
//   <CategoryAvatar />
//   <TitleContent>
//     <CategoryBadge />
//     <TitleHeading />
//   </TitleContent>
// </MiniLessonHeader>

interface MiniLessonHeaderProps {
  category: LessonCategory;
  title: string;
}

export default function MiniLessonHeader({ category, title }: MiniLessonHeaderProps) {
  return (
    <header className="mini-lessons__header-banner">
      <div className="mini-lessons__header-avatar" aria-hidden="true">
        <CategoryIcon category={category} className="mini-lessons__header-avatar-icon" />
      </div>
      <div className="mini-lessons__header-content">
        <span className="mini-lessons__pill mini-lessons__pill--category-accent">
          {MINI_LESSON_CATEGORY_LABELS[category]}
        </span>
        <h1 className="mini-lessons__header-title">{title}</h1>
      </div>
    </header>
  );
}
