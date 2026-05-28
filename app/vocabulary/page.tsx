import { redirect } from "next/navigation";

export default function VocabularyPage() {
  redirect("/words?tab=my-words");
}
