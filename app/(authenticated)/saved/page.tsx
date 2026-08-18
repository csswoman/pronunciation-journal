import { redirect } from "next/navigation";

export default function SavedRedirectPage() {
  redirect("/dictionary?mode=saved");
}
