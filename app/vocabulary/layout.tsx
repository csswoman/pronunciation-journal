import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function VocabularyLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
