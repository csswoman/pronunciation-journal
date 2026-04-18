// Notion API response types
export interface NotionBlock {
  object: string;
  id: string;
  parent: { type: string; page_id?: string };
  created_time: string;
  last_edited_time: string;
  created_by: { object: string; id: string };
  last_edited_by: { object: string; id: string };
  has_children: boolean;
  archived: boolean;
  type: string;
  toggle?: NotionToggleBlock;
  heading_3?: NotionHeadingBlock;
  paragraph?: NotionParagraphBlock;
  [key: string]: unknown;
}

export interface NotionToggleBlock {
  rich_text: NotionRichText[];
  color: string;
  children?: NotionBlock[];
}

export interface NotionHeadingBlock {
  rich_text: NotionRichText[];
  color: string;
  is_toggleable: boolean;
}

export interface NotionParagraphBlock {
  rich_text: NotionRichText[];
  color: string;
}

export interface NotionRichText {
  type: "text" | "mention" | "equation";
  text?: { content: string; link?: { url: string } | null };
  href?: string | null;
  plain_text?: string;
  [key: string]: unknown;
}

export interface NotionPage {
  object: string;
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: { object: string; id: string };
  last_edited_by: { object: string; id: string };
  cover: { type: 'external'; external: { url: string } } | { type: 'file'; file: { url: string } } | null;
  icon: unknown;
  parent: { type: string; page_id?: string; database_id?: string };
  archived: boolean;
  properties: Record<string, NotionProperty>;
  url: string;
  public_url: string | null;
}

export interface NotionProperty {
  id: string;
  type: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  multi_select?: { id: string; name: string; color: string }[];
  [key: string]: unknown;
}

// Transformed types for your app
export interface SubLesson {
  id: string;
  title: string;
  slug: string;
  content: NotionBlock[]; // raw blocks para render con react-notion-x
  parentPageId: string;
  notionUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonTopic {
  id: string;
  title: string;
  slug: string;
  description?: string;
  subLessons: SubLesson[];
  notionUrl: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  lessonCount: number;
  notionPageId: string;
  notionUrl: string;
  level?: string;
  updatedAt: Date;
}

export interface CourseWithLessons extends Course {
  lessons: SubLesson[];
  sections: CourseSection[];
}

export interface CourseSection {
  id: string;
  title: string;
  headingLevel: 1 | 2;
  lessonIds: string[]; // only IDs — content lives in lessons[] to avoid duplication
}
