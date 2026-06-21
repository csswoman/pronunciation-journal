import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
