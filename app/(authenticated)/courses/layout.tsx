import "@/app/styles/course-path.css";
import "@/app/styles/grammar-deck.css";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full w-full">{children}</div>;
}
