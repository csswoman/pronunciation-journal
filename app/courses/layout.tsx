import "@/app/styles/course-path.css";
import "@/app/styles/grammar-deck.css";
import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedAppLayout>
      <div className="min-h-full w-full">{children}</div>
    </AuthenticatedAppLayout>
  );
}
