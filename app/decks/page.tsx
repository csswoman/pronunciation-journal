import { redirect } from "next/navigation";

export default function DecksPage() {
  redirect("/vocabulary?tab=decks");
}
