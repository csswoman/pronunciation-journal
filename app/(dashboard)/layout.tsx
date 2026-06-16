import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <Sidebar className="hidden lg:flex flex-col" />
      <main className="main-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav className="lg:hidden" />
    </div>
  );
}
