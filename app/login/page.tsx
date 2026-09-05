import { Suspense } from "react";
import AuthPanel from "@/components/auth/AuthPanel";

export const metadata = {
  title: "Entrar — English Journal",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPanel />
    </Suspense>
  );
}
