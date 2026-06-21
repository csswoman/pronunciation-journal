import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
