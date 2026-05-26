import { marked } from "marked";

export function isHtmlContent(content: string): boolean {
  return /^\s*<(h1|h2|h3|h4|p|ul|ol|blockquote|figure|img|div|table|hr|pre)/i.test(content);
}

export function ensureHtml(content: string): string {
  if (!content) return "";
  if (isHtmlContent(content)) return content;
  return marked.parse(content, { async: false, gfm: true, breaks: false }) as string;
}
