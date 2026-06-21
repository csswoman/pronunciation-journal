import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function IpaLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
