import { NotionRichText } from "@/lib/notion/types";

type NotionAnnotations = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
};

export const NOTION_COLOR_MAP: Record<string, string> = {
  gray: "md-text-gray",
  brown: "md-text-brown",
  orange: "md-text-orange",
  yellow: "md-text-yellow",
  green: "md-text-green",
  blue: "md-text-blue",
  purple: "md-text-purple",
  pink: "md-text-pink",
  red: "md-text-red",
  gray_background: "md-bg-gray",
  brown_background: "md-bg-brown",
  orange_background: "md-bg-orange",
  yellow_background: "md-bg-yellow",
  green_background: "md-bg-green",
  blue_background: "md-bg-blue",
  purple_background: "md-bg-purple",
  pink_background: "md-bg-pink",
  red_background: "md-bg-red",
};

const IPA_SLASH_RE = /^\/.*\/$/;
const IPA_CHARS_RE = /[ɑɐɒæɜəɪʊʌθðŋʃʒʧʤˈˌːˑ]/;
const isIpaText = (text: string) => IPA_SLASH_RE.test(text.trim()) && IPA_CHARS_RE.test(text);

export function renderRichText(richText: NotionRichText[] | undefined): React.ReactNode {
  if (!richText || richText.length === 0) return null;

  const nodes = richText.map((t, i) => {
    const text = t.plain_text || t.text?.content || "";
    if (!text) return null;
    const ann = (t.annotations || {}) as NotionAnnotations;
    const ipa = isIpaText(text);
    const hasStyle = ann.bold || ann.italic || ann.strikethrough || ann.underline || ann.code || (ann.color && ann.color !== "default");
    const colorClass = ann.color && ann.color !== "default" ? NOTION_COLOR_MAP[ann.color] || "" : "";
    const classes = [
      ann.bold ? "font-semibold" : "",
      ann.italic ? "italic" : "",
      ann.strikethrough ? "line-through" : "",
      ann.underline ? "underline" : "",
      ann.code ? "md-inline-code" : "",
      ipa ? "md-ipa" : "",
      colorClass,
      colorClass.startsWith("md-bg-") ? "md-color-bg" : "",
    ].filter(Boolean).join(" ");

    if (!hasStyle && !ipa) return text;

    return <span key={i} className={classes}>{text}</span>;
  });
  return <>{nodes}</>;
}
