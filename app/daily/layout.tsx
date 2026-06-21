import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
