// Planned structure:
// <CourseHero>           ← editorial masthead, no image
//   <Eyebrow />            (CATEGORY · SOURCE — uppercase tracked, DM Sans)
//   <DisplayTitle />       (Fraunces opsz 144, weight 400, italic accent)
//   <Dek />                (one-line description in DM Sans)
//   <MetaRow />            (date · read time · word count, middots)
// </CourseHero>

"use client";

interface CourseHeroProps {
  title:        string;
  category:    string;
  categoryLabel?: string;
  source:      "manual" | "notion";
  updatedAt:   string;
  dek?:        string;
  readTimeMin: number;
  wordCount:   number;
}

export default function CourseHero({
  title, category, categoryLabel, source, updatedAt, dek, readTimeMin, wordCount,
}: CourseHeroProps) {
  return (
    <header
      style={{
        padding: "clamp(var(--space-8), 6vw, var(--space-12)) 0 var(--space-6)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <Eyebrow categoryLabel={categoryLabel ?? category} source={source} />
      <DisplayTitle title={title} />
      {dek && <Dek text={dek} />}
      <MetaRow updatedAt={updatedAt} readTimeMin={readTimeMin} wordCount={wordCount} />
    </header>
  );
}

function Eyebrow({
  categoryLabel, source,
}: { categoryLabel: string; source: "manual" | "notion" }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-ui), system-ui, sans-serif",
        fontSize: "0.6875rem",
        fontWeight: 500,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
        marginBottom: "var(--space-5)",
      }}
    >
      {categoryLabel} <span aria-hidden style={{ margin: "0 0.55em", color: "var(--primary)" }}>·</span> {source === "notion" ? "Notes" : "Course"}
    </div>
  );
}

function DisplayTitle({ title }: { title: string }) {
  const accent = pickAccent(title);
  return (
    <h1
      style={{
        fontFamily: "var(--font-editorial), 'Fraunces', serif",
        fontOpticalSizing: "auto",
        fontVariationSettings: "'opsz' 144",
        fontWeight: 400,
        fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)",
        lineHeight: 1.02,
        letterSpacing: "-0.025em",
        color: "var(--text-primary)",
        margin: 0,
        maxWidth: "16ch",
        textWrap: "balance",
      }}
    >
      {accent ? (
        <>
          {accent.before}
          <em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--text-primary)" }}>
            {accent.word}
          </em>
          {accent.after}
        </>
      ) : (
        title
      )}
    </h1>
  );
}

function Dek({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-ui), system-ui, sans-serif",
        fontSize: "1.0625rem",
        lineHeight: 1.5,
        color: "var(--text-secondary)",
        margin: "var(--space-5) 0 0",
        maxWidth: "52ch",
        fontWeight: 400,
      }}
    >
      {text}
    </p>
  );
}

function MetaRow({
  updatedAt, readTimeMin, wordCount,
}: { updatedAt: string; readTimeMin: number; wordCount: number }) {
  const date = new Date(updatedAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  const wordsLabel =
    wordCount < 1000 ? `${wordCount} words` : `${(wordCount / 1000).toFixed(wordCount < 10000 ? 1 : 0)}k words`;
  return (
    <div
      style={{
        fontFamily: "var(--font-ui), system-ui, sans-serif",
        fontSize: "0.8125rem",
        color: "var(--text-tertiary)",
        marginTop: "var(--space-5)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0 0.6em",
      }}
    >
      <span>{date}</span>
      <Dot />
      <span>{readTimeMin} min read</span>
      <Dot />
      <span>{wordsLabel}</span>
    </div>
  );
}

function Dot() {
  return <span aria-hidden style={{ opacity: 0.7 }}>·</span>;
}

// Italicise the longest meaningful word so the title gets one expressive
// accent without any external metadata. Falls back to no accent for short
// titles (< 3 words) where italicising one feels arbitrary.
function pickAccent(title: string): { before: string; word: string; after: string } | null {
  const tokens = title.split(/(\s+)/); // keep whitespace
  const words  = tokens.filter((t) => /\S/.test(t));
  if (words.length < 3) return null;
  const target = [...words]
    .sort((a, b) => b.replace(/[^\p{L}]/gu, "").length - a.replace(/[^\p{L}]/gu, "").length)[0];
  const idx = tokens.indexOf(target);
  if (idx < 0) return null;
  return {
    before: tokens.slice(0, idx).join(""),
    word:   target,
    after:  tokens.slice(idx + 1).join(""),
  };
}
