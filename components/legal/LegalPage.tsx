import Link from "next/link";

// Planned structure:
// <LegalPage>
//   <LegalHeader />
//   <LegalBody />
// </LegalPage>

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <article className="px-6 py-12 lg:py-16">
      <div className="mx-auto max-w-prose">
        <Link
          href="/"
          className="mb-8 inline-flex text-sm text-fg-muted transition-colors hover:text-fg"
        >
          ← Back to English Journal
        </Link>
        <div className="markdown">
          <h1 className="md-h1">{title}</h1>
          <p className="text-sm text-fg-muted">Last updated: {updated}</p>
          {children}
        </div>
      </div>
    </article>
  );
}
