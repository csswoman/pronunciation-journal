import { redirect } from "next/navigation";

export default function LexiconPage() {
  redirect("/words?tab=lexicon");
}
