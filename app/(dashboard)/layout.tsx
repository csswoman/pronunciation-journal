import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
      <Sidebar className="hidden lg:flex w-64 flex-col" />
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8 lg:py-9">
          {children}
        </div>
      </main>
      <BottomNav className="lg:hidden" />
    </div>
  );
}
