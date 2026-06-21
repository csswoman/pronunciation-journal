import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";
import AdminGuard from "./AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedAppLayout>
      <AdminGuard>{children}</AdminGuard>
    </AuthenticatedAppLayout>
  );
}
