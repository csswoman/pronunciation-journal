import '@/app/styles/phoneme-practice.css'
import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
}
