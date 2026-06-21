import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function LexiconLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
