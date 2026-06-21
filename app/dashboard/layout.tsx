import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
