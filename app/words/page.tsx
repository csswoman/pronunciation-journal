import { redirect } from "next/navigation";

export default function WordsPage() {
  redirect("/vocabulary?tab=words");
}
