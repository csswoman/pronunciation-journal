import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
