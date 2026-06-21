import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
