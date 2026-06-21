import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function AuthenticatedRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
