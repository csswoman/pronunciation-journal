import type { ReactNode } from "react";

import "@/app/styles/words-lexicon.css";
import AuthenticatedAppLayout from "@/components/layout/AuthenticatedAppLayout";

export default function WordsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>;
}
